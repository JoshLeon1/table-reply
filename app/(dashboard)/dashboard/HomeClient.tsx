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

// ── Setup banner ──────────────────────────────────────────────────────────────
const SKIP_KEY = 'tr_skipped_platforms'

type PlatformKey = 'google' | 'yelp' | 'tripadvisor'

function SetupBanner({
  googleMapsUrl,
  yelpUrl,
  tripadvisorUrl,
  step2Done,
  ownerName,
}: {
  googleMapsUrl: string | null
  yelpUrl: string | null
  tripadvisorUrl: string | null
  step2Done: boolean
  ownerName: string
}) {
  const [dismissed, setDismissed] = useState(false)
  // Read skipped platforms from localStorage (client-only)
  const [skipped, setSkipped] = useState<PlatformKey[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SKIP_KEY)
      if (stored) setSkipped(JSON.parse(stored))
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  const skipPlatform = (key: PlatformKey) => {
    const next = [...skipped, key]
    setSkipped(next)
    try { localStorage.setItem(SKIP_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  const unskipPlatform = (key: PlatformKey) => {
    const next = skipped.filter(k => k !== key)
    setSkipped(next)
    try { localStorage.setItem(SKIP_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  if (!hydrated) return null // Avoid hydration mismatch

  const platforms: { key: PlatformKey; label: string; url: string | null; color: string; colorBg: string; colorBorder: string }[] = [
    { key: 'google',      label: 'Google Maps',  url: googleMapsUrl,  color: 'text-blue-400',    colorBg: 'bg-blue-950/30',    colorBorder: 'border-blue-900/30' },
    { key: 'yelp',        label: 'Yelp',         url: yelpUrl,        color: 'text-red-400',     colorBg: 'bg-red-950/30',     colorBorder: 'border-red-900/30'  },
    { key: 'tripadvisor', label: 'TripAdvisor',  url: tripadvisorUrl, color: 'text-emerald-400', colorBg: 'bg-emerald-950/30', colorBorder: 'border-emerald-900/30' },
  ]

  // Step 1 is done when every platform is either connected or explicitly skipped
  const step1Done = platforms.every(p => !!p.url || skipped.includes(p.key))
  const allDone = step1Done && step2Done
  if (allDone || dismissed) return null

  const completedCount = [step1Done, step2Done].filter(Boolean).length

  return (
    <div className="relative animate-fade-up rounded-2xl border border-[#E05A28]/25 bg-gradient-to-br from-[#1A0F09] to-[#110A05] overflow-hidden shadow-[0_2px_20px_rgba(224,90,40,0.10)]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E05A28]/50 to-transparent" />

      <div className="px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">

            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E05A28]/15 border border-[#E05A28]/25">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E05A28] animate-pulse flex-shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#E05A28]/80">
                  Get started — {completedCount}/2 done
                </span>
              </div>
            </div>

            <h2 className="text-[15px] sm:text-[17px] font-bold text-white tracking-[-0.02em] mb-0.5">
              Hey {ownerName}, finish setup to see replies roll in
            </h2>
            <p className="text-[12px] text-white/40 mb-5">Two quick steps — takes under a minute.</p>

            {/* ── Step 1: Platforms ── */}
            <div className={`rounded-xl border p-4 mb-3 transition-all duration-300 ${step1Done ? 'border-emerald-900/25 bg-emerald-950/15' : 'border-white/[0.08] bg-white/[0.03]'}`}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${step1Done ? 'bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.4)]' : 'border border-[#E05A28]/40 bg-[#E05A28]/10'}`}>
                  {step1Done
                    ? <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    : <span className="text-[10px] font-bold text-[#E05A28]">1</span>
                  }
                </div>
                <p className={`text-[13px] font-semibold ${step1Done ? 'text-emerald-300 line-through decoration-emerald-700' : 'text-white/80'}`}>
                  Connect your review platforms
                </p>
              </div>

              {/* Per-platform rows */}
              <div className="space-y-2 pl-8">
                {platforms.map((p) => {
                  const isConnected = !!p.url
                  const isSkipped = skipped.includes(p.key)

                  if (isConnected) {
                    return (
                      <div key={p.key} className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`text-[12px] font-semibold ${p.color}`}>{p.label}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${p.colorBg} ${p.colorBorder} border ${p.color}`}>Connected</span>
                      </div>
                    )
                  }

                  if (isSkipped) {
                    return (
                      <div key={p.key} className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-white/20 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-[12px] text-white/30 line-through">{p.label}</span>
                        <button
                          onClick={() => unskipPlatform(p.key)}
                          className="text-[11px] text-white/30 hover:text-[#E05A28] underline underline-offset-2 transition-colors ml-1"
                        >
                          Connect now
                        </button>
                      </div>
                    )
                  }

                  // Pending — not connected, not skipped
                  return (
                    <div key={p.key} className="flex items-center gap-2 flex-wrap">
                      <span className="w-3.5 h-3.5 flex-shrink-0" /> {/* Spacer */}
                      <span className="text-[12px] font-medium text-white/55">{p.label}</span>
                      <Link
                        href="/dashboard/get-more-reviews"
                        className={`text-[11px] font-semibold ${p.color} underline underline-offset-2 hover:opacity-80 transition-opacity`}
                      >
                        Connect →
                      </Link>
                      <button
                        onClick={() => skipPlatform(p.key)}
                        className="text-[11px] text-white/25 hover:text-white/50 transition-colors"
                      >
                        Set up later
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Step 2: Generate ── */}
            <div className={`rounded-xl border p-4 mb-5 transition-all duration-300 ${step2Done ? 'border-emerald-900/25 bg-emerald-950/15' : 'border-white/[0.08] bg-white/[0.03]'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${step2Done ? 'bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.4)]' : 'border border-[#E05A28]/40 bg-[#E05A28]/10'}`}>
                  {step2Done
                    ? <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    : <span className="text-[10px] font-bold text-[#E05A28]">2</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold ${step2Done ? 'text-emerald-300 line-through decoration-emerald-700' : 'text-white/80'}`}>
                    Generate your first reply
                  </p>
                  {!step2Done && (
                    <p className="text-[11px] text-white/30 mt-0.5">Let AI draft a response in seconds</p>
                  )}
                </div>
                {!step2Done && (
                  <Link
                    href="/dashboard/generate"
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E05A28]/15 hover:bg-[#E05A28]/25 border border-[#E05A28]/25 text-[12px] font-semibold text-[#E05A28] transition-all duration-150"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Generate →
                  </Link>
                )}
              </div>
            </div>

          </div>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/55 hover:bg-white/[0.07] transition-all duration-150 mt-0.5"
            aria-label="Dismiss"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
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
  yelpUrl: string | null
  tripadvisorUrl: string | null
  hasGeneratedReply: boolean
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
  yelpUrl,
  tripadvisorUrl,
  hasGeneratedReply,
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
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [pendingList, setPendingList] = useState<ScrapedReview[]>(initialPendingReviews)

  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Animated counts
  const animReviews  = useCountUp(reviewsThisMonth, 900, 100)
  const animRating   = useCountUp(Math.round(avgRating * 10), 900, 200)
  const animApproved = useCountUp(approvedThisMonth, 900, 300)
  const animRate     = useCountUp(responseRate, 900, 400)

  const handlePendingAction = (id: string) => setPendingList(prev => prev.filter(r => r.id !== id))

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

        {/* ── Onboarding checklist ────────────────────────────────────────── */}
        <SetupBanner
          ownerName={ownerName}
          googleMapsUrl={googleMapsUrl}
          yelpUrl={yelpUrl}
          tripadvisorUrl={tripadvisorUrl}
          step2Done={hasGeneratedReply}
        />

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

          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            {/* Left — action-oriented headline */}
            <div>
              {/* Eyebrow: restaurant + sync time */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[12px] font-semibold text-white/60 tracking-wide">{restaurantName}</span>
                {lastScrapedAt && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />
                    <span className="text-[11px] text-white/40">synced {formatTimeAgo(lastScrapedAt)}</span>
                  </>
                )}
              </div>

              {/* Big count */}
              <div className="flex items-baseline gap-3 mb-2">
                <h1 className="text-[36px] sm:text-[48px] font-black text-white tracking-[-0.04em] leading-none tabular-nums">
                  {pendingList.length}
                </h1>
                <span className="text-[18px] sm:text-[22px] font-bold text-white/80 tracking-[-0.02em] leading-none">
                  {pendingList.length === 1 ? 'review needs a reply' : 'reviews need replies'}
                </span>
              </div>

              {/* Subtext — contextual */}
              <p className="text-[13px] text-white/55 leading-snug">
                {pendingList.length > 0
                  ? 'Respond in seconds below — AI drafts are ready.'
                  : googleMapsUrl
                    ? "You're all caught up. Sync to check for new reviews."
                    : 'Sync your accounts to start generating replies instantly.'}
              </p>
            </div>

            {/* Right — single dominant CTA */}
            <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
              {!lastScrapedAt ? (
                /* ── NOT YET SYNCED: primary action is Sync ── */
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="group flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white text-[#C94E21] text-[14px] font-bold shadow-[0_4px_20px_rgba(0,0,0,0.20)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.30)] active:scale-[0.97] disabled:opacity-50 transition-all duration-200 whitespace-nowrap"
                >
                  <svg
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-700 ${syncing ? 'animate-spin' : 'group-hover:rotate-180'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {syncing ? 'Syncing…' : 'Sync Reviews'}
                </button>
              ) : (
                /* ── ALREADY SYNCED: primary action is Generate ── */
                <>
                  <Link
                    href="/dashboard/generate"
                    className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white text-[#C94E21] text-[14px] font-bold shadow-[0_4px_20px_rgba(0,0,0,0.20)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.30)] active:scale-[0.97] transition-all duration-200 whitespace-nowrap"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Generate Replies
                  </Link>

                  {/* Secondary: sync (demoted, not competing) */}
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="group flex items-center gap-1.5 text-[12px] font-medium text-white/45 hover:text-white/80 disabled:opacity-40 transition-colors duration-150"
                  >
                    <svg
                      className={`w-3 h-3 transition-transform duration-700 ${syncing ? 'animate-spin' : 'group-hover:rotate-180'}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {syncing ? 'Syncing…' : 'Sync reviews'}
                  </button>
                </>
              )}

              {syncMsg && (
                <span className={`text-[11px] font-semibold animate-fade-in ${syncMsg.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
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

            {/* Recent activity */}
            <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
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
