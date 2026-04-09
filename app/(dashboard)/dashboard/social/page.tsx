import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SocialClient from './SocialClient'

export default async function SocialPage() {
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

  const { data: reviews } = await supabase
    .from('scraped_reviews')
    .select('*')
    .eq('user_id', user.id)
    .gte('star_rating', 4)
    .not('review_text', 'is', null)
    .neq('review_text', '')
    .order('star_rating', { ascending: false })
    .limit(50)

  return (
    <SocialClient
      reviews={reviews ?? []}
      restaurantProfile={restaurantProfile}
    />
  )
}
