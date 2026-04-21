'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PlacesAutocomplete from '@/components/PlacesAutocomplete'

interface SelectedPlace {
  placeId: string
  name: string
  address: string
  mapsUrl: string
  latitude: number | null
  longitude: number | null
}

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
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null)

  const handleSave = async () => {
    const trimmed = url.trim()
    if (!trimmed) { setError('Please enter your Google Maps URL.'); return }
    if (!trimmed.includes('google.com/maps') && !trimmed.includes('maps.google') && !trimmed.includes('goo.gl/maps') && !trimmed.includes('place_id:')) {
      setError("That doesn't look like a Google Maps URL.")
      return
    }
    setSaving(true)
    setError('')
    const { error: dbErr } = await supabase
      .from('business_profiles')
      .update({
        google_maps_url: trimmed,
        ...(selectedPlace ? {
          google_place_id: selectedPlace.placeId,
          latitude: selectedPlace.latitude,
          longitude: selectedPlace.longitude,
        } : {}),
      })
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
        Search for your business below — selecting it will fill in the Google Maps URL automatically. Or paste the URL directly.
      </p>

      {/* Places autocomplete */}
      <PlacesAutocomplete
        selected={selectedPlace}
        onSelect={(place) => {
          setSelectedPlace(place)
          setUrl(place.mapsUrl)
          setError('')
        }}
        onClear={() => {
          setSelectedPlace(null)
          setUrl('')
        }}
        placeholder="Search your business on Google…"
      />

      {/* Yelp helper — shown after a place is found */}
      {selectedPlace && (
        <a
          href={`https://www.yelp.com/search?find_desc=${encodeURIComponent(selectedPlace.name)}&find_loc=${encodeURIComponent(selectedPlace.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] text-[#57534E] hover:text-[#E05A28] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.111 18.226c-.141.969-2.119 3.483-3.029 3.847-.311.124-.611.094-.838-.09-.154-.12-.314-.365-2.447-3.827l-.633-1.046c-.2-.316-.16-.722.094-1.016a1.4 1.4 0 011.046-.477l.049.001c.025.001 3.793.337 4.001.356.406.037.68.221.802.534.093.237.083.512-.045.718zM9.535 14.947c-.157.557-.803 3.47-.868 4.044a.83.83 0 00.33.782c.21.155.501.195.83.115 1.028-.255 3.174-2.161 3.427-3.117a1.28 1.28 0 00-.156-1.017 1.304 1.304 0 00-.893-.578l-1.177-.188c-.405-.064-.794-.023-1.064.145a.887.887 0 00-.429.814zM21.245 12.55c-.189-.444-2.348-2.464-3.308-3.15a.852.852 0 00-.839-.084c-.296.136-.49.435-.528.806-.006.055-.314 3.813-.349 4.026-.07.411.065.726.38.893.228.122.516.124.786.005l1.076-.47c.375-.163 3.1-1.354 3.241-1.597a.826.826 0 00-.459-1.429zm-10.617-8.42C10.36 3.52 9.853.972 9.686.57 9.55.252 9.319.065 9.035.009c-.296-.058-.633.05-.913.299C7.27 1.074 6.144 4.057 6.178 5.045c.018.516.217.927.561 1.159.327.22.748.265 1.185.127l1.124-.343c.394-.12 2.785-.879 2.58-1.858zm-2.261 7.197c.28-.276.38-.676.27-1.073L8.14 9.047c-.108-.387-.392-2.74-.433-2.903-.085-.338-.302-.56-.6-.611a.848.848 0 00-.786.292C5.587 6.712 4.12 9.566 4.08 10.55c-.021.508.148.935.477 1.203.309.251.727.334 1.168.232l1.151-.265c.402-.092 1.972-.704 2.491-.393z"/>
          </svg>
          Find on Yelp →
        </a>
      )}

      {/* URL input — manual fallback / display when no autocomplete result */}
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(''); if (!e.target.value) setSelectedPlace(null) }}
          placeholder="Or paste your Google Maps URL directly…"
          className="flex-1 min-w-0 text-[13px] px-3.5 py-2.5 rounded-xl border border-[#E4DED8] bg-white placeholder:text-[#C4BEB8] focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] transition-all"
        />
        <button
          onClick={handleSave}
          disabled={saving || !url.trim()}
          className="px-4 py-2.5 rounded-xl bg-[#111] hover:bg-[#222] text-white text-[13px] font-semibold transition-colors duration-150 disabled:opacity-50 whitespace-nowrap flex-shrink-0"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
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
        <strong className="text-[#111]">Tip:</strong> Use the search above to find your listing automatically. If you prefer, you can also paste a URL directly from{' '}
        <span className="font-medium text-[#111]">maps.google.com</span>.
      </div>
    </div>
  )
}
