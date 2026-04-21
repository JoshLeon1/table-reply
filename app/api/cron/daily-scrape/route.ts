export const dynamic = 'force-dynamic'
// Pro plan allows up to 300s for cron functions. Daily-scrape is the
// orchestrator that fans out to scrape-reviews/scrape-yelp-reviews (each
// runs in its own 60s function) — at high user counts, orchestrating
// 100+ profiles needs more than 60s even with concurrency control.
// Hobby will silently cap this at 60s, which is fine for low user counts.
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hasAccess } from '@/lib/subscription/access'

export async function GET(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  // Vercel cron sends Authorization: Bearer {CRON_SECRET}
  // Support both that header and x-cron-secret for manual testing
  if (!process.env.CRON_SECRET) {
    console.error('[daily-scrape] CRON_SECRET env var is not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  const cronHeader = request.headers.get('x-cron-secret')
  const isAuthorized =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    cronHeader === process.env.CRON_SECRET

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all business profiles joined to account-status fields so we can
  // filter out expired-trial / unpaid / never-converted users. We only want
  // to burn Outscraper quota on users who currently have access.
  const { data: rawProfiles, error } = await supabaseAdmin
    .from('business_profiles')
    .select(`
      id,
      user_id,
      google_maps_url,
      yelp_url,
      profile:profiles!restaurant_profiles_user_id_fkey (
        is_paid,
        trial_started_at,
        subscription_period_end,
        subscription_canceled_at,
        subscription_past_due
      )
    `)

  if (error) {
    console.error('[daily-scrape] Failed to fetch profiles:', error)
    return NextResponse.json({ error: 'Failed to fetch business profiles' }, { status: 500 })
  }

  if (!rawProfiles || rawProfiles.length === 0) {
    return NextResponse.json({ processed: 0, totalNewReplies: 0, message: 'No profiles configured' })
  }

  // Supabase embed can return the related row as either a single object or an
  // array depending on FK cardinality inference; normalize to a single object.
  const profiles = rawProfiles
    .map((row) => {
      const p = row as unknown as {
        id: string
        user_id: string
        google_maps_url: string | null
        yelp_url: string | null
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
      }
      const profile = Array.isArray(p.profile) ? p.profile[0] ?? null : p.profile
      return { ...p, profile }
    })
    .filter((row) => {
      const access = hasAccess(row.profile)
      if (!access.ok) {
        // Silent skip — expected for expired/abandoned accounts. Log count in summary.
        return false
      }
      return true
    })

  const skipped = rawProfiles.length - profiles.length

  if (profiles.length === 0) {
    return NextResponse.json({
      processed: 0,
      totalNewReplies: 0,
      skipped,
      message: 'No active-access profiles to scrape',
    })
  }

  let processed       = 0
  let totalNewReplies = 0
  const errors: string[] = []

  async function scrape(label: string, endpoint: string, profileId: string, userId: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-cron-secret': process.env.CRON_SECRET! },
      body: JSON.stringify({ userId, restaurantProfileId: profileId }),
    })
    if (res.ok) {
      const result = await res.json()
      return result.newReviews ?? 0
    }
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? res.statusText ?? `HTTP ${res.status}`)
  }

  // Scale-safe fanout: process profiles in concurrency-limited waves rather
  // than firing everything at once. At N=500 users, unbounded parallelism
  // would trigger Outscraper 429s, hit Vercel concurrency caps, and stress
  // Anthropic rate limits. A pool of ~10 in flight keeps load predictable
  // while still finishing a typical daily run well inside maxDuration.
  const PROFILE_CONCURRENCY = 10

  const processProfile = async (profile: typeof profiles[number]) => {
    const tasks: Promise<void>[] = []
    if (profile.google_maps_url) {
      tasks.push(
        scrape('Google', '/api/scrape-reviews', profile.id, profile.user_id)
          .then((n) => { totalNewReplies += n; processed++ })
          .catch((err) => {
            const msg = err instanceof Error ? err.message : String(err)
            console.error(`[daily-scrape] Google failed for profile ${profile.id}:`, msg)
            errors.push(`Google ${profile.id}: ${msg}`)
          })
      )
    }
    if (profile.yelp_url) {
      tasks.push(
        scrape('Yelp', '/api/scrape-yelp-reviews', profile.id, profile.user_id)
          .then((n) => { totalNewReplies += n; processed++ })
          .catch((err) => {
            const msg = err instanceof Error ? err.message : String(err)
            console.error(`[daily-scrape] Yelp failed for profile ${profile.id}:`, msg)
            errors.push(`Yelp ${profile.id}: ${msg}`)
          })
      )
    }
    await Promise.allSettled(tasks)
  }

  // Cheap worker-pool pattern: PROFILE_CONCURRENCY workers pull off a shared
  // queue index until exhausted. No external dep needed.
  let cursor = 0
  const worker = async () => {
    while (true) {
      const i = cursor++
      if (i >= profiles.length) return
      await processProfile(profiles[i])
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(PROFILE_CONCURRENCY, profiles.length) }, worker)
  )

  // After all scrapes complete, fan out to Autopilot processor, digest email,
  // and trial reminders. These are independent — run them in parallel so the
  // cron doesn't blow past Vercel's 60s limit when any one of them is slow.
  // (Chained here rather than as separate cron entries to stay under Vercel
  // Hobby's 2-cron limit.)
  const subCronHeaders = { 'x-cron-secret': process.env.CRON_SECRET! }
  const runSubCron = async (label: string, path: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${path}`, { method: 'GET', headers: subCronHeaders })
      return await res.json().catch(() => ({ error: 'invalid json' }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[daily-scrape] ${label} chain failed:`, msg)
      errors.push(`${label}: ${msg}`)
      return null
    }
  }

  const [autopilot, autopilotDigest, trialReminders, activationEmail] = await Promise.all([
    runSubCron('autopilot', '/api/cron/autopilot'),
    runSubCron('autopilot-digest', '/api/cron/autopilot-digest'),
    runSubCron('trial-reminders', '/api/cron/trial-reminders'),
    runSubCron('activation-email', '/api/cron/activation-email'),
  ])

  return NextResponse.json({
    processed,
    totalNewReplies,
    total:  profiles.length,
    skipped,
    autopilot,
    autopilotDigest,
    trialReminders,
    activationEmail,
    errors: errors.length > 0 ? errors : undefined,
  })
}
