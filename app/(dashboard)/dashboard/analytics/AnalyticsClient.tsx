'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, BarChart, Bar, Cell, ComposedChart,
} from 'recharts'
import type { ScrapedReview } from '@/types'

interface TooltipPayloadEntry {
  name: string
  value: number
  color?: string
}

interface RechartsTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}

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

const STOP_WORDS = new Set([
  'the','and','was','for','that','this','they','were','with','from','have','been',
  'your','their','what','will','just','very','good','great','really','would','could',
  'should','about','also','when','then','than','some','more','here','there','which',
  'these','those','like','well','got','all','but','had','has','not','are','its',
  'our','her','his','him','she','you','can','out','one','how','did','get','back',
  'even','time','only','place','food','came','come','we','me','my','it','be','so',
  'at','in','on','to','of','a','an','is','i','if','as','up',
])

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-amber-400' : 'text-[#E4DED8]'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-semibold text-[#57534E] mb-5">{children}</p>
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

// ─── Tooltips ────────────────────────────────────────────────────────────────

function SparkTooltip({ active, payload, label }: RechartsTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white text-[#111] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#E4DED8] shadow-sm">
      <span className="text-[#A8A29E]">{label} · </span>
      <span className="font-semibold">{Number(payload[0].value).toFixed(1)}★</span>
    </div>
  )
}

function LineTooltip({ active, payload, label }: RechartsTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white text-[#111] text-[12px] px-3 py-2 rounded-xl shadow-lg border border-[#E4DED8]">
      <p className="text-[#A8A29E] text-[11px] mb-0.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold">
          {p.name === 'count' ? `${p.value} review${p.value !== 1 ? 's' : ''}` : `${Number(p.value).toFixed(1)} ★`}
        </p>
      ))}
    </div>
  )
}

function BarChartTooltip({ active, payload, label }: RechartsTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white text-[#111] text-[12px] px-3 py-2 rounded-xl shadow-lg border border-[#E4DED8]">
      <p className="text-[#A8A29E] text-[11px] mb-0.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold">{p.value} review{p.value !== 1 ? 's' : ''}</p>
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ restaurantName }: { restaurantName: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#F3F0EC] border border-[#E4DED8] flex items-center justify-center mb-6">
        <svg className="w-6 h-6 text-[#E05A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-[#111111] mb-2">No data yet</h2>
      <p className="text-[13px] text-[#57534E] max-w-sm leading-relaxed mb-6">
        Connect Google Maps, Yelp, or TripAdvisor and sync reviews to see analytics for {restaurantName}.
      </p>
      <a href="/dashboard/reviews" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F3F0EC] hover:bg-[#E9E5E0] border border-[#E4DED8] text-[#111111] text-[13px] font-medium transition-all">
        Connect a Platform →
      </a>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsClient({ reviews, restaurantName, userId }: Props) {
  const [themes, setThemes] = useState<ThemeResult>({ praised: [], complaints: [], opportunities: [] })
  const [themesLoading, setThemesLoading] = useState(true)
  const [themesError, setThemesError] = useState<string | null>(null)
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [downloadingReport, setDownloadingReport] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [downloadingCsv, setDownloadingCsv] = useState(false)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  type DateRange = '30d' | '90d' | '180d' | 'all'
  const [dateRange, setDateRange] = useState<DateRange>('all')

  const filteredReviews = useMemo(() => {
    if (dateRange === 'all') return reviews
    const days = dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 180
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return reviews.filter((r) => r.review_datetime_utc && new Date(r.review_datetime_utc) >= cutoff)
  }, [reviews, dateRange])

  // ── Core metrics ───────────────────────────────────────────────────────────
  const totalReviews = filteredReviews.length
  const avgRating = avg(filteredReviews.map((r) => r.star_rating))
  const approvedCount = filteredReviews.filter((r) => r.reply_status === 'approved').length
  const responseRate = totalReviews > 0 ? Math.round((approvedCount / totalReviews) * 100) : 0

  const ratingDist = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (const r of filteredReviews) if (r.star_rating >= 1 && r.star_rating <= 5) counts[r.star_rating]++
    return counts
  }, [filteredReviews])

  // ── Trend / sparkline ──────────────────────────────────────────────────────
  const now = new Date()
  const trendData = useMemo(() => {
    // Find the earliest review date so we only show months with actual data
    const datedReviews = filteredReviews.filter((r) => r.review_datetime_utc)
    if (!datedReviews.length) return []

    const earliest = datedReviews.reduce((min, r) =>
      r.review_datetime_utc < min ? r.review_datetime_utc : min,
      datedReviews[0].review_datetime_utc
    )
    const startDate = new Date(earliest)
    const startYear = startDate.getFullYear()
    const startMonth = startDate.getMonth()

    const months: Record<string, number[]> = {}
    let y = startYear, m = startMonth
    while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth())) {
      months[`${y}-${String(m + 1).padStart(2, '0')}`] = []
      m++
      if (m > 11) { m = 0; y++ }
    }

    for (const r of filteredReviews) {
      const key = getMonthKey(r.review_datetime_utc)
      if (key in months) months[key].push(r.star_rating)
    }
    const keys = Object.keys(months)
    const spansMultipleYears = new Set(keys.map(k => k.split('-')[0])).size > 1
    return keys.map((key, i) => {
      const ratings = months[key]
      const d = new Date(key + '-01')
      // Show year on first entry or whenever the year changes
      const prevKey = keys[i - 1]
      const yearChanged = !prevKey || prevKey.split('-')[0] !== key.split('-')[0]
      const label = spansMultipleYears && yearChanged
        ? d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        : d.toLocaleDateString('en-US', { month: 'short' })
      return {
        month: label,
        rating: ratings.length ? parseFloat(avg(ratings).toFixed(2)) : null,
        count: ratings.length,
      }
    })
  }, [filteredReviews])

  const hasEnoughTrend = trendData.filter((d) => d.rating !== null).length >= 2
  const hasVolumeData = trendData.some((d) => d.count > 0)

  const sparkData = useMemo(() => {
    const sorted = [...filteredReviews].filter((r) => r.review_datetime_utc)
      .sort((a, b) => new Date(a.review_datetime_utc).getTime() - new Date(b.review_datetime_utc).getTime())
      .slice(-30)
    const win = Math.max(2, Math.ceil(sorted.length / 5))
    return sorted.map((_, i) => {
      const slice = sorted.slice(Math.max(0, i - win + 1), i + 1)
      const rolling = slice.reduce((s, r) => s + r.star_rating, 0) / slice.length
      return { i, rating: parseFloat(rolling.toFixed(2)) }
    })
  }, [filteredReviews])
  const hasSparkData = sparkData.length >= 3

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

  // ── Day of week analysis ───────────────────────────────────────────────────
  const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dowData = useMemo(() => {
    const counts = Array(7).fill(0)
    const ratings: number[][] = Array(7).fill(null).map(() => [])
    for (const r of filteredReviews) {
      if (!r.review_datetime_utc) continue
      const dow = new Date(r.review_datetime_utc).getDay()
      counts[dow]++
      ratings[dow].push(r.star_rating)
    }
    return DOW_LABELS.map((label, i) => ({
      label,
      count: counts[i],
      avgRating: ratings[i].length ? parseFloat(avg(ratings[i]).toFixed(1)) : 0,
    }))
  }, [filteredReviews])
  const maxDowCount = Math.max(...dowData.map((d) => d.count), 1)
  const hasDowData = dowData.some((d) => d.count > 0)

  // ── Response rate by star rating ───────────────────────────────────────────
  const responseByRating = useMemo(() => {
    const data: Record<number, { total: number; replied: number }> = { 1: { total: 0, replied: 0 }, 2: { total: 0, replied: 0 }, 3: { total: 0, replied: 0 }, 4: { total: 0, replied: 0 }, 5: { total: 0, replied: 0 } }
    for (const r of filteredReviews) {
      const star = r.star_rating
      if (star >= 1 && star <= 5) {
        data[star].total++
        if (r.reply_status === 'approved') data[star].replied++
      }
    }
    return data
  }, [filteredReviews])

  // ── Critical unanswered ────────────────────────────────────────────────────
  const criticalUnanswered = useMemo(() =>
    filteredReviews.filter((r) => r.star_rating <= 2 && r.reply_status !== 'approved' && r.reply_status !== 'dismissed').length
  , [filteredReviews])

  // ── Language breakdown ─────────────────────────────────────────────────────
  const languageData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of filteredReviews) {
      const lang = r.language ?? 'English'
      counts[lang] = (counts[lang] ?? 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([lang, count]) => ({ lang, count, pct: Math.round((count / totalReviews) * 100) }))
  }, [filteredReviews, totalReviews])
  const hasMultipleLanguages = languageData.length > 1

  // ── Top keywords ──────────────────────────────────────────────────────────
  const topKeywords = useMemo(() => {
    const freq: Record<string, number> = {}
    for (const r of filteredReviews) {
      if (!r.review_text) continue
      const words = r.review_text.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? []
      for (const w of words) {
        if (!STOP_WORDS.has(w)) freq[w] = (freq[w] ?? 0) + 1
      }
    }
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20)
      .map(([word, count]) => ({ word, count }))
  }, [filteredReviews])

  // ── This month vs last month ───────────────────────────────────────────────
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`

  const thisMonthReviews = filteredReviews.filter((r) => getMonthKey(r.review_datetime_utc) === thisMonthKey)
  const lastMonthReviews = filteredReviews.filter((r) => getMonthKey(r.review_datetime_utc) === lastMonthKey)
  const thisMonthAvg = thisMonthReviews.length ? avg(thisMonthReviews.map((r) => r.star_rating)) : 0
  const lastMonthAvg = lastMonthReviews.length ? avg(lastMonthReviews.map((r) => r.star_rating)) : 0
  const ratingDelta = thisMonthAvg && lastMonthAvg ? thisMonthAvg - lastMonthAvg : null

  // ── Notable reviews ────────────────────────────────────────────────────────
  const bestReview = useMemo(() =>
    [...filteredReviews].filter((r) => r.review_text?.trim())
      .sort((a, b) => b.star_rating - a.star_rating || b.review_text.length - a.review_text.length)[0] ?? null
  , [filteredReviews])

  const worstReview = useMemo(() =>
    [...filteredReviews].filter((r) => r.review_text?.trim())
      .sort((a, b) => a.star_rating - b.star_rating)[0] ?? null
  , [filteredReviews])

  // ── Fetch themes ───────────────────────────────────────────────────────────
  const fetchThemes = useCallback(async (force = false) => {
    const reviewTexts = filteredReviews.filter((r) => r.review_text?.trim()).map((r) => r.review_text)
    setThemesError(null)
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
      if (data.error) {
        setThemesLoading(false)
        setRefreshing(false)
        setThemesError('Failed to load themes. Try again.')
        console.error('[analytics] theme error:', data.error)
        return
      }
      setThemes({
        praised:       Array.isArray(data.praised)       ? data.praised       : [],
        complaints:    Array.isArray(data.complaints)    ? data.complaints    : [],
        opportunities: Array.isArray(data.opportunities) ? data.opportunities : [],
        insufficient:  data.insufficient,
      })
      if (data.lastAnalyzedAt) setLastAnalyzedAt(data.lastAnalyzedAt)
    } catch (err) {
      console.error('[analytics] fetch error:', err)
      setThemesError('Failed to load themes. Try again.')
    } finally {
      setThemesLoading(false)
      setRefreshing(false)
    }
  }, [filteredReviews])

  useEffect(() => {
    if (reviews.length === 0) { setThemesLoading(false); return }
    setThemesLoading(true)
    // Debounce so rapid date-range changes don't fire multiple Claude calls
    const timer = setTimeout(() => fetchThemes(false), 400)
    return () => clearTimeout(timer)
  }, [userId, dateRange, reviews.length, fetchThemes])

  // ── Escape key closes download dropdown ───────────────────────────────────
  useEffect(() => {
    if (!showDownloadMenu) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowDownloadMenu(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showDownloadMenu])

  const handleRefresh = () => {
    // Keep existing results visible — just show a subtle refreshing indicator
    setRefreshing(true)
    fetchThemes(true)
  }

  const handleDownloadCsv = async () => {
    setDownloadingCsv(true)
    setShowDownloadMenu(false)
    try {
      const res = await fetch('/api/user/export-csv')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${restaurantName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-reviews.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError('CSV export failed. Please try again.')
      setTimeout(() => setDownloadError(null), 5000)
    } finally {
      setDownloadingCsv(false)
    }
  }

  const handleDownloadReport = async () => {
    setDownloadingReport(true)
    setPdfLoading(true)
    setShowDownloadMenu(false)
    try {
      const jsPDF = (await import('jspdf')).default
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      const generatedOn = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

      // ── Design constants ────────────────────────────────────────────────────
      const L = 20          // left margin
      const R = 190         // right edge
      const W = R - L       // usable width = 170mm
      const ORANGE: [number,number,number]  = [224, 90, 40]
      const DARK: [number,number,number]    = [17, 17, 17]
      const MID: [number,number,number]     = [87, 83, 78]
      const LIGHT: [number,number,number]   = [168, 162, 158]
      const BG: [number,number,number]      = [248, 246, 243]
      const RULE: [number,number,number]    = [228, 222, 216]
      const WHITE: [number,number,number]   = [255, 255, 255]

      // ── Helper: standard page background + left accent bar ──────────────────
      const pageChrome = () => {
        doc.setFillColor(...BG)
        doc.rect(0, 0, 210, 297, 'F')
        doc.setFillColor(...ORANGE)
        doc.rect(0, 0, 4, 297, 'F')
      }

      // ── Helper: section header chip ─────────────────────────────────────────
      const sectionHeader = (title: string, yPos: number, color: [number,number,number] = DARK) => {
        doc.setFillColor(color[0], color[1], color[2])
        doc.roundedRect(L, yPos - 5, W, 9, 1.5, 1.5, 'F')
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...WHITE)
        doc.text(title.toUpperCase(), L + 4, yPos + 0.5)
        return yPos + 12
      }

      // ── Helper: horizontal rule ─────────────────────────────────────────────
      const rule = (yPos: number) => {
        doc.setDrawColor(...RULE)
        doc.setLineWidth(0.3)
        doc.line(L, yPos, R, yPos)
      }

      // ── Helper: footer on every page ────────────────────────────────────────
      const addFooter = (pageNum: number, total: number) => {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...LIGHT)
        doc.text(`ReplyFi · replyfi.app · Generated ${generatedOn}`, L, 291)
        doc.text(`${pageNum} / ${total}`, R, 291, { align: 'right' })
      }

      // ── Helper: draw star rating as filled/empty dots ───────────────────────
      const drawStarDots = (x: number, yPos: number, rating: number) => {
        for (let i = 0; i < 5; i++) {
          doc.setFillColor(...(i < rating ? ORANGE : RULE))
          doc.circle(x + i * 4.5, yPos, 1.4, 'F')
        }
      }

      // ── Helper: stat box ────────────────────────────────────────────────────
      const statBox = (x: number, yPos: number, w: number, value: string, label: string, accent = false) => {
        doc.setFillColor(...WHITE)
        doc.setDrawColor(...RULE)
        doc.setLineWidth(0.4)
        doc.roundedRect(x, yPos, w, 20, 2, 2, 'FD')
        if (accent) {
          doc.setFillColor(...ORANGE)
          doc.roundedRect(x, yPos, 3, 20, 1, 1, 'F')
        }
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...DARK)
        doc.text(value, x + w / 2, yPos + 11, { align: 'center' })
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...LIGHT)
        doc.text(label.toUpperCase(), x + w / 2, yPos + 17, { align: 'center' })
      }

      // ═══════════════════════════════════════════════════════════════════════
      // PAGE 1 — COVER
      // ═══════════════════════════════════════════════════════════════════════
      doc.setFillColor(...DARK)
      doc.rect(0, 0, 210, 297, 'F')
      // Orange accent bar
      doc.setFillColor(...ORANGE)
      doc.rect(0, 0, 4, 297, 'F')
      // Brand
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...ORANGE)
      doc.text('REPLYFI', L, 28)
      // Restaurant name
      doc.setFontSize(30)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...WHITE)
      const nameLines = doc.splitTextToSize(restaurantName, W)
      doc.text(nameLines, L, 50)
      const nameH = nameLines.length * 12
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(140, 140, 140)
      doc.text('Review Analytics Report', L, 50 + nameH + 4)
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(month, L, 50 + nameH + 12)

      // Divider
      doc.setDrawColor(50, 50, 50)
      doc.setLineWidth(0.5)
      doc.line(L, 50 + nameH + 18, R, 50 + nameH + 18)

      // 4 stat boxes (2×2 grid)
      const boxTop = 50 + nameH + 26
      const bw = (W - 6) / 2
      statBox(L,        boxTop,      bw, String(totalReviews),                   'Total Reviews',    true)
      statBox(L + bw + 6, boxTop,    bw, `${avgRating.toFixed(1)} / 5`,          'Avg Rating',       true)
      statBox(L,        boxTop + 26, bw, `${responseRate}%`,                     'Response Rate',    false)
      statBox(L + bw + 6, boxTop + 26, bw, String(approvedCount),                'Replies Approved', false)

      // Critical alert badge
      if (criticalUnanswered > 0) {
        const alertY = boxTop + 60
        doc.setFillColor(100, 20, 0)
        doc.roundedRect(L, alertY, W, 11, 2, 2, 'F')
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 160, 100)
        doc.text(`! ${criticalUnanswered} critical review${criticalUnanswered !== 1 ? 's' : ''} still need a reply`, L + 4, alertY + 7)
      }

      // "What's inside" section in the lower half of the cover
      const insideY = boxTop + (criticalUnanswered > 0 ? 80 : 68)
      doc.setDrawColor(50, 50, 50)
      doc.setLineWidth(0.5)
      doc.line(L, insideY, R, insideY)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(120, 120, 120)
      doc.text('WHAT\'S IN THIS REPORT', L, insideY + 8)

      const insideItems = [
        'Performance Overview — rating distribution, monthly volume & reply coverage',
        ...(themes.praised.length || themes.complaints.length ? ['AI-Powered Insights — what customers love, complaints & growth opportunities'] : []),
        'Activity Patterns — busiest days and top keywords from your reviews',
        'Notable Reviews — your highest and lowest rated reviews with your replies',
      ]
      insideItems.forEach((item, i) => {
        const iy = insideY + 17 + i * 9
        doc.setFillColor(...ORANGE)
        doc.rect(L, iy - 3.5, 2, 5, 'F')
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(160, 160, 160)
        doc.text(item, L + 5, iy)
      })

      // Cover footer
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(70, 70, 70)
      doc.text(`Generated ${generatedOn}`, L, 285)

      // ═══════════════════════════════════════════════════════════════════════
      // PAGE 2 — PERFORMANCE OVERVIEW
      // ═══════════════════════════════════════════════════════════════════════
      doc.addPage()
      pageChrome()

      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK)
      doc.text('Performance Overview', L, 24)
      rule(28)

      let y = 38

      // ── Rating Distribution ────────────────────────────────────────────────
      y = sectionHeader('Rating Distribution', y)

      // Table header row
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...LIGHT)
      doc.text('RATING', L, y)
      doc.text('COUNT', L + 35, y)
      doc.text('SHARE', L + 55, y)
      doc.text('DISTRIBUTION', L + 75, y)
      y += 4
      rule(y); y += 5

      ;[5, 4, 3, 2, 1].forEach((star, idx) => {
        const count = ratingDist[star] ?? 0
        const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0

        // Alternating row tint
        if (idx % 2 === 0) {
          doc.setFillColor(244, 242, 239)
          doc.rect(L, y - 4, W, 7, 'F')
        }

        doc.setFontSize(9.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...DARK)
        doc.text(String(star), L, y)
        drawStarDots(L + 7, y - 1.5, star)

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...MID)
        doc.text(String(count), L + 35, y)
        doc.text(`${pct}%`, L + 55, y)

        // Bar track (shift right to match new column offsets, reduce barW to fit)
        const barW2 = 65
        const filled2 = Math.round((pct / 100) * barW2)
        doc.setFillColor(...RULE)
        doc.roundedRect(L + 75, y - 3.5, barW2, 4.5, 1, 1, 'F')
        // Bar fill
        if (filled2 > 0) {
          const barColor: [number,number,number] = star >= 4 ? [34, 197, 94] : star === 3 ? [234, 179, 8] : [239, 68, 68]
          doc.setFillColor(...barColor)
          doc.roundedRect(L + 75, y - 3.5, filled2, 4.5, 1, 1, 'F')
        }
        y += 8
      })
      y += 6

      // ── Monthly Volume Table ───────────────────────────────────────────────
      const monthsWithData = trendData.filter((d) => d.count > 0)
      if (monthsWithData.length > 0) {
        if (y > 230) { doc.addPage(); pageChrome(); y = 38 }
        y = sectionHeader('Monthly Volume', y)

        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...LIGHT)
        doc.text('MONTH', L, y)
        doc.text('REVIEWS', L + 30, y)
        doc.text('AVG RATING', L + 60, y)
        doc.text('VOLUME', L + 100, y)
        y += 4
        rule(y); y += 5

        const maxMonthCount = Math.max(...monthsWithData.map(d => d.count), 1)
        monthsWithData.forEach((d, idx) => {
          if (y > 270) { doc.addPage(); pageChrome(); y = 38 }
          if (idx % 2 === 0) {
            doc.setFillColor(244, 242, 239)
            doc.rect(L, y - 4, W, 7, 'F')
          }
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...DARK)
          doc.text(d.month, L, y)
          doc.text(String(d.count), L + 30, y)
          doc.text(d.rating != null ? `${d.rating.toFixed(1)}` : '–', L + 60, y)

          // Mini bar
          const barFill = Math.round((d.count / maxMonthCount) * 70)
          doc.setFillColor(...RULE)
          doc.roundedRect(L + 100, y - 3.5, 70, 4, 1, 1, 'F')
          if (barFill > 0) {
            doc.setFillColor(...ORANGE)
            doc.roundedRect(L + 100, y - 3.5, barFill, 4, 1, 1, 'F')
          }
          y += 7.5
        })
        y += 6
      }

      // ── Response Rate by Star ──────────────────────────────────────────────
      const ratingRows = [5, 4, 3, 2, 1].filter(s => responseByRating[s].total > 0)
      if (ratingRows.length > 0) {
        if (y > 230) { doc.addPage(); pageChrome(); y = 38 }
        y = sectionHeader('Reply Coverage by Star Rating', y)

        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...LIGHT)
        doc.text('RATING', L, y)
        doc.text('REPLIED', L + 35, y)
        doc.text('TOTAL', L + 58, y)
        doc.text('RATE', L + 82, y)
        doc.text('COVERAGE', L + 105, y)
        y += 4
        rule(y); y += 5

        ratingRows.forEach((star, idx) => {
          const d = responseByRating[star]
          const pct = Math.round((d.replied / d.total) * 100)
          if (idx % 2 === 0) {
            doc.setFillColor(244, 242, 239)
            doc.rect(L, y - 4, W, 7, 'F')
          }
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...DARK)
          doc.text(String(star), L, y)
          drawStarDots(L + 7, y - 1.5, star)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...MID)
          doc.text(String(d.replied), L + 35, y)
          doc.text(String(d.total), L + 58, y)
          doc.text(`${pct}%`, L + 82, y)
          doc.setFillColor(...RULE)
          doc.roundedRect(L + 105, y - 3.5, 65, 4, 1, 1, 'F')
          if (pct > 0) {
            doc.setFillColor(...ORANGE)
            doc.roundedRect(L + 105, y - 3.5, Math.round((pct / 100) * 65), 4, 1, 1, 'F')
          }
          y += 7.5
        })
      }

      // ═══════════════════════════════════════════════════════════════════════
      // PAGE 3 — AI INSIGHTS (conditional)
      // ═══════════════════════════════════════════════════════════════════════
      if (themes.praised.length || themes.complaints.length || themes.opportunities.length) {
        doc.addPage()
        pageChrome()

        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...DARK)
        doc.text('AI-Powered Insights', L, 24)
        rule(28)
        y = 38

        const insightSections: Array<{
          title: string
          items: string[]
          chipColor: [number,number,number]
          dotColor: [number,number,number]
        }> = [
          { title: 'What customers love',        items: themes.praised,       chipColor: [22, 163, 74],  dotColor: [34, 197, 94] },
          { title: 'Frequently mentioned issues', items: themes.complaints,    chipColor: [100, 100, 100],dotColor: [150, 150, 150] },
          { title: 'Top growth opportunities',   items: themes.opportunities, chipColor: ORANGE,         dotColor: ORANGE },
        ]

        for (const section of insightSections) {
          if (!section.items.length) continue
          if (y > 240) { doc.addPage(); pageChrome(); y = 38 }

          // Colored chip header
          doc.setFillColor(...section.chipColor)
          doc.roundedRect(L, y - 5, W, 9, 1.5, 1.5, 'F')
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...WHITE)
          doc.text(section.title.toUpperCase(), L + 4, y + 0.5)
          y += 13

          section.items.forEach((item) => {
            if (y > 275) { doc.addPage(); pageChrome(); y = 38 }
            // Dot
            doc.setFillColor(...section.dotColor)
            doc.circle(L + 2, y - 1.5, 1, 'F')
            // Text
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...MID)
            const lines = doc.splitTextToSize(item, W - 10)
            doc.text(lines, L + 8, y)
            y += lines.length * 5.5 + 2
          })
          y += 8
        }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // PAGE 4 — ACTIVITY PATTERNS
      // ═══════════════════════════════════════════════════════════════════════
      if (hasDowData || topKeywords.length) {
        doc.addPage()
        pageChrome()

        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...DARK)
        doc.text('Activity Patterns', L, 24)
        rule(28)
        y = 38

        // ── Day of Week ──────────────────────────────────────────────────────
        if (hasDowData) {
          y = sectionHeader('Reviews by Day of Week', y)

          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...LIGHT)
          doc.text('DAY', L, y)
          doc.text('REVIEWS', L + 20, y)
          doc.text('AVG RATING', L + 50, y)
          doc.text('VOLUME', L + 90, y)
          y += 4
          rule(y); y += 5

          const maxC = Math.max(...dowData.map((d) => d.count), 1)
          dowData.forEach((d, idx) => {
            if (!d.count) return
            if (idx % 2 === 0) {
              doc.setFillColor(244, 242, 239)
              doc.rect(L, y - 4, W, 7, 'F')
            }
            doc.setFontSize(9)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...DARK)
            doc.text(d.label, L, y)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...MID)
            doc.text(String(d.count), L + 20, y)
            doc.text(`${d.avgRating}`, L + 50, y)
            // Bar
            const fill = Math.round((d.count / maxC) * 70)
            doc.setFillColor(...RULE)
            doc.roundedRect(L + 90, y - 3.5, 70, 4, 1, 1, 'F')
            if (fill > 0) {
              doc.setFillColor(...ORANGE)
              doc.roundedRect(L + 90, y - 3.5, fill, 4, 1, 1, 'F')
            }
            y += 7.5
          })
          y += 8
        }

        // ── Top Keywords ─────────────────────────────────────────────────────
        if (topKeywords.length > 0) {
          if (y > 220) { doc.addPage(); pageChrome(); y = 38 }
          y = sectionHeader('Top Keywords Mentioned', y)

          // Two-column grid, 5 columns × 4 rows
          const kws = topKeywords.slice(0, 20)
          const cols = 4
          const colW = W / cols
          kws.forEach((kw, i) => {
            const col = i % cols
            const row = Math.floor(i / cols)
            const kx = L + col * colW
            const ky = y + row * 8

            // Tag background
            doc.setFillColor(240, 237, 233)
            doc.roundedRect(kx, ky - 4.5, colW - 3, 6.5, 1.5, 1.5, 'F')
            doc.setFontSize(8.5)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...DARK)
            doc.text(kw.word, kx + 3, ky)
            doc.setFontSize(7.5)
            doc.setTextColor(...LIGHT)
            doc.text(`×${kw.count}`, kx + colW - 6, ky, { align: 'right' })
          })
          y += Math.ceil(kws.length / cols) * 8 + 4
        }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // PAGE 5 — NOTABLE REVIEWS
      // ═══════════════════════════════════════════════════════════════════════
      if (bestReview || worstReview) {
        doc.addPage()
        pageChrome()

        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...DARK)
        doc.text('Notable Reviews', L, 24)
        rule(28)
        y = 38

        const drawReviewBlock = (
          label: string,
          review: NonNullable<typeof bestReview>,
          accentColor: [number,number,number]
        ) => {
          if (y > 240) { doc.addPage(); pageChrome(); y = 38 }

          // Label badge
          doc.setFillColor(...accentColor)
          doc.roundedRect(L, y - 5, W, 9, 1.5, 1.5, 'F')
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...WHITE)
          doc.text(label.toUpperCase(), L + 4, y + 0.5)
          y += 12

          // Reviewer name
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...DARK)
          doc.text(review.reviewer_name, L, y)
          // Star dots to the right of the name
          const nameW = doc.getTextWidth(review.reviewer_name)
          drawStarDots(L + nameW + 4, y - 1.5, review.star_rating)
          y += 7

          // Review text in a shaded box
          const reviewLines = doc.splitTextToSize(`"${review.review_text}"`, W - 8)
          const boxH = reviewLines.length * 5.5 + 8
          doc.setFillColor(240, 237, 233)
          doc.setDrawColor(...RULE)
          doc.setLineWidth(0.3)
          doc.roundedRect(L, y - 3, W, boxH, 2, 2, 'FD')
          // Left accent line
          doc.setFillColor(...accentColor)
          doc.rect(L, y - 3, 2.5, boxH, 'F')
          doc.setFontSize(9.5)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(...MID)
          doc.text(reviewLines, L + 7, y + 3)
          y += boxH + 6

          // Generated reply (if any)
          if (review.generated_reply) {
            doc.setFontSize(8)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...LIGHT)
            doc.text('YOUR REPLY:', L, y)
            y += 5
            const replyLines = doc.splitTextToSize(review.generated_reply, W - 4)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(100, 100, 100)
            doc.text(replyLines.slice(0, 6), L, y)  // cap at 6 lines
            y += Math.min(replyLines.length, 6) * 5 + 3
          }
          y += 8
        }

        if (bestReview) {
          drawReviewBlock('Highest-rated review', bestReview, [22, 163, 74])
        }
        if (worstReview && worstReview.id !== bestReview?.id) {
          drawReviewBlock('Lowest-rated review', worstReview, [220, 60, 60])
        }
      }

      // ── Stamp footer on every page ─────────────────────────────────────────
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        addFooter(i, pageCount)
      }

      const slug = restaurantName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      const monthSlug = month.replace(/\s/g, '-').toLowerCase()
      doc.save(`${slug}-${monthSlug}-report.pdf`)
    } catch (err) {
      console.error('PDF generation error:', err)
      setDownloadError('Failed to generate PDF. Please try again.')
      setTimeout(() => setDownloadError(null), 5000)
    } finally {
      setDownloadingReport(false)
      setPdfLoading(false)
    }
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (reviews.length === 0) return <EmptyState restaurantName={restaurantName} />

  // ── Full dashboard ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-20" onClick={() => showDownloadMenu && setShowDownloadMenu(false)}>

      {/* ── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-[#111111] leading-tight">{restaurantName}</h1>
            <p className="text-[#A8A29E] text-[13px] mt-1">
              {totalReviews} review{totalReviews !== 1 ? 's' : ''} {dateRange !== 'all' ? `in last ${dateRange.replace('d', ' days')}` : 'analyzed'}
              {ratingDelta !== null && (
                <span className={`ml-2 font-semibold ${ratingDelta > 0 ? 'text-emerald-600' : ratingDelta < 0 ? 'text-red-500' : 'text-[#A8A29E]'}`}>
                  {ratingDelta > 0 ? `↑ +${ratingDelta.toFixed(1)} vs last month` : ratingDelta < 0 ? `↓ ${ratingDelta.toFixed(1)} vs last month` : '→ steady vs last month'}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {lastAnalyzedAt && (
            <span className="text-[11px] text-[#A8A29E] hidden sm:block">Last analyzed {formatDate(lastAnalyzedAt)}</span>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F3F0EC] border border-[#E4DED8] text-[#57534E] hover:text-[#111111] text-[12px] font-medium disabled:opacity-40 transition-all"
          >
            <svg className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Analyzing…' : 'Refresh AI'}
          </button>

          {/* Download dropdown */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowDownloadMenu((v) => !v) }}
              disabled={downloadingReport || pdfLoading || downloadingCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F3F0EC] border border-[#E4DED8] hover:bg-[#E9E5E0] text-[#111111] text-[12px] font-medium disabled:opacity-40 transition-all"
            >
              {pdfLoading ? (
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {pdfLoading ? 'Generating PDF…' : downloadingCsv ? 'Exporting CSV…' : 'Export Report'}
              <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showDownloadMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-[#E4DED8] shadow-lg z-20 overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <button onClick={handleDownloadReport} className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-[#111111] hover:bg-[#F3F0EC] transition-colors text-left">
                  <svg className="w-4 h-4 text-[#E05A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF Report
                </button>
                <div className="h-px bg-[#EDE9E4]" />
                <button onClick={handleDownloadCsv} className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-[#111111] hover:bg-[#F3F0EC] transition-colors text-left">
                  <svg className="w-4 h-4 text-[#E05A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Download CSV Data
                </button>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Date range filter */}
        <div className="flex items-center gap-1 bg-[#F3F0EC] rounded-xl p-1 border border-[#E4DED8] self-start">
          {(['30d', '90d', '180d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                dateRange === range
                  ? 'bg-white text-[#111111] shadow-sm border border-[#E4DED8]'
                  : 'text-[#A8A29E] hover:text-[#57534E]'
              }`}
            >
              {range === '30d' ? '30d' : range === '90d' ? '90d' : range === '180d' ? '180d' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* No data for selected range */}
      {totalReviews === 0 && (
        <div className="rounded-2xl bg-[#F8F6F3] border border-[#E4DED8] px-6 py-8 text-center">
          <p className="text-[#111111] font-medium mb-1">No reviews in this period</p>
          <p className="text-[13px] text-[#A8A29E]">Try selecting a wider date range</p>
        </div>
      )}

      {/* Download error */}
      {downloadError && (
        <div role="alert" className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-center gap-2.5">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[13px] text-red-600">{downloadError}</p>
        </div>
      )}

      {/* ── QUICK WIN ──────────────────────────────────────────────────────── */}
      {!themesLoading && !themes.insufficient && themes.opportunities.length > 0 && (
        <div>
          <div className="bg-[#E05A28]/10 rounded-2xl border border-[#E05A28]/25 px-6 py-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#E05A28]/10 border border-[#E05A28]/25 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-[#E05A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#E05A28] mb-1.5">Your #1 opportunity right now</p>
              <p className="text-[16px] font-semibold text-[#111111] leading-snug mb-2">{themes.opportunities[0]}</p>
              <p className="text-[12px] text-[#A8A29E]">Based on patterns across your {totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── RATING HERO ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-[#E4DED8] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">

          {/* Big number */}
          <div className="order-1 md:order-2 flex flex-col items-center justify-center px-5 sm:px-8 py-7 sm:py-12 text-center border-b md:border-b-0 border-[#EDE9E4]">
            <p className="text-[#111111] leading-none mb-3 sm:mb-4" style={{ fontSize: 'clamp(56px, 10vw, 120px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {avgRating.toFixed(1)}
            </p>
            <Stars rating={avgRating} />
            <p className="text-[#A8A29E] text-[12px] mt-3 sm:mt-4">
              {totalReviews} reviews ·{' '}
              <span className={responseRate >= 80 ? 'text-emerald-600 font-medium' : responseRate < 50 ? 'text-[#E05A28] font-medium' : 'text-[#A8A29E]'}>
                {responseRate}% replied
              </span>
            </p>
            {responseRate < 50 && (
              <p className="text-[#C4BEB8] text-[10px] mt-1 max-w-[180px] leading-relaxed">Replying to more reviews boosts local SEO</p>
            )}
          </div>

          {/* Breakdown */}
          <div className="order-2 md:order-1 px-5 sm:px-8 py-6 sm:py-12 border-b md:border-b-0 md:border-r border-[#EDE9E4]">
            <p className="text-[11px] font-semibold text-[#E05A28]/70 mb-4 sm:mb-6">Breakdown</p>
            <div className="space-y-2.5 sm:space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingDist[star] ?? 0
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-2.5 sm:gap-3">
                    <span className="text-[11px] text-[#A8A29E] w-5 flex-shrink-0 text-right">{star}★</span>
                    <div className="flex-1 h-1.5 sm:h-2 bg-[#EDE9E4] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#E05A28] transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] text-[#A8A29E] w-12 sm:w-14 flex-shrink-0 text-right tabular-nums">{count} · {Math.round(pct)}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Trend */}
          <div className="order-3 px-5 sm:px-8 py-6 sm:py-12 md:border-l border-[#EDE9E4]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold text-[#E05A28]/70">Trend</p>
              {hasSparkData && (
                <span className={`text-[11px] font-semibold ${sparkTrend === 'up' ? 'text-emerald-600' : sparkTrend === 'down' ? 'text-red-500' : 'text-[#A8A29E]'}`}>
                  {sparkTrend === 'up' ? '▲ Improving' : sparkTrend === 'down' ? '▼ Declining' : '→ Steady'}
                </span>
              )}
            </div>
            {hasSparkData ? (
              <>
                <p className="text-[#C4BEB8] text-[10px] mb-3">Rolling avg · last {sparkData.length} reviews</p>
                <ResponsiveContainer width="100%" height={80}>
                  <LineChart data={sparkData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                    <YAxis domain={[1, 5]} hide />
                    <Line type="monotone" dataKey="rating"
                      stroke={sparkTrend === 'up' ? '#34D399' : sparkTrend === 'down' ? '#F87171' : '#D97706'}
                      strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[#C4BEB8] text-[10px]">Oldest</span>
                  <span className="text-[#C4BEB8] text-[10px]">Latest</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col justify-center h-[100px]">
                <p className="text-[#A8A29E] text-[12px] leading-relaxed">More data coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── QUICK STATS ROW ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {[
          {
            label: 'This month',
            value: thisMonthReviews.length ? thisMonthAvg.toFixed(1) + ' ★' : '—',
            sub: `${thisMonthReviews.length} review${thisMonthReviews.length !== 1 ? 's' : ''}`,
            color: 'text-[#E05A28]',
          },
          {
            label: 'Last month',
            value: lastMonthReviews.length ? lastMonthAvg.toFixed(1) + ' ★' : '—',
            sub: `${lastMonthReviews.length} review${lastMonthReviews.length !== 1 ? 's' : ''}`,
            color: 'text-[#111111]',
          },
          {
            label: 'Response rate',
            value: `${responseRate}%`,
            sub: `${approvedCount} of ${totalReviews} replied`,
            color: responseRate >= 80 ? 'text-emerald-600' : responseRate >= 50 ? 'text-[#111111]' : 'text-[#E05A28]',
          },
          {
            label: 'Critical unanswered',
            value: criticalUnanswered === 0 ? '✓ None' : String(criticalUnanswered),
            sub: criticalUnanswered === 0 ? 'All addressed' : '1–2★ with no reply',
            color: criticalUnanswered === 0 ? 'text-emerald-600' : 'text-red-500',
          },
        ].map((stat, i) => (
          <div key={i} className={`bg-white rounded-xl border border-[#E4DED8] p-3.5 sm:p-4 stagger-${i + 1} animate-fade-up shadow-[0_1px_3px_rgba(0,0,0,0.04)]`}>
            <p className="text-[11px] font-medium text-[#A8A29E] mb-2 leading-tight">{stat.label}</p>
            <p className={`text-[20px] sm:text-[26px] font-bold leading-none mb-1 tracking-tight ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-[#A8A29E] leading-tight">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── WHAT CUSTOMERS ARE SAYING ──────────────────────────────────────── */}
      <div className="pt-4">
        <SectionLabel>What customers are saying</SectionLabel>
        {themesLoading && !refreshing ? (
          <ThemeSkeleton />
        ) : themesError && !themesLoading ? (
          <div role="alert" className="rounded-xl bg-red-50 border border-red-100 px-4 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[13px] text-red-600">{themesError}</p>
            </div>
            <button
              onClick={() => fetchThemes(true)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 text-[12px] font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        ) : themes.insufficient ? (
          <div className="text-center py-12">
            <p className="text-[#A8A29E] text-[13px]">Sync at least 5 reviews to unlock AI sentiment analysis.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 relative transition-opacity duration-200 ${refreshing ? 'opacity-50 pointer-events-none' : ''}`}>
            {refreshing && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <span className="text-[12px] text-[#A8A29E] font-medium bg-white/90 px-3 py-1.5 rounded-full border border-[#E4DED8] shadow-sm">Re-analyzing…</span>
              </div>
            )}
            {[
              {
                icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>,
                title: 'They love',
                items: themes.praised,
                emptyText: 'Nothing notable yet',
                chipClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                iconClass: 'text-emerald-500',
              },
              {
                icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>,
                title: 'They mention',
                items: themes.complaints,
                emptyText: 'No recurring topics found',
                chipClass: 'bg-[#F3F0EC] text-[#57534E] border-[#E4DED8]',
                iconClass: 'text-[#A8A29E]',
              },
              {
                icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
                title: 'Opportunities',
                items: themes.opportunities,
                emptyText: 'No opportunities found',
                chipClass: 'bg-[#FEF0E8] text-[#C94E21] border-[#F5C9AD]',
                iconClass: 'text-[#E05A28]',
              },
            ].map(({ icon, title, items, emptyText, chipClass, iconClass }) => (
              <div key={title} className="bg-white rounded-xl border border-[#E4DED8] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className={`flex items-center gap-1.5 mb-4 ${iconClass}`}>
                  {icon}
                  <span className="text-[13px] font-semibold text-[#111111]">{title}</span>
                </div>
                {items.length === 0 ? (
                  <p className="text-[12px] text-[#C4BEB8]">{emptyText}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {items.map((item, i) => (
                      <span key={i} className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium border ${chipClass} leading-none`}>
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RESPONSE RATE BY RATING ─────────────────────────────────────────── */}
      <div>
        <SectionLabel>Response rate by star rating</SectionLabel>
        <div className="bg-white rounded-2xl border border-[#E4DED8] p-5 sm:p-6">
          <p className="text-[12px] text-[#A8A29E] mb-5">Are you replying to the reviews that matter most? Low-star reviews with no reply damage trust.</p>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].reverse().map((star) => {
              const d = responseByRating[star]
              if (!d.total) return null
              const pct = Math.round((d.replied / d.total) * 100)
              const isLow = star <= 2
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-14 flex-shrink-0">
                    {Array.from({ length: star }).map((_, i) => (
                      <svg key={i} className={`w-3 h-3 ${isLow ? 'text-red-400' : star <= 3 ? 'text-amber-400' : 'text-[#E05A28]'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <div className="flex-1 h-2.5 bg-[#EDE9E4] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-emerald-500' : isLow && pct < 50 ? 'bg-red-400' : 'bg-[#E05A28]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-[12px] font-semibold w-10 text-right ${pct === 100 ? 'text-emerald-600' : isLow && pct < 50 ? 'text-red-500' : 'text-[#111111]'}`}>{pct}%</span>
                  <span className="text-[11px] text-[#A8A29E] w-16 sm:w-20 flex-shrink-0 tabular-nums">{d.replied}/{d.total}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── BUSIEST REVIEW DAYS ────────────────────────────────────────────── */}
      {hasDowData && (
        <div>
          <SectionLabel>Busiest review days</SectionLabel>
          <div className="rounded-2xl border border-[#E4DED8] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[12px] text-[#A8A29E]">Which days of the week generate the most reviews for your business.</p>
              <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#E05A28] opacity-85" />
                  <span className="text-[11px] text-[#A8A29E]">Reviews</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-[#10b981] rounded-full" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] -ml-2.5" />
                  <span className="text-[11px] text-[#A8A29E]">Avg rating</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={dowData} margin={{ top: 8, right: 20, bottom: 0, left: -20 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.35)' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.25)' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.25)' }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-white text-[#111] text-[12px] px-3 py-2 rounded-xl shadow-lg border border-[#E4DED8]">
                      <p className="text-[#A8A29E] text-[11px] mb-0.5">{label}</p>
                      {payload.map((p: any, i: number) => (
                        <p key={i} className="font-semibold">
                          {p.dataKey === 'count'
                            ? `${p.value} review${p.value !== 1 ? 's' : ''}`
                            : `${Number(p.value).toFixed(1)} ★ avg`}
                        </p>
                      ))}
                    </div>
                  )
                }} />
                <Bar yAxisId="left" dataKey="count" radius={[4, 4, 0, 0]} fill="#E05A28" fillOpacity={0.85} name="count" />
                <Line yAxisId="right" type="monotone" dataKey="avgRating" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }} name="avgRating" connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── RATING + VOLUME OVER TIME ────────────────────────────────────────── */}
      <div>
        <SectionLabel>Rating &amp; volume over time</SectionLabel>
        {!hasEnoughTrend ? (
          <div className="rounded-2xl border border-[#E4DED8] bg-[#F8F6F3] px-6 sm:px-8 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
              <div className="text-center sm:text-left flex-shrink-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#E05A28] mb-2">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <p className="text-[#111111] leading-none text-5xl sm:text-6xl font-bold">{avgRating.toFixed(1)}</p>
                <p className="text-[12px] text-[#A8A29E] mt-2">avg this month · {totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-[#111111] mb-1">Your trend chart will fill in over time.</p>
                <p className="text-[13px] text-[#A8A29E] leading-relaxed">Once you have data across 2+ months, you'll see how your rating is moving. Keep responding to reviews to build momentum.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E4DED8] p-4 sm:p-6 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {/* Rating trend */}
            <div>
              <p className="text-[11px] font-medium text-[#A8A29E] mb-3">Average rating per month</p>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={trendData} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E05A28" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#E05A28" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="rating" stroke="#E05A28" strokeWidth={2.5} fill="url(#ratingGrad)"
                    dot={{ fill: '#E05A28', strokeWidth: 0, r: 3.5 }} activeDot={{ r: 5, fill: '#E05A28', strokeWidth: 0 }} connectNulls />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.35)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.25)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<LineTooltip />} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Volume bar chart */}
            {hasVolumeData && (
              <div>
                <p className="text-[11px] font-medium text-[#A8A29E] mb-3">Review volume per month</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.35)' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.25)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<BarChartTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {trendData.map((entry, index) => (
                        <Cell key={index} fill={entry.count > 0 ? '#E05A28' : '#D0C9C1'} fillOpacity={entry.count > 0 ? 0.85 : 0.5} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── LANGUAGE BREAKDOWN ─────────────────────────────────────────────── */}
      {hasMultipleLanguages && (
        <div>
          <SectionLabel>Review languages</SectionLabel>
          <div className="bg-white rounded-2xl border border-[#E4DED8] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <p className="text-[12px] text-[#A8A29E] mb-5">Your business attracts international customers. ReplyFi auto-generates replies in each reviewer's language.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {languageData.map(({ lang, count, pct }) => (
                <div key={lang} className="flex flex-col gap-1 p-4 bg-[#F8F6F3] rounded-xl border border-[#E4DED8]">
                  <p className="text-[13px] font-semibold text-[#111111]">{lang}</p>
                  <p className="text-[24px] font-bold text-[#E05A28] leading-none">{pct}%</p>
                  <p className="text-[11px] text-[#A8A29E]">{count} review{count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── NOTABLE REVIEWS ────────────────────────────────────────────────── */}
      {(bestReview || worstReview) && (
        <div>
          <SectionLabel>Notable reviews</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestReview && (
              <div className="bg-white rounded-2xl border border-[#E4DED8] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((i) => (
                      <svg key={i} className={`w-3 h-3 ${i <= bestReview.star_rating ? 'text-[#E05A28]' : 'text-[#E4DED8]'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <span className="text-[13px] font-semibold text-[#111111]">{bestReview.reviewer_name}</span>
                  <span className="text-[11px] text-[#C4BEB8] ml-auto">{formatDate(bestReview.review_datetime_utc)}</span>
                </div>
                <div className="relative">
                  <span className="absolute -top-4 -left-1 text-[#E05A28]/10 select-none pointer-events-none text-[120px] leading-none">"</span>
                  <p className="relative text-[#57534E] text-[14px] leading-relaxed italic">{bestReview.review_text}</p>
                </div>
              </div>
            )}
            {worstReview && worstReview.id !== bestReview?.id && (
              <div className="bg-white rounded-2xl border border-[#E4DED8] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((i) => (
                      <svg key={i} className={`w-3 h-3 ${i <= worstReview.star_rating ? 'text-red-400' : 'text-[#E4DED8]'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <span className="text-[13px] font-semibold text-[#111111]">{worstReview.reviewer_name}</span>
                  <span className="text-[11px] text-[#C4BEB8] ml-auto">{formatDate(worstReview.review_datetime_utc)}</span>
                </div>
                <div className="relative">
                  <span className="absolute -top-4 -left-1 text-red-400/10 select-none pointer-events-none text-[120px] leading-none">"</span>
                  <p className="relative text-[#57534E] text-[14px] leading-relaxed italic">{worstReview.review_text}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
