export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import AnalyticsClient from './AnalyticsClient'
import type { ScrapedReview } from '@/types'

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AnalyticsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabaseAdmin
    .from('restaurant_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/settings')

  const { data: reviews } = await supabaseAdmin
    .from('scraped_reviews')
    .select('*')
    .eq('user_id', user.id)
    .neq('reply_status', 'skipped')
    .order('review_datetime_utc', { ascending: false })

  return (
    <AnalyticsClient
      reviews={(reviews ?? []) as ScrapedReview[]}
      restaurantName={profile.restaurant_name}
      userId={user.id}
    />
  )
}
