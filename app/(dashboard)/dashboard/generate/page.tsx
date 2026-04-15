export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '../DashboardClient'

export default async function GeneratePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: restaurantProfile } = await supabase
    .from('restaurant_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!restaurantProfile) redirect('/onboarding')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const [{ count: replyCount }] = await Promise.all([
    supabase.from('replies').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  // Start trial on first dashboard visit
  if (profile && !profile.trial_started_at) {
    await supabase
      .from('profiles')
      .update({ trial_started_at: new Date().toISOString() })
      .eq('id', user.id)
  }

  const trialStartedAt = profile?.trial_started_at
    ? new Date(profile.trial_started_at)
    : new Date()
  const trialEndDate = new Date(trialStartedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
  const now = new Date()
  const msRemaining = trialEndDate.getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))
  const trialExpired = daysRemaining === 0 && !profile?.is_paid

  return (
    <DashboardClient
      isPaid={profile?.is_paid ?? false}
      daysRemaining={daysRemaining}
      trialExpired={trialExpired}
      hasGeneratedReply={(replyCount ?? 0) > 0}
      hasAutoSync={!!(restaurantProfile?.google_maps_url || restaurantProfile?.yelp_url || restaurantProfile?.tripadvisor_url)}
      restaurantProfile={restaurantProfile ? {
        restaurant_name: restaurantProfile.restaurant_name,
        cuisine_type: restaurantProfile.cuisine_type,
        vibe: restaurantProfile.vibe,
      } : null}
    />
  )
}
