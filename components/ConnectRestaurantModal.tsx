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

export default function ConnectRestaurantModal({ userId, restaurantName, onClose }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(restaurantName || '')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<PlaceResult | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'syncing' | 'done' | 'error'>('idle')
  const [syncCount, setSyncCount] = useState(0)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/places-search?query=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
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

  const handleQueryChange = (val: string) => {
    setQuery(val)
    setSelected(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 400)
  }

  const handleConnect = async () => {
    if (!selected) return
    setConnecting(true)
    setError('')

    try {
      setSyncStatus('saving')
      const supabase = createClient()
      const { error: saveError } = await supabase
        .from('restaurant_profiles')
        .update({ google_maps_url: selected.mapsUrl })
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
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSyncStatus('error')
    } finally {
      setConnecting(false)
    }
  }

  const handleDone = () => {
    router.push('/dashboard/reviews')
    router.refresh()
    onClose()
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
                  Find your restaurant on Google Maps so we can pull in your latest reviews automatically.
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
            /* ── Success state ─────────────────────────────────────────── */
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
                  ? 'Replies have been generated for each review. Head to your reviews page to approve them.'
                  : "You're all set. New reviews will sync automatically every day."}
              </p>
              <button
                onClick={handleDone}
                className="w-full h-[48px] rounded-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-sm transition-all duration-150"
              >
                View my reviews →
              </button>
            </div>
          ) : (
            /* ── Search + select state ─────────────────────────────────── */
            <>
              {/* Search input */}
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E4DC] text-sm text-[#111] placeholder:text-[#BBB] focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all duration-150"
                />
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div className="space-y-1.5 mb-4 max-h-[240px] overflow-y-auto">
                  {results.map(place => (
                    <button
                      key={place.placeId}
                      type="button"
                      onClick={() => setSelected(place)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                        selected?.placeId === place.placeId
                          ? 'bg-amber-50 border-amber-400'
                          : 'bg-white border-[#E8E4DC] hover:border-stone-300 hover:bg-[#FAFAF8]'
                      }`}
                    >
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

              {results.length === 0 && query.trim() && !searching && (
                <p className="text-[13px] text-[#AAA] text-center py-4 mb-2">
                  No results found. Try a different search.
                </p>
              )}

              {/* Syncing progress */}
              {(syncStatus === 'saving' || syncStatus === 'syncing') && (
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl mb-4">
                  <svg className="w-4 h-4 text-amber-500 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-[13px] text-amber-700 font-medium">
                    {syncStatus === 'saving' ? 'Saving your restaurant…' : 'Importing reviews from Google Maps…'}
                  </span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                  <p className="text-[13px] text-red-600">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={connecting}
                  className="flex-1 h-[44px] rounded-full border border-[#E8E4DC] bg-white hover:bg-[#FAFAF8] text-[#666] text-sm font-medium disabled:opacity-40 transition-all duration-150"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={!selected || connecting}
                  className="flex-1 h-[44px] rounded-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                >
                  {connecting ? 'Connecting…' : 'Connect & sync →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
