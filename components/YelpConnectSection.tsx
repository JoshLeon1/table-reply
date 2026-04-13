'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  restaurantProfileId: string
  currentYelpUrl: string | null
  yelpLastScrapedAt: string | null
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

export default function YelpConnectSection({
  userId,
  restaurantProfileId,
  currentYelpUrl,
  yelpLastScrapedAt,
}: Props) {
  const supabase = createClient()
  const [url, setUrl] = useState(currentYelpUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [lastSynced, setLastSynced] = useState(yelpLastScrapedAt)

  const handleSave = async () => {
    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please enter your Yelp business URL.')
      return
    }
    if (!trimmed.includes('yelp.com/biz/')) {
      setError('URL must be a Yelp business page (e.g. yelp.com/biz/your-restaurant).')
      return
    }
    setSaving(true)
    setError('')

    const { error: dbErr } = await supabase
      .from('restaurant_profiles')
      .update({ yelp_url: trimmed })
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
      const res = await fetch('/api/scrape-yelp-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Sync failed. Please try again.')
      } else {
        const count = data.newReviews ?? 0
        setSyncResult(
          count > 0
            ? `✓ ${count} new Yelp review${count !== 1 ? 's' : ''} synced`
            : '✓ Already up to date — no new Yelp reviews'
        )
        setLastSynced(new Date().toISOString())
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  const isConnected = !!currentYelpUrl || saved

  return (
    <div className="space-y-4">
      {/* Status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Yelp logo-ish mark */}
          <div className="w-6 h-6 rounded-md bg-[#FF1A1A] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-[11px] leading-none">y!</span>
          </div>
          <span className="text-[13px] font-medium text-[#111]">Yelp Auto-Sync</span>
        </div>
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-[#F3F0EC] text-[#A8A29E] border border-[#E4DED8]'
          }`}
        >
          {isConnected ? 'Connected' : 'Not connected'}
        </span>
      </div>

      <p className="text-[12px] text-[#888] leading-relaxed">
        Paste your Yelp business page URL. TableReply will auto-sync your newest Yelp reviews every day alongside Google — no manual copy-paste needed.
      </p>

      {/* URL input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError('') }}
          placeholder="https://www.yelp.com/biz/your-restaurant-city"
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}

      {/* Sync now row — only show if URL is saved */}
      {(currentYelpUrl || saved) && (
        <div className="flex items-center justify-between pt-2 border-t border-[#EDE9E4]">
          <div className="text-[12px] text-[#A8A29E]">
            {lastSynced
              ? `Last synced ${formatRelativeTime(lastSynced)}`
              : 'Never synced — run first sync below'}
          </div>
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E4DED8] hover:border-[#E05A28] hover:text-[#E05A28] text-[12px] font-medium text-[#57534E] transition-all duration-150 disabled:opacity-50"
          >
            {syncing ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Syncing…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync now
              </>
            )}
          </button>
        </div>
      )}

      {syncResult && (
        <p className="text-[12px] text-emerald-600 font-medium">{syncResult}</p>
      )}

      {/* How to find URL hint */}
      <div className="bg-[#F3F0EC] rounded-xl px-4 py-3 text-[12px] text-[#57534E] leading-relaxed">
        <strong className="text-[#111]">How to find your Yelp URL:</strong> Go to{' '}
        <a href="https://biz.yelp.com" target="_blank" rel="noopener noreferrer" className="text-[#E05A28] underline underline-offset-2">
          biz.yelp.com
        </a>
        , click your business → &quot;Public Business Page&quot; → copy the URL from your browser.
        It should look like: <span className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-[#E4DED8]">yelp.com/biz/your-restaurant-city</span>
      </div>
    </div>
  )
}
