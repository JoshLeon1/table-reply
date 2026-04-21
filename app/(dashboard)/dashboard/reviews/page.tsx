export const dynamic = 'force-dynamic'
export const metadata = { title: 'Reviews — ReplyFi' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getActiveLocationId } from '@/lib/locations/active'
import ReviewsClient from './ReviewsClient'
import type { BusinessProfile, ScrapedReview } from '@/types'

export default async function ReviewsPage() {
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Determine active location
  const activeLocationId = getActiveLocationId()

  // Try active location first; fall back to primary if the cookie is stale
  // (e.g. the active location was deleted while the user had it selected).
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
  if (!profile) redirect('/onboarding')

  const { data: reviews } = await supabaseAdmin
    .from('scraped_reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('business_profile_id', profile.id)
    .in('reply_status', ['pending', 'approved'])
    .order('review_datetime_utc', { ascending: false })
    .limit(50)

  return (
    <ReviewsClient
      profile={profile as unknown as BusinessProfile}
      initialReviews={(reviews ?? []) as ScrapedReview[]}
      userId={user.id}
    />
  )
}
