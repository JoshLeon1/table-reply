export const dynamic = 'force-dynamic'
export const metadata = { title: 'Analytics — ReplyFi' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getActiveLocationId } from '@/lib/locations/active'
import AnalyticsClient from './AnalyticsClient'
import type { ScrapedReview } from '@/types'

export default async function AnalyticsPage() {
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
  if (!profile) redirect('/onboarding')

  const { data: reviews } = await supabaseAdmin
    .from('scraped_reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('business_profile_id', profile.id)
    .order('review_datetime_utc', { ascending: false })

  return (
    <AnalyticsClient
      reviews={(reviews ?? []) as ScrapedReview[]}
      restaurantName={profile.business_name}
      userId={user.id}
    />
  )
}
