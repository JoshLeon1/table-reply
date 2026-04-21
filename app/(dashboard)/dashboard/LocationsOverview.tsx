// app/(dashboard)/dashboard/LocationsOverview.tsx
import { createClient } from '@supabase/supabase-js'
import ManageLocationButton from './ManageLocationButton'

interface Location {
  id: string
  business_name: string
  location_label: string | null
  last_scraped_at: string | null
}

function formatTimeAgo(isoStr: string | null): string {
  if (!isoStr) return 'never'
  try {
    const diff = Date.now() - new Date(isoStr).getTime()
    const hrs = Math.floor(diff / 3600000)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  } catch { return '' }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-[#F59E0B]' : 'text-[#E4DED8]'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  )
}

export default async function LocationsOverview({
  locations,
  userId,
  ownerName,
}: {
  locations: Location[]
  userId: string
  ownerName: string
}) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const THIRTY_D = 30 * 24 * 60 * 60 * 1000
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_D).toISOString()
  const sixtyDaysAgo = new Date(Date.now() - 2 * THIRTY_D).toISOString()

  // Fetch per-location stats in parallel
  const locationStats = await Promise.all(
    locations.map(async (loc) => {
      const [{ data: recentReviews }, { data: prevReviews }, { count: pendingCount }] = await Promise.all([
        supabaseAdmin
          .from('scraped_reviews')
          .select('star_rating')
          .eq('business_profile_id', loc.id)
          .gte('review_datetime_utc', thirtyDaysAgo),
        supabaseAdmin
          .from('scraped_reviews')
          .select('star_rating')
          .eq('business_profile_id', loc.id)
          .gte('review_datetime_utc', sixtyDaysAgo)
          .lt('review_datetime_utc', thirtyDaysAgo),
        supabaseAdmin
          .from('scraped_reviews')
          .select('id', { count: 'exact', head: true })
          .eq('business_profile_id', loc.id)
          .eq('reply_status', 'pending'),
      ])

      const recent = (recentReviews ?? []).map((r: { star_rating: number | null }) => r.star_rating).filter(Boolean) as number[]
      const prev = (prevReviews ?? []).map((r: { star_rating: number | null }) => r.star_rating).filter(Boolean) as number[]
      const avgRating = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0
      const prevAvgRating = prev.length > 0 ? prev.reduce((a, b) => a + b, 0) / prev.length : 0

      return {
        ...loc,
        reviewCount: recent.length,
        avgRating: Number(avgRating.toFixed(1)),
        ratingDelta: Number((avgRating - prevAvgRating).toFixed(1)),
        pendingCount: pendingCount ?? 0,
      }
    })
  )

  // Combined stats across all locations
  const totalPending = locationStats.reduce((a, s) => a + s.pendingCount, 0)
  const allRatings = locationStats.flatMap(s => Array(s.reviewCount).fill(s.avgRating))
  const combinedAvg = allRatings.length > 0 ? allRatings.reduce((a: number, b: number) => a + b, 0) / allRatings.length : 0
  const totalReviews = locationStats.reduce((a, s) => a + s.reviewCount, 0)

  // Silence unused variable warning — userId may be used in future for user-scoped queries
  void userId

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="pt-6 sm:pt-8">
        <h1 className="text-[22px] sm:text-[26px] text-[#111] leading-[1.15]" style={{ fontWeight: 600, letterSpacing: '-0.022em' }}>
          Welcome back{ownerName ? `, ${ownerName}` : ''}.
        </h1>
        <p className="text-[13px] text-[#57534E] mt-1.5">All locations overview.</p>
      </div>

      {/* Combined KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#FFF8F2] border border-[#F4DCC4] rounded-2xl p-5">
          <p className="text-[10px] font-semibold tracking-widest text-[#A8956C] uppercase mb-2">Combined Rating — Last 30 Days</p>
          <p className="text-[36px] font-semibold text-[#111] tabular-nums leading-none" style={{ letterSpacing: '-0.03em' }}>
            {combinedAvg > 0 ? combinedAvg.toFixed(1) : '—'}
          </p>
          <p className="text-[12px] text-[#57534E] mt-1.5">
            {totalReviews > 0
              ? `from ${totalReviews} review${totalReviews === 1 ? '' : 's'} across ${locations.length} locations`
              : 'No reviews in the last 30 days'}
          </p>
        </div>
        <div className="bg-[#FEFCF8] border border-[#EDE6DC] rounded-2xl p-5">
          <p className="text-[10px] font-semibold tracking-widest text-[#A8A29E] uppercase mb-2">Pending Replies</p>
          <p className="text-[36px] font-semibold text-[#111] tabular-nums leading-none" style={{ letterSpacing: '-0.03em' }}>
            {totalPending}
          </p>
          <p className="text-[12px] text-[#57534E] mt-1.5">across all locations</p>
        </div>
      </div>

      {/* Location cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-[#111]" style={{ letterSpacing: '-0.01em' }}>Your locations</h2>
          <a href="/settings?tab=locations" className="text-[12px] font-medium text-[#57534E] hover:text-[#111] transition-colors">
            Manage locations →
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {locationStats.map((loc) => (
            <div key={loc.id} className="bg-[#FEFCF8] border border-[#EDE6DC] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[14px] font-semibold text-[#111]">{loc.location_label ?? loc.business_name}</p>
                  <p className="text-[11px] text-[#A8A29E] mt-0.5">Last sync: {formatTimeAgo(loc.last_scraped_at)}</p>
                </div>
                {loc.pendingCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C47A1A] bg-[#FEF8EE] border border-[#F8E0B0] rounded-full px-2 py-0.5 flex-shrink-0">
                    {loc.pendingCount} pending
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[22px] font-semibold text-[#111] tabular-nums" style={{ letterSpacing: '-0.02em' }}>
                  {loc.avgRating > 0 ? loc.avgRating.toFixed(1) : '—'}
                </div>
                {loc.avgRating > 0 && <StarRating rating={loc.avgRating} />}
                {loc.ratingDelta !== 0 && (
                  <span className={`text-[11px] font-medium ${loc.ratingDelta > 0 ? 'text-[#15803D]' : 'text-[#B84A1A]'}`}>
                    {loc.ratingDelta > 0 ? '+' : ''}{loc.ratingDelta.toFixed(1)}
                  </span>
                )}
              </div>
              <ManageLocationButton locationId={loc.id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
