import type { AutopilotRules } from '@/types'

export type AutopilotDecision =
  | { action: 'disabled' }
  | { action: 'skipped_no_text' }
  | { action: 'escalated_low_rating' }
  | { action: 'escalated_keyword'; keyword: string }
  | { action: 'auto_approved' }
  | { action: 'draft_only' }

/**
 * Pure function — determines what the Autopilot cron should do with a review.
 *
 * Priority order:
 *  1. disabled → bail early
 *  2. no text + skipNoText → skip
 *  3. star rating below threshold → escalate
 *  4. keyword match → escalate
 *  5. mode determines draft vs auto-approve
 */
export function decide(
  rules: AutopilotRules | undefined | null,
  review: { star_rating: number; review_text: string | null }
): AutopilotDecision {
  if (!rules?.enabled) return { action: 'disabled' }

  const text = review.review_text?.trim() ?? ''

  if (rules.skipNoText && !text) {
    return { action: 'skipped_no_text' }
  }

  if (review.star_rating < rules.minStarRating) {
    return { action: 'escalated_low_rating' }
  }

  if (rules.keywordBlocklist.length > 0 && text) {
    for (const kw of rules.keywordBlocklist) {
      const trimmed = kw.trim()
      if (!trimmed) continue
      // Word-boundary-ish match: allow the keyword to appear as a word or substring
      // We use a simple case-insensitive includes after normalising both strings.
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(?:^|\\W)${escaped}(?:\\W|$)`, 'i')
      if (regex.test(text)) {
        return { action: 'escalated_keyword', keyword: trimmed }
      }
    }
  }

  if (rules.mode === 'auto_approve') {
    return { action: 'auto_approved' }
  }

  return { action: 'draft_only' }
}

/**
 * Returns the default Autopilot rules shape — used when the user has never
 * saved autopilot settings (prevents undefined-spread bugs).
 */
export function defaultAutopilotRules(): AutopilotRules {
  return {
    enabled: false,
    mode: 'draft',
    minStarRating: 4,
    keywordBlocklist: [],
    skipNoText: true,
    dailyDigest: true,
  }
}
