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

function SectionLabel({ children, badge }: { children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="text-[13px] font-medium text-[#57534E] whitespace-nowrap flex-shrink-0">{children}</span>
      {badge}
      <div className="flex-1 h-px bg-gradient-to-r from-[#E4DED8] to-transparent" />
    </div>
  )
}


// ── Setup panel — shown when no platforms connected ───────────────────────────
const LS_MANUAL = 'tr_manual_mode'

function SetupPanel({ ownerName, onEnterManual, onConnected }: { ownerName: string; onEnterManual: () => void; onConnected: () => void }) {
  const [googleUrl, setGoogleUrl] = useState('')
  const [yelpUrl, setYelpUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleConnect = async () => {
    setError('')
    const gTrimmed = googleUrl.trim()
    const yTrimmed = yelpUrl.trim()

    if (!gTrimmed && !yTrimmed) {
      setError('Add at least one platform URL to continue.')
      return
    }
    if (gTrimmed && !gTrimmed.includes('google.com/maps') && !gTrimmed.includes('maps.google') && !gTrimmed.includes('goo.gl/maps')) {
      setError("That Google Maps URL doesn't look right. Find your listing on maps.google.com and copy the full URL.")
      return
    }
    if (yTrimmed && !/yelp\.(com|to)/i.test(yTrimmed)) {
      setError("That Yelp URL doesn't look right. It should be a yelp.com link.")
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
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F3F0EC] border border-[#EDE6DC] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A8A29E]" />
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#A8A29E]">One-time setup</span>
        </div>
        <h1 className="text-[26px] sm:text-[30px] text-[#111111] tracking-[-0.025em] mb-3" style={{ fontWeight: 500 }}>
          Hey {ownerName}, where are your reviews?
        </h1>
        <p className="text-[14px] text-[#57534E]/80 max-w-md mx-auto leading-relaxed">
          Paste your listing URL from any platform below. ReplyFi will pull in your reviews automatically.
        </p>
      </div>

      {/* URL inputs */}
      <div className="max-w-lg mx-auto space-y-3 mb-6">

        {/* Google */}
        <div className="bg-[#FEFCF8] rounded-xl border border-[#EDE6DC] p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <GoogleLogo size={20} />
            <span className="text-[13px] font-medium text-[#111]">Google Maps</span>
            <span className="text-[10px] font-medium text-[#57534E] bg-[#F3F0EC] border border-[#EDE6DC] px-2 py-0.5 rounded-full uppercase tracking-wide ml-auto">Recommended</span>
          </div>
          <input
            type="url"
            value={googleUrl}
            onChange={e => setGoogleUrl(e.target.value)}
            placeholder="https://maps.google.com/maps?cid=..."
            className="w-full h-10 px-3.5 rounded-xl bg-[#F8F6F3] border border-[#EDE6DC] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:border-[#E05A28]/50 focus:ring-2 focus:ring-[#E05A28]/10 transition-all"
          />
          <p className="mt-1.5 text-[11px] text-[#A8A29E]">Find your listing on Google Maps, click Share, and copy the link.</p>
        </div>

        {/* Yelp */}
        <div className="bg-[#FEFCF8] rounded-xl border border-[#EDE6DC] p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <YelpLogo size={20} />
            <span className="text-[13px] font-medium text-[#111]">Yelp</span>
            <span className="text-[10px] font-medium text-[#A8A29E] bg-[#F8F6F3] border border-[#EDE6DC] px-2 py-0.5 rounded-full uppercase tracking-wide ml-auto">Optional</span>
          </div>
          <input
            type="url"
            value={yelpUrl}
            onChange={e => setYelpUrl(e.target.value)}
            placeholder="https://www.yelp.com/biz/your-business"
            className="w-full h-10 px-3.5 rounded-xl bg-[#F8F6F3] border border-[#EDE6DC] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:border-[#E05A28]/50 focus:ring-2 focus:ring-[#E05A28]/10 transition-all"
          />
        </div>

      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="max-w-lg mx-auto mb-4 rounded-xl bg-[#FEF0E8] border border-[#FCDCCA] px-4 py-3 flex items-start gap-2.5">
          <svg className="w-4 h-4 text-[#B84A1A] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p className="text-[13px] text-[#B84A1A]">{error}</p>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col items-center gap-3">
        <Button
          variant="accent"
          onClick={handleConnect}
          disabled={saving}
          loading={saving}
          className="h-auto px-8 py-3.5 rounded-xl text-[15px] gap-2.5 active:scale-[0.97]"
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
    <div className="animate-fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 rounded-xl bg-[#FEFCF8] border border-[#EDE6DC]">
      <div className="flex items-center gap-3">
        <svg className="w-4 h-4 text-[#57534E] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        <p className="text-[13px] text-[#57534E]">
          <span className="font-medium text-[#111111]">Auto-sync is off.</span> Connect Google or Yelp to unlock automatic reviews and analytics.
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 pl-7 sm:pl-0">
        <Link href="/dashboard/grow" className="text-[12px] font-medium text-[#111] hover:text-[#57534E] transition-colors whitespace-nowrap">
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
          className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#A8A29E] hover:text-[#57534E] transition-colors duration-150 mb-4"
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
        <div className="w-7 h-7 rounded-lg bg-[#F3F0EC] border border-[#EDE6DC] flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-[#57534E]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>
        </div>
        <div>
          <h2 className="text-[15px] text-[#111111]" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>Manual Reply Generator</h2>
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
    <div className={`bg-[#FEFCF8] rounded-xl border border-[#EDE6DC] overflow-hidden ${prominent ? 'shadow-card' : ''}`}>
      <div className="p-4 space-y-3">
        {/* Platform + star rating selectors */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {MANUAL_PLATFORMS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlatform(p.value)}
                className={`px-3 py-2.5 rounded-lg text-xs font-medium min-h-[44px] transition-all duration-150 ${
                  platform === p.value
                    ? 'bg-[#F3F0EC] text-[#111] border border-[#D0C9C1]'
                    : 'text-[#A8A29E] border border-[#EDE6DC] hover:text-[#57534E] hover:border-[#D0C9C1]'
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
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-[16px] leading-none transition-all duration-100 ${s <= starRating ? 'text-[#E0A82E]' : 'text-[#E4DED8]'}`}
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
          className="w-full resize-none px-3.5 py-3 rounded-xl border border-[#EDE6DC] hover:bg-[#F3EEE4] focus:bg-[#FEFCF8] focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] text-[13px] text-[#111111] placeholder:text-[#C4BEB8] transition-all duration-200 leading-relaxed"
        />
        <button
          onClick={onGenerate}
          disabled={loading || !review.trim()}
          className="w-full py-2.5 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? <><svg className="animate-spin w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Generating…</> : <><svg className="w-3.5 h-3.5 opacity-70" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>Generate Reply</>}
        </button>
      </div>

      {error && <p className="px-4 pb-3 text-[12px] text-[#B84A1A] animate-fade-in">{error}</p>}

      {reply && (
        <div className="border-t border-[#EDE9E4] p-4 space-y-3 animate-fade-up">
          <div className="rounded-xl px-4 py-3.5 bg-[#FAF7F2]">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-4 h-4 rounded-md bg-[#F3F0EC] flex items-center justify-center"><svg className="w-2.5 h-2.5 text-[#57534E]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg></div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#A8A29E]">Generated Reply</p>
            </div>
            <p className="text-[12px] text-[#57534E] leading-relaxed">{reply}</p>
          </div>
          <button onClick={onCopy} className={`w-full py-2 rounded-xl text-[12px] font-medium border transition-all duration-200 active:scale-[0.98] ${copied ? 'bg-[#E8F5EE] text-[#0B8A5B] border-[#C9E4D3]' : 'bg-[#F3F0EC] text-[#57534E] border-[#EDE6DC] hover:bg-[#F3EEE4] hover:text-[#111111]'}`}>
            {copied ? 'Copied to clipboard' : 'Copy Reply'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── HeroRow — 30-day rating KPI + volume KPI ─────────────────────────────────
function HeroRow({
  recentCount,
  recentAvg,
  previousCount,
  previousAvg,
}: {
  recentCount: number
  recentAvg: number
  previousCount: number
  previousAvg: number
}) {
  const ratingDelta = Number((recentAvg - previousAvg).toFixed(1))
  const volumeDelta = recentCount - previousCount
  const recent = { length: recentCount }
  const previous = { length: previousCount }

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
// The third card is a sync trigger, not a link. Clicking it runs the scrape
// in-place and shows a spinning refresh icon + "Syncing…" label while the
// request is inflight — no navigation to Settings.
function ActionStrip({ pendingCount, repliesSentCount, lastSyncAt, googleLastSync, yelpLastSync, hasGoogle, hasYelp, syncing, onSync }: {
  pendingCount: number
  repliesSentCount: number
  lastSyncAt: string | null
  googleLastSync: string | null
  yelpLastSync: string | null
  hasGoogle: boolean
  hasYelp: boolean
  syncing: boolean
  onSync: () => void
}) {
  const lastSyncLabel = lastSyncAt ? formatTimeAgo(lastSyncAt) : 'never'
  // Per-platform breakdown shown when user has connected both platforms so they
  // can see at a glance whether one is stale. Otherwise just show the single
  // aggregate "Last sync" line.
  const perPlatformLabel = (() => {
    if (!(hasGoogle && hasYelp)) return null
    const g = googleLastSync ? formatTimeAgo(googleLastSync) : 'never'
    const y = yelpLastSync ? formatTimeAgo(yelpLastSync) : 'never'
    return `Google ${g} · Yelp ${y}`
  })()

  const linkCards = [
    { href: '/dashboard/reviews?tab=pending',  icon: <MessageSquare size={16} strokeWidth={1.5} />, label: 'PENDING REPLIES', value: pendingCount },
    { href: '/dashboard/reviews?tab=approved', icon: <CheckCircle2 size={16} strokeWidth={1.5} />,  label: 'REPLIES SENT',    value: repliesSentCount },
  ]

  return (
    <div className="flex gap-3 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none pb-2 sm:pb-0">
      {linkCards.map((a) => (
        <Link key={a.label} href={a.href} className="group flex-1 min-w-[200px] sm:min-w-0 snap-start">
          <Card variant="flat" padding="md" className="h-full hover:bg-[#F3EEE4] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#57534E] flex-shrink-0">
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <Eyebrow>{a.label}</Eyebrow>
                <div className="text-[18px] font-medium text-[#111] tnum leading-tight mt-0.5 truncate tabular-nums">
                  {a.value}
                </div>
              </div>
              <ArrowRight size={16} strokeWidth={1.5} className="text-[#A8A29E] group-hover:text-[#111] transition-colors flex-shrink-0" />
            </div>
          </Card>
        </Link>
      ))}

      {/* Sync Now — button, not link. Animates while in-flight. */}
      <button
        type="button"
        onClick={onSync}
        disabled={syncing}
        aria-busy={syncing}
        className="group flex-1 min-w-[200px] sm:min-w-0 snap-start text-left disabled:cursor-wait"
      >
        <Card variant="flat" padding="md" className={`h-full transition-colors ${syncing ? 'bg-[#F3EEE4]' : 'hover:bg-[#F3EEE4]'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#57534E] flex-shrink-0">
              <RefreshCw size={16} strokeWidth={1.5} className={syncing ? 'animate-spin' : ''} />
            </div>
            <div className="flex-1 min-w-0">
              <Eyebrow>{syncing ? 'SYNCING…' : 'SYNC NOW'}</Eyebrow>
              <div className="text-[13px] font-medium text-[#57534E] leading-tight mt-0.5 truncate">
                {syncing ? 'Pulling new reviews' : (perPlatformLabel ?? `Last sync: ${lastSyncLabel}`)}
              </div>
            </div>
            <ArrowRight size={16} strokeWidth={1.5} className="text-[#A8A29E] group-hover:text-[#111] transition-colors flex-shrink-0" />
          </div>
        </Card>
      </button>
    </div>
  )
}

// ── RecentReviewsList — rich list of recent reviews with status ───────────────
function RecentReviewsList({ reviews }: { reviews: ScrapedReview[] }) {
  if (reviews.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] text-[#111]" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>Recent reviews</h2>
        <Link href="/dashboard/reviews" className="inline-flex items-center gap-1 text-[12px] font-medium text-[#57534E] hover:text-[#111] transition-colors">
          View all
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </Link>
      </div>
      <div className="bg-[#FEFCF8] border border-[#EDE6DC] rounded-xl divide-y divide-[#EDE6DC] overflow-hidden">
        {reviews.map((r) => {
          const isPending = r.reply_status === 'pending'
          const isApproved = r.reply_status === 'approved'
          const initial = (r.reviewer_name ?? 'A').charAt(0).toUpperCase()
          return (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#F9F6F1] transition-colors duration-150">
              <div className="w-8 h-8 rounded-full bg-[#F0EDE8] text-[#57534E] flex items-center justify-center text-[12px] font-medium flex-shrink-0 leading-none">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-medium text-[#111] truncate leading-none">{r.reviewer_name ?? 'Anonymous'}</span>
                  <PlatformBadge source={r.source} />
                  <Stars rating={r.star_rating ?? 0} size="sm" />
                </div>
                <p className="text-[12px] text-[#57534E] truncate leading-snug">
                  {r.review_text?.trim() || <span className="italic text-[#C4BEB8]">No written review</span>}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
                <span className="text-[11px] text-[#A8A29E] tabular-nums whitespace-nowrap">
                  {r.review_datetime_utc ? formatTimeAgo(r.review_datetime_utc) : ''}
                </span>
                {isPending && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#C47A1A] bg-[#FEF8EE] border border-[#F8E0B0] rounded-full px-1.5 py-0.5 leading-none whitespace-nowrap">
                    <span className="w-1 h-1 rounded-full bg-[#C47A1A]" />
                    Pending
                  </span>
                )}
                {isApproved && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#0B7A52] bg-[#EDFAF3] border border-[#B8E8D2] rounded-full px-1.5 py-0.5 leading-none whitespace-nowrap">
                    <span className="w-1 h-1 rounded-full bg-[#0B7A52]" />
                    Replied
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {reviews.some(r => r.reply_status === 'pending') && (
        <div className="mt-3 text-center">
          <Link
            href="/dashboard/reviews?tab=pending"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#E05A28] hover:text-[#C94E21] transition-colors"
          >
            Review &amp; approve pending replies
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>
      )}
    </section>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  ownerName: string
  restaurantName: string
  lastScrapedAt: string | null
  yelpLastScrapedAt: string | null
  userId: string
  googleMapsUrl: string | null
  yelpUrl: string | null
  hasGeneratedReply: boolean
  reviewsThisMonth: number
  reviewsLastMonth: number
  ratingThisMonthAvg: number
  ratingLastMonthAvg: number
  avgRating: number
  totalReviews: number
  approvedThisMonth: number
  approvedLastMonth: number
  responseRate: number
  pendingCount: number
  recentReviews: ScrapedReview[]
  themes: { praised: string[]; complaints: string[]; opportunities: string[] } | null
  hasAnalytics: boolean
  voiceTrained: number
  voiceApproved: number
  voiceMatchRate: number
  voiceTrainedThisMonth: number
  autopilotEnabled: boolean
}

// ── Autopilot discoverability banner ──────────────────────────────────────────
// Surfaces Autopilot to users who haven't enabled it yet — biggest activation
// lever since Autopilot is buried in Settings today. Dismissable per-browser.
const LS_AP_DISMISSED = 'tr_autopilot_banner_dismissed'

function AutopilotNudge() {
  const [dismissed, setDismissed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(LS_AP_DISMISSED) === 'true') setDismissed(true)
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    try { localStorage.setItem(LS_AP_DISMISSED, 'true') } catch { /* ignore */ }
  }

  if (!hydrated || dismissed) return null

  return (
    <div className="animate-fade-up relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-5 py-4 rounded-xl bg-gradient-to-r from-[#FEF6EF] to-[#FEFCF8] border border-[#F4DCC4]">
      <div className="flex items-start sm:items-center gap-3 pr-8 sm:pr-0">
        <div className="w-9 h-9 rounded-lg bg-white border border-[#F4DCC4] flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-[#E05A28]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[#111]">
            Let ReplyFi handle replies overnight
          </p>
          <p className="text-[12px] text-[#57534E] mt-0.5 leading-snug">
            Autopilot drafts a reply for every new review while you sleep. Wake up to a queue ready to post.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 sm:self-center">
        <Link
          href="/settings?tab=autopilot"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white text-[12px] font-medium transition-all duration-150 active:scale-[0.97] whitespace-nowrap"
        >
          Turn on Autopilot
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="absolute top-2 right-2 sm:top-3 sm:right-3 w-6 h-6 flex items-center justify-center text-[#A8A29E] hover:text-[#57534E] transition-colors"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
  )
}

// ── Voice DNA ─────────────────────────────────────────────────────────────────
// Surfaces how trained the AI is on this user's voice. The compounding-value
// hook: every approval makes the AI more "you", which makes it harder to leave.
function VoiceDNA({
  trained,
  matchRate,
  thisMonth,
}: {
  trained: number
  matchRate: number
  thisMonth: number
}) {
  // Stage thresholds keyed off corpus size — narrative reinforces progress
  const stage =
    trained === 0   ? { label: 'Not yet trained',          pct: 2,  copy: 'Approve your first reply to start training your AI voice.' } :
    trained < 25    ? { label: 'Just getting started',     pct: Math.max(8,  (trained / 25)  * 25),  copy: 'Each approval teaches your AI how you sound.' } :
    trained < 100   ? { label: 'Learning your voice',      pct: 25 + ((trained - 25)  / 75)  * 25,   copy: 'Your AI is picking up your tone and phrasing.' } :
    trained < 500   ? { label: 'Your voice is taking shape', pct: 50 + ((trained - 100) / 400) * 30, copy: 'Replies sound increasingly like you wrote them.' } :
                      { label: 'Trained on your voice',    pct: Math.min(98, 80 + ((trained - 500) / 1000) * 18), copy: 'Your AI has a strong model of how you write.' }

  return (
    <section className="animate-fade-up" style={{ animationDelay: '160ms' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] text-[#111]" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>Your AI voice</h2>
        {trained > 0 && (
          <span className="text-[11px] text-[#A8A29E] tabular-nums">
            {matchRate}% match rate
          </span>
        )}
      </div>

      <div className="bg-[#FEFCF8] border border-[#EDE6DC] rounded-xl px-4 sm:px-5 py-4 sm:py-5">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <div>
            <div className="text-[22px] text-[#111] tabular-nums leading-none" style={{ fontWeight: 600, letterSpacing: '-0.022em' }}>
              {trained.toLocaleString()}
            </div>
            <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#A8A29E] mt-1.5">
              {trained === 1 ? 'Reply trained' : 'Replies trained'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[13px] font-medium text-[#111]">{stage.label}</div>
            {thisMonth > 0 && (
              <div className="text-[11px] text-[#57534E] mt-0.5 tabular-nums">+{thisMonth} this month</div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-[#F3EEE4] overflow-hidden mb-3">
          <div
            className="h-full bg-[#E05A28] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, Math.max(2, stage.pct))}%` }}
          />
        </div>

        <p className="text-[12px] text-[#57534E] leading-relaxed">{stage.copy}</p>
      </div>
    </section>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HomeClient({
  ownerName,
  restaurantName,
  lastScrapedAt,
  yelpLastScrapedAt,
  userId,
  googleMapsUrl,
  yelpUrl,
  hasGeneratedReply,
  reviewsThisMonth,
  reviewsLastMonth,
  ratingThisMonthAvg,
  ratingLastMonthAvg,
  avgRating,
  totalReviews,
  approvedThisMonth,
  approvedLastMonth,
  responseRate,
  pendingCount,
  recentReviews,
  themes,
  hasAnalytics,
  voiceTrained,
  voiceMatchRate,
  voiceTrainedThisMonth,
  autopilotEnabled,
}: Props) {
  const hasAnyPlatform = !!(googleMapsUrl || yelpUrl)

  const [manualMode, setManualMode] = useState(false)
  const [modeHydrated, setModeHydrated] = useState(false)
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
          const msg = (data.errors[0] as string).replace(/^(Google Maps|Yelp): /, '')
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
  return (
    <div className="space-y-5 sm:space-y-7 pb-16">

      {/* ── Autopilot discoverability — only show after first sync ─────────── */}
      {lastScrapedAt && !autopilotEnabled && <AutopilotNudge />}

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="pt-6 sm:pt-8">
        <h1 className="text-[22px] sm:text-[26px] text-[#111] leading-[1.15]" style={{ fontWeight: 600, letterSpacing: '-0.022em' }}>
          Welcome back{ownerName ? `, ${ownerName}` : ''}.
        </h1>
        <p className="text-[13px] text-[#57534E] mt-1.5" style={{ letterSpacing: '-0.006em' }}>
          Here&apos;s how your reputation is trending.
        </p>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      <HeroRow
        recentCount={reviewsThisMonth}
        recentAvg={ratingThisMonthAvg}
        previousCount={reviewsLastMonth}
        previousAvg={ratingLastMonthAvg}
      />

      {/* ── Quick-action strip ─────────────────────────────────────────────── */}
      <ActionStrip
        pendingCount={pendingCount}
        repliesSentCount={approvedThisMonth}
        lastSyncAt={displayLastSynced}
        googleLastSync={lastScrapedAt}
        yelpLastSync={yelpLastScrapedAt}
        hasGoogle={!!googleMapsUrl}
        hasYelp={!!yelpUrl}
        syncing={syncing}
        onSync={handleSync}
      />

      {/* ── Sync status toast ──────────────────────────────────────────────── */}
      {syncMsg && (
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 rounded-xl bg-[#FEFCF8] border border-[#EDE6DC]">
          <span className={`text-[12px] font-medium ${syncMsg.type === 'success' ? 'text-[#0B8A5B]' : 'text-[#B84A1A]'}`}>
            {syncMsg.text}
          </span>
          <button onClick={handleSync} disabled={syncing} className="group flex items-center gap-1.5 text-[12px] font-medium text-[#A8A29E] hover:text-[#57534E] disabled:opacity-40 transition-colors duration-150">
            <svg className={`w-3 h-3 transition-transform duration-700 ${syncing ? 'animate-spin' : 'group-hover:rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            {syncing ? 'Syncing…' : 'Sync again'}
          </button>
        </div>
      )}

      {/* ── Recent reviews ─────────────────────────────────────────────────── */}
      <RecentReviewsList reviews={recentReviews} />

      {/* ── Voice DNA ──────────────────────────────────────────────────────── */}
      <VoiceDNA
        trained={voiceTrained}
        matchRate={voiceMatchRate}
        thisMonth={voiceTrainedThisMonth}
      />

      {/* ── At a glance ────────────────────────────────────────────────────── */}
      <div className="animate-fade-up" style={{ animationDelay: '180ms' }}>
        <SectionLabel>At a glance</SectionLabel>
        {!hasAnalytics ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
            <div>
              <p className="text-[14px] font-medium text-[#111111]">Get insights from your reviews</p>
              <p className="text-[13px] text-[#57534E] mt-1 leading-snug">Discover what customers love, what needs work, and your top growth opportunity.</p>
            </div>
            <Link href="/dashboard/analytics" className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white text-[13px] font-medium transition-all duration-150 active:scale-[0.97] w-full sm:w-auto">
              Run analysis
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>
        ) : (
          <div className="bg-[#FEFCF8] border border-[#EDE6DC] rounded-xl divide-y divide-[#EDE6DC] overflow-hidden">
            {([
              { label: 'Customers love', value: themes?.praised?.[0], fallback: 'Run analytics to see what resonates most.', dotColor: 'bg-[#0B8A5B]' },
              { label: 'Needs attention', value: themes?.complaints?.[0], fallback: 'No recurring complaints — great sign.', dotColor: 'bg-[#E05A28]' },
              { label: 'Top opportunity', value: themes?.opportunities?.[0], fallback: 'Run analytics to find your growth lever.', dotColor: 'bg-[#57534E]' },
            ] as const).map(({ label, value, fallback, dotColor }) => (
              <div key={label} className="flex items-start gap-3 px-4 py-4">
                <span className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0 mt-[5px]`} />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#A8A29E] mb-1">{label}</p>
                  <p className={`text-[13px] leading-snug ${value ? 'font-medium text-[#111]' : 'text-[#C4BEB8] italic'}`}>{value ?? fallback}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Manual generator (collapsed by default) ────────────────────────── */}
      <ManualGenerator prominent={false} />
    </div>
  )
}
