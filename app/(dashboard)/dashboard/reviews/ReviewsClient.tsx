'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { BusinessProfile, ScrapedReview } from '@/types'
import Stars from '@/components/ui/Stars'
import PlatformBadge from '@/components/ui/PlatformBadge'
import { Card } from '@/components/ui/Card'
import KPI from '@/components/ui/KPI'
import PageHeader from '@/components/ui/PageHeader'
import Tabs from '@/components/ui/Tabs'

interface Props {
  profile: BusinessProfile
  initialReviews: ScrapedReview[]
  userId: string
}

// ── Avatar color helpers ──────────────────────────────────────────────────────

function getAvatarColor(_name: string): string {
  return 'bg-[#F3F0EC]'
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function formatDate(utcStr: string) {
  if (!utcStr) return ''
  try {
    return new Date(utcStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return utcStr }
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// ── Scraping progress indicator ───────────────────────────────────────────────

const SCRAPE_MESSAGES = [
  'Scanning your reviews…',
  'Reading what customers said…',
  'Crafting personalized replies…',
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
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#F3EEE4] border border-[#EDE6DC] text-[#111111] mb-5">
      <svg className="animate-spin w-4 h-4 text-[#A8A29E] flex-shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <p className="text-[13px] font-medium transition-all duration-500">{SCRAPE_MESSAGES[msgIdx]}</p>
    </div>
  )
}

// ── Setup panel ───────────────────────────────────────────────────────────────

function SetupPanel({ profile, onSaved }: { profile: BusinessProfile; onSaved: (url: string) => void }) {
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
      .from('business_profiles')
      .update({ google_maps_url: trimmed })
      .eq('id', profile.id)
      .eq('user_id', profile.user_id)

    if (dbErr) setError('Failed to save. Please try again.')
    else onSaved(trimmed)
    setSaving(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
      <div className="w-12 h-12 rounded-xl bg-[#F3F0EC] border border-[#EDE6DC] flex items-center justify-center mb-6">
        <svg className="w-6 h-6 text-[#A8A29E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      </div>
      <h1 className="text-[22px] text-[#111111] leading-[1.15] mb-2" style={{ fontWeight: 600, letterSpacing: '-0.022em' }}>Put Your Review Replies on Autopilot</h1>
      <p className="text-[13px] text-[#57534E]/80 max-w-[280px] sm:max-w-sm mb-8 leading-relaxed">
        Connect Google Maps or Yelp and ReplyFi will sync new reviews every morning, generate personalized replies, and queue them for your approval.
      </p>
      <div className="w-full sm:max-w-lg text-left space-y-3">
        <label className="block text-[13px] font-medium text-[#111111]">Google Maps URL</label>
        <input
          type="url"
          placeholder="https://www.google.com/maps/place/your-business…"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="w-full px-3.5 py-3.5 rounded-xl border border-[#EDE6DC] text-[15px] text-[#111111] placeholder:text-[#C4BEB8] bg-white focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:bg-white focus:border-[#E05A28] transition-all"
        />
        <p className="text-[11px] text-[#A8A29E] mt-1.5">e.g. maps.google.com/maps/place/your-business...</p>
        {error && <p className="text-[12px] text-[#B84A1A]">{error}</p>}

        {/* Helper bullets */}
        <div className="space-y-1.5 pt-1">
          <p className="flex items-center gap-2 text-[12px] text-[#57534E]"><svg className="w-3.5 h-3.5 text-[#A8A29E] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Go to Google Maps</p>
          <p className="flex items-center gap-2 text-[12px] text-[#57534E]"><svg className="w-3.5 h-3.5 text-[#A8A29E] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg> Search for your business</p>
          <p className="flex items-center gap-2 text-[12px] text-[#57534E]"><svg className="w-3.5 h-3.5 text-[#A8A29E] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg> Copy the URL from address bar</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !url.trim()}
          className="w-full min-h-[52px] rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] active:scale-[0.98] text-white text-[15px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {saving ? 'Saving…' : 'Connect Google Maps'}
        </button>
        <p className="text-[12px] text-[#A8A29E] text-center pt-1">
          Also connect{' '}
          <a href="/settings" className="text-[#57534E] hover:text-[#E05A28] underline underline-offset-2 transition-colors">Yelp in Settings →</a>
        </p>
      </div>
      <details className="mt-8 text-left w-full sm:max-w-lg group">
        <summary className="text-[12px] text-[#A8A29E] cursor-pointer hover:text-[#57534E] select-none list-none flex items-center gap-1.5 transition-colors">
          <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
          How do I find my Google Maps URL?
        </summary>
        <div className="mt-3 p-4 rounded-xl bg-[#F3EEE4] border border-[#EDE6DC] text-[12px] text-[#57534E] leading-relaxed space-y-1">
          <p>1. Go to <strong>Google Maps</strong> and search for your business.</p>
          <p>2. Click your listing to open the info panel.</p>
          <p>3. Copy the URL from your browser address bar.</p>
          <p className="text-[#A8A29E] mt-1">URL starts with <code className="font-mono bg-[#F3F0EC] text-[#E05A28] px-1 py-0.5 rounded">google.com/maps/place/</code></p>
        </div>
      </details>
    </div>
  )
}

// ── Review card ───────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-[#EDE6DC] animate-pulse">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#EDE9E4]">
        <div className="w-8 h-8 rounded-full bg-[#F3F0EC] flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-28 bg-[#F3F0EC] rounded-full" />
          <div className="h-2.5 w-20 bg-[#F3F0EC] rounded-full" />
        </div>
      </div>
      <div className="px-5 py-4 border-b border-[#EDE9E4] space-y-2">
        <div className="h-3 w-full bg-[#F3F0EC] rounded-full" />
        <div className="h-3 w-[85%] bg-[#F3F0EC] rounded-full" />
      </div>
      <div className="px-5 py-4 space-y-2">
        <div className="h-3 w-full bg-[#F3F0EC] rounded-full" />
        <div className="h-3 w-[70%] bg-[#F3F0EC] rounded-full" />
      </div>
      <div className="flex gap-2 px-5 py-3.5 border-t border-[#EDE9E4]">
        <div className="h-9 w-32 bg-[#F3F0EC] rounded-xl" />
        <div className="h-9 w-20 bg-[#F3F0EC] rounded-xl" />
      </div>
    </div>
  )
}

const REVIEW_TRUNCATE_LENGTH = 200

// ── Platform deep-link builder ────────────────────────────────────────────────
// Returns the most direct URL for the owner to find and respond to this review.
function buildPlatformDeepLink(
  source: string | null | undefined,
  reviewId: string,
  profileUrls: { google?: string | null; yelp?: string | null } | undefined
): string | null {
  if (source === 'yelp') {
    // Yelp's ?hrid= param scrolls directly to the specific review
    if (!profileUrls?.yelp) return null
    const rawId = reviewId.startsWith('yelp-') ? reviewId.slice(5) : reviewId
    const base = profileUrls.yelp.split('?')[0]
    return `${base}?hrid=${encodeURIComponent(rawId)}`
  }
  // Google: link to Google Business Profile review inbox — this is where owners
  // actually respond, not the public Maps listing.
  return 'https://business.google.com/reviews'
}

function ReviewCard({ review: initialReview, onApprove, onDismiss, onRestore, profileUrls, isCopied }: {
  review: ScrapedReview
  onApprove: (id: string) => Promise<void>
  onDismiss: (id: string) => void
  onRestore?: (id: string) => void
  profileUrls?: { google?: string | null; yelp?: string | null }
  isCopied?: boolean
}) {
  const supabase = createClient()
  const [review, setReview] = useState(initialReview)
  const [copied, setCopied] = useState(false)
  const [actioning, setActioning] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editedReply, setEditedReply] = useState(initialReview.generated_reply ?? '')
  const [savingEdit, setSavingEdit] = useState(false)
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
          platform: review.source === 'yelp' ? 'Yelp' : 'Google',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      const reply: string = data.reply
      const { error: updateError } = await supabase
        .from('scraped_reviews')
        .update({ generated_reply: reply })
        .eq('id', review.id)
        .eq('user_id', review.user_id)
      if (updateError) {
        setGenError('Failed to save reply. Please try again.')
        return
      }
      setReview(prev => ({ ...prev, generated_reply: reply }))
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Failed to generate')
    } finally {
      setGenerating(false)
    }
  }

  const handleApprove = async () => {
    if (!review.generated_reply) return
    // Open the platform deep-link synchronously (inside the user-initiated click)
    // so popup blockers don't kill it. Fire-and-forget.
    if (platformUrl) {
      try { window.open(platformUrl, '_blank', 'noopener,noreferrer') } catch { /* noop */ }
      // For platforms without per-review deep-links (Google), show
      // a toast so the user knows which review to scroll for in the new tab.
      if (review.source !== 'yelp') {
        window.dispatchEvent(new CustomEvent('replyfi:post-reminder', {
          detail: {
            platformLabel,
            reviewerName: review.reviewer_name ?? 'this reviewer',
            starRating: review.star_rating ?? null,
            reviewDate: review.review_datetime_utc ?? null,
          },
        }))
      }
    }
    setActioning(true)
    await onApprove(review.id)
    setActioning(false)
  }

  const handleCopyReply = async () => {
    await navigator.clipboard.writeText(review.generated_reply ?? '').catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSaveEdit = async () => {
    setSavingEdit(true)
    const { error: saveErr } = await supabase
      .from('scraped_reviews')
      .update({ generated_reply: editedReply })
      .eq('id', review.id)
      .eq('user_id', review.user_id)
    if (saveErr) {
      setGenError('Failed to save edit. Please try again.')
    } else {
      setReview(prev => ({ ...prev, generated_reply: editedReply }))
      setEditing(false)
    }
    setSavingEdit(false)
  }

  const platformLabel = review.source === 'yelp' ? 'Yelp' : 'Google'
  const platformUrl = buildPlatformDeepLink(review.source, review.review_id, profileUrls)
  const platformHint = review.source === 'yelp'
    ? 'Opens this review on Yelp'
    : 'Opens your Google Business Profile inbox'

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

  // Status chip — shown on card header right side (eyebrow-chip style)
  const statusChip = (() => {
    if (status === 'pending' && review.generated_reply) {
      return (
        <span className="inline-flex items-center rounded-md border border-[#C9E4D3] bg-[#E8F5EE] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#0B8A5B] tnum flex-shrink-0">
          DRAFT READY
        </span>
      )
    }
    if (status === 'pending' && !review.generated_reply) {
      return (
        <span className="inline-flex items-center rounded-md border border-[#F5C9AD] bg-[#FEF0E8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#C94E21] tnum flex-shrink-0">
          NEEDS REPLY
        </span>
      )
    }
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center rounded-md border border-[#C9E4D3] bg-[#E8F5EE] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#0B8A5B] tnum flex-shrink-0">
          APPROVED
        </span>
      )
    }
    if (status === 'dismissed') {
      return (
        <span className="inline-flex items-center rounded-md border border-[#EDE6DC] bg-[#F0EDE8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#6B6862] tnum flex-shrink-0">
          DISMISSED
        </span>
      )
    }
    return null
  })()

  const displayText = isLong && !expanded
    ? review.review_text.slice(0, REVIEW_TRUNCATE_LENGTH) + '…'
    : review.review_text

  // ── Compact row for rating-only (no text) reviews ──────────────────────────
  if (noText) {
    return (
      <div className="flex items-center gap-3 opacity-60 hover:opacity-80 transition-opacity duration-150">
        <div className={`w-7 h-7 rounded-full ${getAvatarColor(review.reviewer_name)} border border-[#EDE6DC] flex items-center justify-center text-[10px] font-medium text-[#57534E] flex-shrink-0`}>
          {getInitials(review.reviewer_name)}
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[12px] font-medium text-[#57534E] truncate max-w-[120px]">{review.reviewer_name}</span>
          <PlatformBadge source={review.source} />
          <Stars rating={review.star_rating} size="sm" />
        </div>
        <span className="text-[11px] text-[#C4BEB8] flex-shrink-0 hidden sm:block">{formatDate(review.review_datetime_utc)}</span>
        <span className="text-[10px] text-[#C4BEB8] italic flex-1 hidden sm:block">No written review</span>
        {statusChip && <div className="flex-shrink-0">{statusChip}</div>}
        {(status === 'pending' || status === 'dismissed') && (
          <button
            onClick={status === 'dismissed' ? handleRestore : handleDismiss}
            disabled={actioning}
            className="flex-shrink-0 text-[11px] text-[#C4BEB8] hover:text-[#A8A29E] transition-colors disabled:opacity-40"
          >
            {status === 'dismissed' ? 'Restore' : 'Dismiss'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#EDE9E4]">
        <div className="flex items-center gap-3 min-w-0">
          {/* Initials avatar */}
          <div className={`w-9 h-9 rounded-full ${getAvatarColor(review.reviewer_name)} border border-[#EDE6DC] flex items-center justify-center text-[12px] font-medium text-[#57534E] flex-shrink-0`}>
            {getInitials(review.reviewer_name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-medium text-[#111111]">{review.reviewer_name}</span>
              <PlatformBadge source={review.source} />
              {review.star_rating >= 4 ? (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F3F0EC] text-[#57534E] border border-[#EDE6DC]">Positive</span>
              ) : review.star_rating <= 2 ? (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FEF0E8] text-[#B84A1A] border border-[#FCDCCA]">Critical</span>
              ) : null}
              {review.alert_triggered && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FEF0E8] text-[#B84A1A] border border-[#FCDCCA] flex items-center gap-1">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                  Alert
                </span>
              )}
              {review.autopilot_action?.startsWith('escalated') && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F3EEE4] text-[#57534E] border border-[#EDE6DC] flex items-center gap-1">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  Escalated by Autopilot
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Stars rating={review.star_rating} size="sm" />
              <span className="text-[11px] text-[#A8A29E]">{formatDate(review.review_datetime_utc)}</span>
              {review.language && review.language !== 'English' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F3F0EC] text-[#57534E] border border-[#EDE6DC]">{review.language}</span>
              )}
            </div>
          </div>
        </div>
        {/* Status chip on right */}
        {statusChip}
      </div>

      <div className="divide-y divide-[#EDE9E4]">
        {/* Review text */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4">
          <>
            <p className="text-[13px] text-[#57534E] leading-relaxed">&ldquo;{displayText}&rdquo;</p>
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[12px] text-[#57534E] hover:text-[#111] font-medium mt-1.5 transition-colors"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </>
        </div>

        {/* Reply section */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4">
            {review.generated_reply ? (
              /* AI reply card */
              <div className="rounded-xl bg-[#F3EEE4] border border-[#EDE6DC] px-4 py-3.5">
                <div className="flex items-center justify-end gap-2 mb-2">
                  {status === 'pending' && !editing && (
                    <button
                      onClick={() => { setEditedReply(review.generated_reply ?? ''); setEditing(true) }}
                      className="flex items-center gap-1 text-[11px] font-medium text-[#A8A29E] hover:text-[#E05A28] transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit
                    </button>
                  )}
                </div>
                {editing ? (
                  <div className="space-y-2.5">
                    <textarea
                      value={editedReply}
                      onChange={(e) => setEditedReply(e.target.value)}
                      rows={5}
                      autoFocus
                      className="w-full text-[13px] text-[#57534E] leading-relaxed bg-[#FEFCF8] border border-[#EDE6DC] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] resize-none transition-all"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={savingEdit || !editedReply.trim()}
                        className="px-3.5 py-1.5 rounded-lg bg-[#111] hover:bg-[#2A2A2A] text-white text-[12px] font-medium disabled:opacity-40 transition-all"
                      >
                        {savingEdit ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#A8A29E] hover:text-[#57534E] hover:bg-[#F3F0EC] transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-[#57534E] leading-relaxed">{review.generated_reply}</p>
                )}
              </div>
            ) : (
              <div>
                {generating ? (
                  <div className="flex items-center gap-2.5 text-[13px] text-[#57534E] py-1">
                    <svg className="animate-spin w-3.5 h-3.5 text-[#E05A28] flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    <span>Writing reply…</span>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={handleGenerateReply}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F0EC] hover:bg-[#EDE9E4] border border-[#EDE6DC] text-[#57534E] text-[12px] font-medium transition-all duration-150 active:scale-[0.98]"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      Generate Reply
                    </button>
                    {genError && <p className="text-[12px] text-[#B84A1A] mt-2">{genError}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3.5 border-t border-[#EDE9E4]">
        {status === 'approved' ? (
          <>
            {/* Copy reply */}
            <button
              onClick={handleCopyReply}
              disabled={!review.generated_reply}
              className="flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-xl bg-[#111] hover:bg-[#2A2A2A] active:scale-[0.97] text-white text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              {copied ? (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Copied!</>
              ) : (
                <><svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>Copy Reply</>
              )}
            </button>
            {/* Platform deep link */}
            {platformUrl && (
              <a
                href={platformUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={platformHint}
                className="flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-xl border border-[#EDE6DC] hover:bg-[#F3EEE4] hover:bg-[#F3EEE4] text-[#57534E] hover:text-[#111111] text-[13px] font-medium active:scale-[0.97] transition-all duration-150 group"
              >
                <svg className="w-3.5 h-3.5 opacity-50 group-hover:opacity-80 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                Respond on {platformLabel}
              </a>
            )}
            <button
              onClick={handleRestore}
              disabled={actioning}
              className="px-3.5 min-h-[44px] rounded-xl text-[13px] font-medium text-[#A8A29E] hover:text-[#57534E] hover:bg-[#F3F0EC] active:scale-[0.97] disabled:opacity-40 transition-all duration-150"
            >
              Undo Approval
            </button>
          </>
        ) : status === 'dismissed' ? (
          <button
            onClick={handleRestore}
            disabled={actioning}
            className="flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-xl bg-[#F3F0EC] border border-[#EDE6DC] hover:border-[#D0C9C1] text-[#57534E] hover:text-[#111111] text-[13px] font-medium active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
          >
            Restore
          </button>
        ) : (
          <>
            <button
              onClick={handleApprove}
              disabled={actioning || !review.generated_reply || editing}
              className={`flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-xl text-white text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 ${isCopied ? 'bg-[#0B8A5B] hover:bg-[#077A51]' : 'bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] active:scale-[0.97]'}`}
            >
              {isCopied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                  Copy &amp; Approve
                </>
              )}
            </button>
            <button
              onClick={handleGenerateReply}
              disabled={generating || actioning}
              className="px-3.5 min-h-[44px] rounded-xl text-[13px] font-medium text-[#A8A29E] hover:text-[#57534E] hover:bg-[#F3F0EC] border border-[#EDE6DC] active:scale-[0.97] disabled:opacity-40 transition-all duration-150"
            >
              Regenerate
            </button>
            <button
              onClick={handleDismiss}
              disabled={actioning}
              className="px-3.5 min-h-[44px] rounded-xl text-[13px] font-medium text-[#A8A29E] hover:text-[#57534E] hover:bg-[#F3F0EC] active:scale-[0.97] disabled:opacity-40 transition-all duration-150"
            >
              Dismiss
            </button>
          </>
        )}
      </div>
      {status !== 'approved' && status !== 'dismissed' && review.generated_reply && (
        <p className="text-[11px] text-[#C4BEB8] text-center mt-1 pb-3">
          {platformUrl
            ? `Copies reply and opens ${platformLabel} in a new tab — just paste and post`
            : 'Copies reply to clipboard — then paste it on the platform'}
        </p>
      )}
    </div>
  )
}

// ── Connected panel ───────────────────────────────────────────────────────────

type ReviewTab = 'pending' | 'approved' | 'autopilot_queue' | 'dismissed'

// ── Autopilot Queue row ────────────────────────────────────────────────────────

function AutopilotQueueRow({ review, onPosted }: { review: ScrapedReview; onPosted: (id: string) => void }) {
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(!!review.autopilot_posted_at)

  const handlePostToGoogle = async () => {
    setPosting(true)
    try {
      await navigator.clipboard.writeText(review.generated_reply ?? '').catch(() => {})
      // Mark posted via API
      await fetch(`/api/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autopilot_posted_at: new Date().toISOString() }),
      }).catch(() => {})
      setPosted(true)
      onPosted(review.id)
      window.open('https://business.google.com/reviews', '_blank')
    } finally {
      setPosting(false)
    }
  }

  const initials = review.reviewer_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="px-4 sm:px-5 py-4">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#F3F0EC] border border-[#EDE6DC] flex items-center justify-center text-[11px] font-medium text-[#57534E] flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-medium text-[#111111]">{review.reviewer_name}</span>
            <PlatformBadge source={review.source} />
            <Stars rating={review.star_rating} size="sm" />
          </div>
          <span className="text-[11px] text-[#A8A29E]">{formatDate(review.review_datetime_utc)}</span>
        </div>
        <span className="inline-flex items-center rounded-md border border-[#C9E4D3] bg-[#E8F5EE] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#0B8A5B] flex-shrink-0">
          AUTOPILOT
        </span>
      </div>

      {/* Review text */}
      {review.review_text?.trim() && (
        <p className="text-[12px] text-[#57534E] leading-relaxed mb-3 line-clamp-2">&ldquo;{review.review_text}&rdquo;</p>
      )}

      {/* Generated reply preview */}
      {review.generated_reply && (
        <div className="rounded-xl bg-[#F3EEE4] border border-[#EDE6DC] px-4 py-3 mb-3">
          <p className="text-[11px] font-semibold text-[#A8A29E] uppercase tracking-[0.09em] mb-1.5">Your reply</p>
          <p className="text-[12px] text-[#57534E] leading-relaxed line-clamp-3">{review.generated_reply}</p>
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePostToGoogle}
          disabled={posting || posted}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all min-h-[44px] ${
            posted
              ? 'bg-[#E8F5EE] text-[#0B8A5B] border border-[#C9E4D3]'
              : 'bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white disabled:opacity-40'
          }`}
        >
          {posted ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
              </svg>
              Posted
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              Post to Google
            </>
          )}
        </button>
        {!posted && (
          <p className="text-[11px] text-[#C4BEB8]">Copies reply · opens Google Business Profile</p>
        )}
      </div>
    </div>
  )
}

function ConnectedPanel({ profile, reviews, onApprove, onDismiss, onRestore, onScrapeNow, scraping, scrapeError, onDismissError, lastScrapedAt, copiedId }: {
  profile: BusinessProfile
  reviews: ScrapedReview[]
  onApprove: (id: string) => Promise<void>
  onDismiss: (id: string) => void
  onRestore: (id: string) => void
  onScrapeNow: () => void
  scraping: boolean
  scrapeError: string
  onDismissError: () => void
  lastScrapedAt: string | null
  copiedId: string | null
}) {
  const pending   = reviews
    .filter((r) => r.reply_status === 'pending')
    .sort((a, b) => (b.alert_triggered ? 1 : 0) - (a.alert_triggered ? 1 : 0))
  const approved  = reviews.filter((r) => r.reply_status === 'approved')
  // Autopilot queue: approved by autopilot and not yet posted
  const autopilotQueue = reviews.filter(
    (r) => r.reply_status === 'approved' && r.autopilot_action === 'auto_approved'
  )
  const dismissed = reviews.filter((r) => r.reply_status === 'dismissed')
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter')
  const [postedIds, setPostedIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<ReviewTab>(
    filterParam === 'autopilot' && autopilotQueue.length > 0 ? 'autopilot_queue' : 'pending'
  )
  const [readyBannerDismissed, setReadyBannerDismissed] = useState(false)
  const [filterStars, setFilterStars] = useState<number | null>(null)

  const totalWithText  = reviews.filter((r) => r.review_text?.trim()).length
  const approvedCount  = approved.length
  const responseRate   = totalWithText > 0 ? Math.round((approvedCount / totalWithText) * 100) : 0

  const tabs: { key: ReviewTab; label: string; count: number }[] = [
    { key: 'pending',  label: 'Pending',  count: pending.length  },
    { key: 'autopilot_queue', label: 'Autopilot Queue', count: autopilotQueue.filter(r => !postedIds.has(r.id) && !r.autopilot_posted_at).length },
    { key: 'approved', label: 'Approved', count: approved.length  },
    { key: 'dismissed', label: 'Dismissed', count: dismissed.length },
  ].filter(t => t.key !== 'autopilot_queue' || autopilotQueue.length > 0) as { key: ReviewTab; label: string; count: number }[]

  return (
    <div>
      {/* Scrape error banner */}
      {scrapeError && (
        <div role="alert" className="mb-5 flex items-start justify-between gap-3 px-4 py-3 rounded-xl bg-[#FEF0E8] border border-[#FCDCCA] text-[13px] text-[#B84A1A]">
          <p>{scrapeError}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={onScrapeNow} className="font-semibold underline hover:no-underline">Try again</button>
            <button onClick={onDismissError} aria-label="Dismiss" className="text-[#B84A1A] hover:text-[#57534E]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Stat cards */}
      {reviews.length > 0 && (() => {
        const negCount = reviews.filter(r => r.star_rating <= 2).length
        const avgRat = reviews.filter(r => r.star_rating).length > 0
          ? (reviews.reduce((s, r) => s + (r.star_rating || 0), 0) / reviews.filter(r => r.star_rating).length).toFixed(1)
          : '—'
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'TOTAL REVIEWS', value: reviews.length },
              { label: 'NEGATIVE REVIEWS', value: negCount },
              { label: 'AVG RATING', value: `${avgRat} / 5` },
              { label: 'PENDING', value: pending.length },
            ].map(({ label, value }) => (
              <Card key={label} variant="flat" padding="md">
                <KPI variant="secondary" label={label} value={value} />
              </Card>
            ))}
          </div>
        )
      })()}

      <PageHeader
        title="Reviews"
        description={profile.business_name + (lastScrapedAt ? ` · Synced ${formatDate(lastScrapedAt)}` : '')}
        action={
          <button onClick={onScrapeNow} disabled={scraping}
            className="group flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F3F0EC] border border-[#EDE6DC] hover:border-[#D0C9C1] text-[13px] font-medium text-[#57534E] hover:text-[#111111] disabled:opacity-40 transition-all min-h-[36px]">
            <svg className={`w-3.5 h-3.5 transition-transform duration-500 ${scraping ? 'animate-spin' : 'group-hover:rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {scraping ? 'Syncing…' : 'Sync Now'}
          </button>
        }
      />

      {/* Response rate stat */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-[#FEFCF8] border border-[#EDE6DC] mb-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-medium text-[#A8A29E]">Response rate</p>
              <span className={`text-[13px] font-medium tabular-nums tnum ${responseRate >= 80 ? 'text-[#0B8A5B]' : responseRate >= 50 ? 'text-[#111111]' : 'text-[#B84A1A]'}`}>
                {approvedCount} / {totalWithText} &nbsp;·&nbsp; {responseRate}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#EDE9E4] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${responseRate >= 80 ? 'bg-[#0B8A5B]' : responseRate >= 50 ? 'bg-[#111]' : 'bg-[#B84A1A]'}`}
                style={{ width: `${Math.min(responseRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Pending banner */}
      {pending.length > 0 && !scraping && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#FEFCF8] border border-[#EDE6DC]">
          <span className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full bg-[#F3F0EC] border border-[#EDE6DC] text-[10px] text-[#57534E] tabular-nums flex-shrink-0">
            {pending.length}
          </span>
          <p className="text-[13px] text-[#57534E]">
            <span className="font-medium text-[#111]">{pending.length} {pending.length === 1 ? 'review' : 'reviews'}</span>
            {' '}waiting — review the reply, edit if needed, then approve.
          </p>
        </div>
      )}

      <div className="mb-5">
        <Tabs
          tabs={tabs.map(t => ({ key: t.key, label: t.label, count: t.count }))}
          active={activeTab}
          onChange={(key) => { setActiveTab(key as ReviewTab); setFilterStars(null) }}
        />
      </div>

      {/* Star filter */}
      {!scraping && (
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          {([null, 5, 4, 3, 2, 1] as (number | null)[]).map((star) => (
            <button
              key={star ?? 'all'}
              onClick={() => setFilterStars(star)}
              className={`px-3 py-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[12px] font-medium border transition-colors ${
                filterStars === star
                  ? 'bg-[#111] text-white border-[#111]'
                  : 'bg-white text-[#57534E] border-[#E4DED8] hover:border-[#D0C9C1] hover:text-[#111111]'
              }`}
            >
              {star === null ? 'All' : `${star}★`}
            </button>
          ))}
        </div>
      )}

      {/* Skeleton loading */}
      {scraping && (
        <div className="space-y-3 mb-8">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Pending tab */}
      {!scraping && activeTab === 'pending' && (() => {
        const filtered = filterStars !== null ? pending.filter((r) => r.star_rating === filterStars) : pending
        if (filtered.length > 0) {
          return (
            <Card variant="standard" padding="none">
              <ul className="divide-y divide-[#EDE9E4]">
                {filtered.map((r, i) => (
                  <li key={r.id} className={i < 5 ? `animate-fade-up stagger-${i + 1}` : ''}>
                    <ReviewCard review={r} onApprove={onApprove} onDismiss={onDismiss} onRestore={onRestore} profileUrls={{ google: profile.google_maps_url, yelp: profile.yelp_url }} isCopied={copiedId === r.id}/>
                  </li>
                ))}
              </ul>
            </Card>
          )
        }
        // Filter is active and matched 0 → show filter empty state with clear button
        if (filterStars !== null && pending.length > 0) {
          return (
            <div className="text-center py-14 bg-[#FEFCF8] rounded-xl border border-[#EDE6DC]">
              <div className="w-11 h-11 rounded-xl bg-[#F3F0EC] border border-[#EDE6DC] flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-[#A8A29E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
              </div>
              <p className="text-[14px] font-medium text-[#111111]">No {filterStars}-star reviews pending</p>
              <button
                onClick={() => setFilterStars(null)}
                className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#57534E] hover:text-[#111] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Clear filter
              </button>
            </div>
          )
        }
        // No filter and nothing pending → caught-up state
        return (
          <div className="text-center py-14 bg-[#FEFCF8] rounded-xl border border-[#EDE6DC]">
            <div className="w-11 h-11 rounded-xl bg-[#FEFCF8] border border-[#EDE6DC] flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-[#A8A29E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <p className="text-[14px] font-medium text-[#111111]">You&apos;re all caught up!</p>
            <p className="text-[12px] text-[#A8A29E] mt-1 max-w-[220px] mx-auto leading-relaxed">New reviews will appear here after your next sync.</p>
          </div>
        )
      })()}

      {/* Autopilot Queue tab */}
      {!scraping && activeTab === 'autopilot_queue' && (
        <div>
          {autopilotQueue.length > 0 ? (
            <>
              <div className="flex items-start gap-3 px-4 py-3.5 mb-4 rounded-xl bg-[#F3EEE4] border border-[#EDE6DC]">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#E05A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <p className="text-[13px] text-[#57534E] leading-snug flex-1">
                  <span className="font-medium text-[#111]">Auto-approved overnight.</span>{' '}
                  Click &ldquo;Post to Google&rdquo; to copy the reply and open your Google Business Profile.
                </p>
              </div>
              <Card variant="standard" padding="none">
                <ul className="divide-y divide-[#EDE9E4]">
                  {autopilotQueue.map((r) => (
                    <li key={r.id}>
                      <AutopilotQueueRow
                        review={r}
                        onPosted={(id) => setPostedIds((prev) => new Set([...prev, id]))}
                      />
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          ) : (
            <div className="text-center py-14 bg-[#FEFCF8] rounded-xl border border-[#EDE6DC]">
              <div className="w-11 h-11 rounded-xl bg-[#F3F0EC] border border-[#EDE6DC] flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-[#A8A29E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <p className="text-[14px] font-medium text-[#111111]">No autopilot replies queued</p>
              <p className="text-[12px] text-[#A8A29E] mt-1 max-w-[240px] mx-auto leading-relaxed">
                Enable Autopilot in{' '}
                <a href="/settings?tab=autopilot" className="text-[#E05A28] hover:underline">Settings</a>
                {' '}with &ldquo;Auto-approve&rdquo; mode to populate this queue.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Approved tab */}
      {!scraping && activeTab === 'approved' && (
        <div>
          {approved.length > 0 ? (
            <>
              {/* Instruction banner */}
              {!readyBannerDismissed && (
                <div className="flex items-start gap-3 px-4 py-3.5 mb-4 rounded-xl bg-[#FEFCF8] border border-[#EDE6DC]">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#A8A29E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p className="text-[13px] text-[#57534E] leading-snug flex-1">
                    <span className="font-medium text-[#111]">Ready to post.</span>{' '}
                    Copy each reply and paste it directly on the review platform.
                  </p>
                  <button
                    onClick={() => setReadyBannerDismissed(true)}
                    className="text-[#A8A29E] hover:text-[#57534E] transition-colors ml-auto flex-shrink-0"
                    aria-label="Dismiss"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              )}
              {(() => {
                const filtered = filterStars !== null ? approved.filter((r) => r.star_rating === filterStars) : approved
                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-14 bg-[#FEFCF8] rounded-xl border border-[#EDE6DC]">
                      <div className="w-11 h-11 rounded-xl bg-[#F3F0EC] border border-[#EDE6DC] flex items-center justify-center mx-auto mb-4">
                        <svg className="w-5 h-5 text-[#A8A29E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                        </svg>
                      </div>
                      <p className="text-[14px] font-medium text-[#111111]">No {filterStars}-star approved replies</p>
                      <button
                        onClick={() => setFilterStars(null)}
                        className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#57534E] hover:text-[#111] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                        Clear filter
                      </button>
                    </div>
                  )
                }
                return (
                  <Card variant="standard" padding="none">
                    <ul className="divide-y divide-[#EDE9E4]">
                      {filtered.map((r) => (
                        <li key={r.id}>
                          <ReviewCard review={r} onApprove={onApprove} onDismiss={onDismiss} onRestore={onRestore} profileUrls={{ google: profile.google_maps_url, yelp: profile.yelp_url }}/>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )
              })()}
            </>
          ) : (
            <div className="text-center py-14 bg-[#FEFCF8] rounded-xl border border-[#EDE6DC]">
              <div className="w-11 h-11 rounded-xl bg-[#F3F0EC] border border-[#EDE6DC] flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-[#C4BEB8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <p className="text-[14px] font-medium text-[#111111]">No approved replies yet</p>
              <p className="text-[12px] text-[#A8A29E] mt-1 max-w-[220px] mx-auto leading-relaxed">Approve a reply to see it here.</p>
            </div>
          )}
        </div>
      )}

      {/* Dismissed tab */}
      {!scraping && activeTab === 'dismissed' && (() => {
        const filtered = filterStars !== null ? dismissed.filter((r) => r.star_rating === filterStars) : dismissed
        if (filtered.length > 0) {
          return (
            <Card variant="standard" padding="none">
              <ul className="divide-y divide-[#EDE9E4]">
                {filtered.map((r) => (
                  <li key={r.id}>
                    <ReviewCard review={r} onApprove={onApprove} onDismiss={onDismiss} onRestore={onRestore} profileUrls={{ google: profile.google_maps_url, yelp: profile.yelp_url }}/>
                  </li>
                ))}
              </ul>
            </Card>
          )
        }
        if (filterStars !== null && dismissed.length > 0) {
          return (
            <div className="text-center py-14 bg-[#FEFCF8] rounded-xl border border-[#EDE6DC]">
              <div className="w-11 h-11 rounded-xl bg-[#F3F0EC] border border-[#EDE6DC] flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-[#A8A29E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
              </div>
              <p className="text-[14px] font-medium text-[#111111]">No {filterStars}-star dismissed reviews</p>
              <button
                onClick={() => setFilterStars(null)}
                className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#57534E] hover:text-[#111] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Clear filter
              </button>
            </div>
          )
        }
        return (
          <div className="text-center py-14 bg-[#FEFCF8] rounded-xl border border-[#EDE6DC]">
            <div className="w-11 h-11 rounded-xl bg-[#F3F0EC] border border-[#EDE6DC] flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-[#C4BEB8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
              </svg>
            </div>
            <p className="text-[14px] font-medium text-[#111111]">Nothing dismissed</p>
            <p className="text-[12px] text-[#A8A29E] mt-1 max-w-[220px] mx-auto leading-relaxed">Dismissed reviews will appear here.</p>
          </div>
        )
      })()}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ReviewsClient({ profile, initialReviews, userId }: Props) {
  const [mapsUrl, setMapsUrl]       = useState(profile.google_maps_url ?? '')
  const [reviews, setReviews]       = useState<ScrapedReview[]>(initialReviews)
  const [scraping, setScraping]     = useState(false)
  const [scrapeError, setScrapeError] = useState('')
  const [copiedId, setCopiedId]     = useState<string | null>(null)
  // Use the most recent sync time across all connected platforms
  const mostRecentSync = [profile.last_scraped_at, profile.yelp_last_scraped_at]
    .filter(Boolean).sort().pop() ?? null
  const [lastScrapedAt, setLastScrapedAt] = useState(mostRecentSync)
  const supabase = createClient()

  // Notification permission is requested lazily on first sync, not on mount

  const handleSaved = (url: string) => { setMapsUrl(url); handleScrapeNow() }

  const handleScrapeNow = async () => {
    setScraping(true)
    setScrapeError('')
    try {
      const res = await fetch('/api/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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
        window.dispatchEvent(new CustomEvent('reviewsUpdated'))
        // Fire browser notification if new reviews found
        const newCount = data?.newReviews ?? 0
        if (newCount > 0 && 'Notification' in window) {
          // Ask permission lazily — only when there's actually something to notify about
          if (Notification.permission === 'default') {
            Notification.requestPermission().then((perm) => {
              if (perm === 'granted') {
                new Notification(`${newCount} new review${newCount !== 1 ? 's' : ''} synced`, {
                  body: `${newCount} new review${newCount !== 1 ? 's' : ''} for ${profile.business_name} — replies are ready`,
                  icon: '/favicon.svg',
                })
              }
            })
          } else if (Notification.permission === 'granted') {
            new Notification(`${newCount} new review${newCount !== 1 ? 's' : ''} synced`, {
              body: `${newCount} new review${newCount !== 1 ? 's' : ''} for ${profile.business_name} — replies are ready`,
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
    // Copy reply to clipboard and flash a brief "Copied!" indicator
    const review = reviews.find((r) => r.id === id)
    if (review?.generated_reply) {
      navigator.clipboard.writeText(review.generated_reply).catch(() => {})
      setCopiedId(id)
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000)
    }
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, reply_status: 'approved' as const } : r))
    const { error } = await supabase.from('scraped_reviews').update({ reply_status: 'approved' }).eq('id', id).eq('user_id', userId)
    if (error) {
      // Revert optimistic update on failure
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, reply_status: 'pending' as const } : r))
    }
    window.dispatchEvent(new CustomEvent('reviewsUpdated'))
  }

  const handleDismiss = async (id: string) => {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, reply_status: 'dismissed' as const } : r))
    const { error } = await supabase.from('scraped_reviews').update({ reply_status: 'dismissed' }).eq('id', id).eq('user_id', userId)
    if (error) {
      // Revert optimistic update on failure
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, reply_status: 'pending' as const } : r))
      setScrapeError('Failed to dismiss review. Please try again.')
    } else {
      window.dispatchEvent(new CustomEvent('reviewsUpdated'))
    }
  }

  const handleRestore = async (id: string) => {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, reply_status: 'pending' as const } : r))
    const { error } = await supabase.from('scraped_reviews').update({ reply_status: 'pending' }).eq('id', id).eq('user_id', userId)
    if (error) {
      // Revert optimistic update on failure
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, reply_status: 'dismissed' as const } : r))
      setScrapeError('Failed to restore review. Please try again.')
    } else {
      window.dispatchEvent(new CustomEvent('reviewsUpdated'))
    }
  }

  const hasAnyPlatform = !!(mapsUrl || profile.yelp_url)

  return (
    <>
      {!hasAnyPlatform ? (
        <SetupPanel profile={profile} onSaved={handleSaved}/>
      ) : (
        <ConnectedPanel
          profile={profile}
          reviews={reviews}
          onApprove={handleApprove}
          onDismiss={handleDismiss}
          onRestore={handleRestore}
          onScrapeNow={() => handleScrapeNow()}
          scraping={scraping}
          scrapeError={scrapeError}
          onDismissError={() => setScrapeError('')}
          lastScrapedAt={lastScrapedAt}
          copiedId={copiedId}
        />
      )}
      <PostReminderToast />
    </>
  )
}

// ── Post-reminder toast ───────────────────────────────────────────────────────
// Shown after "Copy & Approve" on platforms without per-review deep links
// (Google). Helps users know which review to scroll for in the
// platform tab that just opened.
function PostReminderToast() {
  const [state, setState] = useState<null | {
    platformLabel: string
    reviewerName: string
    starRating: number | null
    reviewDate: string | null
    id: number
  }>(null)

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        platformLabel: string
        reviewerName: string
        starRating: number | null
        reviewDate: string | null
      }
      setState({ ...detail, id: Date.now() })
      if (hideTimer) clearTimeout(hideTimer)
      hideTimer = setTimeout(() => setState(null), 7000)
    }
    window.addEventListener('replyfi:post-reminder', handler)
    return () => {
      window.removeEventListener('replyfi:post-reminder', handler)
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [])

  if (!state) return null

  const stars = state.starRating
    ? '★'.repeat(Math.round(state.starRating)) + '☆'.repeat(5 - Math.round(state.starRating))
    : null

  return (
    <div
      key={state.id}
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-32px)] sm:w-[360px] sm:max-w-md animate-slide-up"
    >
      <div className="bg-[#111111] text-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-white/[0.08] p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#E05A28]/15 border border-[#E05A28]/30 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-[#E05A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-[13px] font-semibold text-white mb-0.5">Reply copied to clipboard</p>
          <p className="text-[12px] text-white/70 leading-relaxed">
            Find review from <span className="text-white font-medium">{state.reviewerName}</span>
            {stars && <> (<span className="text-amber-400">{stars}</span>
              {state.reviewDate && <span className="text-white/40"> · {formatDate(state.reviewDate)}</span>})</>}
            {' '}in {state.platformLabel} and paste.
          </p>
        </div>
        <button
          onClick={() => setState(null)}
          aria-label="Dismiss"
          className="flex-shrink-0 w-6 h-6 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
