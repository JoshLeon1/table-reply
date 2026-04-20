// lib/email/welcome.ts
//
// Sent once, the first time a user signs in after confirming their email.
// Idempotent: guarded by profiles.welcome_email_sent_at timestamp written
// by the caller after a successful send.

import { FROM_DIGEST, REPLY_TO_SUPPORT, buildUnsubscribeHeaders, escapeHtml, getResend } from './client'

export interface WelcomeEmailInput {
  toEmail: string
  firstName?: string | null
}

export async function sendWelcomeEmail(input: WelcomeEmailInput) {
  const resend = getResend()
  if (!resend) {
    console.warn('[welcome-email] RESEND_API_KEY not set — skipping')
    return { skipped: true as const }
  }

  const { toEmail, firstName } = input
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://replyfi.app').replace(/\/$/, '')
  const dashboard = `${appUrl}/dashboard`
  const name = firstName?.trim() ? escapeHtml(firstName.trim().split(/\s+/)[0]) : 'there'

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111;">
    <div style="margin:0 0 24px;">
      <span style="display:inline-block;font-weight:800;font-size:18px;letter-spacing:-0.01em;color:#111;">ReplyFi</span>
    </div>

    <h1 style="font-size:22px;font-weight:700;margin:0 0 14px;line-height:1.3;">Welcome to ReplyFi, ${name}.</h1>

    <p style="font-size:14px;line-height:1.6;color:#444;margin:0 0 14px;">
      Your 7-day free trial just started. Here's the 60-second version of what ReplyFi does for you:
    </p>

    <ol style="font-size:14px;line-height:1.7;color:#444;margin:0 0 22px;padding-left:20px;">
      <li style="margin-bottom:6px;"><strong>We watch your reviews</strong> — Google, Yelp, TripAdvisor — every single day.</li>
      <li style="margin-bottom:6px;"><strong>We draft a reply</strong> in your tone for each new review the moment it lands.</li>
      <li style="margin-bottom:6px;"><strong>You approve or edit</strong> — or flip on Autopilot and we handle the low-risk ones for you.</li>
    </ol>

    <p style="font-size:14px;line-height:1.6;color:#444;margin:0 0 22px;">
      First step: paste your Google listing URL. From there, your next review gets a drafted reply automatically.
    </p>

    <a href="${dashboard}" style="display:inline-block;background:#E05A28;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;">
      Go to my dashboard →
    </a>

    <div style="margin-top:32px;padding-top:22px;border-top:1px solid #EDE9E4;">
      <p style="font-size:13px;line-height:1.6;color:#57534E;margin:0 0 8px;"><strong>Stuck on anything?</strong></p>
      <p style="font-size:13px;line-height:1.6;color:#57534E;margin:0;">Just reply to this email — it reaches a real human (me) and I'll get you unstuck.</p>
    </div>

    <p style="font-size:11px;color:#A8A29E;margin:24px 0 0;">
      You're getting this because you started a trial at replyfi.app.
    </p>
  </div>`

  const { error: sendError } = await resend.emails.send({
    from: FROM_DIGEST,
    to: toEmail,
    replyTo: REPLY_TO_SUPPORT,
    subject: 'Welcome to ReplyFi — here\'s how to get your first reply out the door',
    html,
    headers: buildUnsubscribeHeaders(),
  })

  if (sendError) {
    console.error('[welcome-email] Resend send failed:', sendError)
    return { skipped: false as const, error: sendError }
  }

  return { skipped: false as const }
}
