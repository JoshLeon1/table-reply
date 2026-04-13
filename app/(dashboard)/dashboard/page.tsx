export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Quick check for restaurant profile first
  const { data: restaurantProfileCheck } = await supabase
    .from('restaurant_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!restaurantProfileCheck) redirect('/onboarding')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = monthStart // last month ends where this month starts

  const [
    { data: profile },
    { data: restaurantProfile },
    { count: reviewsThisMonth },
    { count: reviewsLastMonth },
    { data: allReviews },
    { count: approvedThisMonth },
    { count: approvedLastMonth },
    { count: pendingCount },
    { data: pendingReviews },
    { data: recentApproved },
    { data: analyticsCache },
    { count: approvedAllTime },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('restaurant_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart),
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', lastMonthStart).lt('created_at', lastMonthEnd),
    supabase.from('scraped_reviews').select('star_rating').eq('user_id', user.id),
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('reply_status', 'approved').gte('created_at', monthStart),
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('reply_status', 'approved').gte('created_at', lastMonthStart).lt('created_at', lastMonthEnd),
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('reply_status', 'pending'),
    supabase.from('scraped_reviews').select('*').eq('user_id', user.id).eq('reply_status', 'pending').order('review_datetime_utc', { ascending: false }).limit(3),
    supabase.from('scraped_reviews').select('*').eq('user_id', user.id).eq('reply_status', 'approved').order('created_at', { ascending: false }).limit(5),
    supabase.from('restaurant_analytics').select('themes, last_analyzed_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('reply_status', 'approved'),
  ])

  // Start trial if not started
  if (profile && !profile.trial_started_at) {
    await supabase
      .from('profiles')
      .update({ trial_started_at: new Date().toISOString() })
      .eq('id', user.id)
  }

  // Compute derived stats
  const ratings = (allReviews ?? []).map((r: { star_rating: number }) => r.star_rating).filter((r: number) => typeof r === 'number')
  const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0
  const totalReviews = allReviews?.length ?? 0

  // Response rate: use approved this month + last month as approximation over total reviews
  // (allReviews only selects star_rating, so we can't filter by reply_status from it)
  const approvedTotal = (approvedThisMonth ?? 0) + (approvedLastMonth ?? 0)
  const responseRate = totalReviews > 0 ? Math.round((approvedTotal / totalReviews) * 100) : 0

  const themes = analyticsCache?.themes as { praised: string[]; complaints: string[]; opportunities: string[] } | null
  const hasAnalytics = !!analyticsCache

  return (
    <HomeClient
      ownerName={restaurantProfile?.owner_name ?? 'there'}
      restaurantName={restaurantProfile?.restaurant_name ?? ''}
      lastScrapedAt={restaurantProfile?.last_scraped_at ?? null}
      userId={user.id}
      googleMapsUrl={restaurantProfile?.google_maps_url ?? null}
      yelpUrl={restaurantProfile?.yelp_url ?? null}
      tripadvisorUrl={restaurantProfile?.tripadvisor_url ?? null}
      hasGeneratedReply={(approvedAllTime ?? 0) > 0}
      isPaid={profile?.is_paid ?? false}
      reviewsThisMonth={reviewsThisMonth ?? 0}
      reviewsLastMonth={reviewsLastMonth ?? 0}
      avgRating={avgRating}
      totalReviews={totalReviews}
      approvedThisMonth={approvedThisMonth ?? 0}
      approvedLastMonth={approvedLastMonth ?? 0}
      responseRate={responseRate}
      pendingCount={pendingCount ?? 0}
      pendingReviews={pendingReviews ?? []}
      recentApproved={recentApproved ?? []}
      themes={themes}
      hasAnalytics={hasAnalytics}
    />
  )
}
