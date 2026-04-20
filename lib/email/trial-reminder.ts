// lib/email/trial-reminder.ts
//
// Sent twice during a user's 7-day trial: at T-3 days and T-1 day.
// Idempotent: guarded by profiles.trial_reminder_3d_sent_at /
// trial_reminder_1d_sent_at timestamps written by the caller after a
// successful send.

import { FROM_BILLING, REPLY_TO_SUPPORT, buildUnsubscribeHeaders, escapeHtml, getResend } from './client'

export type TrialReminderVariant = '3day' | '1day'

export interface TrialReminderEmailInput {
  toEmail: string
  firstName?: string | null
  variant: TrialReminderVariant
  /** Number of new reviews replied to during the trial so far, for social proof */
  repliedCount?: number
}

export async function sendTrialReminderEmail(input: TrialReminderEmailInput) {
  const resend = getResend()
  if (!resend) {
    console.warn('[trial-reminder] RESEND_API_KEY not set — skipping')
    return { skipped: true as const }
  }

  const { toEmail, firstName, variant, repliedCount } = input
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://replyfi.app').replace(/\/$/, '')
  const upgradeLink = `${appUrl}/settings?tab=account`
  const name = firstName?.trim() ? escapeHtml(firstName.trim().split(/\s+/)[0]) : 'there'

  const is3day = variant === '3day'
  const subject = is3day
    ? 'Your ReplyFi trial ends in 3 days'
    : 'Your ReplyFi trial ends tomorrow'
  const headline = is3day
    ? '3 days left on your trial'
    : 'Your trial ends tomorrow'
  const urgencyLine = is3day
    ? 'You have 3 days left to lock in your subscription before access pauses.'
    : 'Your trial ends in ~24 hours. After that, new reviews stop getting drafted replies.'

  const stats = typeof repliedCount === 'number' && repliedCount > 0
    ? `<div style="background:#F3F0EC;border-radius:10px;padding:14px 16px;margin:0 0 22px;">
         <p style="font-size:13px;line-height:1.5;color:#57534E;margin:0;">
           <strong style="color:#111;">Since you started:</strong> ReplyFi has drafted replies for <strong>${repliedCount}</strong> ${repliedCount === 1 ? 'review' : 'reviews'} for you.
         </p>
       </div>`
    : ''

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111;">
    <div style="margin:0 0 24px;">
      <span style="display:inline-block;font-weight:800;font-size:18px;letter-spacing:-0.01em;color:#111;">ReplyFi</span>
    </div>

    <h1 style="font-size:22px;font-weight:700;margin:0 0 14px;line-height:1.3;">${headline}, ${name}.</h1>

    <p style="font-size:14px;line-height:1.6;color:#444;margin:0 0 18px;">
      ${urgencyLine}
    </p>

    ${stats}

    <p style="font-size:14px;line-height:1.6;color:#444;margin:0 0 22px;">
      Subscribe now and your review-drafting keeps running without interruption. Cancel anytime from your account settings.
    </p>

    <a href="${upgradeLink}" style="display:inline-block;background:#E05A28;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;">
      Keep ReplyFi running →
    </a>

    <div style="margin-top:32px;padding-top:22px;border-top:1px solid #EDE9E4;">
      <p style="font-size:13px;line-height:1.6;color:#57534E;margin:0;">
        Questions? Just reply to this email — a real human reads every one.
      </p>
    </div>
  </div>`

  const { error: sendError } = await resend.emails.send({
    from: FROM_BILLING,
    to: toEmail,
    replyTo: REPLY_TO_SUPPORT,
    subject,
    html,
    headers: buildUnsubscribeHeaders(),
  })

  if (sendError) {
    console.error('[trial-reminder] Resend send failed:', sendError)
    return { skipped: false as const, error: sendError }
  }

  return { skipped: false as const }
}
