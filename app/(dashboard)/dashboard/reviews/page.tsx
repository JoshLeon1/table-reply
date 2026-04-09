import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import ReviewsClient from './ReviewsClient'
import type { RestaurantProfile, ScrapedReview } from '@/types'

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function ReviewsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch restaurant profile
  const { data: profile } = await supabaseAdmin
    .from('restaurant_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // If no profile at all, redirect to settings to set one up
  if (!profile) redirect('/settings')

  // Fetch pending + approved reviews (most recent 50)
  const { data: reviews } = await supabaseAdmin
    .from('scraped_reviews')
    .select('*')
    .eq('user_id', user.id)
    .in('reply_status', ['pending', 'approved'])
    .order('review_datetime_utc', { ascending: false })
    .limit(50)

  return (
    <ReviewsClient
      profile={profile as RestaurantProfile}
      initialReviews={(reviews ?? []) as ScrapedReview[]}
      userId={user.id}
    />
  )
}
