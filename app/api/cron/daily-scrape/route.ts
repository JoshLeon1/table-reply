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
    .from('restaurant_profiles')
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

  for (const profile of profiles) {
    // ── Google scrape ───────────────────────────────────────────────────
    if (profile.google_maps_url) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/scrape-reviews`, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'x-cron-secret': process.env.CRON_SECRET!,
          },
          body: JSON.stringify({
            userId:              profile.user_id,
            restaurantProfileId: profile.id,
          }),
        })

        if (res.ok) {
          const result = await res.json()
          totalNewReplies += result.newReviews ?? 0
          processed++
        } else {
          const err = await res.json().catch(() => ({}))
          errors.push(`Google profile ${profile.id}: ${err.error ?? res.statusText}`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[daily-scrape] Google failed for profile ${profile.id}:`, msg)
        errors.push(`Google profile ${profile.id}: ${msg}`)
      }
    }

    // ── Yelp scrape ─────────────────────────────────────────────────────
    if (profile.yelp_url) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/scrape-yelp-reviews`, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'x-cron-secret': process.env.CRON_SECRET!,
          },
          body: JSON.stringify({
            userId:              profile.user_id,
            restaurantProfileId: profile.id,
          }),
        })

        if (res.ok) {
          const result = await res.json()
          totalNewReplies += result.newReviews ?? 0
        } else {
          const err = await res.json().catch(() => ({}))
          errors.push(`Yelp profile ${profile.id}: ${err.error ?? res.statusText}`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[daily-scrape] Yelp failed for profile ${profile.id}:`, msg)
        errors.push(`Yelp profile ${profile.id}: ${msg}`)
      }
    }

    // ── TripAdvisor scrape ───────────────────────────────────────────────
    if (profile.tripadvisor_url) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/scrape-tripadvisor-reviews`, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'x-cron-secret': process.env.CRON_SECRET!,
          },
          body: JSON.stringify({
            userId:              profile.user_id,
            restaurantProfileId: profile.id,
          }),
        })

        if (res.ok) {
          const result = await res.json()
          totalNewReplies += result.newReviews ?? 0
        } else {
          const err = await res.json().catch(() => ({}))
          errors.push(`TripAdvisor profile ${profile.id}: ${err.error ?? res.statusText}`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[daily-scrape] TripAdvisor failed for profile ${profile.id}:`, msg)
        errors.push(`TripAdvisor profile ${profile.id}: ${msg}`)
      }
    }
  }

  return NextResponse.json({
    processed,
    totalNewReplies,
    total:  profiles.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
