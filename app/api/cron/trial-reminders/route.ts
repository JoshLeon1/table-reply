export const dynamic = 'force-dynamic'

// Trial-reminder cron.
//
// Scans profiles whose 7-day trial is approaching expiration and sends a
// reminder email at T-3 days and T-1 day. Guarded by per-user timestamp
// columns so a reminder is sent at most once per user per variant.
//
// Chained from /api/cron/daily-scrape to stay under Vercel Hobby's 2-cron
// limit. Also accepts a Bearer CRON_SECRET for direct invocation.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TRIAL_DAYS } from '@/lib/subscription'
import { sendTrialReminderEmail, type TrialReminderVariant } from '@/lib/email/trial-reminder'
import { isEmailOptedIn } from '@/lib/email/client'

interface ProfileRow {
  id: string
  trial_started_at: string | null
  is_paid: boolean | null
  full_name: string | null
  welcome_email_sent_at: string | null
  trial_reminder_3d_sent_at: string | null
  trial_reminder_1d_sent_at: string | null
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error('[trial-reminders] CRON_SECRET env var is not set')
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

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const dayMs = 24 * 60 * 60 * 1000
  const now = Date.now()

  // Window boundaries expressed as trial_started_at ISO strings.
  // Trial ends at trial_started_at + TRIAL_DAYS days.
  //   T-3 day reminder: trial_started_at between (now - (TRIAL_DAYS-3) days) and (now - (TRIAL_DAYS-4) days)
  //   T-1 day reminder: trial_started_at between (now - (TRIAL_DAYS-1) days) and (now - (TRIAL_DAYS-2) days)
  // We widen the window to 24h so one-day latency in cron timing never misses a user.

  const threeDayWindowEnd = new Date(now - (TRIAL_DAYS - 3) * dayMs).toISOString()
  const threeDayWindowStart = new Date(now - (TRIAL_DAYS - 2) * dayMs).toISOString()
  const oneDayWindowEnd = new Date(now - (TRIAL_DAYS - 1) * dayMs).toISOString()
  const oneDayWindowStart = new Date(now - TRIAL_DAYS * dayMs).toISOString()

  // Fetch the union of eligible candidates (any trial that started between
  // TRIAL_DAYS days ago and TRIAL_DAYS-4 days ago), not paid.
  const { data: rawProfiles, error } = await supabaseAdmin
    .from('profiles')
    .select(
      'id, trial_started_at, is_paid, full_name, welcome_email_sent_at, trial_reminder_3d_sent_at, trial_reminder_1d_sent_at',
    )
    .not('trial_started_at', 'is', null)
    .or('is_paid.is.null,is_paid.eq.false')
    .gte('trial_started_at', oneDayWindowStart)
    .lte('trial_started_at', threeDayWindowEnd)

  if (error) {
    console.error('[trial-reminders] Failed to fetch profiles:', error)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }

  const profiles = (rawProfiles ?? []) as ProfileRow[]
  if (profiles.length === 0) {
    return NextResponse.json({ scanned: 0, sent3d: 0, sent1d: 0 })
  }

  // Resolve emails via auth.admin.listUsers. Paginate in case >1000.
  const authUsers: Array<{ id: string; email?: string }> = []
  let page = 1
  while (true) {
    const { data: pg, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    })
    if (authErr) {
      console.error('[trial-reminders] Failed to list auth users (page', page, '):', authErr)
      return NextResponse.json({ error: 'Failed to list auth users' }, { status: 500 })
    }
    authUsers.push(...pg.users)
    if (pg.users.length < 1000) break
    page++
  }
  const emailById = new Map(authUsers.map((u) => [u.id, u.email ?? '']))

  let sent3d = 0
  let sent1d = 0
  const errors: string[] = []

  for (const p of profiles) {
    if (!p.trial_started_at) continue
    const email = emailById.get(p.id)
    if (!email) continue

    // Decide variant. 1-day takes priority — if somehow both windows match,
    // send the more urgent one first.
    let variant: TrialReminderVariant | null = null
    if (
      !p.trial_reminder_1d_sent_at &&
      p.trial_started_at >= oneDayWindowStart &&
      p.trial_started_at <= oneDayWindowEnd
    ) {
      variant = '1day'
    } else if (
      !p.trial_reminder_3d_sent_at &&
      p.trial_started_at >= threeDayWindowStart &&
      p.trial_started_at <= threeDayWindowEnd
    ) {
      variant = '3day'
    }

    if (!variant) continue

    // Honor the user's email-notification opt-out for trial reminders.
    // Still mark the column so we don't re-check every cron run.
    const optedIn = await isEmailOptedIn(supabaseAdmin, p.id, 'trialReminders')
    if (!optedIn) {
      const col =
        variant === '1day' ? 'trial_reminder_1d_sent_at' : 'trial_reminder_3d_sent_at'
      await supabaseAdmin
        .from('profiles')
        .update({ [col]: new Date().toISOString() })
        .eq('id', p.id)
      continue
    }

    // Count replies generated during the trial for social proof
    let repliedCount: number | undefined
    try {
      const { count } = await supabaseAdmin
        .from('scraped_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', p.id)
        .not('generated_reply', 'is', null)
      repliedCount = count ?? undefined
    } catch {
      // Non-critical
    }

    const result = await sendTrialReminderEmail({
      toEmail: email,
      firstName: p.full_name,
      variant,
      repliedCount,
    })

    if ('error' in result && result.error) {
      errors.push(`${p.id} (${variant}): ${JSON.stringify(result.error)}`)
      continue
    }
    if (result.skipped) continue

    const col =
      variant === '1day' ? 'trial_reminder_1d_sent_at' : 'trial_reminder_3d_sent_at'
    await supabaseAdmin
      .from('profiles')
      .update({ [col]: new Date().toISOString() })
      .eq('id', p.id)

    if (variant === '1day') sent1d++
    else sent3d++
  }

  return NextResponse.json({
    scanned: profiles.length,
    sent3d,
    sent1d,
    errors: errors.length > 0 ? errors : undefined,
  })
}
