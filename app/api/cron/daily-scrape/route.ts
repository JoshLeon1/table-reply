import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
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

  // Fetch every restaurant profile that has a Google Maps URL configured
  const { data: profiles, error } = await supabaseAdmin
    .from('restaurant_profiles')
    .select('id, user_id')
    .not('google_maps_url', 'is', null)

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
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/scrape-reviews`, {
        method:  'POST',
        headers: {
          'Content-Type':   'application/json',
          'x-cron-secret':  process.env.CRON_SECRET!,
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
        errors.push(`Profile ${profile.id}: ${err.error ?? res.statusText}`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[daily-scrape] Failed to scrape profile ${profile.id}:`, msg)
      errors.push(`Profile ${profile.id}: ${msg}`)
    }
  }

  return NextResponse.json({
    processed,
    totalNewReplies,
    total:  profiles.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
