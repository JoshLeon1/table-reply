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
        <svg key={i} className={`w-3 h-3 ${i <= rating ? 'text-[#E05A28]' : 'text-[#E4DED8]'}`} fill="currentColor" viewBox="0 0 20 20">
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

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function starTopBorder(rating: number) {
  if (rating >= 5) return 'border-t-2 border-t-emerald-300'
  if (rating >= 4) return 'border-t-2 border-t-amber-300'
  if (rating >= 3) return 'border-t-2 border-t-yellow-200'
  return 'border-t-2 border-t-red-300'
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
      <svg className="animate-spin w-4 h-4 text-[#E05A28] flex-shrink-0" fill="none" viewBox="0 0 24 24">
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
        <svg className="w-6 h-6 text-[#E05A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-[#111] mb-2">Put your review replies on autopilot</h1>
      <p className="text-[13px] text-[#6B6B6B] max-w-[280px] sm:max-w-sm mb-8 leading-relaxed">
        Connect your Google Maps listing and TableReply will scrape new reviews every morning, generate personalised replies, and queue them for your approval.
      </p>
      <div className="w-full sm:max-w-lg text-left space-y-3">
        <label className="block text-[13px] font-medium text-[#111]">Google Maps URL</label>
        <input
          type="url"
          placeholder="https://www.google.com/maps/place/your-restaurant…"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="w-full px-3.5 py-3.5 rounded-xl border border-[#E4DED8] text-[15px] text-[#111] placeholder:text-[#C0BDB8] bg-white focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] transition-all"
        />
        <p className="text-[11px] text-[#A8A29E] mt-1.5">e.g. maps.google.com/maps/place/your-restaurant...</p>
        {error && <p className="text-[12px] text-red-500">{error}</p>}

        {/* Helper bullets */}
        <div className="space-y-1.5 pt-1">
          <p className="flex items-center gap-2 text-[12px] text-[#57534E]"><span>📍</span> Go to Google Maps</p>
          <p className="flex items-center gap-2 text-[12px] text-[#57534E]"><span>🔍</span> Search for your restaurant</p>
          <p className="flex items-center gap-2 text-[12px] text-[#57534E]"><span>🔗</span> Copy the URL from address bar</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !url.trim()}
          className="w-full min-h-[52px] rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] active:scale-[0.98] text-white text-[15px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_2px_12px_rgba(224,90,40,0.25)]"
        >
          {saving ? 'Saving…' : 'Connect & Start Syncing'}
        </button>
      </div>
      <details className="mt-8 text-left w-full sm:max-w-lg group">
        <summary className="text-[12px] text-[#A8A29E] cursor-pointer hover:text-[#333] select-none list-none flex items-center gap-1.5 transition-colors">
          <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
          How do I find my Google Maps URL?
        </summary>
        <div className="mt-3 p-4 rounded-xl bg-white border border-[#E4DED8] text-[12px] text-[#666] leading-relaxed space-y-1">
          <p>1. Go to <strong>Google Maps</strong> and search for your restaurant.</p>
          <p>2. Click your listing to open the info panel.</p>
          <p>3. Copy the URL from your browser address bar.</p>
          <p className="text-[#A8A29E] mt-1">URL starts with <code className="font-mono bg-[#F3F0EC] px-1 py-0.5 rounded">google.com/maps/place/</code></p>
        </div>
      </details>
    </div>
  )
}

// ── Review card ───────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#E4DED8] animate-pulse">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#EDE9E4]">
        <div className="w-8 h-8 rounded-full bg-[#EDE9E4] flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-28 bg-[#EDE9E4] rounded-full" />
          <div className="h-2.5 w-20 bg-[#EDE9E4] rounded-full" />
        </div>
      </div>
      <div className="px-5 py-4 border-b border-[#EDE9E4] space-y-2">
        <div className="h-2.5 w-16 bg-[#EDE9E4] rounded-full" />
        <div className="h-3 w-full bg-[#EDE9E4] rounded-full" />
        <div className="h-3 w-[85%] bg-[#EDE9E4] rounded-full" />
      </div>
      <div className="px-5 py-4 space-y-2">
        <div className="h-2.5 w-16 bg-[#EDE9E4] rounded-full" />
        <div className="h-3 w-full bg-[#EDE9E4] rounded-full" />
        <div className="h-3 w-[70%] bg-[#EDE9E4] rounded-full" />
      </div>
      <div className="flex gap-2 px-5 py-3.5 border-t border-[#EDE9E4]">
        <div className="h-9 w-32 bg-[#EDE9E4] rounded-xl" />
        <div className="h-9 w-20 bg-[#EDE9E4] rounded-xl" />
      </div>
    </div>
  )
}

const REVIEW_TRUNCATE_LENGTH = 200

function ReviewCard({ review: initialReview, onApprove, onDismiss, onRestore, showStatus }: {
  review: ScrapedReview
  onApprove: (id: string) => void
  onDismiss: (id: string) => void
  onRestore?: (id: string) => void
  showStatus?: boolean
}) {
  const supabase = createClient()
  const [review, setReview] = useState(initialReview)
  const [copied, setCopied] = useState(false)
  const [actioning, setActioning] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [expanded, setExpanded] = useState(false)
  const noText = !review.review_text?.trim()
  const isLong = (review.review_text?.length ?? 0) > REVIEW_TRUNCATE_LENGTH

  const handleGenerateReply = async () => {
    setGenerating(true)
    setGenError('')
    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: review.review_text,
          starRating: review.star_rating,
          platform: 'Google',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      const reply: string = data.reply
      await supabase
        .from('scraped_reviews')
        .update({ generated_reply: reply })
        .eq('id', review.id)
      setReview(prev => ({ ...prev, generated_reply: reply }))
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Failed to generate')
    } finally {
      setGenerating(false)
    }
  }

  const handleApprove = async () => {
    if (!review.generated_reply) return
    setActioning(true)
    await navigator.clipboard.writeText(review.generated_reply).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
    onApprove(review.id)
    setActioning(false)
  }

  const handleDismiss = () => {
    setActioning(true)
    onDismiss(review.id)
  }

  const handleRestore = () => {
    if (onRestore) {
      setActioning(true)
      onRestore(review.id)
    }
  }

  const status = review.reply_status

  // Status badge
  const statusBadge = showStatus ? (
    status === 'pending' ? (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF0E8] text-[#C94E21] border border-[#F5C9AD]">Pending</span>
    ) : status === 'approved' ? (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>
    ) : (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F3F0EC] text-[#A8A29E] border border-[#E4DED8]">Dismissed</span>
    )
  ) : null

  const displayText = isLong && !expanded
    ? review.review_text.slice(0, REVIEW_TRUNCATE_LENGTH) + '…'
    : review.review_text

  return (
    <div className={`bg-white rounded-2xl overflow-hidden border border-[#E4DED8] ${starTopBorder(review.star_rating)} shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-px ${noText ? 'opacity-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE9E4]">
        <div className="flex items-center gap-3">
          {/* Initials avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FEF0E8] to-[#F3F0EC] border border-[#F5C9AD]/40 flex items-center justify-center text-[12px] font-bold text-[#C94E21] flex-shrink-0 shadow-sm">
            {getInitials(review.reviewer_name)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-semibold text-[#111]">{review.reviewer_name}</span>
              {statusBadge}
              {noText ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F3F0EC] text-[#A8A29E] border border-[#E4DED8]">Rating only</span>
              ) : review.star_rating >= 4 ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">Positive</span>
              ) : review.star_rating <= 2 ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200/80">Critical</span>
              ) : null}
              {review.alert_triggered && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200/80 flex items-center gap-1">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                  Alert
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRow rating={review.star_rating}/>
              <span className="text-[11px] text-[#A8A29E]">{formatDate(review.review_datetime_utc)}</span>
              {review.language && review.language !== 'English' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">{review.language}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-[#EDE9E4]">
        {/* Review text */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E] mb-2">Their review</p>
          {noText ? (
            <p className="text-[13px] text-[#C4BEB8] italic">Rating only — no written review</p>
          ) : (
            <>
              <p className="text-[13px] text-[#57534E] leading-relaxed">&ldquo;{displayText}&rdquo;</p>
              {isLong && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-[12px] text-[#E05A28] hover:text-[#C94E21] font-medium mt-1.5 transition-colors"
                >
                  {expanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Reply section */}
        {!noText && (
          <div className="px-5 py-4">
            {review.generated_reply ? (
              /* AI reply card */
              <div className="rounded-xl bg-[#FAFAF9] border border-[#EDE9E4] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E] mb-2">AI reply</p>
                <p className="text-[13px] text-[#57534E] leading-relaxed">{review.generated_reply}</p>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E] mb-2">AI reply</p>
                {generating ? (
                  <div className="flex items-center gap-2.5 text-[13px] text-[#6B6B6B] py-1">
                    <svg className="animate-spin w-3.5 h-3.5 text-[#E05A28] flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    <span>Writing reply…</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-[12px] text-[#C4BEB8] italic mb-3">No reply generated yet.</p>
                    <button
                      onClick={handleGenerateReply}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF0E8] hover:bg-[#FCDCCA]/50 border border-[#F5C9AD] text-[#C94E21] text-[12px] font-semibold transition-all duration-150 active:scale-[0.98]"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      Generate Reply
                    </button>
                    {genError && <p className="text-[12px] text-red-500 mt-2">{genError}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3.5 bg-[#FAFAF9] border-t border-[#EDE9E4]">
        {noText ? (
          <span className="text-[12px] text-[#C4BEB8] italic flex-1">No reply needed</span>
        ) : status === 'approved' ? (
          <>
            <button
              onClick={handleApprove}
              disabled={actioning}
              className="flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-xl bg-white border border-[#E4DED8] hover:border-[#CEC8C1] text-[#57534E] text-[13px] font-medium active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              {copied ? (
                <><svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Copied!</>
              ) : (
                <><svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>View Reply</>
              )}
            </button>
            <button
              onClick={handleDismiss}
              disabled={actioning}
              className="px-3.5 min-h-[44px] rounded-xl text-[13px] font-medium text-[#A8A29E] hover:text-[#333] hover:bg-[#EDE9E4] active:scale-[0.97] disabled:opacity-40 transition-all duration-150"
            >
              Undo
            </button>
          </>
        ) : status === 'dismissed' ? (
          <button
            onClick={handleRestore}
            disabled={actioning}
            className="flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-xl bg-white border border-[#E4DED8] hover:border-[#CEC8C1] text-[#57534E] text-[13px] font-medium active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
          >
            Restore
          </button>
        ) : (
          <>
            <button
              onClick={handleApprove}
              disabled={actioning || !review.generated_reply}
              className="flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] active:scale-[0.97] text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_1px_3px_rgba(224,90,40,0.3)]"
            >
              {copied ? (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Copied!</>
              ) : (
                <><svg className="w-3.5 h-3.5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>Copy &amp; Approve</>
              )}
            </button>
            <button
              onClick={handleDismiss}
              disabled={actioning}
              className="px-3.5 min-h-[44px] rounded-xl text-[13px] font-medium text-[#A8A29E] hover:text-[#333] hover:bg-[#EDE9E4] active:scale-[0.97] disabled:opacity-40 transition-all duration-150"
            >
              Dismiss
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Connected panel ───────────────────────────────────────────────────────────

type ReviewTab = 'pending' | 'approved' | 'dismissed'

function ConnectedPanel({ profile, reviews, onApprove, onDismiss, onRestore, onScrapeNow, onTestMode, scraping, scrapeError, onDismissError, lastScrapedAt }: {
  profile: RestaurantProfile
  reviews: ScrapedReview[]
  onApprove: (id: string) => void
  onDismiss: (id: string) => void
  onRestore: (id: string) => void
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
  const dismissed = reviews.filter((r) => r.reply_status === 'dismissed')
  const [activeTab, setActiveTab] = useState<ReviewTab>('pending')
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

  const tabs: { key: ReviewTab; label: string; count: number }[] = [
    { key: 'pending',  label: 'Pending',  count: pending.length  },
    { key: 'approved', label: 'Approved', count: approved.length  },
    { key: 'dismissed', label: 'Dismissed', count: dismissed.length },
  ]

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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-[#111]">Auto Reviews</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"/>
            <span className="text-[13px] text-[#57534E]">
              {profile.restaurant_name}
              {lastScrapedAt && <> · Synced {formatDate(lastScrapedAt)}</>}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onTestMode} disabled={scraping}
            className="px-3 py-2 rounded-xl text-[12px] font-medium text-[#A8A29E] hover:text-[#333] border border-dashed border-[#E4DED8] hover:border-[#D4CFC6] disabled:opacity-40 transition-all min-h-[40px]"
            title="Inject fake reviews to test the UI">
            Test data
          </button>
          <button onClick={onScrapeNow} disabled={scraping}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E4DED8] hover:border-[#D4CFC6] text-[13px] font-medium text-[#57534E] hover:text-[#111] disabled:opacity-40 transition-all min-h-[40px]">
            <svg className={`w-3.5 h-3.5 ${scraping ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {scraping ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Response rate stat */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[#E4DED8] border-l-[3px] border-l-[#E05A28] mb-5">
          <svg className="w-4 h-4 text-[#E05A28] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          <p className="text-[13px] text-[#666] leading-snug">
            Responded to{' '}
            <span className={`font-semibold ${responseRate >= 80 ? 'text-emerald-600' : responseRate >= 50 ? 'text-[#111]' : 'text-[#C94E21]'}`}>
              {approvedCount} of {totalWithText} reviews
            </span>
            {' '}
            <span className={`font-semibold ${responseRate >= 80 ? 'text-emerald-600' : responseRate >= 50 ? 'text-[#111]' : 'text-[#C94E21]'}`}>
              ({responseRate}%)
            </span>
          </p>
        </div>
      )}

      {/* Pending banner */}
      {pending.length > 0 && !scraping && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FEF0E8] border border-[#F5C9AD]">
          <span className="w-6 h-6 rounded-full bg-[#E05A28] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
            {pending.length}
          </span>
          <p className="text-[13px] text-[#C94E21]">
            <span className="font-semibold">{pending.length} {pending.length === 1 ? 'review' : 'reviews'}</span>
            <span className="text-[#E05A28]/70"> waiting for approval — copy the reply and paste it into Google Maps.</span>
          </p>
        </div>
      )}

      {/* Tab bar — horizontal scrollable on mobile */}
      <div className="overflow-x-auto scrollbar-hide mb-5">
        <div className="flex border-b border-[#EDE9E4] min-w-max sm:min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition-all duration-150 whitespace-nowrap border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-[#E05A28] text-[#111]'
                  : 'border-transparent text-[#A8A29E] hover:text-[#57534E]'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center leading-none ${
                  activeTab === tab.key
                    ? tab.key === 'pending' ? 'bg-[#E05A28] text-white'
                    : tab.key === 'approved' ? 'bg-emerald-500 text-white'
                    : 'bg-[#A8A29E] text-white'
                    : 'bg-[#E4DED8] text-[#A8A29E]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Skeleton loading */}
      {scraping && (
        <div className="space-y-3 mb-8">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Pending tab */}
      {!scraping && activeTab === 'pending' && (pending.length > 0 ? (
        <div className="space-y-3">
          {pending.map((r) => (
            <ReviewCard key={r.id} review={r} onApprove={onApprove} onDismiss={onDismiss} onRestore={onRestore}/>
          ))}
        </div>
      ) : (
        <div className="text-center py-14 bg-white rounded-2xl border border-[#E4DED8]">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <p className="text-[14px] font-semibold text-[#111]">You&apos;re all caught up!</p>
          <p className="text-[12px] text-[#A8A29E] mt-1 max-w-[220px] mx-auto leading-relaxed">New reviews will appear here after your next sync.</p>
        </div>
      ))}

      {/* Approved tab */}
      {!scraping && activeTab === 'approved' && (
        <div>
          {approved.length > 0 ? (
            <>
              {approved.some((r) => r.generated_reply) && (
                <div className="flex justify-end mb-3">
                  <button
                    onClick={handleCopyAll}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-[#666] hover:text-[#111] px-3 py-1.5 rounded-lg border border-[#E4DED8] hover:border-[#D4CFC6] bg-white transition-all"
                  >
                    {copiedAll ? (
                      <><svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Copied all</>
                    ) : (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>Copy all</>
                    )}
                  </button>
                </div>
              )}
              <div className="space-y-3">
                {approved.map((r) => (
                  <ReviewCard key={r.id} review={r} onApprove={onApprove} onDismiss={onDismiss} onRestore={onRestore}/>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-14 bg-white rounded-2xl border border-[#E4DED8]">
              <div className="w-11 h-11 rounded-2xl bg-[#F3F0EC] border border-[#E4DED8] flex items-center justify-center mx-auto mb-4 shadow-sm">
                <svg className="w-5 h-5 text-[#A8A29E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <p className="text-[14px] font-semibold text-[#111]">No approved replies yet</p>
              <p className="text-[12px] text-[#A8A29E] mt-1 max-w-[220px] mx-auto leading-relaxed">Approve a reply to see it here.</p>
            </div>
          )}
        </div>
      )}

      {/* Dismissed tab */}
      {!scraping && activeTab === 'dismissed' && (
        <div>
          {dismissed.length > 0 ? (
            <div className="space-y-3">
              {dismissed.map((r) => (
                <ReviewCard key={r.id} review={r} onApprove={onApprove} onDismiss={onDismiss} onRestore={onRestore} showStatus/>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 bg-white rounded-2xl border border-[#E4DED8]">
              <div className="w-11 h-11 rounded-2xl bg-[#F3F0EC] border border-[#E4DED8] flex items-center justify-center mx-auto mb-4 shadow-sm">
                <svg className="w-5 h-5 text-[#A8A29E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                </svg>
              </div>
              <p className="text-[14px] font-semibold text-[#111]">Nothing dismissed</p>
              <p className="text-[12px] text-[#A8A29E] mt-1 max-w-[220px] mx-auto leading-relaxed">Dismissed reviews will appear here.</p>
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
          .in('reply_status', ['pending', 'approved', 'dismissed'])
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
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, reply_status: 'dismissed' as const } : r))
    await supabase.from('scraped_reviews').update({ reply_status: 'dismissed' }).eq('id', id).eq('user_id', userId)
  }

  const handleRestore = async (id: string) => {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, reply_status: 'pending' as const } : r))
    await supabase.from('scraped_reviews').update({ reply_status: 'pending' }).eq('id', id).eq('user_id', userId)
  }

  return !mapsUrl ? (
    <SetupPanel profile={profile} onSaved={handleSaved}/>
  ) : (
    <ConnectedPanel
      profile={profile}
      reviews={reviews}
      onApprove={handleApprove}
      onDismiss={handleDismiss}
      onRestore={handleRestore}
      onScrapeNow={() => handleScrapeNow()}
      onTestMode={() => handleScrapeNow(true)}
      scraping={scraping}
      scrapeError={scrapeError}
      onDismissError={() => setScrapeError('')}
      lastScrapedAt={lastScrapedAt}
    />
  )
}
