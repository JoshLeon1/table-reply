'use client'

import { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/client'
import type { BusinessProfile } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewMessages {
  sms: string
  email: string
  receipt: string
  tablecard: string
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChannelIcon({ channel, className = 'w-4 h-4' }: { channel: string; className?: string }) {
  if (channel === 'sms') return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z"/>
    </svg>
  )
  if (channel === 'email') return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
  )
  if (channel === 'receipt') return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
    </svg>
  )
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M3 14h18M7 6h.01M7 18h.01M17 6h.01M17 18h.01M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>
    </svg>
  )
}

const SyncIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const SpinIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

// ─── Platform Card ────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string | null) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return 'just now'
}

interface PlatformCardProps {
  logo: React.ReactNode
  name: string
  description: string
  hint: React.ReactNode
  placeholder: string
  validate: (url: string) => string | null  // returns error string or null
  apiRoute: string
  dbColumn: string
  profileId: string
  userId: string
  currentUrl: string | null
  lastScrapedAt: string | null
  onUrlSaved?: (url: string) => void
}

function PlatformCard({
  logo, name, description, hint, placeholder,
  validate, apiRoute, dbColumn, profileId, userId,
  currentUrl, lastScrapedAt, onUrlSaved,
}: PlatformCardProps) {
  const supabase = createClient()
  const [url, setUrl] = useState(currentUrl ?? '')
  const [savedUrl, setSavedUrl] = useState(currentUrl)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [syncResult, setSyncResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [error, setError] = useState('')
  const [lastSynced, setLastSynced] = useState(lastScrapedAt)
  const [inputHighlighted, setInputHighlighted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isConnected = !!savedUrl

  const focusInput = () => {
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    inputRef.current?.focus()
    setInputHighlighted(true)
    setTimeout(() => setInputHighlighted(false), 1800)
  }

  const handleSave = async () => {
    const trimmed = url.trim()
    const validationError = validate(trimmed)
    if (validationError) { setError(validationError); return }
    setSaving(true)
    setError('')
    const { error: dbErr } = await supabase
      .from('business_profiles')
      .update({ [dbColumn]: trimmed })
      .eq('id', profileId)
      .eq('user_id', userId)
    setSaving(false)
    if (dbErr) {
      setError(dbErr.message)
    } else {
      setSavedUrl(trimmed)
      setJustSaved(true)
      setSyncResult(null)
      onUrlSaved?.(trimmed)
      setTimeout(() => setJustSaved(false), 2500)
    }
  }

  const handleSyncNow = async () => {
    setSyncing(true)
    setSyncResult(null)
    setError('')
    try {
      const res = await fetch(apiRoute, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSyncResult({ ok: false, message: data.error ?? 'Sync failed. Please try again.' })
      } else {
        const count = data.newReviews ?? 0
        setSyncResult({
          ok: true,
          message: count > 0
            ? `${count} new review${count !== 1 ? 's' : ''} imported`
            : 'Already up to date — no new reviews',
        })
        setLastSynced(new Date().toISOString())
      }
    } catch {
      setSyncResult({ ok: false, message: 'Network error. Please try again.' })
    } finally {
      setSyncing(false)
    }
  }

  const urlChanged = url.trim() !== (savedUrl ?? '')

  return (
    <div className="bg-[#FEFCF8] rounded-xl border border-[#EDE6DC] p-4 sm:p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {logo}
          <span className="text-[14px] font-semibold text-[#111111]">{name}</span>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
          isConnected
            ? 'bg-[#0B8A5B] text-[#0B8A5B] border-[#C9E4D3]'
            : 'bg-[#FEF0E8] text-[#E05A28] border-[#E05A28]/30'
        }`}>
          {isConnected ? '● Connected' : '+ Add URL'}
        </span>
      </div>

      <p className="text-[12px] text-[#57534E] leading-relaxed">{description}</p>

      {/* URL input + save */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(''); setSyncResult(null) }}
          placeholder={placeholder}
          className={`flex-1 min-w-0 text-[13px] px-3.5 py-2.5 rounded-xl border bg-[#F3EEE4] text-[#111111] placeholder:text-[#C4BEB8] focus:outline-none focus:ring-2 focus:border-[#E05A28] focus:bg-white transition-all ${
            inputHighlighted
              ? 'border-[#E05A28] ring-2 ring-[#E05A28]/30'
              : 'border-[#EDE6DC] focus:ring-[#E05A28]/20'
          }`}
        />
        <button
          onClick={handleSave}
          disabled={saving || (!urlChanged && !justSaved)}
          className={`px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 disabled:opacity-40 whitespace-nowrap flex-shrink-0 ${
            justSaved
              ? 'bg-[#0B8A5B] border border-[#C9E4D3] text-[#0B8A5B]'
              : 'bg-[#F3F0EC] hover:bg-[#EDE9E4] border border-[#EDE6DC] text-[#57534E]'
          }`}
        >
          {saving ? 'Saving…' : justSaved ? '✓ Saved' : 'Save'}
        </button>
      </div>

      {error && (
        <p className="text-[12px] text-[#B84A1A] flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}

      {/* Sync row — always visible */}
      <div className="flex items-center justify-between pt-3 border-t border-[#EDE6DC]">
        <p className="text-[12px] text-[#A8A29E]">
          {justSaved
            ? <span className="text-[#E05A28] font-medium">URL saved — click Sync Now to import reviews →</span>
            : isConnected
              ? (lastSynced ? `Last synced ${formatRelativeTime(lastSynced)}` : 'Never synced')
              : 'Add a URL above to start syncing'}
        </p>
        {isConnected ? (
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#EDE6DC] hover:border-[#E05A28] hover:text-[#E05A28] text-[12px] font-medium text-[#57534E] transition-all duration-150 disabled:opacity-40 min-h-[44px]"
          >
            {syncing ? <><SpinIcon />Syncing…</> : <><SyncIcon />Sync Now</>}
          </button>
        ) : (
          <button
            onClick={focusInput}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#EDE6DC] hover:border-[#E05A28] hover:text-[#E05A28] text-[12px] font-medium text-[#A8A29E] transition-all duration-150 min-h-[44px]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Connect to Sync →
          </button>
        )}
      </div>

      {syncResult && (
        <p className={`text-[12px] font-medium flex items-center gap-1.5 ${syncResult.ok ? 'text-[#0B8A5B]' : 'text-[#B84A1A]'}`}>
          {syncResult.ok ? '✓' : '✕'} {syncResult.message}
        </p>
      )}

      {/* How to find URL hint */}
      <div className="bg-[#F3EEE4] border border-[#EDE6DC] rounded-xl px-4 py-3 text-[12px] text-[#57534E] leading-relaxed">
        {hint}
      </div>
    </div>
  )
}

// ─── Channel templates ────────────────────────────────────────────────────────

const CHANNELS = [
  { key: 'sms' as const, label: 'SMS', desc: 'Text message', rows: 3 },
  { key: 'email' as const, label: 'Email', desc: 'Email body', rows: 5 },
  { key: 'receipt' as const, label: 'Receipt', desc: 'Printed note', rows: 3 },
  { key: 'tablecard' as const, label: 'Table Card', desc: 'Card insert', rows: 3 },
]

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  restaurantProfile: BusinessProfile
}

export default function GetMoreReviewsClient({ restaurantProfile }: Props) {
  const supabase = createClient()
  const savedMessages = restaurantProfile.review_request_messages ?? null
  const [messages, setMessages] = useState<ReviewMessages | null>(savedMessages)
  const [editedMessages, setEditedMessages] = useState<ReviewMessages | null>(savedMessages)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [generatingQr, setGeneratingQr] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)
  // Track Google Maps URL locally so QR code button reacts immediately
  const [googleUrl, setGoogleUrl] = useState(restaurantProfile.google_maps_url)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (savedFlashRef.current) clearTimeout(savedFlashRef.current)
    }
  }, [])

  function saveMessagesToDb(msgs: ReviewMessages) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('business_profiles')
        .update({ review_request_messages: msgs })
        .eq('id', restaurantProfile.id)
        .eq('user_id', restaurantProfile.user_id)
      if (!error) {
        setAutoSaved(true)
        if (savedFlashRef.current) clearTimeout(savedFlashRef.current)
        savedFlashRef.current = setTimeout(() => setAutoSaved(false), 2500)
      }
    }, 1000)
  }

  async function handleGenerateMessages() {
    setGenerating(true)
    setGenerateError(null)
    try {
      const res = await fetch('/api/generate-review-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: restaurantProfile.business_name,
          cuisineType: restaurantProfile.business_type,
          vibe: restaurantProfile.vibe,
          voiceStyle: restaurantProfile.voice_style,
          ownerName: restaurantProfile.owner_name,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Failed to generate messages')
      const result: ReviewMessages = {
        sms: typeof data.sms === 'string' && data.sms ? data.sms : '',
        email: typeof data.email === 'string' && data.email ? data.email : '',
        receipt: typeof data.receipt === 'string' && data.receipt ? data.receipt : '',
        tablecard: typeof data.tablecard === 'string' && data.tablecard ? data.tablecard : '',
      }
      setMessages(result)
      setEditedMessages(result)
      // Persist to DB (fire and forget)
      supabase
        .from('business_profiles')
        .update({ review_request_messages: result })
        .eq('id', restaurantProfile.id)
        .eq('user_id', restaurantProfile.user_id)
        .then(({ error }) => {
          if (error) console.error('[get-more-reviews] Failed to save messages:', error)
        })
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy(channel: string) {
    const text = editedMessages?.[channel as keyof ReviewMessages] ?? ''
    await navigator.clipboard.writeText(text)
    setCopiedChannel(channel)
    setTimeout(() => setCopiedChannel(null), 2000)
    try {
      await fetch('/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      })
    } catch { /* non-critical */ }
  }

  async function handleGenerateQr() {
    const reviewUrl = googleUrl ?? ''
    if (!reviewUrl) return
    setGeneratingQr(true)
    try {
      const dataUrl = await QRCode.toDataURL(reviewUrl, {
        width: 256, margin: 2,
        color: { dark: '#111111', light: '#FFFFFF' },
      })
      setQrDataUrl(dataUrl)
    } catch { /* ignore */ } finally {
      setGeneratingQr(false)
    }
  }

  function handleDownloadQr() {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `${restaurantProfile.business_name.replace(/\s+/g, '-')}-review-qr.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const showSkeletons = generating
  const showCards = !generating && (messages !== null || generateError !== null)

  return (
    <div className="space-y-8 pb-12">

      {/* Page Header */}
      <div>
        <h1 className="text-[22px] font-semibold text-[#111111] tracking-tight">Grow Your Reviews</h1>
        <p className="text-[13px] text-[#57534E] mt-1">Connect your review platforms and generate tools to earn more 5-star reviews.</p>
      </div>

      {/* ── Section 1: Platform Connections ─────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E] mb-1">Review Platforms</p>
          <p className="text-[13px] text-[#57534E]">Connect your listings so ReplyFi can pull in new reviews automatically every day.</p>
        </div>

        {/* Google Maps */}
        <PlatformCard
          logo={
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#F3F0EC] border border-[#EDE6DC]">
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.226 17.64 11.918 17.64 9.2z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            </div>
          }
          name="Google Maps"
          description="Your primary review source. ReplyFi syncs new Google reviews daily and auto-generates replies."
          placeholder="https://www.google.com/maps/place/Your+Business/..."
          validate={(url) => {
            if (!url) return 'Please enter your Google Maps URL.'
            if (!url.includes('google.com/maps') && !url.includes('maps.google') && !url.includes('goo.gl/maps')) {
              return "That doesn't look like a Google Maps URL."
            }
            return null
          }}
          hint={
            <>
              <span className="font-medium text-[#57534E]">How to find it:</span> Open{' '}
              <span className="text-[#57534E]">maps.google.com</span>, search your business, click your listing, then copy the URL from your browser.
            </>
          }
          apiRoute="/api/scrape-reviews"
          dbColumn="google_maps_url"
          profileId={restaurantProfile.id}
          userId={restaurantProfile.user_id}
          currentUrl={restaurantProfile.google_maps_url}
          lastScrapedAt={restaurantProfile.last_scraped_at}
          onUrlSaved={setGoogleUrl}
        />

        {/* Yelp */}
        <PlatformCard
          logo={
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#FF1A1A]/15 border border-[#FF1A1A]/20">
              <span className="text-[#FF1A1A] font-black text-[13px] leading-none">y!</span>
            </div>
          }
          name="Yelp"
          description="Sync Yelp reviews daily alongside Google. Replies are generated for every new review automatically."
          placeholder="https://www.yelp.com/biz/your-business-city"
          validate={(url) => {
            if (!url) return 'Please enter your Yelp business URL.'
            if (!/yelp\.(com|to)/i.test(url)) return 'URL must be a Yelp link (yelp.com).'
            return null
          }}
          hint={
            <>
              <span className="font-medium text-[#57534E]">How to find it:</span> Go to{' '}
              <a href="https://biz.yelp.com" target="_blank" rel="noopener noreferrer" className="text-[#E05A28] underline underline-offset-2">biz.yelp.com</a>
              , click your business → &ldquo;Public Business Page&rdquo; → copy the URL.
              Format: <span className="font-mono text-[11px] text-[#57534E] bg-[#F3F0EC] px-1.5 py-0.5 rounded">yelp.com/biz/your-business-city</span>
            </>
          }
          apiRoute="/api/scrape-yelp-reviews"
          dbColumn="yelp_url"
          profileId={restaurantProfile.id}
          userId={restaurantProfile.user_id}
          currentUrl={restaurantProfile.yelp_url}
          lastScrapedAt={restaurantProfile.yelp_last_scraped_at}
        />

        {/* TripAdvisor */}
        <PlatformCard
          logo={
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#34E0A1]/10 border border-[#34E0A1]/20">
              <span className="text-[#34E0A1] font-black text-[11px] leading-none">TA</span>
            </div>
          }
          name="TripAdvisor"
          description="Pull in TripAdvisor reviews daily. AI replies are generated and queued for your approval."
          placeholder="https://www.tripadvisor.com/Restaurant_Review-g..."
          validate={(url) => {
            if (!url) return 'Please enter your TripAdvisor URL.'
            if (!url.includes('tripadvisor.com')) return 'URL must be a TripAdvisor business page.'
            return null
          }}
          hint={
            <>
              <span className="font-medium text-[#57534E]">How to find it:</span> Search your business on{' '}
              <a href="https://www.tripadvisor.com" target="_blank" rel="noopener noreferrer" className="text-[#E05A28] underline underline-offset-2">tripadvisor.com</a>
              , open your page, copy the URL.
              Format: <span className="font-mono text-[11px] text-[#57534E] bg-[#F3F0EC] px-1.5 py-0.5 rounded">tripadvisor.com/Restaurant_Review-g...-your-business.html</span>
            </>
          }
          apiRoute="/api/scrape-tripadvisor-reviews"
          dbColumn="tripadvisor_url"
          profileId={restaurantProfile.id}
          userId={restaurantProfile.user_id}
          currentUrl={restaurantProfile.tripadvisor_url}
          lastScrapedAt={restaurantProfile.tripadvisor_last_scraped_at}
        />
      </div>

      {/* ── Section 2: Review Request Messages ──────────────────────────────── */}
      <div className="bg-[#FEFCF8] rounded-xl border border-[#EDE6DC] p-4 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[14px] font-semibold text-[#111111]">Review Request Messages</h2>
            <p className="text-[12px] text-[#57534E] mt-0.5">
              Personalized messages to send via SMS, email, receipt, or table card
            </p>
          </div>
          {autoSaved && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-[#0B8A5B] bg-[#0B8A5B] border border-[#C9E4D3] px-2 py-1 rounded-lg flex-shrink-0 mt-0.5 transition-all">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
              </svg>
              Saved
            </span>
          )}
        </div>
        <button
          onClick={handleGenerateMessages}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2.5 bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] active:scale-[0.98] disabled:opacity-60 text-white font-semibold text-[14px] px-4 rounded-xl transition-all min-h-[52px] shadow-[0_2px_12px_rgba(224,90,40,0.25)]"
        >
          {generating ? (
            <><SpinIcon className="w-4 h-4" />Generating…</>
          ) : (
            <>
              <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              {messages ? 'Regenerate Messages' : 'Generate Messages'}
            </>
          )}
        </button>

        {generateError && <p className="text-[#B84A1A] text-[13px]">{generateError}</p>}

        {/* Skeletons */}
        {showSkeletons && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CHANNELS.map((ch) => (
              <div key={ch.key} className="rounded-xl border border-[#EDE6DC] p-4 space-y-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#F3F0EC] rounded-md" />
                  <div className="w-20 h-4 bg-[#F3F0EC] rounded" />
                </div>
                <div className="space-y-2">
                  <div className="w-full h-3 bg-[#F3F0EC] rounded" />
                  <div className="w-4/5 h-3 bg-[#F3F0EC] rounded" />
                  <div className="w-3/5 h-3 bg-[#F3F0EC] rounded" />
                </div>
                <div className="w-20 h-8 bg-[#F3F0EC] rounded-lg ml-auto" />
              </div>
            ))}
          </div>
        )}

        {/* Message cards */}
        {showCards && messages && editedMessages && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {CHANNELS.map((ch) => {
              const isSms = ch.key === 'sms'
              const isEmail = ch.key === 'email'
              const isReceipt = ch.key === 'receipt'
              return (
                <div key={ch.key} className="rounded-xl border border-[#EDE6DC] bg-white p-4 space-y-3 hover:border-[#D0C9C1] transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSms ? 'bg-[#EDE6DC] border border-[#EDE6DC] text-[#57534E]'
                      : isEmail ? 'bg-violet-50 border border-violet-200 text-violet-500'
                      : 'bg-[#F3F0EC] border border-[#EDE6DC] text-[#57534E]'
                    }`}>
                      <ChannelIcon channel={ch.key} className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[13px] font-semibold text-[#111111]">{ch.label}</span>
                    <span className="text-[11px] text-[#A8A29E] ml-auto">{ch.desc}</span>
                  </div>

                  {isSms && (
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#F3F0EC] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-[#A8A29E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                      </div>
                      <div className="bg-[#E9EFFD] rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
                        <p className="text-[12px] text-[#1A1A2E] leading-relaxed whitespace-pre-wrap break-words">{editedMessages[ch.key]}</p>
                      </div>
                    </div>
                  )}

                  {isEmail && (
                    <div className="rounded-xl border border-[#EDE6DC] overflow-hidden">
                      <div className="bg-[#F3EEE4] border-b border-[#EDE6DC] px-3 py-2 space-y-0.5">
                        <p className="text-[11px] text-[#A8A29E]"><span className="font-medium text-[#57534E]">From:</span> {restaurantProfile.business_name}</p>
                        <p className="text-[11px] text-[#A8A29E]"><span className="font-medium text-[#57534E]">Subject:</span> We&apos;d love your feedback!</p>
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="text-[12px] text-[#57534E] leading-relaxed whitespace-pre-wrap break-words">{editedMessages[ch.key]}</p>
                      </div>
                    </div>
                  )}

                  {(isReceipt || ch.key === 'tablecard') && (
                    <div className="rounded-xl border-2 border-dashed border-[#D0C9C1] bg-[#F3EEE4] px-4 py-3">
                      <p className="text-[12px] text-[#57534E] leading-relaxed whitespace-pre-wrap break-words font-mono">{editedMessages[ch.key]}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.10em] text-[#A8A29E] mb-1.5">Edit message</p>
                    <textarea
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE6DC] bg-[#F3EEE4] text-[13px] text-[#111111] placeholder:text-[#C4BEB8] focus:bg-white focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] focus:outline-none resize-none transition-all"
                      rows={ch.key === 'email' ? 5 : 3}
                      value={editedMessages[ch.key]}
                      onChange={(e) => {
                        const updated = editedMessages ? { ...editedMessages, [ch.key]: e.target.value } : null
                        setEditedMessages(updated)
                        if (updated) saveMessagesToDb(updated)
                      }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleCopy(ch.key)}
                      className={`text-[12px] font-semibold px-3.5 min-h-[36px] rounded-xl border transition-all flex items-center gap-1.5 ${
                        copiedChannel === ch.key
                          ? 'bg-[#0B8A5B] border-[#C9E4D3] text-[#0B8A5B]'
                          : 'border-[#EDE6DC] hover:border-[#D0C9C1] bg-[#F3F0EC] text-[#57534E] hover:text-[#111111]'
                      }`}
                    >
                      {copiedChannel === ch.key ? (
                        <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Copied!</>
                      ) : (
                        <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>Copy</>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {!showSkeletons && !showCards && (
          <div className="text-center py-10">
            <div className="w-10 h-10 rounded-xl bg-[#FEF0E8] border border-[#F5C9AD] flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-[#E05A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z"/>
              </svg>
            </div>
            <p className="text-[14px] font-medium text-[#111111]">Generate your message templates</p>
            <p className="text-[13px] text-[#57534E] mt-1 max-w-[280px] mx-auto leading-relaxed">
              AI-crafted messages for <span className="text-[#111111] font-medium">{restaurantProfile.business_name}</span> — ready to copy and send.
            </p>
          </div>
        )}
      </div>

      {/* ── Section 3: QR Code ───────────────────────────────────────────────── */}
      <div className="bg-[#FEFCF8] rounded-xl border border-[#EDE6DC] p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-[14px] font-semibold text-[#111111]">QR Code for your Google review page</h2>
          <p className="text-[12px] text-[#57534E] mt-0.5">Add this to your menu, receipt, or table card</p>
        </div>

        {googleUrl ? (
          <div className="space-y-4">
            {!qrDataUrl && (
              <button
                onClick={handleGenerateQr}
                disabled={generatingQr}
                className="flex items-center gap-2 bg-[#E05A28] hover:bg-[#C94E21] disabled:opacity-60 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors min-h-[44px]"
              >
                {generatingQr ? <><SpinIcon className="w-4 h-4" />Generating…</> : 'Generate QR Code'}
              </button>
            )}
            {qrDataUrl && (
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="p-4 bg-white rounded-xl flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="Google Review QR Code" width={180} height={180} className="block w-40 h-40 sm:w-[180px] sm:h-[180px]" />
                </div>
                <div className="flex flex-col items-center sm:items-start gap-3 text-center sm:text-left">
                  <p className="text-[13px] text-[#57534E] leading-relaxed max-w-[280px]">
                    Print this QR code and add it to your menu, receipt, or table tent card to collect more reviews.
                  </p>
                  <button onClick={handleDownloadQr} className="flex items-center gap-2 bg-[#F3F0EC] hover:bg-[#EDE9E4] border border-[#EDE6DC] text-[#111111] font-semibold text-[13px] px-4 py-2.5 rounded-xl transition-colors min-h-[44px]">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download QR Code
                  </button>
                  <button onClick={() => setQrDataUrl(null)} className="text-[12px] text-[#A8A29E] hover:text-[#57534E] transition-colors">Regenerate</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-[#EDE6DC] bg-[#F3EEE4] px-4 py-5 text-[13px] text-[#57534E]">
            Connect your Google Maps listing above to generate a QR code.
          </div>
        )}
      </div>

      {/* ── Section 4: Tips ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E]">Tips for getting more reviews</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { title: 'Ask in person', body: "The best time to ask is right after a positive experience. A simple 'Would you mind leaving us a review? It really helps.' goes a long way." },
            { title: 'Timing matters', body: 'Ask within 24 hours while the experience is still fresh. Happy customers who just left are your best reviewers.' },
            { title: 'Make it easy', body: 'The fewer steps the better. A QR code at checkout or on a receipt removes all friction.' },
          ].map((tip) => (
            <div key={tip.title} className="bg-[#FEFCF8] rounded-xl border border-[#EDE6DC] p-4 sm:p-5">
              <h3 className="text-[13px] font-semibold text-[#111111] mb-1.5">{tip.title}</h3>
              <p className="text-[12px] text-[#57534E] leading-relaxed">{tip.body}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
