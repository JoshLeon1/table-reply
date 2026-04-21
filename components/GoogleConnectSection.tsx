'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  restaurantProfileId: string
  currentGoogleUrl: string | null
  googleLastScrapedAt: string | null
}

function formatRelativeTime(iso: string | null) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return 'just now'
}

export default function GoogleConnectSection({
  userId,
  restaurantProfileId,
  currentGoogleUrl,
  googleLastScrapedAt,
}: Props) {
  const supabase = createClient()
  const [url, setUrl] = useState(currentGoogleUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [lastSynced, setLastSynced] = useState(googleLastScrapedAt)

  const handleSave = async () => {
    const trimmed = url.trim()
    if (!trimmed) { setError('Please enter your Google Maps URL.'); return }
    if (!trimmed.includes('google.com/maps') && !trimmed.includes('maps.google') && !trimmed.includes('goo.gl/maps')) {
      setError("That doesn't look like a Google Maps URL.")
      return
    }
    setSaving(true)
    setError('')
    const { error: dbErr } = await supabase
      .from('business_profiles')
      .update({ google_maps_url: trimmed })
      .eq('id', restaurantProfileId)
      .eq('user_id', userId)
    setSaving(false)
    if (dbErr) {
      setError(dbErr.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const handleSyncNow = async () => {
    setSyncing(true)
    setSyncResult(null)
    setError('')
    try {
      const res = await fetch('/api/scrape-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Sync failed. Please try again.')
      } else {
        const count = data.newReviews ?? 0
        setSyncResult(count > 0 ? `✓ ${count} new Google review${count !== 1 ? 's' : ''} synced` : '✓ Already up to date — no new reviews')
        setLastSynced(new Date().toISOString())
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  const isConnected = !!currentGoogleUrl || saved

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white border border-[#E4DED8] flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.226 17.64 11.918 17.64 9.2z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          </div>
          <span className="text-[13px] font-medium text-[#111]">Google Maps Auto-Sync</span>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${isConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-[#F3F0EC] text-[#A8A29E] border border-[#E4DED8]'}`}>
          {isConnected ? 'Connected' : 'Not connected'}
        </span>
      </div>

      <p className="text-[12px] text-[#888] leading-relaxed">
        Paste your Google Maps listing URL. ReplyFi will automatically sync your newest Google reviews every day and generate AI reply drafts for each one.
      </p>

      {/* URL input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError('') }}
          placeholder="https://www.google.com/maps/place/Your+Restaurant/..."
          className="flex-1 min-w-0 text-[13px] px-3.5 py-2.5 rounded-xl border border-[#E4DED8] bg-white placeholder:text-[#C4BEB8] focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] transition-all"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl bg-[#111] hover:bg-[#222] text-white text-[13px] font-semibold transition-colors duration-150 disabled:opacity-50 whitespace-nowrap flex-shrink-0"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save URL'}
        </button>
      </div>

      {error && (
        <p className="text-[12px] text-red-500 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {error}
        </p>
      )}

      {/* Sync row */}
      {(currentGoogleUrl || saved) && (
        <div className="flex items-center justify-between pt-2 border-t border-[#EDE9E4]">
          <div className="text-[12px] text-[#A8A29E]">
            {lastSynced ? `Last synced ${formatRelativeTime(lastSynced)}` : 'Never synced — run first sync below'}
          </div>
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            aria-busy={syncing}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E4DED8] hover:border-[#E05A28] hover:text-[#E05A28] text-[12px] font-medium text-[#57534E] transition-colors duration-150 disabled:opacity-50 min-w-[112px] whitespace-nowrap"
          >
            {syncing ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <span>Syncing…</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span>Sync now</span>
              </>
            )}
          </button>
        </div>
      )}

      {syncResult && <p className="text-[12px] text-emerald-600 font-medium">{syncResult}</p>}

      {/* Hint */}
      <div className="bg-[#F3F0EC] rounded-xl px-4 py-3 text-[12px] text-[#57534E] leading-relaxed">
        <strong className="text-[#111]">How to find your Google Maps URL:</strong> Open{' '}
        <span className="font-medium text-[#111]">maps.google.com</span>, search your business name, click your listing, then copy the full URL from your browser&apos;s address bar.
      </div>
    </div>
  )
}
