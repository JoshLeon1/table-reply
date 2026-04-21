export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { FROM_DIGEST, REPLY_TO_SUPPORT, buildUnsubscribeHeaders, escapeHtml, getResend } from '@/lib/email/client'
import { hasActiveAccess } from '@/lib/subscription'
import type { AutopilotRules } from '@/types'

// ---------------------------------------------------------------------------
// Auth guard
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
// Email template
// ---------------------------------------------------------------------------

interface DigestCounts {
  auto_approved: number
  draft_only: number
  escalated_low_rating: number
  escalated_keyword: number
  skipped_no_text: number
  total: number
}

function buildDigestHtml(params: {
  businessName: string
  counts: DigestCounts
}): string {
  const { businessName, counts } = params
  const safeName = escapeHtml(businessName)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://replyfi.app'

  const statRows = [
    counts.auto_approved    > 0 && { label: 'Auto-approved replies',    value: counts.auto_approved,    color: '#0B8A5B' },
    counts.draft_only       > 0 && { label: 'Drafts ready for review',  value: counts.draft_only,       color: '#111827' },
    counts.escalated_low_rating > 0 && { label: 'Escalated (low rating)',   value: counts.escalated_low_rating, color: '#B84A1A' },
    counts.escalated_keyword > 0 && { label: 'Escalated (keyword)',      value: counts.escalated_keyword, color: '#B84A1A' },
    counts.skipped_no_text  > 0 && { label: 'Skipped (no text)',         value: counts.skipped_no_text,  color: '#9CA3AF' },
  ].filter(Boolean) as { label: string; value: number; color: string }[]

  const statRowsHtml = statRows.map(({ label, value, color }) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #EDE6DC;font-size:14px;color:#374151;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #EDE6DC;text-align:right;font-size:16px;font-weight:700;color:${color};">${value}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Autopilot processed ${counts.total} replies — ${safeName}</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF7F2;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FEFCF8;border-radius:12px;overflow:hidden;border:1px solid #EDE6DC;">

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid #EDE6DC;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#E05A28;letter-spacing:.08em;text-transform:uppercase;">ReplyFi Autopilot</p>
              <p style="margin:0;font-size:22px;font-weight:600;color:#111111;letter-spacing:-0.022em;">Overnight run complete</p>
              <p style="margin:6px 0 0;font-size:13px;color:#57534E;">${safeName} &middot; ${counts.total} review${counts.total !== 1 ? 's' : ''} processed</p>
            </td>
          </tr>

          <!-- Stats table -->
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${statRowsHtml}
              </table>
            </td>
          </tr>

          <!-- Explainer -->
          ${(counts.escalated_low_rating > 0 || counts.escalated_keyword > 0) ? `
          <tr>
            <td style="padding:0 32px 24px;">
              <div style="background:#FEF0E8;border:1px solid #F5C9AD;border-radius:8px;padding:14px 16px;">
                <p style="margin:0;font-size:13px;color:#B34419;line-height:1.6;">
                  <strong>${counts.escalated_low_rating + counts.escalated_keyword} review${(counts.escalated_low_rating + counts.escalated_keyword) !== 1 ? 's were' : ' was'} escalated</strong> to your queue —
                  Autopilot flagged them as high-risk (low rating or blocked keyword). Check the Pending tab.
                </p>
              </div>
            </td>
          </tr>` : ''}

          <!-- CTA -->
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <a href="${appUrl}/dashboard/reviews?filter=autopilot"
                 style="display:inline-block;background-color:#E05A28;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 28px;border-radius:8px;letter-spacing:.01em;">
                View Autopilot Queue &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F3EEE4;padding:16px 32px;border-top:1px solid #EDE6DC;text-align:center;">
              <p style="margin:0;font-size:12px;color:#A8A29E;">
                &copy; ReplyFi &nbsp;&middot;&nbsp;
                <a href="${appUrl}/settings?tab=replies" style="color:#A8A29E;text-decoration:underline;">Manage Autopilot</a>
                &nbsp;&middot;&nbsp;
                <a href="${appUrl}/settings?tab=account" style="color:#A8A29E;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// GET /api/cron/autopilot-digest  (Vercel cron sends GET)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error('[autopilot-digest] CRON_SECRET env var is not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = getResend()
  if (!resend) {
    console.error('[autopilot-digest] RESEND_API_KEY is not set — cannot send emails')
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── 1. Find ANY location with autopilot.enabled + dailyDigest ──────────────
  // Previously filtered to is_primary=true, which silently dropped digest
  // emails for multi-location users whose digest was enabled on a secondary
  // location. Group by user_id so each user gets exactly one email that
  // aggregates autopilot activity across ALL of their locations.
  const { data: digestProfiles, error: profilesErr } = await supabase
    .from('business_profiles')
    .select('id, user_id, business_name, is_primary, reply_preferences')
    .filter('reply_preferences->autopilot->>enabled', 'eq', 'true')
    .filter('reply_preferences->autopilot->>dailyDigest', 'eq', 'true')

  if (profilesErr) {
    console.error('[autopilot-digest] Failed to fetch profiles:', profilesErr)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }

  if (!digestProfiles || digestProfiles.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0 })
  }

  // Collect every user who opted in on at least one location.
  const optedInUserIds = Array.from(new Set(digestProfiles.map((p) => p.user_id)))

  // For each user, fetch ALL of their locations so the digest covers every
  // autopilot action regardless of which location produced it.
  const { data: allLocations, error: allErr } = await supabase
    .from('business_profiles')
    .select('id, user_id, business_name, is_primary')
    .in('user_id', optedInUserIds)

  if (allErr) {
    console.error('[autopilot-digest] Failed to fetch all locations:', allErr)
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }

  const locationsByUser = new Map<string, Array<{ id: string; user_id: string; business_name: string; is_primary: boolean | null }>>()
  for (const loc of allLocations ?? []) {
    const list = locationsByUser.get(loc.user_id) ?? []
    list.push(loc)
    locationsByUser.set(loc.user_id, list)
  }

  // ── 2. Batch-fetch auth users for email addresses ───────────────────────────
  const allAuthUsers: Array<{ id: string; email?: string }> = []
  let page = 1
  while (true) {
    const { data: authPage, error: authErr } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (authErr) {
      console.error('[autopilot-digest] Failed to list auth users:', authErr)
      return NextResponse.json({ error: 'Failed to fetch auth users' }, { status: 500 })
    }
    allAuthUsers.push(...authPage.users)
    if (authPage.users.length < 1000) break
    page++
  }
  const emailMap = new Map<string, string>(allAuthUsers.map((u) => [u.id, u.email ?? '']))

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  let sent = 0
  let skipped = 0

  for (const userId of optedInUserIds) {
    try {
      const userEmail = emailMap.get(userId)
      if (!userEmail) { skipped++; continue }

      // Skip churned / expired-trial users
      const hasAccess = await hasActiveAccess(supabase, userId)
      if (!hasAccess) { skipped++; continue }

      const userLocations = locationsByUser.get(userId) ?? []
      if (userLocations.length === 0) { skipped++; continue }
      const locationIds = userLocations.map((l) => l.id)

      // Fetch autopilot activity across ALL of this user's locations
      const { data: rows, error: rowsErr } = await supabase
        .from('scraped_reviews')
        .select('autopilot_action')
        .in('business_profile_id', locationIds)
        .eq('autopilot_handled', true)
        .gte('autopilot_processed_at', since24h)

      if (rowsErr) {
        console.error(`[autopilot-digest] Error fetching reviews for user ${userId}:`, rowsErr)
        skipped++
        continue
      }

      if (!rows || rows.length === 0) { skipped++; continue }

      const counts: DigestCounts = {
        auto_approved: 0,
        draft_only: 0,
        escalated_low_rating: 0,
        escalated_keyword: 0,
        skipped_no_text: 0,
        total: rows.length,
      }
      for (const row of rows) {
        const a = row.autopilot_action as keyof Omit<DigestCounts, 'total'>
        if (a && a in counts) counts[a]++
      }

      // Defensive: confirm at least one of this user's digest-opted-in
      // profiles still has dailyDigest set (protects against race with a
      // settings-save that ran between the two SELECTs above).
      const userDigestProfiles = digestProfiles.filter((p) => p.user_id === userId)
      const stillOptedIn = userDigestProfiles.some((p) => {
        const prefs = p.reply_preferences as { autopilot?: AutopilotRules } | null
        return prefs?.autopilot?.dailyDigest === true
      })
      if (!stillOptedIn) { skipped++; continue }

      // Use the primary location's name as the digest label; fall back to
      // the first location if no primary is marked (shouldn't happen).
      const primary = userLocations.find((l) => l.is_primary) ?? userLocations[0]
      const businessLabel = userLocations.length > 1
        ? `${primary.business_name} + ${userLocations.length - 1} more`
        : primary.business_name

      const subject = `Autopilot processed ${counts.total} ${counts.total === 1 ? 'reply' : 'replies'} overnight`

      const { error: sendErr } = await resend.emails.send({
        from: FROM_DIGEST,
        to: userEmail,
        replyTo: REPLY_TO_SUPPORT,
        subject,
        headers: buildUnsubscribeHeaders(),
        html: buildDigestHtml({ businessName: businessLabel, counts }),
      })

      if (sendErr) {
        console.error(`[autopilot-digest] Resend error for user ${userId}:`, sendErr)
        skipped++
        continue
      }

      console.log(`[autopilot-digest] Sent to ${userEmail} — ${counts.total} processed across ${userLocations.length} location(s)`)
      sent++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[autopilot-digest] Unexpected error for user ${userId}:`, msg)
      skipped++
    }
  }

  console.log(`[autopilot-digest] Done — sent: ${sent}, skipped: ${skipped}`)
  return NextResponse.json({ sent, skipped })
}
