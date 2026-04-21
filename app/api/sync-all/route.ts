export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { hasActiveAccess } from '@/lib/subscription'

/**
 * POST /api/sync-all
 *
 * Syncs all connected platforms (Google Maps, Yelp) for the
 * authenticated user in parallel. Returns a combined newReviews count.
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── Auth ───────────────────────────────────────────────────────────────
    const userSupabase = createServerClient()
    const { data: { user } } = await userSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await hasActiveAccess(supabaseAdmin, user.id)
    if (!allowed) return NextResponse.json({ error: 'Subscription required' }, { status: 402 })

    // ── Fetch profile ──────────────────────────────────────────────────────
    const { data: profile } = await supabaseAdmin
      .from('business_profiles')
      .select('id, google_maps_url, yelp_url')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    }

    const { google_maps_url, yelp_url } = profile

    if (!google_maps_url && !yelp_url) {
      return NextResponse.json({ error: 'No review platforms connected. Go to Settings to connect Google Maps or Yelp.' }, { status: 400 })
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('[sync-all] NEXT_PUBLIC_APP_URL is not set')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')

    // ── Fire all connected platforms in parallel ───────────────────────────
    const tasks: Array<{ platform: string; endpoint: string }> = []
    if (google_maps_url)  tasks.push({ platform: 'Google Maps',  endpoint: `${baseUrl}/api/scrape-reviews` })
    if (yelp_url)         tasks.push({ platform: 'Yelp',         endpoint: `${baseUrl}/api/scrape-yelp-reviews` })

    if (!process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const body = JSON.stringify({ userId: user.id, restaurantProfileId: profile.id })
    const headers = {
      'Content-Type': 'application/json',
      'x-cron-secret': process.env.CRON_SECRET,
    }

    const results = await Promise.allSettled(
      tasks.map(({ endpoint }) =>
        fetch(endpoint, { method: 'POST', headers, body })
          .then(r => r.json())
      )
    )

    let totalNew = 0
    const errors: string[] = []

    results.forEach((result, i) => {
      const { platform } = tasks[i]
      if (result.status === 'fulfilled') {
        totalNew += result.value.newReviews ?? 0
        if (result.value.error) {
          errors.push(`${platform}: ${result.value.error}`)
        }
      } else {
        errors.push(`${platform}: ${result.reason?.message ?? 'failed'}`)
      }
    })

    return NextResponse.json({
      newReviews: totalNew,
      platforms: tasks.map(t => t.platform),
      ...(errors.length > 0 ? { errors } : {}),
    })
  } catch (err) {
    console.error('[sync-all] Unhandled error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
