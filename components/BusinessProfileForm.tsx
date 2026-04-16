'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from './ui/Input'
import Textarea from './ui/Textarea'
import Select from './ui/Select'
import Button from './ui/Button'
import type { BusinessProfile } from '@/types'

interface BusinessProfileFormProps {
  userId: string
  existingProfile?: BusinessProfile | null
  redirectTo?: string
}

interface PlaceResult {
  placeId: string
  name: string
  address: string
  rating?: number
  mapsUrl: string
}

const businessTypeOptions = [
  { value: '', label: 'Select business type...' },
  { value: 'Restaurant', label: 'Restaurant' },
  { value: 'Dental Practice', label: 'Dental Practice' },
  { value: 'Hair Salon', label: 'Hair Salon' },
  { value: 'Med Spa', label: 'Med Spa' },
  { value: 'Auto Repair', label: 'Auto Repair' },
  { value: 'Law Firm', label: 'Law Firm' },
  { value: 'Home Services', label: 'Home Services' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Other', label: 'Other' },
]

const vibeOptions = [
  { value: '', label: 'Select vibe...' },
  { value: 'casual', label: 'Casual & Relaxed' },
  { value: 'upscale', label: 'Upscale & Fine Dining' },
  { value: 'family_friendly', label: 'Family-Friendly' },
  { value: 'trendy', label: 'Trendy & Modern' },
  { value: 'cozy', label: 'Cozy & Intimate' },
  { value: 'lively', label: 'Lively & Social' },
  { value: 'rustic', label: 'Rustic & Homey' },
  { value: 'fast-casual', label: 'Fast Casual' },
]

const voiceOptions = [
  { value: '', label: 'Select voice style...' },
  { value: 'warm and personal', label: 'Warm & Personal' },
  { value: 'professional and polished', label: 'Professional & Polished' },
  { value: 'fun and playful', label: 'Fun & Playful' },
  { value: 'formal and reserved', label: 'Formal & Reserved' },
  { value: 'friendly and casual', label: 'Friendly & Casual' },
  { value: 'sincere and humble', label: 'Sincere & Humble' },
  { value: 'enthusiastic and energetic', label: 'Enthusiastic & Energetic' },
]

export default function BusinessProfileForm({
  userId,
  existingProfile,
  redirectTo = '/dashboard',
}: BusinessProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    business_name: existingProfile?.business_name ?? '',
    business_type: existingProfile?.business_type ?? '',
    vibe: existingProfile?.vibe ?? '',
    voice_style: existingProfile?.voice_style ?? '',
    description: existingProfile?.description ?? '',
    owner_name: existingProfile?.owner_name ?? '',
    google_maps_url: existingProfile?.google_maps_url ?? '',
    yelp_url: existingProfile?.yelp_url ?? '',
    tripadvisor_url: existingProfile?.tripadvisor_url ?? '',
  })

  // Tracks address from Places selection for Yelp/TA search links
  const [placesAddress, setPlacesAddress] = useState('')
  // Tracks whether google_maps_url was auto-filled from Places
  const [mapsUrlAutoFilled, setMapsUrlAutoFilled] = useState(false)
  // Tracks auto-fill state for Yelp / TripAdvisor
  const [urlSearching, setUrlSearching] = useState(false)
  const [yelpAutoFilled, setYelpAutoFilled] = useState(false)
  const [taAutoFilled, setTaAutoFilled] = useState(false)

  // Autocomplete state
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([])
  const [placesLoading, setPlacesLoading] = useState(false)
  const [placesSearched, setPlacesSearched] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchPlaces = useCallback(async (query: string) => {
    setPlacesLoading(true)
    setPlacesSearched(false)
    try {
      const res = await fetch(`/api/places-search?query=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPlaceResults(data.results ?? [])
      setPlacesSearched(true)
      setDropdownOpen(true)
    } catch {
      setPlaceResults([])
      setPlacesSearched(true)
    } finally {
      setPlacesLoading(false)
    }
  }, [])

  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, business_name: value }))
    setMapsUrlAutoFilled(false)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.length >= 2) {
      debounceRef.current = setTimeout(() => {
        fetchPlaces(value)
      }, 350)
    } else {
      setDropdownOpen(false)
      setPlaceResults([])
      setPlacesSearched(false)
    }
  }

  const handlePlaceSelect = async (place: PlaceResult) => {
    setForm((prev) => ({
      ...prev,
      business_name: place.name,
      google_maps_url: place.mapsUrl,
    }))
    setPlacesAddress(place.address)
    setMapsUrlAutoFilled(true)
    setDropdownOpen(false)
    setPlaceResults([])
    setPlacesSearched(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Auto-find Yelp + TripAdvisor URLs via Outscraper search
    setUrlSearching(true)
    setYelpAutoFilled(false)
    setTaAutoFilled(false)
    try {
      const res = await fetch('/api/find-business-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: place.name, address: place.address }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.yelpUrl) {
          setForm((prev) => ({ ...prev, yelp_url: prev.yelp_url || data.yelpUrl }))
          setYelpAutoFilled(true)
        }
        if (data.tripAdvisorUrl) {
          setForm((prev) => ({ ...prev, tripadvisor_url: prev.tripadvisor_url || data.tripAdvisorUrl }))
          setTaAutoFilled(true)
        }
      }
    } catch {
      // Silently fail — user can still fill manually
    } finally {
      setUrlSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setDropdownOpen(false)
    }
  }

  // Build Yelp / TA search URLs using whatever name+address we have
  const yelpSearchUrl = `https://www.yelp.com/search?find_desc=${encodeURIComponent(form.business_name)}&find_loc=${encodeURIComponent(placesAddress)}`
  const taSearchUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(`${form.business_name} ${placesAddress}`.trim())}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      business_name: form.business_name,
      business_type: form.business_type,
      vibe: form.vibe,
      voice_style: form.voice_style,
      description: form.description,
      owner_name: form.owner_name,
      google_maps_url: form.google_maps_url,
      yelp_url: form.yelp_url,
      tripadvisor_url: form.tripadvisor_url,
    }

    if (existingProfile) {
      const { data: updated, error: updateError } = await supabase
        .from('business_profiles')
        .update(payload)
        .eq('id', existingProfile.id)
        .eq('user_id', userId)
        .select('id')

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }
      if (!updated || updated.length === 0) {
        setError('Could not save — please refresh and try again.')
        setLoading(false)
        return
      }
    } else {
      const { error: insertError } = await supabase
        .from('business_profiles')
        .insert({ ...payload, user_id: userId })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
    }

    // New profiles get the demo moment; updates go to redirectTo
    if (existingProfile) {
      router.push(redirectTo)
    } else {
      router.push('/onboarding/demo')
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Business Name with Places autocomplete */}
      <div ref={dropdownRef} className="relative">
        <label
          htmlFor="business_name"
          className="block text-[13px] font-semibold text-[#111] mb-1.5"
        >
          Business Name <span className="text-[#E05A28]">*</span>
        </label>
        <div className="relative">
          <input
            id="business_name"
            type="text"
            required
            value={form.business_name}
            onChange={handleBusinessNameChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Bright Smile Dental"
            autoComplete="off"
            className="w-full h-10 px-3.5 rounded-xl border border-[#E4DED8] bg-[#F8F6F3] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:border-[#E05A28]/50 focus:ring-2 focus:ring-[#E05A28]/10 transition-all pr-9"
          />
          {placesLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="w-4 h-4 animate-spin text-[#A8A29E]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>
          )}
        </div>

        {dropdownOpen && (
          <div className="absolute z-50 w-full bg-white rounded-xl border border-[#E4DED8] shadow-lg mt-1 overflow-hidden max-h-[280px] overflow-y-auto">
            {placeResults.length > 0 ? (
              placeResults.map((place) => (
                <button
                  key={place.placeId}
                  type="button"
                  className="w-full text-left px-4 py-3 cursor-pointer hover:bg-[#F8F6F3] transition-colors"
                  onClick={() => handlePlaceSelect(place)}
                >
                  <div className="text-[13px] font-semibold text-[#111]">{place.name}</div>
                  <div className="text-[11px] text-[#A8A29E] mt-0.5">{place.address}</div>
                </button>
              ))
            ) : placesSearched ? (
              <div className="px-4 py-3 text-[13px] text-[#A8A29E]">No results found</div>
            ) : null}
          </div>
        )}
      </div>

      <Input
        id="owner_name"
        label="Your Name (Owner)"
        required
        value={form.owner_name}
        onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
        placeholder="e.g. Marco"
      />
      <Select
        id="business_type"
        label="Business Type"
        required
        value={form.business_type}
        onChange={(e) => setForm({ ...form, business_type: e.target.value })}
        options={businessTypeOptions}
      />
      <Select
        id="vibe"
        label="Business Vibe"
        required
        value={form.vibe}
        onChange={(e) => setForm({ ...form, vibe: e.target.value })}
        options={vibeOptions}
      />
      <Select
        id="voice_style"
        label="Reply Voice Style"
        required
        value={form.voice_style}
        onChange={(e) => setForm({ ...form, voice_style: e.target.value })}
        options={voiceOptions}
      />
      <Textarea
        id="description"
        label="Tell Us About Your Business"
        required
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="A brief description — what makes your business special, your story, what customers love most..."
        rows={4}
      />

      {/* Platform URLs */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E] mb-3">
          Platform URLs
        </p>
        <div className="space-y-4">
          {/* Google Maps URL */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label
                htmlFor="google_maps_url"
                className="text-[13px] font-semibold text-[#111]"
              >
                Google Maps URL
              </label>
              <span className="text-[11px] text-[#A8A29E]">(optional)</span>
              {mapsUrlAutoFilled && (
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Auto-filled ✓
                </span>
              )}
            </div>
            <input
              id="google_maps_url"
              type="url"
              value={form.google_maps_url}
              onChange={(e) => {
                setMapsUrlAutoFilled(false)
                setForm({ ...form, google_maps_url: e.target.value })
              }}
              placeholder="https://maps.google.com/..."
              className="w-full h-10 px-3.5 rounded-xl border border-[#E4DED8] bg-[#F8F6F3] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:border-[#E05A28]/50 focus:ring-2 focus:ring-[#E05A28]/10 transition-all"
            />
          </div>

          {/* Yelp URL */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label
                htmlFor="yelp_url"
                className="text-[13px] font-semibold text-[#111]"
              >
                Yelp URL
              </label>
              <span className="text-[11px] text-[#A8A29E]">(optional)</span>
              {urlSearching && !yelpAutoFilled && (
                <span className="flex items-center gap-1 text-[11px] text-[#A8A29E]">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Searching…
                </span>
              )}
              {yelpAutoFilled && (
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Auto-filled ✓
                </span>
              )}
              {!urlSearching && !yelpAutoFilled && form.business_name && (
                <a
                  href={yelpSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#E05A28] hover:text-[#C94E21] transition-colors"
                >
                  Find on Yelp →
                </a>
              )}
            </div>
            <input
              id="yelp_url"
              type="url"
              value={form.yelp_url}
              onChange={(e) => {
                setYelpAutoFilled(false)
                setForm({ ...form, yelp_url: e.target.value })
              }}
              placeholder="https://www.yelp.com/biz/your-business"
              className="w-full h-10 px-3.5 rounded-xl border border-[#E4DED8] bg-[#F8F6F3] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:border-[#E05A28]/50 focus:ring-2 focus:ring-[#E05A28]/10 transition-all"
            />
          </div>

          {/* TripAdvisor URL */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label
                htmlFor="tripadvisor_url"
                className="text-[13px] font-semibold text-[#111]"
              >
                TripAdvisor URL
              </label>
              <span className="text-[11px] text-[#A8A29E]">(optional)</span>
              {urlSearching && !taAutoFilled && (
                <span className="flex items-center gap-1 text-[11px] text-[#A8A29E]">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Searching…
                </span>
              )}
              {taAutoFilled && (
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Auto-filled ✓
                </span>
              )}
              {!urlSearching && !taAutoFilled && form.business_name && (
                <a
                  href={taSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#E05A28] hover:text-[#C94E21] transition-colors"
                >
                  Find on TripAdvisor →
                </a>
              )}
            </div>
            <input
              id="tripadvisor_url"
              type="url"
              value={form.tripadvisor_url}
              onChange={(e) => {
                setTaAutoFilled(false)
                setForm({ ...form, tripadvisor_url: e.target.value })
              }}
              placeholder="https://www.tripadvisor.com/Restaurant_Review-..."
              className="w-full h-10 px-3.5 rounded-xl border border-[#E4DED8] bg-[#F8F6F3] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:border-[#E05A28]/50 focus:ring-2 focus:ring-[#E05A28]/10 transition-all"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-2.5">
          <svg
            className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full">
        {existingProfile ? 'Save Changes' : 'Set Up My Business →'}
      </Button>
    </form>
  )
}
