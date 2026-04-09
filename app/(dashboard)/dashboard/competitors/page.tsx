export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import CompetitorsClient from './CompetitorsClient'
import type { RestaurantProfile, CompetitorProfile } from '@/types'

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function CompetitorsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabaseAdmin
    .from('restaurant_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/settings')

  const { data: competitors } = await supabaseAdmin
    .from('competitor_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  // Compute user's own avg rating from scraped_reviews
  const { data: ratingRows } = await supabaseAdmin
    .from('scraped_reviews')
    .select('star_rating')
    .eq('user_id', user.id)
    .neq('reply_status', 'skipped')

  let userAvgRating = 0
  if (ratingRows && ratingRows.length > 0) {
    const total = ratingRows.reduce((sum, r) => sum + (r.star_rating ?? 0), 0)
    userAvgRating = Math.round((total / ratingRows.length) * 10) / 10
  }

  return (
    <CompetitorsClient
      restaurantProfile={profile as RestaurantProfile}
      competitors={(competitors ?? []) as CompetitorProfile[]}
      userAvgRating={userAvgRating}
    />
  )
}
