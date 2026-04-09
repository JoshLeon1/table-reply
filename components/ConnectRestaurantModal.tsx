'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface PlaceResult {
  placeId: string
  name: string
  address: string
  rating?: number
  mapsUrl: string
}

interface Props {
  userId: string
  restaurantName: string
  onClose: () => void
}

function isValidMapsUrl(url: string) {
  return url.includes('google.com/maps') || url.includes('maps.google') || url.includes('goo.gl/maps')
}

const SYNC_MESSAGES = [
  'Connecting to Google Maps…',
  'Fetching your latest reviews…',
  'Reading what your guests said…',
  'Detecting review languages…',
  'Generating personalised replies…',
  'Matching your restaurant\'s voice…',
  'Polishing each response…',
  'Almost there — adding final touches…',
]

// ─── Sync Loading Screen ──────────────────────────────────────────────────────

function SyncLoadingScreen({ restaurantName }: { restaurantName: string }) {
  const [progress, setProgress] = useState(0)
  const [msgIndex, setMsgIndex] = useState(0)

  // Fake progress: slow, eases towards ~92%, never hits 100 until done
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 92) return prev
        // Faster at the start, slower near the end
        const increment = prev < 30 ? 1.2 : prev < 60 ? 0.7 : prev < 80 ? 0.4 : 0.15
        return Math.min(prev + increment, 92)
      })
    }, 400)
    return () => clearInterval(interval)
  }, [])

  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % SYNC_MESSAGES.length)
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center px-8 py-10 text-center">
      {/* Pulsing ring animation */}
      <div className="relative w-24 h-24 mb-8">
        {/* Outer rings */}
        <div className="absolute inset-0 rounded-full border-2 border-amber-200 animate-ping opacity-40" />
        <div className="absolute inset-2 rounded-full border-2 border-amber-300 animate-ping opacity-30" style={{ animationDelay: '0.4s' }} />
        {/* Inner circle */}
        <div className="absolute inset-4 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
      </div>

      {/* Restaurant name */}
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-500 mb-1">
        {restaurantName}
      </p>

      {/* Headline */}
      <h3 className="text-[20px] font-bold text-[#111] leading-tight mb-1">
        Setting up your account
      </h3>
      <p className="text-[13px] text-[#888] mb-8 leading-relaxed">
        We&apos;re importing your reviews and crafting<br />personalised replies for each one.
      </p>

      {/* Progress bar */}
      <div className="w-full mb-3">
        <div className="w-full h-2 bg-[#F0EDE8] rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Status message */}
      <div className="h-5 overflow-hidden">
        <p
          key={msgIndex}
          className="text-[12px] text-[#AAA] animate-pulse"
        >
          {SYNC_MESSAGES[msgIndex]}
        </p>
      </div>

      {/* Floating review chips — decorative */}
      <div className="flex flex-wrap justify-center gap-2 mt-8 opacity-40">
        {['★★★★★', '★★★★★', '★★★★★'].map((stars, i) => (
          <div
            key={i}
            className="px-3 py-1.5 rounded-full border border-[#E8E4DC] bg-[#F7F6F3] text-[11px] text-[#AAA]"
            style={{ animationDelay: `${i * 0.3}s` }}
          >
            {stars}
          </div>
        ))}
      </div>

      <p className="text-[11px] text-[#CCC] mt-6">
        This usually takes 1–2 minutes. Don&apos;t close this window.
      </p>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function ConnectRestaurantModal({ userId, restaurantName, onClose }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(restaurantName || '')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selected, setSelected] = useState<PlaceResult | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'syncing' | 'done' | 'error'>('idle')
  const [syncCount, setSyncCount] = useState(0)
  const [connectError, setConnectError] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [manualUrl, setManualUrl] = useState('')
  const [manualUrlError, setManualUrlError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const manualRef = useRef<HTMLInputElement>(null)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearchError(''); return }
    setSearching(true)
    setSearchError('')
    try {
      const res = await fetch(`/api/places-search?query=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.apiError) {
        setSearchError(data.apiError)
        setResults([])
      } else {
        setResults(data.results ?? [])
        setSearchError('')
      }
    } catch {
      setSearchError('Search unavailable. Use the manual URL option below.')
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
    if (restaurantName) doSearch(restaurantName)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (showManual && manualRef.current) manualRef.current.focus()
  }, [showManual])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    setSelected(null)
    setSearchError('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 400)
  }

  const triggerConnect = async (mapsUrl: string) => {
    setConnecting(true)
    setConnectError('')

    try {
      setSyncStatus('saving')
      const supabase = createClient()
      const { error: saveError } = await supabase
        .from('restaurant_profiles')
        .update({ google_maps_url: mapsUrl })
        .eq('user_id', userId)

      if (saveError) throw new Error(saveError.message)

      setSyncStatus('syncing')
      const res = await fetch('/api/scrape-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')

      setSyncCount(data.newReviews ?? 0)
      setSyncStatus('done')
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Something went wrong')
      setSyncStatus('error')
    } finally {
      setConnecting(false)
    }
  }

  const handleConnect = () => {
    if (!selected) return
    triggerConnect(selected.mapsUrl)
  }

  const handleManualConnect = () => {
    setManualUrlError('')
    if (!manualUrl.trim()) { setManualUrlError('Please paste your Google Maps URL.'); return }
    if (!isValidMapsUrl(manualUrl)) { setManualUrlError("That doesn't look like a Google Maps URL. Copy the URL from your browser while viewing your restaurant on Google Maps."); return }
    triggerConnect(manualUrl.trim())
  }

  const handleDone = () => {
    router.push('/dashboard/reviews')
    router.refresh()
    onClose()
  }

  const isBusy = connecting || syncStatus === 'saving' || syncStatus === 'syncing'

  // Full-screen loading state
  if (syncStatus === 'saving' || syncStatus === 'syncing') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
          <SyncLoadingScreen restaurantName={restaurantName} />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-[18px] h-[18px] text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-[#111] leading-tight">Connect your Google listing</h2>
                <p className="text-[13px] text-[#888] mt-0.5 leading-snug">
                  Find your restaurant so we can pull in your latest reviews automatically.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#CCC] hover:text-[#666] transition-colors ml-3 flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          {syncStatus === 'done' ? (
            /* ── Success ── */
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-[16px] font-bold text-[#111] mb-1">
                {syncCount > 0 ? `${syncCount} review${syncCount !== 1 ? 's' : ''} imported!` : 'Connected!'}
              </h3>
              <p className="text-[13px] text-[#888] mb-5 leading-relaxed">
                {syncCount > 0
                  ? 'Replies have been generated for each review. Head to your reviews to approve them.'
                  : "You're all set. New reviews will sync automatically every day."}
              </p>
              <button
                onClick={handleDone}
                className="w-full h-[48px] rounded-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-sm transition-all duration-150"
              >
                View my reviews →
              </button>
            </div>
          ) : showManual ? (
            /* ── Manual URL ── */
            <div className="space-y-4">
              <div className="bg-[#F7F6F3] rounded-xl border border-[#EDEAE5] px-4 py-3 text-[12px] text-[#666] leading-relaxed">
                <p className="font-semibold text-[#444] mb-1">How to find your Google Maps URL:</p>
                <ol className="space-y-0.5 list-decimal list-inside">
                  <li>Open <span className="font-medium">maps.google.com</span> in your browser</li>
                  <li>Search for your restaurant name and city</li>
                  <li>Click your restaurant listing</li>
                  <li>Copy the full URL from your browser&apos;s address bar</li>
                </ol>
              </div>
              <div>
                <input
                  ref={manualRef}
                  type="url"
                  value={manualUrl}
                  onChange={e => { setManualUrl(e.target.value); setManualUrlError('') }}
                  placeholder="https://www.google.com/maps/place/Your+Restaurant/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] text-sm text-[#111] placeholder:text-[#BBB] focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all"
                  disabled={isBusy}
                />
                {manualUrlError && <p className="text-[12px] text-red-500 mt-1.5">{manualUrlError}</p>}
              </div>
              {connectError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-[13px] text-red-600">{connectError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowManual(false); setManualUrlError(''); setConnectError('') }}
                  disabled={isBusy}
                  className="flex-1 h-[44px] rounded-full border border-[#E8E4DC] bg-white hover:bg-[#FAFAF8] text-[#666] text-sm font-medium disabled:opacity-40 transition-all">
                  ← Back to search
                </button>
                <button type="button" onClick={handleManualConnect}
                  disabled={isBusy || !manualUrl.trim()}
                  className="flex-1 h-[44px] rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  Connect & sync →
                </button>
              </div>
            </div>
          ) : (
            /* ── Search ── */
            <>
              <div className="relative mb-3">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  {searching ? (
                    <svg className="w-4 h-4 text-[#AAA] animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-[#AAA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => handleQueryChange(e.target.value)}
                  placeholder="Search restaurant name and city…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E4DC] text-sm text-[#111] placeholder:text-[#BBB] focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all"
                />
              </div>

              {searchError && (
                <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-3">
                  <p className="text-[12px] text-amber-800 font-medium mb-0.5">Search unavailable</p>
                  <p className="text-[12px] text-amber-700">{searchError}</p>
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-1.5 mb-4 max-h-[220px] overflow-y-auto">
                  {results.map(place => (
                    <button key={place.placeId} type="button" onClick={() => setSelected(place)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                        selected?.placeId === place.placeId
                          ? 'bg-amber-50 border-amber-400'
                          : 'bg-white border-[#E8E4DC] hover:border-stone-300 hover:bg-[#FAFAF8]'
                      }`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#111] leading-tight truncate">{place.name}</p>
                          <p className="text-[12px] text-[#888] leading-tight mt-0.5 truncate">{place.address}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {place.rating !== undefined && (
                            <span className="text-[12px] font-medium text-[#888]">★ {place.rating}</span>
                          )}
                          {selected?.placeId === place.placeId && (
                            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.length === 0 && query.trim() && !searching && !searchError && (
                <p className="text-[13px] text-[#AAA] text-center py-3 mb-2">
                  No results found. Try adding your city name.
                </p>
              )}

              {connectError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-3">
                  <p className="text-[13px] text-red-600">{connectError}</p>
                </div>
              )}

              <div className="flex gap-3 mt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 h-[44px] rounded-full border border-[#E8E4DC] bg-white hover:bg-[#FAFAF8] text-[#666] text-sm font-medium transition-all">
                  Skip for now
                </button>
                <button type="button" onClick={handleConnect}
                  disabled={!selected || isBusy}
                  className="flex-1 h-[44px] rounded-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  Connect & sync →
                </button>
              </div>

              <p className="text-center mt-3">
                <button type="button" onClick={() => setShowManual(true)}
                  className="text-[12px] text-[#AAA] hover:text-amber-600 underline underline-offset-2 transition-colors">
                  Can&apos;t find it? Paste your Google Maps URL instead
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
