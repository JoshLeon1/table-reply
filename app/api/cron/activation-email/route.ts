export const dynamic = 'force-dynamic'

// Activation email cron.
//
// Runs ~24 hours after a user's trial_started_at. Sends one of two variants:
//   'ready'   — user has a connected platform (replies are waiting to approve)
//   'connect' — user never connected Google/Yelp (nudge them to do it)
//
// Chained from /api/cron/daily-scrape. Also accepts direct invocation with
// a Bearer CRON_SECRET for manual testing.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendActivationEmail, type ActivationVariant } from '@/lib/email/activation'

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error('[activation-email] CRON_SECRET env var is not set')
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const dayMs = 24 * 60 * 60 * 1000
  const now   = Date.now()

  // Target users whose trial started 22–26 hours ago (wider than 24h so
  // cron timing jitter never skips someone). Guarded by activation_email_sent_at
  // so the email sends exactly once per user regardless of how many times the
  // cron runs within the window.
  const windowStart = new Date(now - 26 * 60 * 60 * 1000).toISOString()
  const windowEnd   = new Date(now - 22 * 60 * 60 * 1000).toISOString()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, activation_email_sent_at')
    .not('trial_started_at', 'is', null)
    .is('activation_email_sent_at', null)
    .gte('trial_started_at', windowStart)
    .lte('trial_started_at', windowEnd)

  if (error) {
    console.error('[activation-email] Failed to fetch profiles:', error)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ scanned: 0, sent: 0 })
  }

  // Resolve emails via auth admin (not stored in profiles table)
  const authUsers: Array<{ id: string; email?: string }> = []
  let page = 1
  while (true) {
    const { data: pg, error: authErr } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (authErr) {
      console.error('[activation-email] Failed to list auth users:', authErr)
      return NextResponse.json({ error: 'Failed to list auth users' }, { status: 500 })
    }
    authUsers.push(...pg.users)
    if (pg.users.length < 1000) break
    page++
  }
  const emailById = new Map(authUsers.map(u => [u.id, u.email ?? '']))

  // Fetch business profiles for all matching users in one query
  const userIds = profiles.map(p => p.id)
  const { data: bizProfiles } = await supabase
    .from('business_profiles')
    .select('user_id, business_name, google_maps_url, yelp_url')
    .in('user_id', userIds)
    .eq('is_primary', true)

  const bizByUserId = new Map(
    (bizProfiles ?? []).map(b => [b.user_id, b])
  )

  // Fetch pending reply counts for users who have a connected platform
  const connectedUserIds = (bizProfiles ?? [])
    .filter(b => b.google_maps_url || b.yelp_url)
    .map(b => b.user_id)

  const pendingCountByUserId = new Map<string, number>()
  if (connectedUserIds.length > 0) {
    const { data: pendingRows } = await supabase
      .from('scraped_reviews')
      .select('user_id')
      .in('user_id', connectedUserIds)
      .eq('reply_status', 'pending')
      .not('generated_reply', 'is', null)

    for (const row of pendingRows ?? []) {
      pendingCountByUserId.set(row.user_id, (pendingCountByUserId.get(row.user_id) ?? 0) + 1)
    }
  }

  let sent = 0
  const errors: string[] = []

  for (const p of profiles) {
    const email = emailById.get(p.id)
    if (!email) continue

    const biz = bizByUserId.get(p.id)
    const hasConnectedPlatform = !!(biz?.google_maps_url || biz?.yelp_url)

    const variant: ActivationVariant = hasConnectedPlatform ? 'ready' : 'connect'
    const pendingCount = pendingCountByUserId.get(p.id) ?? 0

    const result = await sendActivationEmail({
      toEmail: email,
      firstName: p.full_name,
      businessName: biz?.business_name,
      variant,
      pendingCount,
    })

    if ('error' in result && result.error) {
      errors.push(`${p.id}: ${JSON.stringify(result.error)}`)
      continue
    }

    // Mark as sent regardless of skipped (RESEND_API_KEY missing) so we
    // don't re-attempt on every cron run when the key is absent in dev.
    await supabase
      .from('profiles')
      .update({ activation_email_sent_at: new Date().toISOString() })
      .eq('id', p.id)

    if (!result.skipped) sent++
  }

  return NextResponse.json({
    scanned: profiles.length,
    sent,
    errors: errors.length > 0 ? errors : undefined,
  })
}
