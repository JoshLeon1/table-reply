export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateReviewReply } from '@/lib/anthropic'
import { decide } from '@/lib/autopilot/rules'
import { hasAccess } from '@/lib/subscription/access'
import { postGbpReply } from '@/lib/gbp/post-reply'
import { getGbpToken } from '@/lib/gbp/client'
import type { AutopilotRules, ReplyPreferences } from '@/types'

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
  // Join to profiles so we can filter out expired-trial / canceled / past-due
  // users. Without this, we'd burn Anthropic + Outscraper quota auto-drafting
  // replies for accounts that already churned.
  const { data: rawProfiles, error: profilesErr } = await supabase
    .from('business_profiles')
    .select(`
      id, user_id, business_name, business_type, vibe, voice_style, description, owner_name, reply_preferences,
      profile:profiles!restaurant_profiles_user_id_fkey (
        is_paid, trial_started_at, subscription_period_end, subscription_canceled_at, subscription_past_due
      )
    `)
    .filter('reply_preferences->autopilot->>enabled', 'eq', 'true')

  if (profilesErr) {
    console.error('[autopilot-cron] Failed to fetch profiles:', profilesErr)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }

  if (!rawProfiles || rawProfiles.length === 0) {
    return NextResponse.json({ processed: 0, autoApproved: 0, drafted: 0, escalated: 0, skipped: 0, errors: 0 })
  }

  // Same normalize-and-filter pattern as /api/cron/daily-scrape: Supabase's
  // embed returns the joined row as either an object or a single-element array
  // depending on FK inference.
  const profiles = rawProfiles
    .map((row) => {
      const r = row as unknown as {
        profile:
          | {
              is_paid: boolean | null
              trial_started_at: string | null
              subscription_period_end: string | null
              subscription_canceled_at: string | null
              subscription_past_due: boolean | null
            }
          | Array<{
              is_paid: boolean | null
              trial_started_at: string | null
              subscription_period_end: string | null
              subscription_canceled_at: string | null
              subscription_past_due: boolean | null
            }>
          | null
      } & Record<string, unknown>
      const profile = Array.isArray(r.profile) ? r.profile[0] ?? null : r.profile
      return { ...row, profile }
    })
    .filter((row) => hasAccess(row.profile).ok)

  const skippedInactive = rawProfiles.length - profiles.length
  if (skippedInactive > 0) {
    console.log('[autopilot-cron] Skipped %d inactive-access profiles', skippedInactive)
  }

  if (profiles.length === 0) {
    return NextResponse.json({ processed: 0, autoApproved: 0, drafted: 0, escalated: 0, skipped: 0, errors: 0, skippedInactive })
  }

  const counters = { processed: 0, autoApproved: 0, drafted: 0, escalated: 0, skipped: 0, errors: 0 }

  // 48-hour safety window — only process recently-created reviews
  const windowStart = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  for (const profile of profiles) {
    const prefs = profile.reply_preferences as ReplyPreferences | null
    const rules = prefs?.autopilot

    if (!rules?.enabled) continue

    // ── 2. Fetch unhandled pending reviews for this profile ──────────────────
    const { data: reviews, error: reviewsErr } = await supabase
      .from('scraped_reviews')
      .select('id, user_id, business_profile_id, star_rating, review_text, source, google_review_name')
      .eq('business_profile_id', profile.id)
      .eq('autopilot_handled', false)
      .eq('reply_status', 'pending')
      .gte('review_datetime_utc', windowStart)

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
          review.source === 'yelp' ? 'Yelp' : 'Google'

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
          if (decision.action === 'auto_approved') {
            counters.autoApproved++
            // Post to GBP if review has a matched resource name
            if (review.source === 'google' && review.google_review_name) {
              const token = await getGbpToken(review.user_id, review.business_profile_id ?? undefined)
              if (token) {
                const gbp = await postGbpReply(review.user_id, review.business_profile_id ?? '', review.google_review_name, generatedReply)
                if (gbp.ok) {
                  await supabase
                    .from('scraped_reviews')
                    .update({ gbp_posted_at: new Date().toISOString() })
                    .eq('id', review.id)
                } else {
                  console.warn(`[autopilot-cron] GBP post failed for review ${review.id}:`, gbp.error)
                }
              }
            }
          } else {
            counters.drafted++
          }
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
