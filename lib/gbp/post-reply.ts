// lib/gbp/post-reply.ts
// Posts an owner reply to a Google Business Profile review.
// Returns { ok: true } on success, { ok: false, error } on failure.

import { gbpFetch, getGbpToken } from './client'

export async function postGbpReply(
  userId: string,
  googleReviewName: string,
  replyText: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = await getGbpToken(userId)
  if (!token) {
    return { ok: false, error: 'No GBP token — user has not connected Google Business Profile' }
  }

  try {
    const res = await gbpFetch(userId, `/${googleReviewName}/reply`, {
      method: 'PUT',
      body: JSON.stringify({ comment: replyText }),
    })

    if (res.ok) return { ok: true }

    const body = await res.json().catch(() => ({}))
    const msg = body?.error?.message ?? `HTTP ${res.status}`
    console.error('[gbp-post-reply] Failed:', res.status, msg)
    return { ok: false, error: msg }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[gbp-post-reply] Error:', msg)
    return { ok: false, error: msg }
  }
}
