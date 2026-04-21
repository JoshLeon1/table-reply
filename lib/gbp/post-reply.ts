// lib/gbp/post-reply.ts
import { gbpFetch, getGbpToken } from './client'

export async function postGbpReply(
  userId: string,
  businessProfileId: string,
  googleReviewName: string,
  replyText: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = await getGbpToken(userId, businessProfileId)
  if (!token) {
    return { ok: false, error: 'No GBP token — user has not connected Google Business Profile for this location' }
  }

  try {
    const res = await gbpFetch(userId, `/${googleReviewName}/reply`, {
      method: 'PUT',
      body: JSON.stringify({ comment: replyText }),
    }, businessProfileId)

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
