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
import type { SupabaseClient } from '@supabase/supabase-js'

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

/**
 * Build the List-Unsubscribe header for an outbound email.
 *
 * Gmail/Yahoo bulk-sender rules (effective Feb 2024) require a valid
 * List-Unsubscribe header on marketing/bulk mail. A mailto: form is always
 * valid and keeps us out of spam folders as volume grows.
 *
 * Override `UNSUBSCRIBE_MAILTO` to point at a monitored inbox (default:
 * unsubscribe@replyfi.app, which should be routed to support).
 */
export function buildUnsubscribeHeaders(): Record<string, string> {
  const mailto = process.env.UNSUBSCRIBE_MAILTO ?? 'unsubscribe@replyfi.app'
  return {
    'List-Unsubscribe': `<mailto:${mailto}?subject=unsubscribe>`,
  }
}

/**
 * Email-notification preference categories stored in profiles.email_notifications (jsonb).
 * Each key defaults to opted-in when unset or null. Explicit string "false" or
 * boolean false disables that category.
 *
 * Categories:
 *  - weeklyDigest: the Monday recap email
 *  - keywordAlerts: real-time negative-keyword/safety alerts during scraping
 *  - trialReminders: T-3 and T-1 trial-ending nudges
 *
 * Transactional emails (welcome, payment-failed) bypass this check — they're
 * account-state changes the user needs to see regardless of marketing prefs.
 */
export type EmailCategory = 'weeklyDigest' | 'keywordAlerts' | 'trialReminders'

export async function isEmailOptedIn(
  supabaseAdmin: SupabaseClient,
  userId: string,
  category: EmailCategory,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('email_notifications')
    .eq('id', userId)
    .maybeSingle()

  const prefs = (data?.email_notifications ?? {}) as Record<string, unknown>
  const val = prefs[category]
  // Default to opted-in; treat explicit false/'false' as opted-out.
  return val !== false && val !== 'false'
}
