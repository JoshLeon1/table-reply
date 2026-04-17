'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ScrapedReview } from '@/types'
import Button from '@/components/ui/Button'
import KPI from '@/components/ui/KPI'
import Eyebrow from '@/components/ui/Eyebrow'
import Delta from '@/components/ui/Delta'
import Stars from '@/components/ui/Stars'
import PlatformBadge from '@/components/ui/PlatformBadge'
import { Card } from '@/components/ui/Card'
import { ArrowRight, MessageSquare, RefreshCw, CheckCircle2 } from 'lucide-react'

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

// ── Platform logos ────────────────────────────────────────────────────────────
function GoogleLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.09-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function YelpLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF1A1A">
      <path d="M12.27 13.78l-2.14.9c-.58.24-1.22-.18-1.22-.81V8.1c0-.65.67-1.07 1.26-.8l5.72 2.57c.56.25.64 1.01.15 1.38l-3.77 2.53zM9.44 15.94l2.04 1.08c.56.3.59 1.09.05 1.43l-4.88 3.06c-.57.36-1.27-.08-1.22-.76l.43-5.72c.05-.63.72-.97 1.27-.65l2.31 1.56zM14.5 14.7l1.9-1.23c.52-.34 1.19-.02 1.27.6l.7 5.7c.08.65-.58 1.12-1.16.83l-5.17-2.57c-.56-.28-.62-1.06-.1-1.42l2.56-1.91zM13.48 12.02l1.35-2.07c.37-.56 1.14-.58 1.53-.04l3.33 4.54c.4.55.05 1.32-.62 1.38l-5.76.54c-.63.06-1.07-.6-.79-1.17l.96-3.18zM10.24 10.64L8.46 9.1c-.5-.44-.4-1.21.18-1.5L13.82 5c.6-.3 1.28.14 1.24.81l-.33 5.77c-.04.63-.72.99-1.27.68l-3.22-1.62z"/>
    </svg>
  )
}

function TripAdvisorLogo({ size = 22 }: { size?: number }) {
  // Stylized owl-eyes shape (TA's iconic two circles)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="7.5" cy="13" r="4" fill="#34E0A1"/>
      <circle cx="16.5" cy="13" r="4" fill="#34E0A1"/>
      <circle cx="7.5" cy="13" r="2" fill="#fff"/>
      <circle cx="16.5" cy="13" r="2" fill="#fff"/>
      <circle cx="7.5" cy="13" r="1" fill="#111"/>
      <circle cx="16.5" cy="13" r="1" fill="#111"/>
      <path d="M4 10.5C5.5 8 8.5 7 12 7s6.5 1 8 3.5" stroke="#34E0A1" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}


function SectionLabel({ children, badge }: { children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="text-[13px] font-semibold text-[#57534E] whitespace-nowrap flex-shrink-0">{children}</span>
      {badge}
      <div className="flex-1 h-px bg-gradient-to-r from-[#E4DED8] to-transparent" />
    </div>
  )
}

// ── Pending review card ───────────────────────────────────────────────────────
function PendingCard({ review, userId, onAction, animDelay = 0 }: { review: ScrapedReview; userId: string; onAction: (id: string, a: 'approved' | 'dismissed') => void; animDelay?: number }) {
  const supabase = createClient()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [actioning, setActioning] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleApprove = async () => {
    if (!review.generated_reply) return
    setActioning(true)
    try {
      await navigator.clipboard.writeText(review.generated_reply).catch(() => {})
      setCopied(true)
      const { error } = await supabase.from('scraped_reviews').update({ reply_status: 'approved' }).eq('id', review.id).eq('user_id', userId)
      if (!error) {
        window.dispatchEvent(new CustomEvent('reviewsUpdated'))
        router.refresh()
        setTimeout(() => onAction(review.id, 'approved'), 1400)
      }
    } finally { setActioning(false) }
  }

  const handleDismiss = async () => {
    setActioning(true)
    try {
      const { error } = await supabase.from('scraped_reviews').update({ reply_status: 'dismissed' }).eq('id', review.id).eq('user_id', userId)
      if (!error) {
        window.dispatchEvent(new CustomEvent('reviewsUpdated'))
        router.refresh()
        onAction(review.id, 'dismissed')
      }
    } finally { setActioning(false) }
  }

  const initials = review.reviewer_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const isNeg = review.star_rating <= 2
  const isNeu = review.star_rating === 3
  const avatarBg = isNeg ? 'from-red-50 to-rose-50' : isNeu ? 'from-amber-50 to-yellow-50' : 'from-emerald-50 to-teal-50'
  const avatarText = isNeg ? 'text-red-400' : isNeu ? 'text-amber-400' : 'text-emerald-500'

  const noText = !review.review_text?.trim()

  if (noText) {
    return (
      <div className="animate-fade-up flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-[#E4DED8] hover:border-[#D0C9C1] transition-all duration-150 opacity-60 hover:opacity-80" style={{ animationDelay: `${animDelay}ms` }}>
        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarBg} border border-[#E4DED8] flex items-center justify-center text-[10px] font-bold ${avatarText} flex-shrink-0`}>{initials}</div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[12px] font-medium text-[#57534E] truncate max-w-[100px]">{review.reviewer_name}</span>
          <PlatformBadge source={review.source} />
          <Stars rating={review.star_rating} size="sm" />
        </div>
        <span className="text-[11px] text-[#C4BEB8] flex-shrink-0 hidden sm:block">{review.review_datetime_utc ? formatTimeAgo(review.review_datetime_utc) : ''}</span>
        <span className="text-[10px] text-[#C4BEB8] italic flex-1 hidden sm:block">No written review</span>
        <button onClick={handleDismiss} disabled={actioning} className="flex-shrink-0 text-[11px] text-[#C4BEB8] hover:text-[#A8A29E] transition-colors disabled:opacity-40">
          Dismiss
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-up bg-white rounded-xl border border-[#E4DED8] overflow-hidden transition-all duration-200 hover:border-[#D0C9C1] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)]" style={{ animationDelay: `${animDelay}ms` }}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarBg} border border-[#E4DED8] flex items-center justify-center text-[11px] font-bold ${avatarText} flex-shrink-0 mt-0.5`}>{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="text-[13px] font-semibold text-[#111111] truncate leading-none">{review.reviewer_name}</span>
                <PlatformBadge source={review.source} />
                {review.alert_triggered && <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 rounded-md px-1.5 py-0.5 leading-none">⚠ Alert</span>}
              </div>
              <span className="text-[11px] text-[#C4BEB8] flex-shrink-0 tabular-nums leading-none">{review.review_datetime_utc ? formatTimeAgo(review.review_datetime_utc) : ''}</span>
            </div>
            <Stars rating={review.star_rating} size="sm" />
          </div>
        </div>
        <p className="text-[13px] text-[#57534E] leading-relaxed mt-3 pl-10 sm:pl-12 line-clamp-3">{review.review_text || <span className="italic text-[#C4BEB8]">No review text</span>}</p>
      </div>

      {review.generated_reply && (
        <div className="px-4 pb-3 border-t border-[#EDE9E4]">
          <button onClick={() => setExpanded(v => !v)} className="flex items-center gap-1.5 mt-3 text-[12px] font-medium text-[#A8A29E] hover:text-[#E05A28] transition-colors duration-150">
            <svg className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
            {expanded ? 'Hide AI draft' : 'Preview AI draft'}
          </button>
          {expanded && (
            <div className="mt-2.5 bg-[#E05A28]/[0.08] rounded-xl px-4 py-3.5 border border-[#E05A28]/20 animate-fade-up">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-4 h-4 rounded-md bg-[#E05A28]/10 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-[#E05A28]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>
                </div>
                <span className="text-[11px] font-semibold text-[#E05A28]">AI reply</span>
              </div>
              <p className="text-[12px] text-[#57534E] leading-relaxed">{review.generated_reply}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 px-4 pb-4 pt-1">
        <button onClick={handleApprove} disabled={actioning || !review.generated_reply} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[12px] font-semibold disabled:opacity-40 transition-all duration-200 active:scale-[0.97] ${copied ? 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_2px_8px_rgba(52,211,153,0.3)]' : 'bg-[#E05A28] hover:bg-[#C94E21] shadow-[0_2px_8px_rgba(224,90,40,0.2)] hover:shadow-[0_4px_14px_rgba(224,90,40,0.35)]'}`}>
          {copied ? <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Copied!</> : <><svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>Copy &amp; Approve</>}
        </button>
        <button onClick={handleDismiss} disabled={actioning} className="px-3 py-2 rounded-xl text-[12px] font-medium text-[#A8A29E] hover:text-[#57534E] hover:bg-[#F3F0EC] disabled:opacity-40 transition-all duration-150">Dismiss</button>
      </div>
    </div>
  )
}

// ── Setup panel — shown when no platforms connected ───────────────────────────
const LS_MANUAL = 'tr_manual_mode'

function SetupPanel({ ownerName, onEnterManual, onConnected }: { ownerName: string; onEnterManual: () => void; onConnected: () => void }) {
  const [googleUrl, setGoogleUrl] = useState('')
  const [yelpUrl, setYelpUrl] = useState('')
  const [taUrl, setTaUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleConnect = async () => {
    setError('')
    const gTrimmed = googleUrl.trim()
    const yTrimmed = yelpUrl.trim()
    const tTrimmed = taUrl.trim()

    if (!gTrimmed && !yTrimmed && !tTrimmed) {
      setError('Add at least one platform URL to continue.')
      return
    }
    if (gTrimmed && !gTrimmed.includes('google.com/maps') && !gTrimmed.includes('maps.google') && !gTrimmed.includes('goo.gl/maps')) {
      setError("That Google Maps URL doesn't look right. Find your listing on maps.google.com and copy the full URL.")
      return
    }
    if (yTrimmed && !yTrimmed.includes('yelp.com/biz/')) {
      setError("That Yelp URL doesn't look right. It should contain \"yelp.com/biz/\".")
      return
    }
    if (tTrimmed && !tTrimmed.includes('tripadvisor.com')) {
      setError("That TripAdvisor URL doesn't look right. It should be a tripadvisor.com page.")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const updates: Record<string, string> = {}
      if (gTrimmed) updates.google_maps_url = gTrimmed
      if (yTrimmed) updates.yelp_url = yTrimmed
      if (tTrimmed) updates.tripadvisor_url = tTrimmed

      const { error: dbErr } = await supabase
        .from('business_profiles')
        .update(updates)
        .eq('user_id', user.id)

      if (dbErr) throw new Error(dbErr.message)

      // Kick off first sync in background
      fetch('/api/sync-all', { method: 'POST', headers: { 'Content-Type': 'application/json' } }).catch(() => {})

      onConnected()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-up pb-16">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E05A28]/10 border border-[#E05A28]/20 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E05A28] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#E05A28]/80">One-time setup</span>
        </div>
        <h1 className="text-[26px] sm:text-[30px] font-black text-[#111111] tracking-[-0.03em] mb-3">
          Hey {ownerName}, where are your reviews?
        </h1>
        <p className="text-[14px] text-[#57534E]/80 max-w-md mx-auto leading-relaxed">
          Paste your listing URL from any platform below. ReplyFi will pull in your reviews automatically.
        </p>
      </div>

      {/* URL inputs */}
      <div className="max-w-lg mx-auto space-y-3 mb-6">

        {/* Google */}
        <div className="bg-white rounded-2xl border border-[#E4DED8] p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <GoogleLogo size={20} />
            <span className="text-[13px] font-bold text-[#111]">Google Maps</span>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wide ml-auto">Recommended</span>
          </div>
          <input
            type="url"
            value={googleUrl}
            onChange={e => setGoogleUrl(e.target.value)}
            placeholder="https://maps.google.com/maps?cid=..."
            className="w-full h-10 px-3.5 rounded-xl bg-[#F8F6F3] border border-[#E4DED8] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:border-[#E05A28]/50 focus:ring-2 focus:ring-[#E05A28]/10 transition-all"
          />
          <p className="mt-1.5 text-[11px] text-[#A8A29E]">Find your listing on Google Maps, click Share, and copy the link.</p>
        </div>

        {/* Yelp */}
        <div className="bg-white rounded-2xl border border-[#E4DED8] p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <YelpLogo size={20} />
            <span className="text-[13px] font-bold text-[#111]">Yelp</span>
            <span className="text-[10px] font-bold text-[#A8A29E] bg-[#F8F6F3] border border-[#E4DED8] px-2 py-0.5 rounded-full uppercase tracking-wide ml-auto">Optional</span>
          </div>
          <input
            type="url"
            value={yelpUrl}
            onChange={e => setYelpUrl(e.target.value)}
            placeholder="https://www.yelp.com/biz/your-business"
            className="w-full h-10 px-3.5 rounded-xl bg-[#F8F6F3] border border-[#E4DED8] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:border-[#E05A28]/50 focus:ring-2 focus:ring-[#E05A28]/10 transition-all"
          />
        </div>

        {/* TripAdvisor */}
        <div className="bg-white rounded-2xl border border-[#E4DED8] p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <TripAdvisorLogo size={20} />
            <span className="text-[13px] font-bold text-[#111]">TripAdvisor</span>
            <span className="text-[10px] font-bold text-[#A8A29E] bg-[#F8F6F3] border border-[#E4DED8] px-2 py-0.5 rounded-full uppercase tracking-wide ml-auto">Optional</span>
          </div>
          <input
            type="url"
            value={taUrl}
            onChange={e => setTaUrl(e.target.value)}
            placeholder="https://www.tripadvisor.com/Restaurant_Review-..."
            className="w-full h-10 px-3.5 rounded-xl bg-[#F8F6F3] border border-[#E4DED8] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:border-[#E05A28]/50 focus:ring-2 focus:ring-[#E05A28]/10 transition-all"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="max-w-lg mx-auto mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-2.5">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col items-center gap-3">
        <Button
          variant="accent"
          onClick={handleConnect}
          disabled={saving}
          loading={saving}
          className="h-auto px-8 py-3.5 rounded-2xl text-[15px] font-bold gap-2.5 shadow-[0_4px_20px_rgba(224,90,40,0.35)] hover:shadow-[0_6px_28px_rgba(224,90,40,0.50)] active:scale-[0.97]"
        >
          {saving ? (
            'Connecting…'
          ) : (
            <>
              <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
              Connect &amp; Start Syncing
            </>
          )}
        </Button>
        <button
          onClick={onEnterManual}
          className="text-[13px] text-[#A8A29E] hover:text-[#57534E] transition-colors duration-150 underline underline-offset-4 decoration-[#D0C9C1] hover:decoration-[#A8A29E]"
        >
          Skip — I'll add these later
        </button>
      </div>
    </div>
  )
}

// ── Manual nudge banner — shown when in manual mode ───────────────────────────
function ConnectNudge({ onExitManual }: { onExitManual: () => void }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="animate-fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 rounded-xl bg-[#E05A28]/[0.08] border border-[#E05A28]/20">
      <div className="flex items-center gap-3">
        <svg className="w-4 h-4 text-[#E05A28] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        <p className="text-[13px] text-[#57534E]">
          <span className="font-semibold text-[#111111]/80">Auto-sync is off.</span> Connect Google, Yelp, or TripAdvisor to unlock automatic reviews and analytics.
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 pl-7 sm:pl-0">
        <Link href="/dashboard/grow" className="text-[12px] font-bold text-[#E05A28] hover:text-[#C94E21] transition-colors whitespace-nowrap">
          Add platform URLs →
        </Link>
        <button onClick={() => { onExitManual(); setDismissed(true) }} className="text-[11px] text-[#C4BEB8] hover:text-[#A8A29E] transition-colors whitespace-nowrap">
          Keep manual
        </button>
      </div>
    </div>
  )
}

// ── Manual reply generator ────────────────────────────────────────────────────
const MANUAL_PLATFORMS = [
  { value: 'Google', label: 'Google' },
  { value: 'Yelp', label: 'Yelp' },
  { value: 'TripAdvisor', label: 'TripAdvisor' },
]

function ManualGenerator({ prominent = false }: { prominent?: boolean }) {
  const [review, setReview] = useState('')
  const [platform, setPlatform] = useState('Google')
  const [starRating, setStarRating] = useState(5)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(prominent)

  const generate = async () => {
    if (!review.trim()) return
    setLoading(true); setError(''); setReply('')
    try {
      const res = await fetch('/api/generate-reply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewText: review, starRating, platform }) })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setReply(data.reply ?? data.generated_reply ?? '')
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  const handleCopy = async () => {
    if (!reply) return
    await navigator.clipboard.writeText(reply).catch(() => {
      setError('Could not copy to clipboard. Please copy the reply manually.')
    })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!prominent) {
    // Collapsed secondary version shown when platforms are connected
    return (
      <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#A8A29E] hover:text-[#57534E] transition-colors duration-150 mb-4"
        >
          <div className="flex-1 h-px bg-gradient-to-r from-[#E4DED8] to-transparent" />
          <span className="flex items-center gap-1.5 px-3">
            Generate a Reply Manually
            <svg className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
          </span>
          <div className="flex-1 h-px bg-gradient-to-l from-[#E4DED8] to-transparent" />
        </button>

        {open && <GeneratorBody review={review} setReview={setReview} platform={platform} setPlatform={setPlatform} starRating={starRating} setStarRating={setStarRating} reply={reply} loading={loading} error={error} copied={copied} onGenerate={generate} onCopy={handleCopy} prominent={false} />}
      </div>
    )
  }

  // Prominent version shown in manual mode
  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[#E05A28]/15 border border-[#E05A28]/25 flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-[#E05A28]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>
        </div>
        <div>
          <h2 className="text-[15px] font-bold text-[#111111]">Manual Reply Generator</h2>
          <p className="text-[11px] text-[#A8A29E]">Paste any review to get an AI-crafted reply instantly</p>
        </div>
      </div>
      <GeneratorBody review={review} setReview={setReview} platform={platform} setPlatform={setPlatform} starRating={starRating} setStarRating={setStarRating} reply={reply} loading={loading} error={error} copied={copied} onGenerate={generate} onCopy={handleCopy} prominent={true} />
    </div>
  )
}

function GeneratorBody({ review, setReview, platform, setPlatform, starRating, setStarRating, reply, loading, error, copied, onGenerate, onCopy, prominent }: {
  review: string; setReview: (v: string) => void; platform: string; setPlatform: (v: string) => void; starRating: number; setStarRating: (v: number) => void; reply: string; loading: boolean; error: string; copied: boolean; onGenerate: () => void; onCopy: () => void; prominent: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E4DED8] overflow-hidden ${prominent ? 'shadow-[0_2px_20px_rgba(0,0,0,0.06)]' : ''}`}>
      <div className="p-4 space-y-3">
        {/* Platform + star rating selectors */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {MANUAL_PLATFORMS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlatform(p.value)}
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold min-h-[44px] transition-all duration-150 ${
                  platform === p.value
                    ? 'bg-[#E05A28]/20 text-[#E05A28] border border-[#E05A28]/30'
                    : 'text-[#A8A29E] border border-[#E4DED8] hover:text-[#57534E] hover:border-[#D0C9C1]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0">
            {[1,2,3,4,5].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStarRating(s)}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-[16px] leading-none transition-all duration-100 ${s <= starRating ? 'text-amber-400' : 'text-[#E4DED8]'}`}
              >★</button>
            ))}
          </div>
        </div>
        <textarea
          value={review}
          onChange={e => setReview(e.target.value)}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onGenerate() }}
          placeholder={`Paste a ${platform} review to generate a reply…`}
          rows={prominent ? 5 : 3}
          className="w-full resize-none px-3.5 py-3 rounded-xl border border-[#E4DED8] bg-white hover:bg-[#F8F6F3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] text-[13px] text-[#111111] placeholder:text-[#C4BEB8] transition-all duration-200 leading-relaxed"
        />
        <button
          onClick={onGenerate}
          disabled={loading || !review.trim()}
          className="w-full py-2.5 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(224,90,40,0.2)] hover:shadow-[0_4px_14px_rgba(224,90,40,0.3)]"
        >
          {loading ? <><svg className="animate-spin w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Generating…</> : <><svg className="w-3.5 h-3.5 opacity-70" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>Generate Reply</>}
        </button>
      </div>

      {error && <p className="px-4 pb-3 text-[12px] text-red-400 animate-fade-in">{error}</p>}

      {reply && (
        <div className="border-t border-[#EDE9E4] p-4 space-y-3 animate-fade-up">
          <div className="bg-[#E05A28]/[0.08] border border-[#E05A28]/20 rounded-xl px-4 py-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-4 h-4 rounded-md bg-[#E05A28]/10 flex items-center justify-center"><svg className="w-2.5 h-2.5 text-[#E05A28]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg></div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#E05A28]/70">Generated Reply</p>
            </div>
            <p className="text-[12px] text-[#57534E] leading-relaxed">{reply}</p>
          </div>
          <button onClick={onCopy} className={`w-full py-2 rounded-xl text-[12px] font-semibold border transition-all duration-200 active:scale-[0.98] ${copied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-[#F3F0EC] text-[#57534E] border-[#E4DED8] hover:border-[#D0C9C1] hover:text-[#111111]'}`}>
            {copied ? '✓ Copied to clipboard' : 'Copy Reply'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── HeroRow — 30-day rating KPI + volume KPI ─────────────────────────────────
function HeroRow({ reviews }: { reviews: ScrapedReview[] }) {
  const now = Date.now()
  const THIRTY_D = 30 * 24 * 60 * 60 * 1000
  const recent = reviews.filter(r => now - new Date(r.review_datetime_utc).getTime() < THIRTY_D)
  const previous = reviews.filter(r => {
    const age = now - new Date(r.review_datetime_utc).getTime()
    return age >= THIRTY_D && age < THIRTY_D * 2
  })

  const avg = (arr: ScrapedReview[]) =>
    arr.length ? arr.reduce((s, r) => s + (r.star_rating ?? 0), 0) / arr.length : 0

  const recentAvg = avg(recent)
  const prevAvg = avg(previous)
  const ratingDelta = Number((recentAvg - prevAvg).toFixed(1))
  const volumeDelta = recent.length - previous.length

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card variant="hero" padding="lg" className="md:col-span-2">
        <KPI
          variant="hero"
          label="RATING — LAST 30 DAYS"
          value={recentAvg ? recentAvg.toFixed(1) : '—'}
          trailing={recent.length > 0 && previous.length > 0 ? <Delta value={ratingDelta} unit="" /> : undefined}
          sub={recent.length > 0 ? (
            <span className="inline-flex items-center gap-2">
              <Stars rating={recentAvg} size="sm" />
              <span>from {recent.length} review{recent.length === 1 ? '' : 's'}</span>
            </span>
          ) : 'No reviews in the last 30 days'}
        />
      </Card>

      <Card variant="standard" padding="lg">
        <KPI
          variant="secondary"
          label="REVIEW VOLUME"
          value={recent.length}
          trailing={previous.length > 0 ? <Delta value={volumeDelta} unit="" /> : undefined}
          sub={`vs ${previous.length} previous 30d`}
        />
      </Card>
    </div>
  )
}

// ── ActionStrip — 3 quick-action flat cards ───────────────────────────────────
function ActionStrip({ pendingCount, repliesSentCount, lastSyncAt }: {
  pendingCount: number
  repliesSentCount: number
  lastSyncAt: string | null
}) {
  const lastSyncLabel = lastSyncAt ? formatTimeAgo(lastSyncAt) : 'never'

  const actions = [
    { href: '/dashboard/reviews?tab=pending', icon: <MessageSquare size={16} strokeWidth={1.5} />, label: 'PENDING REPLIES', value: pendingCount },
    { href: '/dashboard/reviews?tab=approved', icon: <CheckCircle2 size={16} strokeWidth={1.5} />, label: 'REPLIES SENT',    value: repliesSentCount },
    { href: '/settings?tab=integrations',      icon: <RefreshCw size={16} strokeWidth={1.5} />,    label: 'LAST SYNC',      value: lastSyncLabel },
  ]

  return (
    <div className="flex gap-3 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none pb-2 sm:pb-0">
      {actions.map((a) => (
        <Link key={a.label} href={a.href} className="group flex-1 min-w-[240px] sm:min-w-0 snap-start">
          <Card variant="flat" padding="md" className="h-full hover:bg-white transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#57534E] flex-shrink-0">
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <Eyebrow>{a.label}</Eyebrow>
                <div className="text-[18px] font-semibold text-[#111] tnum leading-tight mt-0.5 truncate">
                  {a.value}
                </div>
              </div>
              <ArrowRight size={16} strokeWidth={1.5} className="text-[#A8A29E] group-hover:text-[#111] transition-colors flex-shrink-0" />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}

// ── RecentReviewsList — dense list of 5 most recent reviews ──────────────────
function RecentReviewsList({ reviews }: { reviews: ScrapedReview[] }) {
  const recent = reviews.slice(0, 5)
  if (recent.length === 0) return null

  return (
    <Card variant="standard" padding="none">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#EDE9E4]">
        <Eyebrow>RECENT REVIEWS</Eyebrow>
        <Link href="/dashboard/reviews" className="text-[12px] font-medium text-[#57534E] hover:text-[#111] inline-flex items-center gap-1">
          See all <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </div>
      <ul className="divide-y divide-[#EDE9E4]">
        {recent.map((r) => (
          <li key={r.id} className="px-5 sm:px-6 py-3.5">
            <div className="flex items-start sm:items-center gap-3 flex-col sm:flex-row">
              <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                <div className="w-8 h-8 rounded-full bg-[#F0EDE8] text-[#57534E] flex items-center justify-center text-[12px] font-semibold flex-shrink-0">
                  {(r.reviewer_name ?? 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[#111] truncate">{r.reviewer_name ?? 'Anonymous'}</span>
                    <Stars rating={r.star_rating ?? 0} size="sm" />
                  </div>
                  <p className="text-[13px] text-[#57534E] truncate mt-0.5">{r.review_text}</p>
                </div>
              </div>
              <span className="text-[11px] text-[#A8A29E] tnum self-end sm:self-auto flex-shrink-0">
                {formatTimeAgo(r.review_datetime_utc)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  ownerName: string
  restaurantName: string
  lastScrapedAt: string | null
  userId: string
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
  const hasAnyPlatform = !!(googleMapsUrl || yelpUrl || tripadvisorUrl)

  const [manualMode, setManualMode] = useState(false)
  const [modeHydrated, setModeHydrated] = useState(false)
  const [pendingList, setPendingList] = useState<ScrapedReview[]>(initialPendingReviews)
  const [displayLastSynced, setDisplayLastSynced] = useState<string | null>(lastScrapedAt)

  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    try {
      if (localStorage.getItem(LS_MANUAL) === 'true') setManualMode(true)
    } catch { /* ignore */ }
    setModeHydrated(true)
  }, [])

  const enterManual = () => {
    setManualMode(true)
    try { localStorage.setItem(LS_MANUAL, 'true') } catch { /* ignore */ }
  }

  const exitManual = () => {
    setManualMode(false)
    try { localStorage.removeItem(LS_MANUAL) } catch { /* ignore */ }
  }

  const handlePendingAction = (id: string) => setPendingList(prev => prev.filter(r => r.id !== id))

  const handleSync = async () => {
    setSyncing(true); setSyncMsg(null)
    try {
      const res = await fetch('/api/sync-all', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')

      // Surface platform-level errors even when HTTP 200
      if (data.errors?.length > 0) {
        if (!data.newReviews) {
          // All platforms failed — strip the platform prefix for a cleaner message
          const msg = (data.errors[0] as string).replace(/^(Google Maps|Yelp|TripAdvisor): /, '')
          throw new Error(msg)
        }
        // Partial success — some platforms failed
        setSyncMsg({ type: 'error', text: `${data.newReviews} new synced — some platforms failed` })
        router.refresh()
        return
      }

      const n: number = data.newReviews ?? 0
      const now = new Date().toISOString()
      setDisplayLastSynced(now)
      setSyncMsg({ type: 'success', text: n > 0 ? `${n} new review${n > 1 ? 's' : ''} synced` : 'Already up to date' })
      router.refresh()
    } catch (err) {
      setSyncMsg({ type: 'error', text: err instanceof Error ? err.message : 'Sync failed' })
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(null), 6000)
    }
  }

  // ── State A / B: No platform connected ─────────────────────────────────────
  // We know this from server props — don't wait for localStorage hydration.
  // manualMode only flips to true after hydration; until then default to panel.
  if (!hasAnyPlatform) {
    if (modeHydrated && manualMode) {
      // State B — chose to skip and use manual mode
      return (
        <div className="space-y-6 pb-16">
          <ConnectNudge onExitManual={exitManual} />
          <ManualGenerator prominent />
        </div>
      )
    }
    // State A — default: show setup panel (also shown during pre-hydration)
    return (
      <div className="pb-16">
        <SetupPanel ownerName={ownerName} onEnterManual={enterManual} onConnected={() => router.refresh()} />
      </div>
    )
  }

  // ── State C: Has at least one platform — full dashboard ──────────────────────
  const allReviews = [...pendingList, ...recentApproved]

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">

      {/* First-sync nudge — shown only when platforms connected but never synced */}
      {hasAnyPlatform && !lastScrapedAt && (
        <div className="animate-fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 rounded-xl bg-[#E05A28]/[0.08] border border-[#E05A28]/20">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-[#E05A28] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            <div>
              <p className="text-[13px] text-[#57534E]">
                <span className="font-semibold text-[#111111]/80">
                  {[googleMapsUrl && 'Google Maps', yelpUrl && 'Yelp', tripadvisorUrl && 'TripAdvisor'].filter(Boolean).join(', ')}
                </span>
                {' '}connected — run your first sync to pull in reviews.
              </p>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-[12px] font-bold text-[#E05A28] hover:text-[#C94E21] transition-colors whitespace-nowrap pl-7 sm:pl-0 disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : 'Sync now →'}
          </button>
        </div>
      )}

      {/* ── New hero layout ────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold text-[#111] tracking-[-0.01em]">
            Welcome back{ownerName ? `, ${ownerName}` : ''}
          </h1>
          <p className="text-[13px] text-[#57534E] mt-1">Here&apos;s how your reputation is trending.</p>
        </div>

        <HeroRow reviews={allReviews} />
        <ActionStrip
          pendingCount={pendingList.length}
          repliesSentCount={recentApproved.length}
          lastSyncAt={displayLastSynced}
        />
        <RecentReviewsList reviews={allReviews} />
      </div>

      {/* ── Sync status message ────────────────────────────────────────────── */}
      {syncMsg && (
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 rounded-xl bg-white border border-[#E4DED8]">
          <span className={`text-[12px] font-semibold ${syncMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
            {syncMsg.type === 'success' ? '✓ ' : '✕ '}{syncMsg.text}
          </span>
          <button onClick={handleSync} disabled={syncing} className="group flex items-center gap-1.5 text-[12px] font-medium text-[#A8A29E] hover:text-[#57534E] disabled:opacity-40 transition-colors duration-150">
            <svg className={`w-3 h-3 transition-transform duration-700 ${syncing ? 'animate-spin' : 'group-hover:rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            {syncing ? 'Syncing…' : 'Sync reviews'}
          </button>
        </div>
      )}

      {/* ── Reviews + Activity ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pending reviews */}
        <div className="lg:col-span-3">
          <SectionLabel badge={pendingList.length > 0 ? <span className="relative inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-[#E05A28] text-white text-[10px] font-bold shadow-[0_0_10px_rgba(224,90,40,0.35)]"><span className="absolute inset-0 rounded-full bg-[#E05A28] animate-ping opacity-40"/><span className="relative">{pendingList.length}</span></span> : undefined}>
            Pending replies
          </SectionLabel>
          {pendingList.length === 0 ? (
            <div className="flex items-center gap-4 px-5 py-5 bg-emerald-50 border border-emerald-200 rounded-2xl animate-fade-up">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-emerald-700">All caught up</p>
                <p className="text-[12px] text-emerald-600/60 mt-0.5">New reviews appear here after each sync.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingList.map((review, i) => <PendingCard key={review.id} review={review} userId={userId} onAction={handlePendingAction} animDelay={i * 60} />)}
              {pendingList.length > 3 && (
                <Link href="/dashboard/reviews" className="inline-flex items-center gap-1.5 text-[13px] text-[#E05A28] font-semibold hover:text-[#C94E21] transition-colors pt-1 group">
                  View all {pendingList.length} pending
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2">
          <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
            <SectionLabel>Recent activity</SectionLabel>
            <div className="bg-white rounded-xl border border-[#E4DED8] overflow-hidden">
              {recentApproved.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-10 h-10 rounded-2xl bg-[#F3F0EC] border border-[#E4DED8] flex items-center justify-center mb-3"><svg className="text-[#C4BEB8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></div>
                  <p className="text-[12px] font-medium text-[#A8A29E]">No approved replies yet</p>
                  <p className="text-[11px] text-[#C4BEB8] mt-0.5">Approved reviews will show here</p>
                </div>
              ) : (
                <div className="divide-y divide-[#EDE9E4]">
                  {recentApproved.map(review => (
                    <div key={review.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F6F3] transition-colors duration-150">
                      <div className="w-8 h-8 rounded-full bg-[#F3F0EC] border border-[#E4DED8] flex items-center justify-center text-[11px] font-bold text-[#A8A29E] flex-shrink-0">{review.reviewer_name.charAt(0).toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[12px] font-semibold text-[#111111]/80 truncate">{review.reviewer_name}</span>
                          <PlatformBadge source={review.source} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-400 text-[10px]">{'★'.repeat(review.star_rating)}</span>
                          <span className="text-[10px] text-[#C4BEB8]">{formatTimeAgo(review.review_datetime_utc ?? review.created_at)}</span>
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Manual generator (secondary, collapsed by default) ────────────── */}
      <ManualGenerator prominent={false} />

      {/* ── At a glance ────────────────────────────────────────────────────── */}
      <div className="animate-fade-up" style={{ animationDelay: '220ms' }}>
        <SectionLabel>At a glance</SectionLabel>
        {!hasAnalytics ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-6 py-5 bg-white rounded-2xl border border-[#E4DED8]">
            <div>
              <p className="text-[14px] font-semibold text-[#111111]">Get insights from your reviews</p>
              <p className="text-[13px] text-[#57534E] mt-1 leading-snug">Discover what customers love, what needs work, and your top growth opportunity.</p>
            </div>
            <Link href="/dashboard/analytics" className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white text-[13px] font-semibold transition-all duration-150 active:scale-[0.97] shadow-[0_2px_8px_rgba(224,90,40,0.2)] w-full sm:w-auto">
              Run analysis <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {([
              { label: 'Customers love', value: themes?.praised?.[0], fallback: 'Run analytics to see what resonates most.', dotColor: 'bg-emerald-400', tint: 'bg-white', border: 'border-[#E4DED8]' },
              { label: 'Needs attention', value: themes?.complaints?.[0], fallback: 'No recurring complaints — great sign.', dotColor: 'bg-[#E05A28]', tint: 'bg-white', border: 'border-[#E4DED8]' },
              { label: 'Top opportunity', value: themes?.opportunities?.[0], fallback: 'Run analytics to find your growth lever.', dotColor: 'bg-blue-400', tint: 'bg-white', border: 'border-[#E4DED8]' },
            ] as const).map(({ label, value, fallback, dotColor, tint, border }) => (
              <div key={label} className={`${tint} rounded-xl px-5 py-5 border ${border} hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#A8A29E]">{label}</p>
                </div>
                <p className={`text-[13px] leading-snug ${value ? 'font-semibold text-[#111]' : 'text-[#C4BEB8] italic'}`}>{value ?? fallback}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
