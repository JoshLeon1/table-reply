'use client'

import { useState, useEffect, useRef } from 'react'

interface PlaceResult {
  placeId: string
  name: string
  address: string
  rating?: number
  mapsUrl: string
  latitude: number | null
  longitude: number | null
}

interface SelectedPlace {
  placeId: string
  name: string
  address: string
  mapsUrl: string
  latitude: number | null
  longitude: number | null
}

interface Props {
  /** Initial query text to pre-populate the search box (e.g. the business name) */
  initialQuery?: string
  /** Called when a place is selected */
  onSelect: (place: SelectedPlace) => void
  /** Called when the selection is cleared */
  onClear: () => void
  /** Currently selected place (controlled) */
  selected: SelectedPlace | null
  placeholder?: string
}

export default function PlacesAutocomplete({ initialQuery = '', onSelect, onClear, selected, placeholder = 'Search your business by name…' }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<PlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showDrop, setShowDrop] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults([]); setShowDrop(false); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/places-search?query=${encodeURIComponent(query)}`)
        const data = await res.json()
        const r: PlaceResult[] = data.results ?? []
        setResults(r)
        setShowDrop(r.length > 0)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDrop(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (place: PlaceResult) => {
    onSelect({ placeId: place.placeId, name: place.name, address: place.address, mapsUrl: place.mapsUrl, latitude: place.latitude, longitude: place.longitude })
    setShowDrop(false)
    setResults([])
  }

  const handleClear = () => {
    onClear()
    setQuery(initialQuery)
    setResults([])
    setShowDrop(false)
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#111] truncate">{selected.name}</p>
          <p className="text-[11px] text-[#A8A29E] truncate">{selected.address}</p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="flex-shrink-0 text-[11px] text-[#A8A29E] hover:text-[#E05A28] transition font-medium"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value) }}
          onFocus={() => { if (results.length > 0) setShowDrop(true) }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full h-10 px-3.5 rounded-xl bg-[#F8F6F3] border border-[#EDE6DC] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:border-[#E05A28]/50 focus:ring-2 focus:ring-[#E05A28]/10"
        />
        {searching && (
          <svg className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A29E]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        )}
      </div>
      {showDrop && results.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-[#EDE6DC] rounded-xl shadow-lg overflow-hidden">
          {results.map((r) => (
            <button
              key={r.placeId}
              type="button"
              className="w-full text-left px-3.5 py-2.5 hover:bg-[#F8F6F3] border-b border-[#F0EDE9] last:border-0 transition-colors"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(r) }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[13px] font-medium text-[#111] truncate">{r.name}</p>
                {r.rating && <span className="text-[11px] text-[#E0A82E] flex-shrink-0">{r.rating.toFixed(1)}★</span>}
              </div>
              <p className="text-[11px] text-[#A8A29E] truncate mt-0.5">{r.address}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
