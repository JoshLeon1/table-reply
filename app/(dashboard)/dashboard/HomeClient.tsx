'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ScrapedReview } from '@/types'
import ConnectRestaurantModal from '@/components/ConnectRestaurantModal'

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 950, delay = 0) {
  const [val, setVal] = useState(0)
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return
    ran.current = true
    if (target === 0) return
    const t = setTimeout(() => {
      const start = Date.now()
      const tick = () => {
        const p = Math.min((Date.now() - start) / duration, 1)
        const e = 1 - Math.pow(1 - p, 3)
        setVal(Math.round(target * e))
        if (p < 1) requestAnimationFrame(tick)
        else setVal(target)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(t)
  }, [target, duration, delay])
  return val
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTimeAgo(isoStr: string): string {
  try {
    const diff = Date.now() - new Date(isoStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return '' }
}

function trendCalc(current: number, prev: number) {
  if (prev === 0) return { dir: 'flat' as const, pct: 0 }
  const pct = Math.round(((current - prev) / prev) * 100)
  return {
    dir: pct > 0 ? 'up' as const : pct < 0 ? 'down' as const : 'flat' as const,
    pct: Math.abs(pct),
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────
function TrendBadge({ current, prev }: { current: number; prev: number }) {
  const t = trendCalc(current, prev)
  if (t.dir === 'up') return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.5 rounded-md">
      ↑ {t.pct}%
    </span>
  )
  if (t.dir === 'down') return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-red-400 bg-red-950/30 border border-red-900/30 px-1.5 py-0.5 rounded-md">
      ↓ {t.pct}%
    </span>
  )
  return <span className="text-[11px] text-white/25">—</span>
}

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`${cls} ${i <= rating ? 'text-amber-400' : 'text-[#E4DED8]'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function PlatformBadge({ source }: { source?: string | null }) {
  if (source === 'yelp') return (
    <span className="inline-flex items-center text-[10px] font-bold tracking-wide text-red-400 bg-red-950/40 border border-red-900/30 rounded-md px-1.5 py-0.5 leading-none">
      YELP
    </span>
  )
  if (source === 'tripadvisor') return (
    <span className="inline-flex items-center text-[10px] font-bold tracking-wide text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 rounded-md px-1.5 py-0.5 leading-none">
      TA
    </span>
  )
  return (
    <span className="inline-flex items-center text-[10px] font-bold tracking-wide text-blue-400 bg-blue-950/40 border border-blue-900/30 rounded-md px-1.5 py-0.5 leading-none">
      G
    </span>
  )
}

function SectionLabel({ children, badge }: { children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/35 whitespace-nowrap flex-shrink-0">
        {children}
      </span>
      {badge}
      <div className="flex-1 h-px bg-gradient-to-r from-white/[0.10] to-transparent" />
    </div>
  )
}

function PendingCard({
  review,
  onAction,
  animDelay = 0,
}: {
  review: ScrapedReview
  onAction: (id: string, a: 'approved' | 'dismissed') => void
  animDelay?: number
}) {
  const supabase = createClient()
  const [expanded, setExpanded] = useState(false)
  const [actioning, setActioning] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleApprove = async () => {
    if (!review.generated_reply) return
    setActioning(true)
    try {
      await navigator.clipboard.writeText(review.generated_reply).catch(() => {})
      setCopied(true)
      await supabase.from('scraped_reviews').update({ reply_status: 'approved' }).eq('id', review.id)
      setTimeout(() => onAction(review.id, 'approved'), 1400)
    } finally { setActioning(false) }
  }

  const handleDismiss = async () => {
    setActioning(true)
    try {
      await supabase.from('scraped_reviews').update({ reply_status: 'dismissed' }).eq('id', review.id)
      onAction(review.id, 'dismissed')
    } finally { setActioning(false) }
  }

  const initials = review.reviewer_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  const isNeg = review.star_rating <= 2
  const isNeu = review.star_rating === 3
  const avatarBg = isNeg ? 'from-red-950/30 to-rose-900/20' : isNeu ? 'from-amber-950/30 to-yellow-900/20' : 'from-emerald-950/30 to-teal-900/20'
  const avatarText = isNeg ? 'text-red-400' : isNeu ? 'text-amber-400' : 'text-emerald-400'

  return (
    <div
      className="animate-fade-up bg-[#111111] rounded-2xl border border-white/[0.07] overflow-hidden transition-all duration-200 hover:border-white/[0.14] hover:shadow-[0_6px_24px_rgba(0,0,0,0.07)] shadow-[0_1px_4px_rgba(0,0,0,0.04),0_2px_10px_rgba(0,0,0,0.04)]"
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarBg} border border-white/[0.10] flex items-center justify-center text-[11px] font-bold ${avatarText} flex-shrink-0 mt-0.5`}>
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name row */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="text-[13px] font-semibold text-white truncate leading-none">{review.reviewer_name}</span>
                <PlatformBadge source={review.source} />
                {review.alert_triggered && (
                  <span className="text-[10px] font-bold text-red-400 bg-red-950/30 border border-red-900/30 rounded-md px-1.5 py-0.5 leading-none">
                    ⚠ Alert
                  </span>
                )}
              </div>
              <span className="text-[11px] text-white/25 flex-shrink-0 tabular-nums leading-none">
                {review.review_datetime_utc ? formatTimeAgo(review.review_datetime_utc) : ''}
              </span>
            </div>
            <StarRow rating={review.star_rating} />
          </div>
        </div>

        {/* Review text */}
        <p className="text-[13px] text-white/55 leading-relaxed mt-3 pl-10 sm:pl-12 line-clamp-3">
          {review.review_text || <span className="italic text-white/25">No review text</span>}
        </p>
      </div>

      {/* AI Reply expandable */}
      {review.generated_reply && (
        <div className="px-4 pb-3 border-t border-white/[0.06]">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 mt-3 text-[12px] font-medium text-white/35 hover:text-[#E05A28] transition-colors duration-150"
          >
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
            {expanded ? 'Hide AI draft' : 'Preview AI draft'}
          </button>

          {expanded && (
            <div className="mt-2.5 bg-[#E05A28]/[0.08] rounded-xl px-4 py-3.5 border border-[#E05A28]/20 animate-fade-up">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-4 h-4 rounded-md bg-[#E05A28]/10 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-[#E05A28]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E05A28]/70">AI Draft</span>
              </div>
              <p className="text-[12px] text-white/60 leading-relaxed">{review.generated_reply}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 pb-4 pt-1">
        <button
          onClick={handleApprove}
          disabled={actioning || !review.generated_reply}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[12px] font-semibold disabled:opacity-40 transition-all duration-200 active:scale-[0.97] ${
            copied
              ? 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_2px_8px_rgba(52,211,153,0.3)]'
              : 'bg-[#E05A28] hover:bg-[#C94E21] shadow-[0_2px_8px_rgba(224,90,40,0.2)] hover:shadow-[0_4px_14px_rgba(224,90,40,0.35)]'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Copy &amp; Approve
            </>
          )}
        </button>
        <button
          onClick={handleDismiss}
          disabled={actioning}
          className="px-3 py-2 rounded-xl text-[12px] font-medium text-white/30 hover:text-white/60 hover:bg-white/[0.06] disabled:opacity-40 transition-all duration-150"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon,
  iconBg,
  extra,
  delay,
}: {
  label: string
  value: React.ReactNode
  sub: React.ReactNode
  icon: React.ReactNode
  iconBg: string
  extra?: React.ReactNode
  delay: number
}) {
  return (
    <div
      className="animate-fade-up bg-[#111111] rounded-2xl p-3.5 sm:p-5 border border-white/[0.07] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Icon + label */}
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
              {icon}
            </div>
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] sm:tracking-[0.11em] text-white/35 leading-tight line-clamp-2">{label}</p>
          </div>
          {/* Number */}
          <p className="text-[22px] sm:text-[28px] font-bold text-white leading-none tracking-[-0.03em] mb-2">{value}</p>
          {/* Sub */}
          {sub}
        </div>
        {extra && <div className="flex-shrink-0">{extra}</div>}
      </div>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  ownerName: string
  restaurantName: string
  lastScrapedAt: string | null
  userId: string
  isPaid: boolean
  googleMapsUrl: string | null
  reviewsThisMonth: number
  reviewsLastMonth: number
  avgRating: number
  totalReviews: number
  approvedThisMonth: number
  approvedLastMonth: number
  responseRate: number
  pendingCount: number
  pendingReviews: ScrapedReview[]
  recentApproved: ScrapedReview[]
  themes: { praised: string[]; complaints: string[]; opportunities: string[] } | null
  hasAnalytics: boolean
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HomeClient({
  ownerName,
  restaurantName,
  lastScrapedAt,
  userId,
  isPaid: _isPaid,
  googleMapsUrl,
  reviewsThisMonth,
  reviewsLastMonth,
  avgRating,
  totalReviews,
  approvedThisMonth,
  approvedLastMonth,
  responseRate,
  pendingCount,
  pendingReviews: initialPendingReviews,
  recentApproved,
  themes,
  hasAnalytics,
}: Props) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const greetingEmoji = hour < 12 ? '☀️' : hour < 17 ? '⚡' : '🌙'

  const [showConnectModal, setShowConnectModal] = useState(!googleMapsUrl)
  const [pendingList, setPendingList] = useState<ScrapedReview[]>(initialPendingReviews)
  const [quickReview, setQuickReview] = useState('')
  const [quickReply, setQuickReply] = useState('')
  const [quickLoading, setQuickLoading] = useState(false)
  const [quickError, setQuickError] = useState('')
  const [quickCopied, setQuickCopied] = useState(false)

  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Animated counts
  const animReviews  = useCountUp(reviewsThisMonth, 900, 100)
  const animRating   = useCountUp(Math.round(avgRating * 10), 900, 200)
  const animApproved = useCountUp(approvedThisMonth, 900, 300)
  const animRate     = useCountUp(responseRate, 900, 400)

  const handlePendingAction = (id: string) => setPendingList(prev => prev.filter(r => r.id !== id))

  const handleQuickGenerate = async () => {
    if (!quickReview.trim()) return
    setQuickLoading(true)
    setQuickError('')
    setQuickReply('')
    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewText: quickReview, starRating: 3, platform: 'Google' }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setQuickReply(data.reply ?? data.generated_reply ?? '')
    } catch {
      setQuickError('Something went wrong. Please try again.')
    } finally {
      setQuickLoading(false)
    }
  }

  const handleQuickCopy = async () => {
    if (!quickReply) return
    await navigator.clipboard.writeText(quickReply)
    setQuickCopied(true)
    setTimeout(() => setQuickCopied(false), 2000)
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch('/api/scrape-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')
      const n: number = data.newReviews ?? 0
      setSyncMsg({ type: 'success', text: n > 0 ? `${n} new review${n > 1 ? 's' : ''} synced` : 'Already up to date' })
      router.refresh()
    } catch (err) {
      setSyncMsg({ type: 'error', text: err instanceof Error ? err.message : 'Sync failed' })
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(null), 4000)
    }
  }

  const rateColor = responseRate >= 70 ? 'text-emerald-400' : responseRate >= 40 ? 'text-[#E05A28]' : 'text-red-400'

  return (
    <>
      {showConnectModal && (
        <ConnectRestaurantModal
          userId={userId}
          restaurantName={restaurantName}
          onClose={() => setShowConnectModal(false)}
        />
      )}

      <div className="space-y-6 sm:space-y-8 pb-16">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl px-5 py-6 sm:px-8 sm:py-8 animate-fade-up"
          style={{ background: 'linear-gradient(140deg, #E8623A 0%, #D14E22 45%, #A83A18 100%)' }}
        >
          {/* Radial highlight */}
          <div className="absolute top-0 left-0 right-0 h-px bg-white/20" />
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/[0.06] rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-40 h-24 bg-black/[0.08] rounded-full blur-3xl pointer-events-none" />

          {/* Subtle dot grid */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">{greetingEmoji}</span>
                <h1 className="text-[20px] sm:text-[26px] font-bold text-white tracking-[-0.03em] leading-tight">
                  {greeting}, {ownerName}
                </h1>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-medium text-white/70">{restaurantName}</span>
                <span className="w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />
                <span className="text-[12px] text-white/50">
                  {lastScrapedAt ? `Synced ${formatTimeAgo(lastScrapedAt)}` : 'Not synced yet'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.12] hover:bg-white/[0.22] border border-white/[0.18] text-[13px] font-semibold text-white/90 hover:text-white disabled:opacity-40 transition-all duration-200 active:scale-[0.97] backdrop-blur-sm flex-shrink-0"
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-700 ${syncing ? 'animate-spin' : 'group-hover:rotate-180'}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {syncing ? 'Syncing…' : 'Sync Now'}
              </button>

              {syncMsg && (
                <span className={`text-[12px] font-semibold animate-fade-in ${syncMsg.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {syncMsg.type === 'success' ? '✓ ' : '✕ '}{syncMsg.text}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            delay={60}
            label="Reviews this month"
            value={animReviews}
            sub={<TrendBadge current={reviewsThisMonth} prev={reviewsLastMonth} />}
            iconBg="bg-blue-950/40"
            icon={
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />

          <StatCard
            delay={120}
            label="Average rating"
            value={
              <span className="text-amber-400">
                {(animRating / 10).toFixed(1)}
                <span className="text-[14px] ml-0.5 text-amber-300">★</span>
              </span>
            }
            sub={<StarRow rating={Math.round(avgRating)} size="md" />}
            iconBg="bg-amber-950/40"
            icon={
              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            }
          />

          <StatCard
            delay={180}
            label="Approved replies"
            value={animApproved}
            sub={<TrendBadge current={approvedThisMonth} prev={approvedLastMonth} />}
            iconBg="bg-emerald-950/40"
            icon={
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            }
          />

          <StatCard
            delay={240}
            label="Response rate"
            value={<span className={rateColor}>{animRate}<span className="text-[14px]">%</span></span>}
            sub={<span className="text-[11px] text-white/35">{totalReviews} reviews total</span>}
            iconBg="bg-orange-950/40"
            icon={
              <svg className="w-3.5 h-3.5 text-[#E05A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
            extra={
              <div className="relative mt-0.5">
                <svg viewBox="0 0 36 36" className="w-9 h-9 sm:w-11 sm:h-11 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="#E05A28" strokeWidth="3"
                    strokeDasharray={`${Math.min(animRate, 100)} 100`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)' }}
                  />
                </svg>
              </div>
            }
          />
        </div>

        {/* ── Main content grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Pending replies ─ 3/5 */}
          <div className="lg:col-span-3">
            <SectionLabel
              badge={
                pendingList.length > 0 ? (
                  <span className="relative inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-[#E05A28] text-white text-[10px] font-bold shadow-[0_0_10px_rgba(224,90,40,0.45)]">
                    <span className="absolute inset-0 rounded-full bg-[#E05A28] animate-ping opacity-40" />
                    <span className="relative">{pendingCount}</span>
                  </span>
                ) : undefined
              }
            >
              Pending replies
            </SectionLabel>

            {pendingList.length === 0 ? (
              <div className="flex items-center gap-4 px-5 py-5 bg-emerald-950/15 border border-emerald-900/20 rounded-2xl animate-fade-up">
                <div className="w-10 h-10 rounded-full bg-emerald-950/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(52,211,153,0.25)]">
                  <svg className="w-4.5 h-4.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-emerald-300">All caught up</p>
                  <p className="text-[12px] text-emerald-500/50 mt-0.5">New reviews appear here after each sync.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingList.map((review, i) => (
                  <PendingCard key={review.id} review={review} onAction={handlePendingAction} animDelay={i * 60} />
                ))}
                {pendingCount > 3 && (
                  <Link
                    href="/dashboard/reviews"
                    className="inline-flex items-center gap-1.5 text-[13px] text-[#E05A28] font-semibold hover:text-[#C94E21] transition-colors pt-1 group"
                  >
                    View all {pendingCount} pending
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right column ─ 2/5 */}
          <div className="lg:col-span-2 space-y-6">

            {/* Quick reply */}
            <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
              <SectionLabel>Quick reply</SectionLabel>
              <div className="bg-[#111111] rounded-2xl border border-white/[0.07] shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="p-4">
                  <textarea
                    value={quickReview}
                    onChange={e => setQuickReview(e.target.value)}
                    onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleQuickGenerate() }}
                    placeholder="Paste a review to get an instant reply…"
                    rows={4}
                    className="w-full resize-none px-3.5 py-3 rounded-xl border border-white/[0.10] bg-[#1A1A1A] hover:bg-[#1E1E1E] focus:bg-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] text-[13px] text-white placeholder:text-white/25 transition-all duration-200 leading-relaxed"
                  />
                  <button
                    onClick={handleQuickGenerate}
                    disabled={quickLoading || !quickReview.trim()}
                    className="mt-3 w-full py-2.5 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(224,90,40,0.2)] hover:shadow-[0_4px_14px_rgba(224,90,40,0.3)]"
                  >
                    {quickLoading ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating…
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 opacity-70" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        Generate Reply
                      </>
                    )}
                  </button>
                </div>

                {quickError && (
                  <p className="px-4 pb-3 text-[12px] text-red-400 animate-fade-in">{quickError}</p>
                )}

                {quickReply && (
                  <div className="border-t border-white/[0.07] p-4 space-y-3 animate-fade-up">
                    <div className="bg-[#E05A28]/[0.08] border border-[#E05A28]/20 rounded-xl px-4 py-3.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-4 h-4 rounded-md bg-[#E05A28]/10 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-[#E05A28]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#E05A28]/70">Generated Reply</p>
                      </div>
                      <p className="text-[12px] text-white/60 leading-relaxed">{quickReply}</p>
                    </div>
                    <button
                      onClick={handleQuickCopy}
                      className={`w-full py-2 rounded-xl text-[12px] font-semibold border transition-all duration-200 active:scale-[0.98] ${
                        quickCopied
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                          : 'bg-white/[0.06] text-white/55 border-white/[0.10] hover:border-white/[0.20] hover:text-white hover:shadow-sm'
                      }`}
                    >
                      {quickCopied ? '✓ Copied to clipboard' : 'Copy Reply'}
                    </button>
                  </div>
                )}

                <div className="px-4 py-2.5 border-t border-white/[0.07] bg-white/[0.02]">
                  <Link href="/dashboard/generate" className="inline-flex items-center gap-1 text-[12px] font-medium text-[#A8A29E] hover:text-[#E05A28] transition-colors duration-150 group">
                    More options in Full Generator
                    <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent activity */}
            <div className="animate-fade-up" style={{ animationDelay: '180ms' }}>
              <SectionLabel>Recent activity</SectionLabel>
              <div className="bg-[#111111] rounded-2xl border border-white/[0.07] shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden">
                {recentApproved.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.08] border border-white/[0.10] flex items-center justify-center mb-3">
                      <svg className="text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-[12px] font-medium text-[#A8A29E]">No approved replies yet</p>
                    <p className="text-[11px] text-[#C4BEB8] mt-0.5">Approved reviews will show here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F3F0EC]">
                    {recentApproved.map(review => (
                      <div
                        key={review.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAF9] transition-colors duration-150"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FEF0E8] to-[#F3F0EC] border border-[#E4DED8] flex items-center justify-center text-[11px] font-bold text-[#E05A28]/60 flex-shrink-0">
                          {review.reviewer_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[12px] font-semibold text-[#111] truncate">{review.reviewer_name}</span>
                            <PlatformBadge source={review.source} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-400 text-[10px]">{'★'.repeat(review.star_rating)}</span>
                            <span className="text-[10px] text-[#C4BEB8]">{formatTimeAgo(review.created_at)}</span>
                          </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── At a glance ──────────────────────────────────────────────────── */}
        <div className="animate-fade-up" style={{ animationDelay: '220ms' }}>
          <SectionLabel>At a glance</SectionLabel>

          {!hasAnalytics ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-6 py-5 bg-[#111111] rounded-2xl border border-white/[0.07]">
              <div>
                <p className="text-[14px] font-semibold text-white">Get insights from your reviews</p>
                <p className="text-[13px] text-white/55 mt-1 leading-snug">
                  Discover what customers love, what needs work, and your top growth opportunity.
                </p>
              </div>
              <Link
                href="/dashboard/analytics"
                className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white text-[13px] font-semibold transition-all duration-150 active:scale-[0.97] shadow-[0_2px_8px_rgba(224,90,40,0.2)] hover:shadow-[0_4px_14px_rgba(224,90,40,0.3)] w-full sm:w-auto"
              >
                Run analysis
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {([
                {
                  label: 'Customers love',
                  value: themes?.praised?.[0],
                  fallback: 'Run analytics to see what resonates most.',
                  dotColor: 'bg-emerald-400',
                  dotGlow: 'shadow-[0_0_8px_rgba(52,211,153,0.6)]',
                  tint: 'bg-gradient-to-br from-white via-white to-emerald-50/60',
                  border: 'border-emerald-100',
                  pulse: false,
                },
                {
                  label: 'Needs attention',
                  value: themes?.complaints?.[0],
                  fallback: 'No recurring complaints — great sign.',
                  dotColor: 'bg-[#E05A28]',
                  dotGlow: 'shadow-[0_0_8px_rgba(224,90,40,0.5)]',
                  tint: 'bg-gradient-to-br from-white via-white to-[#FEF0E8]/60',
                  border: 'border-[#F5C9AD]/40',
                  pulse: true,
                },
                {
                  label: 'Top opportunity',
                  value: themes?.opportunities?.[0],
                  fallback: 'Run analytics to find your growth lever.',
                  dotColor: 'bg-blue-400',
                  dotGlow: 'shadow-[0_0_8px_rgba(96,165,250,0.5)]',
                  tint: 'bg-gradient-to-br from-white via-white to-blue-50/60',
                  border: 'border-blue-100',
                  pulse: false,
                },
              ] as const).map(({ label, value, fallback, dotColor, dotGlow, tint, border, pulse }) => (
                <div
                  key={label}
                  className={`${tint} rounded-2xl px-5 py-5 border ${border} shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-200`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0 ${dotGlow} ${pulse ? 'animate-pulse' : ''}`} />
                    <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#A8A29E]">{label}</p>
                  </div>
                  <p className={`text-[13px] leading-snug ${value ? 'font-semibold text-[#111]' : 'text-[#C4BEB8] italic'}`}>
                    {value ?? fallback}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
