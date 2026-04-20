export const dynamic = 'force-dynamic'
export const metadata = { title: 'Home — ReplyFi' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Quick check for restaurant profile first. Use maybeSingle so a
  // brand-new user with no business_profiles row hits the explicit null
  // branch below instead of an unhandled "0 rows" throw from .single().
  const { data: restaurantProfileCheck } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

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
    { count: voiceTrainedCount },
    { count: voiceApprovedCount },
    { count: voiceTrainedThisMonth },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('business_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart),
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', lastMonthStart).lt('created_at', lastMonthEnd),
    supabase.from('scraped_reviews').select('star_rating').eq('user_id', user.id),
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('reply_status', 'approved').gte('created_at', monthStart),
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('reply_status', 'approved').gte('created_at', lastMonthStart).lt('created_at', lastMonthEnd),
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('reply_status', 'pending'),
    supabase.from('scraped_reviews').select('*').eq('user_id', user.id).eq('reply_status', 'pending').order('review_datetime_utc', { ascending: false }).limit(3),
    supabase.from('scraped_reviews').select('*').eq('user_id', user.id).eq('reply_status', 'approved').order('created_at', { ascending: false }).limit(5),
    supabase.from('business_analytics').select('themes, last_analyzed_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('reply_status', 'approved'),
    // Voice DNA: total replies generated for this user (training corpus size)
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).not('generated_reply', 'is', null),
    // Voice DNA: approvals against generated replies (match rate numerator)
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('reply_status', 'approved').not('generated_reply', 'is', null),
    // Voice DNA: training velocity this month
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).not('generated_reply', 'is', null).gte('created_at', monthStart),
  ])

  // Start trial if not started
  if (profile && !profile.trial_started_at) {
    await supabase
      .from('profiles')
      .update({ trial_started_at: new Date().toISOString() })
      .eq('id', user.id)
  }

  // First-run activation: if the user has never seen the demo, send them there
  const hasSeenDemo = (profile as { has_seen_demo?: boolean | null } | null)?.has_seen_demo
  if (hasSeenDemo === false) {
    redirect('/onboarding/demo')
  }

  // Compute derived stats
  const ratings = (allReviews ?? []).map((r: { star_rating: number }) => r.star_rating).filter((r: number) => typeof r === 'number')
  const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0
  const totalReviews = allReviews?.length ?? 0

  // Response rate: approved all-time replies / all-time reviews
  const responseRate = totalReviews > 0 ? Math.round(((approvedAllTime ?? 0) / totalReviews) * 100) : 0

  const themes = analyticsCache?.themes as { praised: string[]; complaints: string[]; opportunities: string[] } | null
  const hasAnalytics = !!analyticsCache

  // Autopilot enablement — drives discoverability banner on home
  const autopilotEnabled = !!(restaurantProfile?.reply_preferences as { autopilot?: { enabled?: boolean } } | null)?.autopilot?.enabled

  // Voice DNA — derived metrics
  const voiceTrained   = voiceTrainedCount   ?? 0
  const voiceApproved  = voiceApprovedCount  ?? 0
  const voiceMonth     = voiceTrainedThisMonth ?? 0
  const voiceMatchRate = voiceTrained > 0 ? Math.round((voiceApproved / voiceTrained) * 100) : 0

  return (
    <HomeClient
      ownerName={restaurantProfile?.owner_name ?? 'there'}
      restaurantName={restaurantProfile?.business_name ?? ''}
      lastScrapedAt={restaurantProfile?.last_scraped_at ?? null}
      userId={user.id}
      googleMapsUrl={restaurantProfile?.google_maps_url ?? null}
      yelpUrl={restaurantProfile?.yelp_url ?? null}
      tripadvisorUrl={restaurantProfile?.tripadvisor_url ?? null}
      hasGeneratedReply={(approvedAllTime ?? 0) > 0}
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
      voiceTrained={voiceTrained}
      voiceApproved={voiceApproved}
      voiceMatchRate={voiceMatchRate}
      voiceTrainedThisMonth={voiceMonth}
      autopilotEnabled={autopilotEnabled}
    />
  )
}
