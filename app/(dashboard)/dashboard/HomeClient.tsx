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
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
      ↑ {t.pct}%
    </span>
  )
  if (t.dir === 'down') return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">
      ↓ {t.pct}%
    </span>
  )
  return <span className="text-[11px] text-[#C4BEB8]">—</span>
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-3 h-3 ${i <= rating ? 'text-amber-400' : 'text-[#E4DED8]'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function SectionLabel({ children, badge }: { children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E] whitespace-nowrap">{children}</span>
      {badge}
      <div className="flex-1 h-px bg-[#E4DED8]" />
    </div>
  )
}

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

  const initials = review.reviewer_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="bg-white rounded-2xl border border-[#E4DED8] shadow-card overflow-hidden transition-all duration-200 hover:border-[#D0C9C1] hover:shadow-card-hover">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F3F0EC] border border-[#E4DED8] flex items-center justify-center text-[11px] font-semibold text-[#7C7672] flex-shrink-0 mt-0.5">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-[#111] leading-none">{review.reviewer_name}</span>
                {review.alert_triggered && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-md px-1.5 py-0.5 leading-none">
                    Alert
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#C4BEB8] flex-shrink-0 leading-none">
                {review.review_datetime_utc ? formatTimeAgo(review.review_datetime_utc) : ''}
              </span>
            </div>
            <StarRow rating={review.star_rating} />
          </div>
        </div>
        <p className="text-[13px] text-[#57534E] leading-relaxed mt-3 pl-11">
          {review.review_text.length > 120 ? review.review_text.slice(0, 120) + '…' : review.review_text}
        </p>
      </div>

      {review.generated_reply && (
        <div className="px-4 pb-3 pl-4">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 text-[12px] text-[#A8A29E] hover:text-[#333] font-medium transition-colors"
          >
            <svg className={`w-3.5 h-3.5 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {expanded ? 'Hide reply' : 'View reply'}
          </button>
          {expanded && (
            <div className="mt-2.5 bg-[#F8F6F3] rounded-xl px-4 py-3 border border-[#E4DED8] text-[12px] text-[#57534E] leading-relaxed">
              {review.generated_reply}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 px-4 pb-4">
        <button
          onClick={handleApprove}
          disabled={actioning || !review.generated_reply}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111] hover:bg-[#1E1E1E] text-white text-[12px] font-semibold disabled:opacity-40 transition-all duration-150"
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
          className="px-3 py-2 rounded-xl text-[12px] font-medium text-[#A8A29E] hover:text-[#333] hover:bg-[#F3F0EC] disabled:opacity-40 transition-all duration-150"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

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

  const rateColor = responseRate >= 70 ? 'text-emerald-600' : responseRate >= 40 ? 'text-[#E05A28]' : 'text-red-500'

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

      <div className="space-y-7 pb-12">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="bg-[#0A0A0A] rounded-2xl px-5 py-6 sm:px-7 sm:py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <h1 className="text-[21px] sm:text-[26px] font-bold text-white tracking-[-0.03em] leading-tight">
              {greeting}, {ownerName}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[13px] font-medium text-white/55">{restaurantName}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[12px] text-white/35">
                {lastScrapedAt ? `Synced ${formatTimeAgo(lastScrapedAt)}` : 'Not synced'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1.5">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.08] text-[13px] font-medium text-white/65 hover:text-white/90 disabled:opacity-40 transition-all duration-150"
            >
              <svg className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
            {syncMsg && (
              <span className={`text-[11px] font-medium animate-fade-in ${syncMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {syncMsg.type === 'success' ? '✓ ' : '✕ '}{syncMsg.text}
              </span>
            )}
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Reviews this month',
              value: reviewsThisMonth,
              sub: <TrendBadge current={reviewsThisMonth} prev={reviewsLastMonth} />,
              delay: 'stagger-1',
            },
            {
              label: 'Average rating',
              value: <span className="text-amber-400">{avgRating.toFixed(1)}<span className="text-[16px] sm:text-[18px] ml-0.5">★</span></span>,
              sub: <StarRow rating={Math.round(avgRating)} />,
              delay: 'stagger-2',
            },
            {
              label: 'Approved replies',
              value: approvedThisMonth,
              sub: <TrendBadge current={approvedThisMonth} prev={approvedLastMonth} />,
              delay: 'stagger-3',
            },
            {
              label: 'Response rate',
              value: <span className={rateColor}>{responseRate}<span className="text-[16px] sm:text-[18px]">%</span></span>,
              sub: <span className="text-[11px] text-[#A8A29E]">{totalReviews} total reviews</span>,
              delay: 'stagger-4',
            },
          ].map(({ label, value, sub, delay }) => (
            <div key={label} className={`bg-white rounded-2xl p-4 sm:p-5 border border-[#E4DED8] shadow-card animate-fade-up ${delay}`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[#A8A29E] mb-3">{label}</p>
              <p className="text-[26px] sm:text-[30px] font-bold text-[#111] leading-none tracking-[-0.03em] mb-3">{value}</p>
              {sub}
            </div>
          ))}
        </div>

        {/* ── Main content ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Pending replies */}
          <div className="lg:col-span-3">
            <SectionLabel
              badge={
                pendingList.length > 0 ? (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#111] text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                ) : undefined
              }
            >
              Pending replies
            </SectionLabel>

            {pendingList.length === 0 ? (
              <div className="flex items-center gap-4 px-5 py-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-emerald-700">All caught up</p>
                  <p className="text-[12px] text-emerald-600/75 mt-0.5">New reviews appear here after each sync.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingList.map(review => (
                  <PendingCard key={review.id} review={review} onAction={handlePendingAction} />
                ))}
                {pendingCount > 3 && (
                  <Link href="/dashboard/reviews" className="inline-flex items-center gap-1.5 text-[13px] text-[#E05A28] font-medium hover:text-[#C94E21] transition-colors pt-1 group">
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
              <div className="bg-white rounded-2xl border border-[#E4DED8] shadow-card overflow-hidden">
                <div className="p-4">
                  <textarea
                    value={quickReview}
                    onChange={e => setQuickReview(e.target.value)}
                    onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleQuickGenerate() }}
                    placeholder="Paste a review…"
                    rows={4}
                    className="w-full resize-none px-3.5 py-3 rounded-xl border border-[#E4DED8] bg-[#F8F6F3] hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] text-[13px] text-[#111] placeholder-[#C4BEB8] transition-all duration-200 leading-relaxed"
                  />
                  <button
                    onClick={handleQuickGenerate}
                    disabled={quickLoading || !quickReview.trim()}
                    className="mt-3 w-full py-2.5 rounded-xl bg-[#111] hover:bg-[#1E1E1E] text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    {quickLoading ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Generating…
                      </>
                    ) : 'Generate Reply'}
                  </button>
                </div>

                {quickError && (
                  <p className="px-4 pb-3 text-[12px] text-red-500">{quickError}</p>
                )}

                {quickReply && (
                  <div className="border-t border-[#EDE9E4] p-4 space-y-3">
                    <p className="text-[12px] text-[#57534E] leading-relaxed">{quickReply}</p>
                    <button
                      onClick={handleQuickCopy}
                      className={`w-full py-2 rounded-xl text-[12px] font-semibold border transition-all duration-150 ${
                        quickCopied
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-white text-[#57534E] border-[#E4DED8] hover:border-[#CEC8C1] hover:text-[#111]'
                      }`}
                    >
                      {quickCopied ? '✓ Copied' : 'Copy reply'}
                    </button>
                  </div>
                )}

                <div className="px-4 py-2.5 border-t border-[#EDE9E4] bg-[#F8F6F3]">
                  <Link href="/dashboard/generate" className="text-[11px] text-[#A8A29E] hover:text-[#57534E] transition-colors font-medium">
                    More options in full generator →
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent activity */}
            <div>
              <SectionLabel>Recent activity</SectionLabel>
              <div className="bg-white rounded-2xl border border-[#E4DED8] shadow-card overflow-hidden">
                {recentApproved.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-9 px-4 text-center">
                    <div className="w-9 h-9 rounded-full bg-[#F3F0EC] border border-[#E4DED8] flex items-center justify-center mb-3">
                      <svg className="w-4 h-4 text-[#C4BEB8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-[12px] font-medium text-[#A8A29E]">No approved replies yet</p>
                    <p className="text-[11px] text-[#C4BEB8] mt-0.5">Approved reviews will appear here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F3F0EC]">
                    {recentApproved.map(review => (
                      <div key={review.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-[#F3F0EC] border border-[#E4DED8] flex items-center justify-center text-[11px] font-semibold text-[#A8A29E] flex-shrink-0">
                          {review.reviewer_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[12px] font-semibold text-[#111] truncate">{review.reviewer_name}</span>
                            <span className="text-amber-400 text-[10px] flex-shrink-0">{'★'.repeat(review.star_rating)}</span>
                          </div>
                          <p className="text-[11px] text-[#C4BEB8]">{formatTimeAgo(review.created_at)}</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Approved" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Insights ───────────────────────────────────────────── */}
        <div>
          <SectionLabel>At a glance</SectionLabel>

          {!hasAnalytics ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-6 py-5 bg-white rounded-2xl border border-[#E4DED8] shadow-card">
              <div>
                <p className="text-[14px] font-semibold text-[#111]">Get insights from your reviews</p>
                <p className="text-[13px] text-[#7C7672] mt-1 leading-snug">Discover what customers love, what needs improving, and your top growth opportunity.</p>
              </div>
              <Link
                href="/dashboard/analytics"
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111] hover:bg-[#1E1E1E] text-white text-[13px] font-semibold transition-all duration-150"
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
                { label: 'Customers love', value: themes?.praised?.[0], fallback: 'Run analytics to see what resonates most.', dot: 'bg-emerald-400' },
                { label: 'Needs attention', value: themes?.complaints?.[0], fallback: "No recurring complaints — great sign.", dot: 'bg-amber-400' },
                { label: 'Top opportunity', value: themes?.opportunities?.[0], fallback: 'Run analytics to find your growth lever.', dot: 'bg-blue-400' },
              ] as const).map(({ label, value, fallback, dot }) => (
                <div key={label} className="bg-white rounded-2xl px-5 py-5 border border-[#E4DED8] shadow-card card-hover">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${dot} flex-shrink-0`} />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[#A8A29E]">{label}</p>
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
