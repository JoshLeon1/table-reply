'use client'

import { useEffect, useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import type { ScrapedReview } from '@/types'

interface Props {
  reviews: ScrapedReview[]
  restaurantName: string
  userId: string
}

interface ThemeResult {
  praised: string[]
  complaints: string[]
  opportunities: string[]
  insufficient?: boolean
  cached?: boolean
  lastAnalyzedAt?: string
  error?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avg(nums: number[]) {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function getMonthKey(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  } catch { return '' }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '' }
}

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sz = size === 'lg' ? 'w-6 h-6' : 'w-3.5 h-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`${sz} ${i <= Math.round(rating) ? 'text-[#E05A28]' : 'text-white/20'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#E05A28] mb-6">{children}</p>
  )
}

// ─── Theme Skeleton ───────────────────────────────────────────────────────────

function ThemeSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
      {[4, 3, 4].map((lines, col) => (
        <div key={col}>
          <div className="h-3 w-16 bg-[#E4DED8] rounded-full animate-pulse mb-5" />
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="h-3 bg-[#E4DED8] rounded-full animate-pulse mb-3" style={{ width: `${75 - i * 10}%` }} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Sparkline tooltip ────────────────────────────────────────────────────────

function SparkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/10 backdrop-blur-sm text-white text-[11px] px-2.5 py-1.5 rounded-lg border border-white/10">
      <span className="text-white/60">{label} · </span>
      <span className="font-semibold">{Number(payload[0].value).toFixed(1)}★</span>
    </div>
  )
}

// ─── Line tooltip ─────────────────────────────────────────────────────────────

function LineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111] text-white text-[12px] px-3 py-2 rounded-xl">
      <p className="text-white/50 text-[11px]">{label}</p>
      <p className="font-semibold">{Number(payload[0].value).toFixed(1)} ★</p>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ restaurantName }: { restaurantName: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#111] flex items-center justify-center mb-6">
        <svg className="w-6 h-6 text-[#E05A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-[#111] mb-2">No data yet</h2>
      <p className="text-[13px] text-[#888] max-w-sm leading-relaxed mb-6">
        Connect your Google Maps listing and sync reviews to see analytics for {restaurantName}.
      </p>
      <a href="/dashboard/reviews" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111] hover:bg-[#2a2a2a] text-white text-[13px] font-medium transition-all">
        Set up Auto Reviews →
      </a>
    </div>
  )
}

// ─── Staff Mentions ───────────────────────────────────────────────────────────

function StaffMentionsSection({ reviews }: { reviews: ScrapedReview[] }) {
  // Extract all staff mentions from reviews that have staff_mentions
  const staffMap = new Map<string, { count: number; totalRating: number; quotes: string[] }>()

  for (const review of reviews) {
    const mentions = review.staff_mentions
    if (!mentions || !Array.isArray(mentions) || mentions.length === 0) continue
    for (const name of mentions) {
      const key = name.toLowerCase()
      const existing = staffMap.get(key) ?? { count: 0, totalRating: 0, quotes: [] }
      existing.count++
      existing.totalRating += review.star_rating
      if (review.review_text && existing.quotes.length < 2) {
        existing.quotes.push(review.review_text.slice(0, 120))
      }
      staffMap.set(key, existing)
    }
  }

  const staff = Array.from(staffMap.entries())
    .map(([key, data]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      count: data.count,
      avgRating: data.totalRating / data.count,
      quote: data.quotes[0] ?? null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  if (staff.length === 0) return null

  return (
    <div>
      <SectionLabel>Your team in customers' words</SectionLabel>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {staff.map((member) => (
          <div key={member.name} className="bg-white rounded-2xl border border-[#E4DED8] p-5">
            <div className="w-10 h-10 rounded-full bg-[#FEF0E8] border border-[#F5C9AD] flex items-center justify-center text-[#C94E21] font-bold text-[16px] mb-3">
              {member.name.charAt(0)}
            </div>
            <p className="text-[14px] font-semibold text-[#111] mb-1">{member.name}</p>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[12px] text-[#555]">{member.count} mention{member.count !== 1 ? 's' : ''}</span>
              <span className="text-[#CCC]">·</span>
              <span className="text-[12px] text-[#E05A28] font-medium">{member.avgRating.toFixed(1)}★</span>
            </div>
            {member.quote && (
              <p className="text-[11px] text-[#888] italic leading-relaxed line-clamp-3">"{member.quote}…"</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsClient({ reviews, restaurantName, userId }: Props) {
  const [themes, setThemes] = useState<ThemeResult>({ praised: [], complaints: [], opportunities: [] })
  const [themesLoading, setThemesLoading] = useState(true)
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [downloadingReport, setDownloadingReport] = useState(false)

  // ── Derived data ───────────────────────────────────────────────────────────
  const totalReviews = reviews.length
  const avgRating = avg(reviews.map((r) => r.star_rating))
  const approvedCount = reviews.filter((r) => r.reply_status === 'approved').length
  const responseRate = totalReviews > 0 ? Math.round((approvedCount / totalReviews) * 100) : 0

  const ratingDist = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (const r of reviews) if (r.star_rating >= 1 && r.star_rating <= 5) counts[r.star_rating]++
    return counts
  }, [reviews])

  const now = new Date()
  const trendData = useMemo(() => {
    const months: Record<string, number[]> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = []
    }
    for (const r of reviews) {
      const key = getMonthKey(r.review_datetime_utc)
      if (key in months) months[key].push(r.star_rating)
    }
    return Object.entries(months).map(([key, ratings]) => ({
      month: new Date(key + '-01').toLocaleDateString('en-US', { month: 'short' }),
      rating: ratings.length ? parseFloat(avg(ratings).toFixed(2)) : null,
    }))
  }, [reviews])

  const hasEnoughTrend = trendData.filter((d) => d.rating !== null).length >= 2

  // Rolling-average sparkline — smooths noise so the line tells a real story
  const sparkData = useMemo(() => {
    const sorted = [...reviews]
      .filter((r) => r.review_datetime_utc)
      .sort((a, b) => new Date(a.review_datetime_utc).getTime() - new Date(b.review_datetime_utc).getTime())
      .slice(-20)
    const win = Math.max(2, Math.ceil(sorted.length / 5)) // window ~20% of dataset
    return sorted.map((_, i) => {
      const slice = sorted.slice(Math.max(0, i - win + 1), i + 1)
      const rolling = slice.reduce((s, r) => s + r.star_rating, 0) / slice.length
      return { i, rating: parseFloat(rolling.toFixed(2)) }
    })
  }, [reviews])
  const hasSparkData = sparkData.length >= 3

  // Trend direction: compare first-half avg vs second-half avg
  const sparkTrend = useMemo(() => {
    if (sparkData.length < 4) return 'neutral'
    const mid = Math.ceil(sparkData.length / 2)
    const firstAvg = sparkData.slice(0, mid).reduce((s, d) => s + d.rating, 0) / mid
    const lastHalf = sparkData.slice(mid)
    const lastAvg = lastHalf.reduce((s, d) => s + d.rating, 0) / lastHalf.length
    const delta = lastAvg - firstAvg
    if (delta > 0.15) return 'up'
    if (delta < -0.15) return 'down'
    return 'neutral'
  }, [sparkData])

  const bestReview = useMemo(() =>
    [...reviews].filter((r) => r.review_text?.trim())
      .sort((a, b) => b.star_rating - a.star_rating || b.review_text.length - a.review_text.length)[0] ?? null
  , [reviews])

  const worstReview = useMemo(() =>
    [...reviews].filter((r) => r.review_text?.trim())
      .sort((a, b) => a.star_rating - b.star_rating)[0] ?? null
  , [reviews])

  // ── Fetch themes ───────────────────────────────────────────────────────────
  const fetchThemes = async (force = false) => {
    const reviewTexts = reviews.filter((r) => r.review_text?.trim()).map((r) => r.review_text)
    if (reviewTexts.length < 3) {
      setThemes({ praised: [], complaints: [], opportunities: [], insufficient: true })
      setThemesLoading(false)
      return
    }

    try {
      const res = await fetch('/api/analyze-themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: reviewTexts, forceRefresh: force }),
      })
      const data: ThemeResult = await res.json()

      if (data.error) { console.error('[analytics] theme error:', data.error); return }

      setThemes({
        praised:       Array.isArray(data.praised)       ? data.praised       : [],
        complaints:    Array.isArray(data.complaints)    ? data.complaints    : [],
        opportunities: Array.isArray(data.opportunities) ? data.opportunities : [],
        insufficient:  data.insufficient,
      })
      if (data.lastAnalyzedAt) setLastAnalyzedAt(data.lastAnalyzedAt)
    } catch (err) {
      console.error('[analytics] fetch error:', err)
    } finally {
      setThemesLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (totalReviews === 0) { setThemesLoading(false); return }
    fetchThemes(false)
  }, [userId, totalReviews])

  const handleRefresh = () => {
    setRefreshing(true)
    setThemesLoading(true)
    fetchThemes(true)
  }

  const handleDownloadReport = async () => {
    setDownloadingReport(true)
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

      // Cover page
      doc.setFillColor(17, 17, 17) // #111
      doc.rect(0, 0, 210, 297, 'F')
      doc.setTextColor(224, 90, 40) // accent orange
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('TABLEREPLY', 20, 30)
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(32)
      doc.text(restaurantName, 20, 60, { maxWidth: 170 })
      doc.setFontSize(16)
      doc.setTextColor(170, 170, 170)
      doc.text(`${month} · Review Report`, 20, 80)

      // Page 2 — Executive summary
      doc.addPage()
      doc.setFillColor(243, 240, 236) // #F3F0EC
      doc.rect(0, 0, 210, 297, 'F')
      doc.setTextColor(17, 17, 17)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('Executive Summary', 20, 30)

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(85, 85, 85)
      const summaryLines = [
        `Total Reviews: ${totalReviews}`,
        `Average Rating: ${avgRating.toFixed(1)} ★`,
        `Response Rate: ${responseRate}%`,
        `Replies Generated: ${approvedCount}`,
      ]
      summaryLines.forEach((line, i) => {
        doc.text(line, 20, 50 + i * 10)
      })

      // Rating distribution
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(17, 17, 17)
      doc.text('Rating Breakdown', 20, 110)

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(85, 85, 85)
      ;[5, 4, 3, 2, 1].forEach((star, i) => {
        const count = ratingDist[star] ?? 0
        const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
        doc.text(`${star}★  ${count} reviews (${pct}%)`, 20, 125 + i * 10)
      })

      // Themes (if available)
      if (themes.praised.length || themes.complaints.length || themes.opportunities.length) {
        doc.addPage()
        doc.setFillColor(245, 244, 240)
        doc.rect(0, 0, 210, 297, 'F')
        doc.setTextColor(17, 17, 17)
        doc.setFontSize(20)
        doc.setFont('helvetica', 'bold')
        doc.text('Insights', 20, 30)

        let y = 50
        if (themes.praised.length) {
          doc.setFontSize(13)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(17, 17, 17)
          doc.text('Customers love:', 20, y); y += 8
          doc.setFontSize(11)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(85, 85, 85)
          themes.praised.forEach((item) => { doc.text(`• ${item}`, 25, y); y += 7 })
          y += 5
        }
        if (themes.complaints.length) {
          doc.setFontSize(13)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(17, 17, 17)
          doc.text('Frequently mentioned:', 20, y); y += 8
          doc.setFontSize(11)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(85, 85, 85)
          themes.complaints.forEach((item) => { doc.text(`• ${item}`, 25, y); y += 7 })
          y += 5
        }
        if (themes.opportunities.length) {
          doc.setFontSize(13)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(17, 17, 17)
          doc.text('Opportunities to improve:', 20, y); y += 8
          doc.setFontSize(11)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(85, 85, 85)
          themes.opportunities.forEach((item) => { doc.text(`• ${item}`, 25, y); y += 7 })
        }
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(9)
        doc.setTextColor(170, 170, 170)
        doc.text('Generated by TableReply · tablereply.com', 20, 290)
        doc.text(`Page ${i} of ${pageCount}`, 180, 290, { align: 'right' })
      }

      const filename = `${restaurantName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${month.replace(' ', '-').toLowerCase()}-review-report.pdf`
      doc.save(filename)
    } catch (err) {
      console.error('PDF generation error:', err)
      alert('Failed to generate report. Please try again.')
    } finally {
      setDownloadingReport(false)
    }
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (totalReviews === 0) return <EmptyState restaurantName={restaurantName} />

  // ── Full dashboard ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-12 pb-20">

      {/* ── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1
            className="text-[clamp(26px,3vw,38px)] text-[#111] leading-tight"
            style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}
          >
            {restaurantName}
          </h1>
          <p className="text-[#999] text-[13px] mt-0.5">
            {totalReviews} review{totalReviews !== 1 ? 's' : ''} · analytics overview
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {lastAnalyzedAt && (
            <span className="text-[11px] text-[#BBB] hidden sm:block">
              Last analyzed {formatDate(lastAnalyzedAt)}
            </span>
          )}
          <button
            onClick={handleDownloadReport}
            disabled={downloadingReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E4DED8] bg-white hover:border-[#D4CFC6] text-[#555] hover:text-[#111] text-[12px] font-medium disabled:opacity-40 transition-all"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloadingReport ? 'Generating…' : 'Download Report'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111] hover:bg-[#2a2a2a] text-white text-[12px] font-medium disabled:opacity-40 transition-all"
          >
            <svg className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Analysing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── RATING HERO ────────────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-[#111111] overflow-hidden">
        {/* Mobile: center → breakdown → trend. Desktop: breakdown | center | trend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">

          {/* Center — big number (first on mobile via order-1) */}
          <div className="order-1 md:order-2 flex flex-col items-center justify-center px-8 py-12 text-center border-b md:border-b-0 border-white/[0.07]">
            <p
              className="text-white leading-none mb-5"
              style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(80px, 10vw, 120px)', fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              {avgRating.toFixed(1)}
            </p>
            <div className="flex items-center gap-1.5">
              {[1,2,3,4,5].map((i) => (
                <svg key={i} className={`w-7 h-7 ${i <= Math.round(avgRating) ? 'text-[#E05A28]' : 'text-white/15'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-white/40 text-[12px] mt-4 leading-relaxed">
              {totalReviews} reviews analysed ·{' '}
              <span className={
                responseRate >= 80 ? 'text-emerald-400 font-medium' :
                responseRate < 50  ? 'text-[#E05A28] font-medium' :
                'text-white/40'
              }>
                {responseRate}% replied
              </span>
            </p>
            {responseRate < 50 && (
              <p className="text-white/20 text-[10px] mt-1 max-w-[180px] leading-relaxed">
                Reply to more reviews to boost local SEO
              </p>
            )}
          </div>

          {/* Breakdown (second on mobile via order-2, first on desktop) */}
          <div className="order-2 md:order-1 px-8 py-12 border-b md:border-b-0 md:border-r border-white/[0.07]">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#E05A28]/70 mb-6">Breakdown</p>
            <div className="space-y-3.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingDist[star] ?? 0
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-[11px] text-white/40 w-5 flex-shrink-0 text-right">{star}★</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#E05A28] transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-white/40 w-12 flex-shrink-0 text-right">{count} · {Math.round(pct)}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Trend (third, order-3 on both) */}
          <div className="order-3 px-8 py-12 md:border-l border-white/[0.07]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#E05A28]/70">Trend</p>
              {hasSparkData && (
                <span className={`text-[11px] font-semibold ${
                  sparkTrend === 'up' ? 'text-emerald-400' :
                  sparkTrend === 'down' ? 'text-red-400' :
                  'text-white/30'
                }`}>
                  {sparkTrend === 'up' ? '▲ Improving' : sparkTrend === 'down' ? '▼ Declining' : '→ Steady'}
                </span>
              )}
            </div>
            {hasSparkData ? (
              <>
                <p className="text-white/25 text-[10px] mb-3">Rolling avg · last {sparkData.length} reviews</p>
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={sparkData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                    <YAxis domain={[1, 5]} hide />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      stroke={sparkTrend === 'up' ? '#34D399' : sparkTrend === 'down' ? '#F87171' : '#E05A28'}
                      strokeWidth={2.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-white/20 text-[10px]">Oldest</span>
                  <span className="text-white/20 text-[10px]">Latest</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col justify-center h-[120px]">
                <p className="text-white/30 text-[12px] leading-relaxed">More data coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── YOUR IMPACT ────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Your impact</SectionLabel>
        <div className="rounded-2xl border border-[#E4DED8] bg-white p-6 md:p-8">

          {/* Before / After header */}
          <div className="flex flex-col sm:flex-row gap-8 mb-8">
            <div className="flex-shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#CCC] mb-1">Most restaurants</p>
              <p
                className="text-[#CCC] leading-none mb-1"
                style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(36px,5vw,52px)', fontWeight: 700 }}
              >
                ~15%
              </p>
              <p className="text-[11px] text-[#CCC]">respond to reviews</p>
            </div>

            <div className="w-px bg-[#EDE9E4] self-stretch hidden sm:block" />

            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#E05A28] mb-1">
                {restaurantName}
              </p>
              <p
                className="leading-none mb-2"
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: 'clamp(40px,6vw,60px)',
                  fontWeight: 700,
                  color: responseRate >= 80 ? '#22c55e' : responseRate >= 50 ? '#111' : '#E05A28',
                }}
              >
                {responseRate}%
              </p>
              {responseRate >= 80 ? (
                <p className="text-[13px] font-semibold text-emerald-600">
                  You're in the top tier of restaurants
                </p>
              ) : responseRate >= 50 ? (
                <p className="text-[13px] font-medium text-[#555]">
                  Above average — keep it up
                </p>
              ) : (
                <p className="text-[13px] font-medium text-[#C94E21]">
                  Responding to more reviews could increase profile conversions by up to 16%
                </p>
              )}
            </div>
          </div>

          {/* Bar comparison */}
          <div className="space-y-3">
            {([
              { label: 'Industry avg', pct: 15, highlight: false },
              { label: restaurantName, pct: Math.min(responseRate, 100), highlight: true },
              { label: 'Top chains', pct: 60, highlight: false },
            ] as const).map(({ label, pct, highlight }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`text-[12px] flex-shrink-0 w-28 truncate ${highlight ? 'font-semibold text-[#111]' : 'text-[#AAA]'}`}>
                  {label}
                </span>
                <div className="flex-1 h-2 bg-[#F3F0EC] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      highlight
                        ? responseRate >= 50 ? 'bg-emerald-400' : 'bg-[#E05A28]'
                        : 'bg-[#E4DED8]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`text-[12px] w-8 flex-shrink-0 text-right ${highlight ? 'font-semibold text-[#111]' : 'text-[#CCC]'}`}>
                  {pct}%
                </span>
              </div>
            ))}
          </div>

          {responseRate < 50 && (
            <p className="text-[10px] text-[#CCC] mt-5">
              16% conversion uplift stat: SOCi research
            </p>
          )}
        </div>
      </div>

      {/* ── WHAT CUSTOMERS ARE SAYING ──────────────────────────────────────── */}
      <div className="pt-8 pb-4">
        <SectionLabel>What customers are saying</SectionLabel>

        {themesLoading ? (
          <ThemeSkeleton />
        ) : themes.insufficient ? (
          <div className="text-center py-12">
            <p className="text-[#888] text-[13px]">
              Sync at least 5 reviews to unlock sentiment analysis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">

            {/* They love */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <svg className="w-4 h-4 text-[#E05A28]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                </svg>
                <span className="text-[13px] font-semibold text-[#111]">They love</span>
              </div>
              <ul>
                {(themes.praised.length ? themes.praised : []).map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 mb-3">
                    <svg className="w-3.5 h-3.5 text-[#E05A28] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                    </svg>
                    <span className="text-[13px] text-[#444] leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* They mention */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <svg className="w-4 h-4 text-[#AAA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                </svg>
                <span className="text-[13px] font-semibold text-[#111]">They mention</span>
              </div>
              <ul>
                {(themes.complaints.length ? themes.complaints : []).map((item, i) => (
                  <li key={i} className="text-[13px] text-[#888] leading-snug mb-3">{item}</li>
                ))}
              </ul>
            </div>

            {/* To improve */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <svg className="w-4 h-4 text-[#888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
                <span className="text-[13px] font-semibold text-[#111]">To improve</span>
              </div>
              <ul>
                {(themes.opportunities.length ? themes.opportunities : []).map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 mb-3">
                    <span className="text-[#CCC] mt-0.5 flex-shrink-0 text-[11px] font-bold">{i + 1}.</span>
                    <span className="text-[13px] text-[#555] leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}
      </div>

      {/* ── RATING OVER TIME ───────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Rating over time</SectionLabel>

        {!hasEnoughTrend ? (
          /* Single-month state — show current avg prominently + explanation */
          <div className="rounded-2xl border border-[#E4DED8] bg-[#F3F0EC] px-8 py-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-8">
              <div className="text-center sm:text-left flex-shrink-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#E05A28] mb-2">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <p
                  className="text-[#111] leading-none"
                  style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(52px, 7vw, 80px)', fontWeight: 700, letterSpacing: '-0.02em' }}
                >
                  {avgRating.toFixed(1)}
                </p>
                <p className="text-[12px] text-[#AAA] mt-2">
                  avg this month · {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-[#333] mb-1 leading-snug">
                  Your trend chart will fill in as reviews come in over time.
                </p>
                <p className="text-[13px] text-[#888] leading-relaxed">
                  Once you have data across 2 or more months, you'll see how your rating is moving — up, down, or steady. Keep responding to reviews to keep the momentum going.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E05A28" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#E05A28" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="rating"
                stroke="#E05A28"
                strokeWidth={2.5}
                fill="url(#trendGrad)"
                dot={{ fill: '#E05A28', strokeWidth: 0, r: 3.5 }}
                activeDot={{ r: 5, fill: '#E05A28', strokeWidth: 0 }}
                connectNulls
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#BBB' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<LineTooltip />} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── NOTABLE REVIEWS ────────────────────────────────────────────────── */}
      {(bestReview || worstReview) && (
        <div>
          <SectionLabel>Notable reviews</SectionLabel>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x md:divide-[#E4DED8]">

            {/* Best review */}
            {bestReview && (
              <div className="pr-0 md:pr-10 pb-10 md:pb-0">
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((i) => (
                      <svg key={i} className={`w-3 h-3 ${i <= bestReview.star_rating ? 'text-[#E05A28]' : 'text-[#E4DED8]'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <span className="text-[13px] font-semibold text-[#111]">{bestReview.reviewer_name}</span>
                  <span className="text-[11px] text-[#CCC]">{formatDate(bestReview.review_datetime_utc)}</span>
                </div>

                <div className="relative">
                  {/* Large background quote mark */}
                  <span
                    className="absolute -top-4 -left-2 text-[#E05A28]/10 select-none pointer-events-none"
                    style={{ fontFamily: 'var(--font-playfair)', fontSize: 96, lineHeight: 1 }}
                    aria-hidden
                  >
                    "
                  </span>
                  <p
                    className="relative text-[#333] text-base leading-relaxed"
                    style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
                  >
                    {bestReview.review_text}
                  </p>
                </div>
              </div>
            )}

            {/* Worst review */}
            {worstReview && worstReview.id !== bestReview?.id && (
              <div className="pl-0 md:pl-10 pt-10 md:pt-0">
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((i) => (
                      <svg key={i} className={`w-3 h-3 ${i <= worstReview.star_rating ? 'text-red-400' : 'text-[#E4DED8]'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <span className="text-[13px] font-semibold text-[#111]">{worstReview.reviewer_name}</span>
                  <span className="text-[11px] text-[#CCC]">{formatDate(worstReview.review_datetime_utc)}</span>
                </div>

                <div className="relative">
                  <span
                    className="absolute -top-4 -left-2 text-red-300/20 select-none pointer-events-none"
                    style={{ fontFamily: 'var(--font-playfair)', fontSize: 96, lineHeight: 1 }}
                    aria-hidden
                  >
                    "
                  </span>
                  <p
                    className="relative text-[#777] text-base leading-relaxed"
                    style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}
                  >
                    {worstReview.review_text}
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── QUICK WIN ──────────────────────────────────────────────────────── */}
      {!themesLoading && !themes.insufficient && themes.opportunities.length > 0 && (
        <div>
          <SectionLabel>Quick win</SectionLabel>
          <div className="border-l-[3px] border-[#E05A28] pl-6 py-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#E05A28] mb-2">
              Your #1 opportunity right now
            </p>
            <p
              className="text-[17px] font-semibold text-[#111] leading-snug mb-2"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {themes.opportunities[0]}
            </p>
            <p className="text-[12px] text-[#AAA]">
              Based on patterns across your {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* ── STAR EMPLOYEES ───────────────────────────────────────────────── */}
      <StaffMentionsSection reviews={reviews} />

    </div>
  )
}
