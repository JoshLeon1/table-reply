export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  // Fetch all restaurant profiles (we'll filter per platform below)
  const { data: profiles, error } = await supabaseAdmin
    .from('business_profiles')
    .select('id, user_id, google_maps_url, yelp_url, tripadvisor_url')

  if (error) {
    console.error('[daily-scrape] Failed to fetch profiles:', error)
    return NextResponse.json({ error: 'Failed to fetch restaurant profiles' }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ processed: 0, totalNewReplies: 0, message: 'No profiles configured' })
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

  // Process all profiles in parallel (up to all at once — each scrape is network-bound)
  await Promise.allSettled(
    profiles.map(async (profile) => {
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
            .then((n) => { totalNewReplies += n })
            .catch((err) => {
              const msg = err instanceof Error ? err.message : String(err)
              console.error(`[daily-scrape] Yelp failed for profile ${profile.id}:`, msg)
              errors.push(`Yelp ${profile.id}: ${msg}`)
            })
        )
      }

      if (profile.tripadvisor_url) {
        tasks.push(
          scrape('TripAdvisor', '/api/scrape-tripadvisor-reviews', profile.id, profile.user_id)
            .then((n) => { totalNewReplies += n })
            .catch((err) => {
              const msg = err instanceof Error ? err.message : String(err)
              console.error(`[daily-scrape] TripAdvisor failed for profile ${profile.id}:`, msg)
              errors.push(`TripAdvisor ${profile.id}: ${msg}`)
            })
        )
      }

      await Promise.allSettled(tasks)
    })
  )

  return NextResponse.json({
    processed,
    totalNewReplies,
    total:  profiles.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
