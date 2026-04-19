export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateReviewReply } from '@/lib/anthropic'
import { decide } from '@/lib/autopilot/rules'
import type { AutopilotRules } from '@/types'

// ---------------------------------------------------------------------------
// Auth guard (shared pattern from /api/cron/daily-scrape)
// ---------------------------------------------------------------------------

function isAuthorized(request: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return false
  const authHeader = request.headers.get('authorization')
  const cronHeader = request.headers.get('x-cron-secret')
  return (
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    cronHeader === process.env.CRON_SECRET
  )
}

// ---------------------------------------------------------------------------
// GET /api/cron/autopilot  (Vercel cron sends GET)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error('[autopilot-cron] CRON_SECRET env var is not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── 1. Find all business profiles whose user has autopilot enabled ──────────
  const { data: profiles, error: profilesErr } = await supabase
    .from('business_profiles')
    .select('id, user_id, business_name, business_type, vibe, voice_style, description, owner_name, reply_preferences')
    .filter('reply_preferences->autopilot->>enabled', 'eq', 'true')

  if (profilesErr) {
    console.error('[autopilot-cron] Failed to fetch profiles:', profilesErr)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ processed: 0, autoApproved: 0, drafted: 0, escalated: 0, skipped: 0, errors: 0 })
  }

  const counters = { processed: 0, autoApproved: 0, drafted: 0, escalated: 0, skipped: 0, errors: 0 }

  // 48-hour safety window — only process recently-created reviews
  const windowStart = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  for (const profile of profiles) {
    const prefs = profile.reply_preferences as { autopilot?: AutopilotRules } | null
    const rules = prefs?.autopilot

    if (!rules?.enabled) continue

    // ── 2. Fetch unhandled pending reviews for this profile ──────────────────
    const { data: reviews, error: reviewsErr } = await supabase
      .from('scraped_reviews')
      .select('id, user_id, star_rating, review_text, source')
      .eq('business_profile_id', profile.id)
      .eq('autopilot_handled', false)
      .eq('reply_status', 'pending')
      .gte('created_at', windowStart)

    if (reviewsErr) {
      console.error(`[autopilot-cron] Error fetching reviews for profile ${profile.id}:`, reviewsErr)
      counters.errors++
      continue
    }

    if (!reviews || reviews.length === 0) continue

    for (const review of reviews) {
      try {
        const decision = decide(rules, { star_rating: review.star_rating, review_text: review.review_text })

        if (decision.action === 'disabled') {
          // Should not happen — already filtered — but be safe
          continue
        }

        if (decision.action === 'skipped_no_text' || decision.action === 'escalated_low_rating' || decision.action === 'escalated_keyword') {
          // Mark as handled with no reply generated
          const { error: updateErr } = await supabase
            .from('scraped_reviews')
            .update({
              autopilot_handled: true,
              autopilot_action: decision.action,
              autopilot_processed_at: new Date().toISOString(),
            })
            .eq('id', review.id)

          if (updateErr) {
            console.error(`[autopilot-cron] Failed to update review ${review.id}:`, updateErr)
            counters.errors++
          } else {
            counters.escalated += (decision.action === 'skipped_no_text') ? 0 : 1
            counters.skipped  += (decision.action === 'skipped_no_text') ? 1 : 0
            counters.processed++
          }
          continue
        }

        // auto_approved or draft_only — generate reply
        const platformLabel =
          review.source === 'yelp' ? 'Yelp' :
          review.source === 'tripadvisor' ? 'TripAdvisor' : 'Google'

        const generatedReply = await generateReviewReply({
          businessName:  profile.business_name ?? '',
          businessType:  profile.business_type ?? '',
          vibe:          profile.vibe ?? '',
          voiceStyle:    profile.voice_style ?? '',
          description:   profile.description ?? '',
          ownerName:     profile.owner_name ?? '',
          reviewText:    review.review_text ?? '',
          platform:      platformLabel,
          starRating:    review.star_rating,
          replyPreferences: prefs ?? undefined,
        })

        const newStatus = decision.action === 'auto_approved' ? 'approved' : 'pending'

        const { error: updateErr } = await supabase
          .from('scraped_reviews')
          .update({
            generated_reply:       generatedReply,
            reply_status:          newStatus,
            autopilot_handled:     true,
            autopilot_action:      decision.action,
            autopilot_processed_at: new Date().toISOString(),
          })
          .eq('id', review.id)

        if (updateErr) {
          console.error(`[autopilot-cron] Failed to save reply for review ${review.id}:`, updateErr)
          counters.errors++
        } else {
          if (decision.action === 'auto_approved') counters.autoApproved++
          else counters.drafted++
          counters.processed++
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[autopilot-cron] Error processing review ${review.id}:`, msg)
        counters.errors++
      }
    }
  }

  console.log('[autopilot-cron] Done', counters)
  return NextResponse.json(counters)
}
