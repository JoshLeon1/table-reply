// lib/gbp/match-reviews.ts
// After Outscraper inserts new reviews, this matches them to Google Business
// Profile review resource names via reviewer name + date proximity (±2 days).
// Stores the matched resource name in scraped_reviews.google_review_name.

import { SupabaseClient } from '@supabase/supabase-js'
import { gbpFetch, getGbpToken } from './client'

interface GbpReview {
  name: string // e.g. "accounts/123/locations/456/reviews/abc"
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
  newReviewDbIds: string[], // scraped_reviews.id values just inserted
) {
  if (newReviewDbIds.length === 0) return

  const token = await getGbpToken(userId)
  if (!token?.account_name || !token?.location_name) return

  const locationName = token.location_name

  // Fetch up to 200 recent GBP reviews (one page is usually enough)
  let gbpReviews: GbpReview[] = []
  try {
    const res = await gbpFetch(
      userId,
      `/${locationName}/reviews?pageSize=200`,
    )
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

  // Fetch the scraped reviews we need to match
  const { data: scraped } = await supabase
    .from('scraped_reviews')
    .select('id, reviewer_name, review_datetime_utc')
    .in('id', newReviewDbIds)
    .is('google_review_name', null)

  if (!scraped || scraped.length === 0) return

  // Build a quick lookup of GBP reviews by normalized reviewer name
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

    const scrapeTime = row.review_datetime_utc
      ? new Date(row.review_datetime_utc).getTime()
      : null

    let matched: GbpReview | null = null
    if (scrapeTime !== null) {
      matched =
        candidates.find((c) => {
          const gbpTime = new Date(c.createTime).getTime()
          return Math.abs(gbpTime - scrapeTime) <= TWO_DAYS_MS
        }) ?? null
    } else {
      // No timestamp — use the only candidate if unambiguous
      matched = candidates.length === 1 ? candidates[0] : null
    }

    if (!matched) continue

    await supabase
      .from('scraped_reviews')
      .update({ google_review_name: matched.name })
      .eq('id', row.id)
  }
}
