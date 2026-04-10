'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ScrapedReview } from '@/types'
import ConnectRestaurantModal from '@/components/ConnectRestaurantModal'

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  return { dir: pct > 0 ? 'up' as const : pct < 0 ? 'down' as const : 'flat' as const, pct: Math.abs(pct) }
}

function TrendBadge({ current, prev }: { current: number; prev: number }) {
  const t = trendCalc(current, prev)
  if (t.dir === 'up') return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
      ↑ {t.pct}%
    </span>
  )
  if (t.dir === 'down') return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">
      ↓ {t.pct}%
    </span>
  )
  return <span className="text-[11px] text-[#C0BDB8]">—</span>
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-3 h-3 ${i <= rating ? 'text-amber-400' : 'text-[#E0DDD8]'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children, badge }: { children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A8A5A0]">{children}</span>
      {badge}
      <div className="flex-1 h-px bg-[#E8E6E1]" />
    </div>
  )
}

// ─── Pending Card ─────────────────────────────────────────────────────────────

function PendingCard({ review, onAction }: { review: ScrapedReview; onAction: (id: string, a: 'approved' | 'dismissed') => void }) {
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
      setTimeout(() => onAction(review.id, 'approved'), 600)
    } finally { setActioning(false) }
  }

  const handleDismiss = async () => {
    setActioning(true)
    try {
      await supabase.from('scraped_reviews').update({ reply_status: 'dismissed' }).eq('id', review.id)
      onAction(review.id, 'dismissed')
    } finally { setActioning(false) }
  }

  const initials = review.reviewer_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden transition-all duration-200 hover:border-[#D9D5CF] hover:shadow-[0_2px_12px_rgba(0,0,0,0.05)]">

      {/* Card header */}
      <div className="px-5 pt-4 pb-3.5">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-[#F5F4F0] border border-[#E8E4DC] flex items-center justify-center text-[12px] font-semibold text-[#888] flex-shrink-0 mt-0.5">
            {initials}
          </div>

          {/* Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-[#111] leading-none">{review.reviewer_name}</span>
                {review.alert_triggered && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-md px-1.5 py-0.5 leading-none">
                    ⚠ Alert
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#C0BDB8] flex-shrink-0 leading-none">
                {review.review_datetime_utc ? formatTimeAgo(review.review_datetime_utc) : ''}
              </span>
            </div>
            <StarRow rating={review.star_rating} />
          </div>
        </div>

        {/* Review snippet */}
        <p className="text-[13px] text-[#555] leading-relaxed mt-3 pl-0 sm:pl-12">
          {review.review_text.length > 110 ? review.review_text.slice(0, 110) + '…' : review.review_text}
        </p>
      </div>

      {/* Reply section */}
      {review.generated_reply && (
        <div className="px-5 pb-3.5 pl-5">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#555] font-medium transition-colors group"
          >
            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {expanded ? 'Hide reply' : 'View reply'}
          </button>
          {expanded && (
            <div className="mt-2.5 bg-[#F9F8F6] rounded-xl px-4 py-3 border border-[#EDEAE5] text-[12px] text-[#555] leading-relaxed">
              {review.generated_reply}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-5 pb-4 pl-5">
        <button
          onClick={handleApprove}
          disabled={actioning || !review.generated_reply}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111] hover:bg-[#1e1e1e] text-white text-[12px] font-semibold disabled:opacity-40 transition-all duration-150"
        >
          {copied ? (
            <><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Copied</>
          ) : (
            <><svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>Copy &amp; Approve</>
          )}
        </button>
        <button
          onClick={handleDismiss}
          disabled={actioning}
          className="px-3.5 py-2 rounded-xl text-[12px] font-medium text-[#AAA] hover:text-[#666] hover:bg-[#F5F4F0] disabled:opacity-40 transition-all duration-150"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function HomeClient({
  ownerName,
  restaurantName,
  lastScrapedAt,
  userId,
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
  const [showConnectModal, setShowConnectModal] = useState(!googleMapsUrl)
  const [pendingList, setPendingList] = useState<ScrapedReview[]>(initialPendingReviews)
  const [quickReview, setQuickReview] = useState('')
  const [quickReply, setQuickReply] = useState('')
  const [quickLoading, setQuickLoading] = useState(false)
  const [quickError, setQuickError] = useState('')
  const [quickCopied, setQuickCopied] = useState(false)

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

  const rateColor = responseRate >= 70 ? 'text-emerald-600' : responseRate >= 40 ? 'text-amber-500' : 'text-red-500'

  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch('/api/scrape-reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')
      const newCount: number = data.newReviews ?? 0
      setSyncMsg({ type: 'success', text: newCount > 0 ? `${newCount} new review${newCount > 1 ? 's' : ''} synced` : 'Already up to date' })
      router.refresh()
    } catch (err) {
      setSyncMsg({ type: 'error', text: err instanceof Error ? err.message : 'Sync failed' })
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(null), 4000)
    }
  }

  return (
    <>
    {showConnectModal && (
      <ConnectRestaurantModal
        userId={userId}
        restaurantName={restaurantName}
        onClose={() => setShowConnectModal(false)}
      />
    )}
    <div className="space-y-8 pb-12">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="bg-[#0D0D0D] rounded-2xl px-5 py-6 sm:px-7 sm:py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-white tracking-[-0.02em] leading-tight">
            {greeting}, {ownerName} 👋
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[13px] font-medium text-white/60">{restaurantName}</span>
            <span className="text-white/20">·</span>
            <span className="text-[12px] text-white/40">
              {lastScrapedAt ? `Synced ${formatTimeAgo(lastScrapedAt)}` : 'Not yet synced'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1.5 flex-shrink-0">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[13px] font-medium text-white/80 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 border border-white/10"
          >
            <svg className={`w-3.5 h-3.5 opacity-70 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
          {syncMsg && (
            <span className={`text-[11px] font-medium ${syncMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {syncMsg.type === 'success' ? '✓ ' : '✕ '}{syncMsg.text}
            </span>
          )}
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        {/* Reviews this month */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.05)] card-hover animate-fade-up stagger-1 relative overflow-hidden">
          <div className="absolute top-3 right-3 opacity-[0.06]">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A8A5A0] mb-3">Reviews</p>
          <p className="text-[26px] sm:text-[30px] font-bold text-[#0D0D0D] leading-none tracking-[-0.02em] mb-3">{reviewsThisMonth}</p>
          <TrendBadge current={reviewsThisMonth} prev={reviewsLastMonth} />
        </div>

        {/* Average rating */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.05)] card-hover animate-fade-up stagger-2 relative overflow-hidden">
          <div className="absolute top-3 right-3 opacity-[0.07] text-amber-400">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A8A5A0] mb-3">Avg rating</p>
          <p className="text-[26px] sm:text-[30px] font-bold text-[#F59E0B] leading-none tracking-[-0.02em] mb-3">
            {avgRating.toFixed(1)}<span className="text-[18px] ml-0.5">★</span>
          </p>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <svg key={i} className={`w-3 h-3 ${i <= Math.round(avgRating) ? 'text-amber-400' : 'text-[#E8E6E1]'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            ))}
          </div>
        </div>

        {/* Replies approved */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.05)] card-hover animate-fade-up stagger-3 relative overflow-hidden">
          <div className="absolute top-3 right-3 opacity-[0.06]">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A8A5A0] mb-3">Approved</p>
          <p className="text-[26px] sm:text-[30px] font-bold text-[#0D0D0D] leading-none tracking-[-0.02em] mb-3">{approvedThisMonth}</p>
          <TrendBadge current={approvedThisMonth} prev={approvedLastMonth} />
        </div>

        {/* Response rate */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.05)] card-hover animate-fade-up stagger-4 relative overflow-hidden">
          <div className="absolute top-3 right-3 opacity-[0.06]">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A8A5A0] mb-3">Response rate</p>
          <p className={`text-[26px] sm:text-[30px] font-bold leading-none tracking-[-0.02em] mb-3 ${rateColor}`}>{responseRate}<span className="text-[17px] sm:text-[18px]">%</span></p>
          <span className="text-[11px] text-[#A8A5A0]">all time · {totalReviews} reviews</span>
        </div>
      </div>

      {/* ── Two-column ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Pending replies */}
        <div className="lg:col-span-3">
          <SectionLabel
            badge={
              pendingList.length > 0 ? (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#111] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {pendingCount}
                </span>
              ) : undefined
            }
          >
            Pending replies
          </SectionLabel>

          {pendingList.length === 0 ? (
            <div className="flex items-center gap-4 px-5 py-5 bg-emerald-50/50 rounded-2xl">
              <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-emerald-700">All caught up</p>
                <p className="text-[12px] text-emerald-600/80 mt-0.5">New reviews appear here after each sync.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingList.map(review => (
                <PendingCard key={review.id} review={review} onAction={handlePendingAction} />
              ))}
              {pendingCount > 3 && (
                <Link href="/dashboard/reviews" className="flex items-center gap-1.5 text-[13px] text-amber-600 font-medium hover:text-amber-700 transition-colors pt-1 group">
                  View all {pendingCount} pending
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick reply */}
          <div>
            <SectionLabel>Quick reply</SectionLabel>
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.05)]">
              <div className="p-4">
                <textarea
                  value={quickReview}
                  onChange={e => setQuickReview(e.target.value)}
                  onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleQuickGenerate() }}
                  placeholder="Paste a review…"
                  rows={4}
                  className="w-full resize-none px-3.5 py-3 rounded-xl border border-[#EBEBEB] bg-[#F8F7F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-300 text-[13px] text-[#0D0D0D] placeholder-[#B8B5B0] transition-all duration-200 leading-relaxed"
                />
                <button
                  onClick={handleQuickGenerate}
                  disabled={quickLoading || !quickReview.trim()}
                  className="mt-3 w-full py-2.5 rounded-xl bg-[#111] hover:bg-[#1e1e1e] text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
                >
                  {quickLoading ? (
                    <><svg className="animate-spin w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Generating…</>
                  ) : 'Generate Reply'}
                </button>
              </div>

              {quickError && (
                <p className="px-4 pb-3 text-[12px] text-red-500">{quickError}</p>
              )}

              {quickReply && (
                <div className="border-t border-[#F0EDE8] p-4 space-y-3">
                  <p className="text-[12px] text-[#888] leading-relaxed">{quickReply}</p>
                  <button
                    onClick={handleQuickCopy}
                    className={`w-full py-2 rounded-xl text-[12px] font-semibold border transition-all duration-150 ${
                      quickCopied
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-[#555] border-[#E8E4DC] hover:border-[#D4CFC6] hover:text-[#111]'
                    }`}
                  >
                    {quickCopied ? '✓ Copied' : 'Copy reply'}
                  </button>
                </div>
              )}

              <div className="px-4 py-2.5 border-t border-[#F2F1EE] bg-[#F8F7F5]">
                <Link href="/dashboard/generate" className="text-[11px] text-[#AAA] hover:text-[#666] transition-colors font-medium">
                  More options in full generator →
                </Link>
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div>
            <SectionLabel>Recent activity</SectionLabel>
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.05)]">
              {recentApproved.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-9 h-9 rounded-full bg-[#F5F4F0] border border-[#E8E4DC] flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-[#CCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-[12px] font-medium text-[#AAA]">No approved replies yet</p>
                  <p className="text-[11px] text-[#C8C4BE] mt-0.5">Approved reviews will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-[#F5F4F0]">
                  {recentApproved.map(review => (
                    <div key={review.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-[#F5F4F0] border border-[#EDEAE5] flex items-center justify-center text-[11px] font-semibold text-[#999] flex-shrink-0">
                        {review.reviewer_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[12px] font-semibold text-[#111] truncate">{review.reviewer_name}</span>
                          <span className="text-amber-400 text-[10px] flex-shrink-0">{'★'.repeat(review.star_rating)}</span>
                        </div>
                        <p className="text-[11px] text-[#C0BDB8]">{formatTimeAgo(review.created_at)}</p>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title="Approved" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Insights ─────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>At a glance</SectionLabel>

        {!hasAnalytics ? (
          <div className="flex items-center justify-between gap-4 px-6 py-5 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.05)]">
            <div>
              <p className="text-[13px] font-semibold text-[#111]">Get insights from your reviews</p>
              <p className="text-[12px] text-[#888] mt-0.5">Discover what customers love, what needs improving, and your top growth opportunity.</p>
            </div>
            <Link href="/dashboard/analytics" className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-[#111] hover:bg-[#1e1e1e] text-white text-[13px] font-semibold transition-all duration-150 ml-4">
              Run analysis →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {([
              { label: 'Customers love', value: themes?.praised?.[0], fallback: 'Run analytics to discover what resonates most.', dot: 'bg-emerald-400' },
              { label: 'Needs attention', value: themes?.complaints?.[0], fallback: "No recurring complaints — that's a great sign.", dot: 'bg-amber-400' },
              { label: 'Top opportunity', value: themes?.opportunities?.[0], fallback: 'Run analytics to find your biggest growth lever.', dot: 'bg-blue-400' },
            ] as const).map(({ label, value, fallback, dot }) => (
              <div key={label} className="bg-white rounded-2xl px-5 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.05)] card-hover">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0`} />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#B0ABA4]">{label}</p>
                </div>
                <p className={`text-[13px] leading-snug ${value ? 'font-semibold text-[#111]' : 'text-[#C0BDB8] italic'}`}>
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
