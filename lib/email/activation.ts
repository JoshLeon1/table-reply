// lib/email/activation.ts
//
// Sent ~24 hours after trial_started_at — the first product-value email.
// Two variants:
//   'ready'   — user connected a platform and has AI replies waiting to approve
//   'connect' — user never connected Google/Yelp, nudge them to do it
//
// Idempotent: guarded by profiles.activation_email_sent_at written by caller.

import { FROM_DIGEST, REPLY_TO_SUPPORT, buildUnsubscribeHeaders, escapeHtml, getResend } from './client'

export type ActivationVariant = 'ready' | 'connect'

export interface ActivationEmailInput {
  toEmail: string
  firstName?: string | null
  businessName?: string | null
  variant: ActivationVariant
  pendingCount?: number
}

export async function sendActivationEmail(input: ActivationEmailInput) {
  const resend = getResend()
  if (!resend) {
    console.warn('[activation-email] RESEND_API_KEY not set — skipping')
    return { skipped: true as const }
  }

  const { toEmail, firstName, businessName, variant, pendingCount = 0 } = input
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://replyfi.app').replace(/\/$/, '')
  const name = firstName?.trim() ? escapeHtml(firstName.trim().split(/\s+/)[0]) : 'there'
  const biz  = businessName?.trim() ? escapeHtml(businessName.trim()) : 'your business'

  const isReady = variant === 'ready'

  const subject = isReady
    ? `Your first AI ${pendingCount === 1 ? 'reply is' : 'replies are'} ready to approve`
    : 'One step away from your first AI reply'

  const headline = isReady
    ? `Your ${pendingCount > 1 ? `${pendingCount} ` : ''}AI ${pendingCount === 1 ? 'reply is' : 'replies are'} waiting, ${name}.`
    : `You're one step away, ${name}.`

  const body = isReady
    ? `ReplyFi has drafted ${pendingCount > 1 ? `${pendingCount} replies` : 'a reply'} for <strong>${biz}</strong>. Read it over, hit approve, and it's ready to paste into Google — takes about 30 seconds.`
    : `Connect your Google Maps listing and ReplyFi will draft AI replies for every review — automatically. It takes about 60 seconds to set up.`

  const ctaHref = isReady ? `${appUrl}/dashboard` : `${appUrl}/dashboard/settings?tab=integrations`
  const ctaLabel = isReady ? 'Review & approve replies →' : 'Connect Google Maps →'

  const tipHtml = isReady
    ? `<div style="background:#F3F0EC;border-radius:10px;padding:14px 16px;margin:22px 0 0;">
         <p style="font-size:13px;line-height:1.5;color:#57534E;margin:0;">
           <strong style="color:#111;">Pro tip:</strong> Turn on Autopilot in Settings and ReplyFi will handle new reviews for you without lifting a finger.
         </p>
       </div>`
    : `<div style="background:#F3F0EC;border-radius:10px;padding:14px 16px;margin:22px 0 0;">
         <p style="font-size:13px;line-height:1.5;color:#57534E;margin:0;">
           <strong style="color:#111;">What happens next:</strong> Once connected, we'll scrape your existing reviews and draft AI replies within minutes.
         </p>
       </div>`

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111;">
    <div style="margin:0 0 28px;">
      <span style="display:inline-block;font-weight:800;font-size:18px;letter-spacing:-0.01em;color:#111;">ReplyFi</span>
    </div>

    <h1 style="font-size:22px;font-weight:700;margin:0 0 14px;line-height:1.3;letter-spacing:-0.01em;">${headline}</h1>

    <p style="font-size:14px;line-height:1.65;color:#444;margin:0 0 24px;">${body}</p>

    <a href="${ctaHref}" style="display:inline-block;background:#E05A28;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:13px 24px;border-radius:10px;letter-spacing:-0.01em;">
      ${ctaLabel}
    </a>

    ${tipHtml}

    <div style="margin-top:32px;padding-top:22px;border-top:1px solid #EDE9E4;">
      <p style="font-size:13px;line-height:1.6;color:#57534E;margin:0;">
        Questions? Just reply to this email — a real human reads every one.
      </p>
    </div>
  </div>`

  const { error: sendError } = await resend.emails.send({
    from: FROM_DIGEST,
    to: toEmail,
    replyTo: REPLY_TO_SUPPORT,
    subject,
    html,
    headers: buildUnsubscribeHeaders(),
  })

  if (sendError) {
    console.error('[activation-email] Resend send failed:', sendError)
    return { skipped: false as const, error: sendError }
  }

  return { skipped: false as const }
}
