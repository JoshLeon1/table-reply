// lib/email/payment-failed.ts
//
// Sent from the Stripe webhook when an invoice payment fails.
// Uses the shared Resend client from lib/email/client.ts so the API key
// is resolved lazily at send time (not at module load).

import { FROM_BILLING, REPLY_TO_SUPPORT, buildUnsubscribeHeaders, getResend } from './client'

export interface PaymentFailedEmailInput {
  toEmail: string
  /** Number of days until access stops, if Stripe provides it */
  graceDays?: number
}

export async function sendPaymentFailedEmail(input: PaymentFailedEmailInput) {
  const resend = getResend()
  if (!resend) {
    console.warn('[payment-failed-email] RESEND_API_KEY not set — skipping')
    return { skipped: true as const }
  }

  const { toEmail, graceDays } = input
  const grace = graceDays ?? 3
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://replyfi.app').replace(/\/$/, '')
  const portalLink = `${appUrl}/settings?tab=account`

  const { error: sendError } = await resend.emails.send({
    from: FROM_BILLING,
    to: toEmail,
    replyTo: REPLY_TO_SUPPORT,
    subject: 'Your card was declined — update your payment method',
    headers: buildUnsubscribeHeaders(),
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111;">
        <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 16px;">Your most recent payment didn't go through</h1>
        <p style="font-size: 14px; line-height: 1.55; color: #444; margin: 0 0 12px;">
          We tried to charge the card on file for your ReplyFi subscription and it was declined.
          You have <strong>${grace} days</strong> to update your payment before access pauses.
        </p>
        <p style="font-size: 14px; line-height: 1.55; color: #444; margin: 0 0 24px;">
          The most common reasons: card expired, daily limit reached, or the bank flagged it as suspicious.
        </p>
        <a href="${portalLink}" style="display: inline-block; background: #E05A28; color: white; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 20px; border-radius: 10px;">
          Update payment method
        </a>
        <p style="font-size: 12px; color: #888; margin: 32px 0 0;">
          Replying to this email reaches a real human at ReplyFi support.
        </p>
      </div>
    `,
  })

  if (sendError) {
    console.error('[payment-failed-email] Resend send failed:', sendError)
    return { skipped: false as const, error: sendError }
  }

  return { skipped: false as const }
}
