'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RestaurantProfile, ScrapedReview } from '@/types'

interface Props {
  profile: RestaurantProfile
  initialReviews: ScrapedReview[]
  userId: string
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <svg key={i} className={`w-3 h-3 ${i <= rating ? 'text-amber-400' : 'text-[#E8E4DC]'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  )
}

function formatDate(utcStr: string) {
  if (!utcStr) return ''
  try {
    return new Date(utcStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return utcStr }
}

// ── Scraping progress indicator ───────────────────────────────────────────────

const SCRAPE_MESSAGES = [
  'Scanning Google reviews…',
  'Reading what customers said…',
  'Crafting personalised replies…',
  'Almost done…',
]

function ScrapeProgress() {
  const [msgIdx, setMsgIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % SCRAPE_MESSAGES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#111] text-white mb-5">
      <svg className="animate-spin w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <p className="text-[13px] font-medium transition-all duration-500">{SCRAPE_MESSAGES[msgIdx]}</p>
    </div>
  )
}

// ── Setup panel ───────────────────────────────────────────────────────────────

function SetupPanel({ profile, onSaved }: { profile: RestaurantProfile; onSaved: (url: string) => void }) {
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSave = async () => {
    const trimmed = url.trim()
    if (!trimmed) return
    if (!trimmed.includes('google.com/maps') && !trimmed.includes('maps.google')) {
      setError('Please enter a valid Google Maps URL.')
      return
    }
    setSaving(true)
    setError('')
    const { error: dbErr } = await supabase
      .from('restaurant_profiles')
      .update({ google_maps_url: trimmed })
      .eq('id', profile.id)

    if (dbErr) setError('Failed to save. Please try again.')
    else onSaved(trimmed)
    setSaving(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#111] flex items-center justify-center mb-6">
        <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-[#111] mb-2">Put your review replies on autopilot</h1>
      <p className="text-[13px] text-[#888] max-w-sm mb-8 leading-relaxed">
        Connect your Google Maps listing and TableReply will scrape new reviews every morning, generate personalised replies, and queue them for your approval.
      </p>
      <div className="w-full max-w-md text-left space-y-3">
        <label className="block text-[13px] font-medium text-[#111]">Google Maps URL</label>
        <input
          type="url"
          placeholder="https://www.google.com/maps/place/your-restaurant…"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] text-[#111] text-sm placeholder:text-[#C0BDB8] bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all"
        />
        {error && <p className="text-[12px] text-red-500">{error}</p>}
        <button
          onClick={handleSave}
          disabled={saving || !url.trim()}
          className="w-full py-2.5 rounded-xl bg-[#111] hover:bg-[#2a2a2a] text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {saving ? 'Saving…' : 'Connect & Start Syncing'}
        </button>
      </div>
      <details className="mt-8 text-left max-w-md w-full group">
        <summary className="text-[12px] text-[#AAA] cursor-pointer hover:text-[#666] select-none list-none flex items-center gap-1.5 transition-colors">
          <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
          How do I find my Google Maps URL?
        </summary>
        <div className="mt-3 p-4 rounded-xl bg-white border border-[#E8E4DC] text-[12px] text-[#666] leading-relaxed space-y-1">
          <p>1. Go to <strong>Google Maps</strong> and search for your restaurant.</p>
          <p>2. Click your listing to open the info panel.</p>
          <p>3. Copy the URL from your browser address bar.</p>
          <p className="text-[#AAA] mt-1">URL starts with <code className="font-mono bg-[#F5F4F0] px-1 py-0.5 rounded">google.com/maps/place/</code></p>
        </div>
      </details>
    </div>
  )
}

// ── Review card ───────────────────────────────────────────────────────────────

function ReviewCard({ review, onApprove, onDismiss }: {
  review: ScrapedReview
  onApprove: (id: string) => void
  onDismiss: (id: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [actioning, setActioning] = useState(false)
  const noText = !review.review_text?.trim()

  const handleApprove = async () => {
    setActioning(true)
    if (review.generated_reply) {
      await navigator.clipboard.writeText(review.generated_reply).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    onApprove(review.id)
  }

  const handleDismiss = () => {
    setActioning(true)
    onDismiss(review.id)
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${noText ? 'border-[#F0EDE8] opacity-75' : 'border-[#E8E4DC]'}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EDE8]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F5F4F0] border border-[#E8E4DC] flex items-center justify-center text-[12px] font-semibold text-[#555]">
            {review.reviewer_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-[#111]">{review.reviewer_name}</span>
              {noText ? (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#F5F4F0] text-[#AAA] border border-[#E8E4DC]">Rating only</span>
              ) : review.star_rating >= 4 ? (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Positive</span>
              ) : review.star_rating <= 2 ? (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">Critical</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {review.alert_triggered && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center gap-1">
                  <span>⚠️</span> Alert
                </span>
              )}
              <StarRow rating={review.star_rating}/>
              <span className="text-[11px] text-[#AAA]">{formatDate(review.review_datetime_utc)}</span>
              {review.language && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  {review.language}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {noText ? (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#CCC] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/>
            </svg>
            <p className="text-[13px] text-[#CCC] italic">Rating only — no text</p>
          </div>
        ) : (
          <p className="text-[13px] text-[#555] leading-relaxed line-clamp-4">"{review.review_text}"</p>
        )}

        {review.generated_reply && !noText && (
          <div className="bg-[#F7F6F3] rounded-xl p-4 border border-[#E8E4DC]">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#888]">Suggested reply</span>
            </div>
            <p className="text-[13px] text-[#333] leading-relaxed">{review.generated_reply}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          {noText ? (
            <span className="text-[12px] text-[#CCC] italic px-1">No reply needed</span>
          ) : (
            <button
              onClick={handleApprove}
              disabled={actioning}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-[#111] hover:bg-[#2a2a2a] text-white text-[13px] font-medium disabled:opacity-40 transition-all min-h-[44px] sm:min-h-0"
            >
              {copied ? (
                <><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Copied</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>Copy &amp; Approve</>
              )}
            </button>
          )}
          <button
            onClick={handleDismiss}
            disabled={actioning}
            className="flex items-center justify-center px-3.5 py-2.5 sm:py-2 rounded-xl text-[13px] font-medium text-[#888] hover:text-[#111] hover:bg-[#F5F4F0] border border-transparent hover:border-[#E8E4DC] disabled:opacity-40 transition-all min-h-[44px] sm:min-h-0"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Connected panel ───────────────────────────────────────────────────────────

function ConnectedPanel({ profile, reviews, onApprove, onDismiss, onScrapeNow, onTestMode, scraping, scrapeError, onDismissError, lastScrapedAt }: {
  profile: RestaurantProfile
  reviews: ScrapedReview[]
  onApprove: (id: string) => void
  onDismiss: (id: string) => void
  onScrapeNow: () => void
  onTestMode: () => void
  scraping: boolean
  scrapeError: string
  onDismissError: () => void
  lastScrapedAt: string | null
}) {
  const pending   = reviews
    .filter((r) => r.reply_status === 'pending')
    .sort((a, b) => (b.alert_triggered ? 1 : 0) - (a.alert_triggered ? 1 : 0))
  const approved  = reviews.filter((r) => r.reply_status === 'approved')
  const [showHistory, setShowHistory] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)

  const totalWithText  = reviews.filter((r) => r.review_text?.trim()).length
  const approvedCount  = approved.length
  const responseRate   = totalWithText > 0 ? Math.round((approvedCount / totalWithText) * 100) : 0

  const handleCopyAll = () => {
    const text = approved
      .filter((r) => r.generated_reply)
      .map((r) => `— ${r.reviewer_name} (${r.star_rating}★)\nReview: "${r.review_text}"\n\nReply:\n${r.generated_reply}`)
      .join('\n\n─────────────────────\n\n')
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2500)
  }

  return (
    <div>
      {/* Scrape error banner */}
      {scrapeError && (
        <div className="mb-5 flex items-start justify-between gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-600">
          <p>{scrapeError}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={onScrapeNow} className="font-semibold underline hover:no-underline">Try again</button>
            <button onClick={onDismissError} className="text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-[#111]">Auto Reviews</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
            <span className="text-[13px] text-[#888]">
              {profile.restaurant_name}
              {lastScrapedAt && <> · Synced {formatDate(lastScrapedAt)}</>}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onTestMode} disabled={scraping}
            className="px-3.5 py-2 rounded-xl text-[13px] font-medium text-[#AAA] hover:text-[#666] border border-dashed border-[#E8E4DC] hover:border-[#D4CFC6] disabled:opacity-40 transition-all"
            title="Inject fake reviews to test the UI">
            Test data
          </button>
          <button onClick={onScrapeNow} disabled={scraping}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E8E4DC] hover:border-[#D4CFC6] text-[13px] font-medium text-[#555] hover:text-[#111] disabled:opacity-40 transition-all">
            <svg className={`w-3.5 h-3.5 ${scraping ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {scraping ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Response rate stat */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[#E8E4DC] mb-5">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          <p className="text-[13px] text-[#555]">
            You've responded to{' '}
            <span className={`font-semibold ${responseRate >= 80 ? 'text-emerald-600' : responseRate >= 50 ? 'text-[#111]' : 'text-amber-600'}`}>
              {approvedCount} of {totalWithText}
            </span>
            {' '}reviews with text{' '}
            <span className={`font-semibold ${responseRate >= 80 ? 'text-emerald-600' : responseRate >= 50 ? 'text-[#111]' : 'text-amber-600'}`}>
              ({responseRate}%)
            </span>
          </p>
        </div>
      )}

      {/* Scraping progress */}
      {scraping && <ScrapeProgress/>}

      {/* Pending banner */}
      {pending.length > 0 && !scraping && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#111] text-white">
          <span className="w-6 h-6 rounded-full bg-amber-400 text-[#111] text-[11px] font-bold flex items-center justify-center flex-shrink-0">
            {pending.length}
          </span>
          <p className="text-[13px]">
            <span className="font-semibold">{pending.length} {pending.length === 1 ? 'review' : 'reviews'}</span>
            <span className="text-white/60"> waiting for approval — copy the reply and paste it into Google Maps.</span>
          </p>
        </div>
      )}

      {/* Pending reviews */}
      {!scraping && (pending.length > 0 ? (
        <div className="space-y-3 mb-8">
          {pending.map((r) => (
            <ReviewCard key={r.id} review={r} onApprove={onApprove} onDismiss={onDismiss}/>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 mb-8 bg-white rounded-2xl border border-[#E8E4DC]">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-[#111]">All caught up</p>
          <p className="text-[12px] text-[#AAA] mt-1">New reviews will appear here after the next sync.</p>
        </div>
      ))}

      {/* History */}
      {approved.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowHistory((p) => !p)}
              className="flex items-center gap-1.5 text-[12px] font-medium text-[#AAA] hover:text-[#555] transition-colors"
            >
              <svg className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
              {showHistory ? 'Hide' : 'Show'} approved history ({approved.length})
            </button>

            {showHistory && approved.some((r) => r.generated_reply) && (
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 text-[12px] font-medium text-[#666] hover:text-[#111] px-3 py-1.5 rounded-lg border border-[#E8E4DC] hover:border-[#D4CFC6] bg-white transition-all"
              >
                {copiedAll ? (
                  <><svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Copied all</>
                ) : (
                  <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>Copy all approved</>
                )}
              </button>
            )}
          </div>

          {showHistory && (
            <div className="space-y-3 opacity-60">
              {approved.map((r) => (
                <ReviewCard key={r.id} review={r} onApprove={onApprove} onDismiss={onDismiss}/>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ReviewsClient({ profile, initialReviews, userId }: Props) {
  const [mapsUrl, setMapsUrl]       = useState(profile.google_maps_url ?? '')
  const [reviews, setReviews]       = useState<ScrapedReview[]>(initialReviews)
  const [scraping, setScraping]     = useState(false)
  const [scrapeError, setScrapeError] = useState('')
  const [lastScrapedAt, setLastScrapedAt] = useState(profile.last_scraped_at)
  const supabase = createClient()

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const handleSaved = (url: string) => { setMapsUrl(url); handleScrapeNow() }

  const handleScrapeNow = async (testMode = false) => {
    setScraping(true)
    setScrapeError('')
    try {
      const res = await fetch('/api/scrape-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMode ? { testMode: true } : {}),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setScrapeError(data.error ?? 'Scrape failed. Please try again.')
      } else {
        const data = await res.json().catch(() => ({}))
        const { data: fresh } = await supabase
          .from('scraped_reviews').select('*')
          .eq('user_id', userId)
          .in('reply_status', ['pending', 'approved'])
          .order('review_datetime_utc', { ascending: false })
          .limit(50)
        if (fresh) setReviews(fresh as ScrapedReview[])
        setLastScrapedAt(new Date().toISOString())
        // Fire browser notification if new reviews found
        if ('Notification' in window && Notification.permission === 'granted') {
          const newCount = data?.newReviews ?? 0
          if (newCount > 0) {
            new Notification(`🍴 ${newCount} new review${newCount !== 1 ? 's' : ''} synced`, {
              body: `${newCount} new review${newCount !== 1 ? 's' : ''} for ${profile.restaurant_name} — replies are ready`,
              icon: '/favicon.svg',
            })
          }
        }
      }
    } catch {
      setScrapeError('Network error. Please try again.')
    } finally {
      setScraping(false)
    }
  }

  const handleApprove = async (id: string) => {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, reply_status: 'approved' as const } : r))
    await supabase.from('scraped_reviews').update({ reply_status: 'approved' }).eq('id', id).eq('user_id', userId)
  }

  const handleDismiss = async (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id))
    await supabase.from('scraped_reviews').update({ reply_status: 'dismissed' }).eq('id', id).eq('user_id', userId)
  }

  return !mapsUrl ? (
    <SetupPanel profile={profile} onSaved={handleSaved}/>
  ) : (
    <ConnectedPanel
      profile={profile}
      reviews={reviews}
      onApprove={handleApprove}
      onDismiss={handleDismiss}
      onScrapeNow={() => handleScrapeNow()}
      onTestMode={() => handleScrapeNow(true)}
      scraping={scraping}
      scrapeError={scrapeError}
      onDismissError={() => setScrapeError('')}
      lastScrapedAt={lastScrapedAt}
    />
  )
}
