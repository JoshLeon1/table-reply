// lib/gbp/match-reviews.ts
import { SupabaseClient } from '@supabase/supabase-js'
import { gbpFetch, getGbpToken } from './client'

interface GbpReview {
  name: string
  reviewer: { displayName: string }
  createTime: string
}

interface NewReview {
  id: string
  reviewer_name: string
  review_datetime_utc: string | null
}

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

function normalize(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export async function matchAndStoreGbpReviewNames(
  supabase: SupabaseClient,
  userId: string,
  businessProfileId: string,
  newReviewDbIds: string[],
) {
  if (newReviewDbIds.length === 0) return

  const token = await getGbpToken(userId, businessProfileId)
  if (!token?.account_name || !token?.location_name) return

  const locationName = token.location_name

  let gbpReviews: GbpReview[] = []
  try {
    const res = await gbpFetch(userId, `/${locationName}/reviews?pageSize=200`, {}, businessProfileId)
    if (!res.ok) {
      console.error('[gbp-match] Failed to fetch GBP reviews:', res.status, await res.text())
      return
    }
    const json = await res.json()
    gbpReviews = json.reviews ?? []
  } catch (err) {
    console.error('[gbp-match] Error fetching GBP reviews:', err)
    return
  }

  if (gbpReviews.length === 0) return

  const { data: scraped } = await supabase
    .from('scraped_reviews')
    .select('id, reviewer_name, review_datetime_utc')
    .in('id', newReviewDbIds)
    .is('google_review_name', null)

  if (!scraped || scraped.length === 0) return

  const gbpByName = new Map<string, GbpReview[]>()
  for (const r of gbpReviews) {
    const key = normalize(r.reviewer?.displayName ?? '')
    if (!gbpByName.has(key)) gbpByName.set(key, [])
    gbpByName.get(key)!.push(r)
  }

  for (const row of scraped as NewReview[]) {
    const key = normalize(row.reviewer_name ?? '')
    const candidates = gbpByName.get(key) ?? []
    if (candidates.length === 0) continue

    const scrapeTime = row.review_datetime_utc ? new Date(row.review_datetime_utc).getTime() : null

    let matched: GbpReview | null = null
    if (scrapeTime !== null) {
      matched = candidates.find((c) => Math.abs(new Date(c.createTime).getTime() - scrapeTime) <= TWO_DAYS_MS) ?? null
    } else {
      matched = candidates.length === 1 ? candidates[0] : null
    }

    if (!matched) continue

    await supabase
      .from('scraped_reviews')
      .update({ google_review_name: matched.name })
      .eq('id', row.id)
  }
}
