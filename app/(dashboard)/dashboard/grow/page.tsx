export const dynamic = 'force-dynamic'
export const metadata = { title: 'Grow — ReplyFi' }

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import GrowClient from './GrowClient'
import { getActiveLocationId } from '@/lib/locations/active'
import type { BusinessProfile, CompetitorProfile } from '@/types'

export default async function GrowPage() {
  const supabase = createClient()
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Prefer the currently-viewed location; fall back to primary if the
  // active cookie is unset or stale. Matches the pattern used by
  // reviews/analytics/settings so every per-location page agrees on
  // which row is "in focus".
  const activeLocationId = getActiveLocationId()
  let profile: { id: string; business_name: string; [k: string]: unknown } | null = null
  if (activeLocationId) {
    const { data } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('id', activeLocationId)
      .maybeSingle()
    profile = data
  }
  if (!profile) {
    const { data } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle()
    profile = data
  }

  if (!profile) redirect('/settings')

  // Social: top-rated reviews with text
  const { data: reviews } = await supabase
    .from('scraped_reviews')
    .select('*')
    .eq('user_id', user.id)
    .gte('star_rating', 4)
    .not('review_text', 'is', null)
    .neq('review_text', '')
    .order('star_rating', { ascending: false })
    .limit(50)

  // Competitors
  const { data: competitors } = await supabaseAdmin
    .from('competitor_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  // User avg rating
  const { data: ratingRows } = await supabaseAdmin
    .from('scraped_reviews')
    .select('star_rating')
    .eq('user_id', user.id)
    .neq('reply_status', 'skipped')

  let userAvgRating = 0
  if (ratingRows && ratingRows.length > 0) {
    const total = ratingRows.reduce((sum: number, r: { star_rating: number }) => sum + (r.star_rating ?? 0), 0)
    userAvgRating = Math.round((total / ratingRows.length) * 10) / 10
  }

  const userReviewCount = ratingRows?.length ?? 0

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[#A09A94]">Loading…</div>}>
      <GrowClient
        restaurantProfile={profile as unknown as BusinessProfile}
        reviews={reviews ?? []}
        competitors={(competitors ?? []) as CompetitorProfile[]}
        userAvgRating={userAvgRating}
        userReviewCount={userReviewCount}
      />
    </Suspense>
  )
}
