export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(str: string | null | undefined, max: number): string {
  if (!str) return ''
  return str.length <= max ? str : str.slice(0, max).trimEnd() + '…'
}

function starString(rating: number): string {
  const full = Math.round(rating)
  return '★'.repeat(full) + '☆'.repeat(Math.max(0, 5 - full))
}

function buildHtml(params: {
  businessName: string
  newReviewCount: number
  avgRating: number | null
  approvedCount: number
  reviews: Array<{
    reviewerName: string
    starRating: number
    reviewText: string | null
    generatedReply: string | null
  }>
}): string {
  const { businessName, newReviewCount, avgRating, approvedCount, reviews } = params

  const avgDisplay = avgRating != null ? avgRating.toFixed(1) + ' ★' : 'N/A'

  const reviewRows = reviews
    .slice(0, 5)
    .map(
      (r) => `
      <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #e5e7eb;">
        <div style="margin-bottom:6px;">
          <span style="font-weight:600;color:#111827;">${r.reviewerName || 'Anonymous'}</span>
          <span style="margin-left:10px;color:#E0A020;letter-spacing:1px;">${starString(r.starRating)}</span>
        </div>
        ${
          r.reviewText
            ? `<p style="margin:0 0 10px;color:#374151;font-size:14px;line-height:1.6;">${truncate(r.reviewText, 150)}</p>`
            : ''
        }
        ${
          r.generatedReply
            ? `<div style="background:#f3f4f6;border-left:3px solid #E05A28;padding:10px 14px;border-radius:4px;">
                <p style="margin:0;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Your reply</p>
                <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">${truncate(r.generatedReply, 200)}</p>
              </div>`
            : ''
        }
      </div>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Your weekly review summary — ${businessName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#111827;padding:28px 32px;">
              <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#E05A28;letter-spacing:.5px;">Replyfi</p>
              <p style="margin:0;font-size:22px;font-weight:600;color:#ffffff;">${businessName}</p>
              <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">Weekly review digest</p>
            </td>
          </tr>

          <!-- Stats row -->
          <tr>
            <td style="padding:24px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align:center;padding:16px 8px;border:2px solid #E05A28;border-radius:6px;margin:0 4px;">
                    <p style="margin:0;font-size:28px;font-weight:700;color:#111827;">${newReviewCount}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">New Reviews</p>
                  </td>
                  <td width="4px"></td>
                  <td width="33%" style="text-align:center;padding:16px 8px;border:2px solid #E05A28;border-radius:6px;">
                    <p style="margin:0;font-size:28px;font-weight:700;color:#111827;">${avgDisplay}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Avg Rating This Week</p>
                  </td>
                  <td width="4px"></td>
                  <td width="33%" style="text-align:center;padding:16px 8px;border:2px solid #E05A28;border-radius:6px;">
                    <p style="margin:0;font-size:28px;font-weight:700;color:#111827;">${approvedCount}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Replies Approved</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Reviews section -->
          <tr>
            <td style="padding:28px 32px 8px;">
              <h2 style="margin:0 0 20px;font-size:16px;font-weight:600;color:#111827;">This week at ${businessName}:</h2>
              ${reviewRows}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:8px 32px 32px;text-align:center;">
              <a href="https://replyfi.com/dashboard/reviews"
                 style="display:inline-block;background-color:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:6px;letter-spacing:.3px;">
                View All Reviews →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © Replyfi &nbsp;·&nbsp;
                <a href="https://replyfi.com/settings" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
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
// POST /api/digest
// ---------------------------------------------------------------------------

// Vercel cron always sends GET — alias it to the same handler
export async function GET(request: NextRequest) {
  return POST(request)
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const resend = new Resend(process.env.RESEND_API_KEY!)
  // Auth: accept Vercel cron Bearer token or manual x-cron-secret header
  const authHeader = request.headers.get('authorization')
  const cronHeader = request.headers.get('x-cron-secret')
  const isAuthorized =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    cronHeader === process.env.CRON_SECRET

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[digest] Starting weekly email digest run')

  // -------------------------------------------------------------------------
  // 1. Fetch eligible profiles
  //    - email_notifications->>'newReviewsScrapped' = 'true'
  //    - is_paid OR trial not expired (trial_started_at within 14 days)
  // -------------------------------------------------------------------------
  const trialCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, is_paid, trial_started_at, email_notifications')
    .eq('email_notifications->>newReviewsScrapped', 'true')

  if (profilesError) {
    console.error('[digest] Failed to fetch profiles:', profilesError)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    console.log('[digest] No eligible profiles found')
    return NextResponse.json({ sent: 0, skipped: 0 })
  }

  // Filter to paid or active trial users
  const eligibleProfiles = profiles.filter((p) => {
    if (p.is_paid) return true
    if (p.trial_started_at && p.trial_started_at >= trialCutoff) return true
    return false
  })

  console.log(`[digest] ${eligibleProfiles.length} eligible profiles (of ${profiles.length} with notifications on)`)

  // -------------------------------------------------------------------------
  // 2. Fetch all auth users in one call to cross-reference emails
  // -------------------------------------------------------------------------
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  })

  if (authError) {
    console.error('[digest] Failed to fetch auth users:', authError)
    return NextResponse.json({ error: 'Failed to fetch auth users' }, { status: 500 })
  }

  const emailMap = new Map<string, string>(
    authUsers.users.map((u) => [u.id, u.email ?? '']),
  )

  // -------------------------------------------------------------------------
  // 3. Process each user
  // -------------------------------------------------------------------------
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  let sent = 0
  let skipped = 0

  for (const profile of eligibleProfiles) {
    try {
      const userEmail = emailMap.get(profile.id)
      if (!userEmail) {
        console.warn(`[digest] No email for user ${profile.id}, skipping`)
        skipped++
        continue
      }

      // Fetch business profile
      const { data: restaurant, error: restError } = await supabaseAdmin
        .from('business_profiles')
        .select('id, business_name')
        .eq('user_id', profile.id)
        .single()

      if (restError || !restaurant) {
        console.warn(`[digest] No business profile for user ${profile.id}, skipping`)
        skipped++
        continue
      }

      // Fetch scraped reviews from the past 7 days
      // NOTE: actual DB column is scraped_at (not created_at)
      const { data: reviews, error: reviewsError } = await supabaseAdmin
        .from('scraped_reviews')
        .select('id, reviewer_name, star_rating, review_text, generated_reply, reply_status')
        .eq('user_id', profile.id)
        .gte('scraped_at', sevenDaysAgo)
        .order('star_rating', { ascending: false })

      if (reviewsError) {
        console.error(`[digest] Failed to fetch reviews for user ${profile.id}:`, reviewsError)
        skipped++
        continue
      }

      if (!reviews || reviews.length === 0) {
        console.log(`[digest] No new reviews for user ${profile.id} (${restaurant.business_name}), skipping`)
        skipped++
        continue
      }

      // Stats
      const reviewsWithText = reviews.filter((r) => r.review_text?.trim())
      const approvedCount = reviews.filter((r) => r.reply_status === 'approved').length
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.star_rating ?? 0), 0) / reviews.length
          : null

      // Send email
      const { error: sendError } = await resend.emails.send({
        from: 'Replyfi <digest@replyfi.com>',
        to: userEmail,
        subject: `Your weekly review summary — ${restaurant.business_name}`,
        html: buildHtml({
          businessName: restaurant.business_name,
          newReviewCount: reviews.length,
          avgRating,
          approvedCount,
          reviews: reviewsWithText.map((r) => ({
            reviewerName: r.reviewer_name,
            starRating: r.star_rating,
            reviewText: r.review_text,
            generatedReply: r.generated_reply,
          })),
        }),
      })

      if (sendError) {
        console.error(`[digest] Resend error for user ${profile.id}:`, sendError)
        skipped++
        continue
      }

      console.log(
        `[digest] Sent digest to ${userEmail} (${restaurant.business_name}) — ${reviews.length} reviews, ${approvedCount} approved`,
      )
      sent++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[digest] Unexpected error for user ${profile.id}:`, msg)
      skipped++
    }
  }

  console.log(`[digest] Done — sent: ${sent}, skipped: ${skipped}`)
  return NextResponse.json({ sent, skipped })
}
