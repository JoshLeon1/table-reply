export const dynamic = 'force-dynamic'
export const metadata = { title: 'Grow — Replyfi' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import GrowClient from './GrowClient'
import type { BusinessProfile, CompetitorProfile } from '@/types'

export default async function GrowPage() {
  const supabase = createClient()
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabaseAdmin
    .from('business_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

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
    <GrowClient
      restaurantProfile={profile as BusinessProfile}
      reviews={reviews ?? []}
      competitors={(competitors ?? []) as CompetitorProfile[]}
      userAvgRating={userAvgRating}
      userReviewCount={userReviewCount}
    />
  )
}
