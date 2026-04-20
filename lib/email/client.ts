// lib/email/client.ts
//
// Central Resend client + helpers. All outbound email should flow through
// these utilities so that:
//   1. We never instantiate `new Resend()` at module load (prevents build-time
//      crashes when RESEND_API_KEY is absent, e.g. in CI).
//   2. User-supplied strings (review text, reviewer names, keywords) are
//      HTML-escaped before being interpolated into email templates.
//   3. `from:` addresses are sourced from env vars with sane defaults, so
//      dev/staging/prod can override without code changes.

import { Resend } from 'resend'

let _resend: Resend | null = null

/**
 * Lazy singleton Resend client.
 *
 * Returns `null` when `RESEND_API_KEY` is not set — callers must handle this
 * and skip the send. This mirrors the existing runtime-guard pattern used in
 * the scrape routes.
 */
export function getResend(): Resend | null {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  _resend = new Resend(key)
  return _resend
}

/**
 * HTML-escape a user-supplied string before interpolating it into an email
 * template. Covers the five characters that must be escaped in HTML text
 * context: &, <, >, ", '.
 *
 * NOTE: do NOT use this for URLs — use encodeURI/encodeURIComponent for those.
 */
export function escapeHtml(input: string | null | undefined): string {
  if (input == null) return ''
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Sender addresses — overridable via env vars for staging/prod splits.
 * All default to replyfi.app domain (verified in Resend).
 */
export const FROM_ALERTS  = process.env.FROM_EMAIL_ALERTS  ?? 'ReplyFi Alerts <alerts@replyfi.app>'
export const FROM_DIGEST  = process.env.FROM_EMAIL_DIGEST  ?? 'ReplyFi <digest@replyfi.app>'
export const FROM_BILLING = process.env.FROM_EMAIL_BILLING ?? 'ReplyFi <billing@replyfi.app>'

/**
 * Reply-To address — where user replies to any ReplyFi email land.
 * Set this to an inbox you actually monitor (e.g. via Cloudflare Email
 * Routing forwarding to your personal Gmail). If not set, replies go to
 * the from-address, which is send-only on Resend and will bounce.
 */
export const REPLY_TO_SUPPORT = process.env.REPLY_TO_SUPPORT ?? 'support@replyfi.app'
