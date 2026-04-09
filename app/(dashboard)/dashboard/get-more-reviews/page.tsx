import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GetMoreReviewsClient from './GetMoreReviewsClient'
import type { RestaurantProfile } from '@/types'

export default async function GetMoreReviewsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('restaurant_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/settings')

  return <GetMoreReviewsClient restaurantProfile={profile as RestaurantProfile} />
}
