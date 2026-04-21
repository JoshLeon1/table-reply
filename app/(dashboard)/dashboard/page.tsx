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
  // Rolling 30-day windows based on when the review was POSTED
  // (review_datetime_utc), not when we scraped it (scraped_at). The table has
  // no `created_at` column — earlier code referenced it and PostgREST silently
  // returned null counts, which is why the dashboard showed "3 reviews" while
  // Reviews showed 15.
  const THIRTY_D_MS = 30 * 24 * 60 * 60 * 1000
  const thirtyDaysAgo = new Date(now.getTime() - THIRTY_D_MS).toISOString()
  const sixtyDaysAgo  = new Date(now.getTime() - 2 * THIRTY_D_MS).toISOString()

  const [
    { data: profile },
    { data: restaurantProfile },
    { data: allReviews },
    { count: pendingCount },
    { data: pendingReviews },
    { data: recentApproved },
    { data: analyticsCache },
    { count: approvedAllTime },
    { count: voiceTrainedCount },
    { count: voiceApprovedCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('business_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    // Full review set for accurate 30-day stats. Small payload (2 cols) so OK
    // to pull everything; we need it to match what Reviews/Analytics show.
    supabase.from('scraped_reviews').select('star_rating, review_datetime_utc, reply_status').eq('user_id', user.id),
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('reply_status', 'pending'),
    supabase.from('scraped_reviews').select('*').eq('user_id', user.id).eq('reply_status', 'pending').order('review_datetime_utc', { ascending: false }).limit(3),
    supabase.from('scraped_reviews').select('*').eq('user_id', user.id).eq('reply_status', 'approved').order('scraped_at', { ascending: false }).limit(5),
    supabase.from('business_analytics').select('themes, last_analyzed_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('reply_status', 'approved'),
    // Voice DNA: total replies generated for this user (training corpus size)
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).not('generated_reply', 'is', null),
    // Voice DNA: approvals against generated replies (match rate numerator)
    supabase.from('scraped_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('reply_status', 'approved').not('generated_reply', 'is', null),
  ])

  // ── Derive 30-day windows from the full review set ────────────────────────
  type RatingRow = { star_rating: number | null; review_datetime_utc: string | null; reply_status: string | null }
  const reviewsAll = (allReviews ?? []) as RatingRow[]
  const inWindow = (iso: string | null, fromMs: number, toMs: number) => {
    if (!iso) return false
    const t = new Date(iso).getTime()
    if (!Number.isFinite(t)) return false
    return t >= fromMs && t < toMs
  }
  const nowMs = now.getTime()
  const reviewsThisMonth  = reviewsAll.filter(r => inWindow(r.review_datetime_utc, nowMs - THIRTY_D_MS, nowMs)).length
  const reviewsLastMonth  = reviewsAll.filter(r => inWindow(r.review_datetime_utc, nowMs - 2 * THIRTY_D_MS, nowMs - THIRTY_D_MS)).length
  const approvedThisMonth = reviewsAll.filter(r => r.reply_status === 'approved' && inWindow(r.review_datetime_utc, nowMs - THIRTY_D_MS, nowMs)).length
  const approvedLastMonth = reviewsAll.filter(r => r.reply_status === 'approved' && inWindow(r.review_datetime_utc, nowMs - 2 * THIRTY_D_MS, nowMs - THIRTY_D_MS)).length
  const ratingsThisMonth  = reviewsAll
    .filter(r => inWindow(r.review_datetime_utc, nowMs - THIRTY_D_MS, nowMs))
    .map(r => r.star_rating ?? 0)
    .filter(r => r > 0)
  const ratingThisMonthAvg = ratingsThisMonth.length > 0 ? ratingsThisMonth.reduce((a, b) => a + b, 0) / ratingsThisMonth.length : 0
  const ratingsLastMonth = reviewsAll
    .filter(r => inWindow(r.review_datetime_utc, nowMs - 2 * THIRTY_D_MS, nowMs - THIRTY_D_MS))
    .map(r => r.star_rating ?? 0)
    .filter(r => r > 0)
  const ratingLastMonthAvg = ratingsLastMonth.length > 0 ? ratingsLastMonth.reduce((a, b) => a + b, 0) / ratingsLastMonth.length : 0

  // Voice DNA velocity: replies generated for reviews posted in the last 30 days
  const { count: voiceTrainedThisMonthCount } = await supabase
    .from('scraped_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('generated_reply', 'is', null)
    .gte('review_datetime_utc', thirtyDaysAgo)
  const voiceTrainedThisMonth = voiceTrainedThisMonthCount ?? 0
  void sixtyDaysAgo

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
  const ratings = reviewsAll.map(r => r.star_rating ?? 0).filter(r => r > 0)
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
  const totalReviews = reviewsAll.length

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
      ratingThisMonthAvg={ratingThisMonthAvg}
      ratingLastMonthAvg={ratingLastMonthAvg}
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
