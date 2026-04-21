'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type PlaceResult = { placeId: string; name: string; address: string; rating?: number; mapsUrl: string }

const BUSINESS_TYPE_OPTIONS = ['Restaurant', 'Dental Practice', 'Hair Salon', 'Med Spa', 'Auto Repair', 'Law Firm', 'Home Services', 'Retail', 'Other']

const VIBE_OPTIONS = [
  { value: 'casual',          label: 'Casual & Relaxed' },
  { value: 'upscale',         label: 'Upscale & Professional' },
  { value: 'family_friendly', label: 'Friendly & Welcoming' },
  { value: 'trendy',          label: 'Modern & Premium' },
]

const TONE_OPTIONS = [
  { value: 'warm and personal',         label: 'Warm & Personal' },
  { value: 'professional and polished', label: 'Professional & Polished' },
  { value: 'fun and playful',           label: 'Fun & Playful' },
  { value: 'formal and reserved',       label: 'Formal & Reserved' },
]

function OptionButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-3.5 min-h-[44px] rounded-xl text-[13px] font-medium border transition-all duration-150 text-center ${
        selected
          ? 'bg-[#FEF0E8] border-[#E05A28] text-[#E05A28]'
          : 'bg-white border-[#E4DED8] text-[#333] hover:border-[#CEC8C1]'
      }`}
    >
      {children}
    </button>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-2.5">
      <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-[13px] text-red-600">{message}</p>
    </div>
  )
}

const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-[#E4DED8] hover:border-[#CEC8C1] text-[#111] text-sm placeholder:text-[#C4BEB8] bg-[#F8F6F3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] transition-all duration-150"

// Platform logos (inline, no external images)
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.226 17.64 11.918 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

const DRAFT_KEY = 'replyfi_onboarding_draft'

interface OnboardingDraft {
  step: number
  businessName: string
  businessType: string
  ownerName: string
  vibe: string
  replyTone: string
  googleUrl: string
  yelpUrl: string
  voiceTrainingText: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  // Step 1
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [ownerName, setOwnerName] = useState('')

  // Step 2
  const [vibe, setVibe] = useState('')
  const [replyTone, setReplyTone] = useState('')

  // Step 3 — platforms
  const [googleUrl, setGoogleUrl] = useState('')
  const [yelpUrl, setYelpUrl] = useState('')

  // Google search autocomplete
  const [googleQuery, setGoogleQuery] = useState('')
  const [googleResults, setGoogleResults] = useState<PlaceResult[]>([])
  const [googleSearching, setGoogleSearching] = useState(false)
  const [showGoogleDrop, setShowGoogleDrop] = useState(false)
  const [selectedGoogle, setSelectedGoogle] = useState<{ name: string; address: string } | null>(null)
  const googleDropRef = useRef<HTMLDivElement>(null)

  // Step 4 — training
  const [voiceTrainingText, setVoiceTrainingText] = useState('')

  // Auth guard + load draft from localStorage on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (profile) { router.replace('/dashboard'); return }

      // Restore draft if present
      try {
        const saved = localStorage.getItem(DRAFT_KEY)
        if (saved) {
          const draft: OnboardingDraft = JSON.parse(saved)
          setStep(draft.step ?? 1)
          setBusinessName(draft.businessName ?? '')
          setBusinessType(draft.businessType ?? '')
          setOwnerName(draft.ownerName ?? '')
          setVibe(draft.vibe ?? '')
          setReplyTone(draft.replyTone ?? '')
          setGoogleUrl(draft.googleUrl ?? '')
          setYelpUrl(draft.yelpUrl ?? '')
          setVoiceTrainingText(draft.voiceTrainingText ?? '')
          // If a google URL was saved, show a generic "saved" chip so the user can see it
          if (draft.googleUrl) {
            setSelectedGoogle({ name: 'Saved listing', address: draft.googleUrl.slice(0, 60) + '…' })
          }
        }
      } catch {
        // Ignore parse errors
      }

      setChecking(false)
    }
    checkAuth()
  }, [router])

  // Persist draft to localStorage whenever form state changes
  useEffect(() => {
    if (checking) return
    try {
      const draft: OnboardingDraft = {
        step, businessName, businessType, ownerName,
        vibe, replyTone, googleUrl, yelpUrl, voiceTrainingText,
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // Ignore storage errors
    }
  }, [checking, step, businessName, businessType, ownerName, vibe, replyTone, googleUrl, yelpUrl, voiceTrainingText])

  // Pre-populate Google search when entering step 3
  useEffect(() => {
    if (step === 3 && !selectedGoogle && !googleUrl && businessName) {
      setGoogleQuery(businessName)
    }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced Google Places search
  useEffect(() => {
    if (googleQuery.length < 2) {
      setGoogleResults([])
      setShowGoogleDrop(false)
      return
    }
    const t = setTimeout(async () => {
      setGoogleSearching(true)
      try {
        const res = await fetch(`/api/places-search?query=${encodeURIComponent(googleQuery)}`)
        const data = await res.json()
        const results: PlaceResult[] = data.results ?? []
        setGoogleResults(results)
        setShowGoogleDrop(results.length > 0)
      } catch {
        setGoogleResults([])
      } finally {
        setGoogleSearching(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [googleQuery])

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (googleDropRef.current && !googleDropRef.current.contains(e.target as Node)) {
        setShowGoogleDrop(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function selectGooglePlace(place: PlaceResult) {
    setGoogleUrl(place.mapsUrl)
    setSelectedGoogle({ name: place.name, address: place.address })
    setShowGoogleDrop(false)
    setGoogleResults([])
    setError('')
  }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!businessName.trim() || !businessType || !ownerName.trim()) {
      setError('Please fill in all fields.')
      return
    }
    setStep(2)
  }

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!vibe || !replyTone) {
      setError('Please select both a vibe and a reply tone.')
      return
    }
    setStep(3)
  }

  const handleStep3 = () => {
    setError('')
    // Validate URLs if provided
    if (googleUrl.trim() && !googleUrl.includes('google.com/maps') && !googleUrl.includes('maps.google') && !googleUrl.includes('goo.gl/maps')) {
      setError("That Google Maps URL doesn't look right. Search your business on maps.google.com and copy the URL from your browser.")
      return
    }
    if (yelpUrl.trim() && !/yelp\.(com|to)/i.test(yelpUrl)) {
      setError("That Yelp URL doesn't look right. It should be a yelp.com link.")
      return
    }
    setStep(4)
  }

  const handleFinish = async (skip: boolean) => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      // Check if a primary profile was partially saved (e.g. user refreshed mid-flow)
      const { data: existingProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .maybeSingle()

      const profileData = {
        user_id: user.id,
        business_name: businessName.trim(),
        business_type: businessType,
        owner_name: ownerName.trim(),
        vibe,
        voice_style: replyTone,
        description: skip ? '' : (voiceTrainingText.trim() || ''),
        is_primary: true,
        ...(googleUrl.trim() && { google_maps_url: googleUrl.trim() }),
        ...(yelpUrl.trim() && { yelp_url: yelpUrl.trim() }),
      }

      let profileError: { message?: string } | null = null
      if (existingProfile?.id) {
        const { error } = await supabase
          .from('business_profiles')
          .update(profileData)
          .eq('id', existingProfile.id)
        profileError = error
      } else {
        const { error } = await supabase
          .from('business_profiles')
          .insert(profileData)
        profileError = error
      }

      if (profileError) {
        console.error('[ReplyFi] Onboarding save error:', profileError)
        setError(profileError.message || 'Failed to save your profile. Please try again.')
        setLoading(false)
        return
      }

      // Only set trial_started_at if it hasn't been set already (signup sets it first)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('trial_started_at')
        .eq('id', user.id)
        .maybeSingle()
      if (!existingProfile?.trial_started_at) {
        await supabase
          .from('profiles')
          .update({ trial_started_at: new Date().toISOString() })
          .eq('id', user.id)
      }

      // Kick off first sync if any platform was connected
      if (googleUrl.trim() || yelpUrl.trim()) {
        fetch('/api/sync-all', { method: 'POST', headers: { 'Content-Type': 'application/json' } }).catch(() => {})
      }

      // Clear draft on successful completion
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('[ReplyFi] Unexpected onboarding error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const stepLabels = ['Basics', 'Voice', 'Platforms', 'Train']
  const totalSteps = stepLabels.length

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center">
        <svg className="animate-spin h-6 w-6 text-[#E05A28]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F6F3] flex flex-col items-center justify-center px-4 py-10 sm:py-12">

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-7">
        <div className="w-8 h-8 rounded-lg bg-[#E05A28] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 20 20" fill="none" style={{ width: 16, height: 16 }}>
            <path d="M2 1.5h9A1.5 1.5 0 0112.5 3v5A1.5 1.5 0 0111 9.5H7l-2 2v-2H2A1.5 1.5 0 01.5 8V3A1.5 1.5 0 012 1.5z" fill="white" fillOpacity="0.5" />
            <path d="M8 8h9.5A1.5 1.5 0 0119 9.5v5A1.5 1.5 0 0117.5 16H16v2.5l-3-2.5H8A1.5 1.5 0 016.5 14.5v-5A1.5 1.5 0 018 8z" fill="white" />
          </svg>
        </div>
        <span className="text-[16px] font-bold text-[#111] tracking-tight">ReplyFi</span>
      </div>

      <div className="w-full max-w-sm animate-fade-up">

        {/* Progress */}
        <div className="mb-5">
          <div className="h-1.5 bg-[#EDE9E4] rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-[#E05A28] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            {stepLabels.map((label, i) => {
              const s = i + 1
              const done = step > s
              const active = step === s
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                    done ? 'bg-emerald-500 text-white' : active ? 'bg-[#E05A28] text-white' : 'bg-[#E4DED8] text-[#A8A29E]'
                  }`}>
                    {done ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : s}
                  </div>
                  <span className={`text-[12px] font-medium transition-colors ${active ? 'text-[#111]' : done ? 'text-[#A8A29E]' : 'text-[#C4BEB8]'}`}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E4DED8] shadow-modal p-6 sm:p-8">

          {/* ── Step 1: Basics ─────────────────────────────────────── */}
          {step === 1 && (
            <>
              <h2 className="text-[18px] font-bold text-[#111] tracking-[-0.02em] mb-1">Business Basics</h2>
              <p className="text-[13px] text-[#A8A29E] mb-5">Takes 30 seconds — we only need the essentials.</p>
              <form onSubmit={handleStep1} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="business-name" className="block text-[13px] font-medium text-[#111] mb-1.5">Business Name</label>
                    <input
                      id="business-name"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Bright Smile Dental"
                      required
                      autoFocus
                      maxLength={100}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="owner-name" className="block text-[13px] font-medium text-[#111] mb-1.5">Your First Name</label>
                    <input
                      id="owner-name"
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Alex"
                      required
                      maxLength={80}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="business-type" className="block text-[13px] font-medium text-[#111] mb-1.5">Business Type</label>
                  <select
                    id="business-type"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    required
                    className={`${inputClass} appearance-none`}
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A8A29E' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  >
                    <option value="" disabled>Select business type</option>
                    {BUSINESS_TYPE_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {error && <ErrorBox message={error} />}
                <button
                  type="submit"
                  className="w-full min-h-[48px] rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] active:scale-[0.98] text-white font-semibold text-[14px] transition-all duration-150 mt-1 shadow-[0_2px_12px_rgba(224,90,40,0.25)]"
                >
                  Continue →
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: Voice ──────────────────────────────────────── */}
          {step === 2 && (
            <>
              <h2 className="text-[18px] font-bold text-[#111] tracking-[-0.02em] mb-1">Your Voice</h2>
              <p className="text-[13px] text-[#A8A29E] mb-5">This shapes how all your replies will sound.</p>
              <form onSubmit={handleStep2} className="space-y-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.10em] text-[#A8A29E] mb-2.5">Business Vibe</p>
                  <div className="grid grid-cols-2 gap-2">
                    {VIBE_OPTIONS.map((opt) => (
                      <OptionButton key={opt.value} selected={vibe === opt.value} onClick={() => setVibe(opt.value)}>
                        {opt.label}
                      </OptionButton>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.10em] text-[#A8A29E] mb-2.5">Reply Tone</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TONE_OPTIONS.map((opt) => (
                      <OptionButton key={opt.value} selected={replyTone === opt.value} onClick={() => setReplyTone(opt.value)}>
                        {opt.label}
                      </OptionButton>
                    ))}
                  </div>
                </div>
                {error && <ErrorBox message={error} />}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError('') }}
                    className="flex-1 min-h-[48px] rounded-xl border border-[#E4DED8] bg-white hover:bg-[#F8F6F3] text-[#555] font-medium text-[13px] transition-all duration-150"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] min-h-[48px] rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] active:scale-[0.98] text-white font-semibold text-[14px] transition-all duration-150 shadow-[0_2px_12px_rgba(224,90,40,0.25)]"
                  >
                    Continue →
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── Step 3: Platforms ──────────────────────────────────── */}
          {step === 3 && (
            <>
              <h2 className="text-[18px] font-bold text-[#111] tracking-[-0.02em] mb-1">Connect Your Platforms</h2>
              <p className="text-[13px] text-[#A8A29E] mb-5">
                Search your business name — we&apos;ll find your listing. After setup, connect Google Business Profile in Settings to post replies directly to Google.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); handleStep3() }}>
              <div className="space-y-3">

                {/* Google — primary */}
                <div className="rounded-xl border border-[#E4DED8] bg-[#FAFAF8] p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <GoogleIcon />
                    <span className="text-[13px] font-semibold text-[#111]">Google Maps</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full leading-none">Recommended · Direct posting available</span>
                  </div>

                  {selectedGoogle ? (
                    <div className="flex items-center justify-between gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#111] truncate">{selectedGoogle.name}</p>
                        <p className="text-[11px] text-[#A8A29E] truncate">{selectedGoogle.address}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedGoogle(null); setGoogleUrl(''); setGoogleQuery(businessName); setError('') }}
                        className="flex-shrink-0 text-[11px] text-[#A8A29E] hover:text-[#E05A28] transition font-medium"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="relative" ref={googleDropRef}>
                      <div className="relative">
                        <input
                          type="text"
                          value={googleQuery}
                          onChange={(e) => { setGoogleQuery(e.target.value); setGoogleUrl(''); setError('') }}
                          onFocus={() => { if (googleResults.length > 0) setShowGoogleDrop(true) }}
                          placeholder="Search your business by name…"
                          maxLength={200}
                          className={inputClass}
                          autoComplete="off"
                        />
                        {googleSearching && (
                          <svg className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A29E]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                          </svg>
                        )}
                      </div>
                      {showGoogleDrop && googleResults.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-[#E4DED8] rounded-xl shadow-lg overflow-hidden">
                          {googleResults.map((r) => (
                            <button
                              key={r.placeId}
                              type="button"
                              className="w-full text-left px-3.5 py-2.5 hover:bg-[#F8F6F3] border-b border-[#F0EDE9] last:border-0 transition-colors"
                              onMouseDown={(e) => { e.preventDefault(); selectGooglePlace(r) }}
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
                  )}
                </div>

                {/* Yelp — optional */}
                <div className="rounded-xl border border-[#E4DED8] bg-[#FAFAF8] p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF1A1A"><path d="M21.111 18.226c-.141.969-2.119 3.483-3.029 3.847-.311.124-.611.094-.838-.09-.154-.12-.314-.365-2.447-3.827l-.633-1.046c-.2-.316-.16-.722.094-1.016a1.4 1.4 0 011.046-.477l.049.001c.025.001 3.793.337 4.001.356.406.037.68.221.802.534.093.237.083.512-.045.718zM9.535 14.947c-.157.557-.803 3.47-.868 4.044a.83.83 0 00.33.782c.21.155.501.195.83.115 1.028-.255 3.174-2.161 3.427-3.117a1.28 1.28 0 00-.156-1.017 1.304 1.304 0 00-.893-.578l-1.177-.188c-.405-.064-.794-.023-1.064.145a.887.887 0 00-.429.814zM21.245 12.55c-.189-.444-2.348-2.464-3.308-3.15a.852.852 0 00-.839-.084c-.296.136-.49.435-.528.806-.006.055-.314 3.813-.349 4.026-.07.411.065.726.38.893.228.122.516.124.786.005l1.076-.47c.375-.163 3.1-1.354 3.241-1.597a.826.826 0 00-.459-1.429zm-10.617-8.42C10.36 3.52 9.853.972 9.686.57 9.55.252 9.319.065 9.035.009c-.296-.058-.633.05-.913.299C7.27 1.074 6.144 4.057 6.178 5.045c.018.516.217.927.561 1.159.327.22.748.265 1.185.127l1.124-.343c.394-.12 2.785-.879 2.58-1.858zm-2.261 7.197c.28-.276.38-.676.27-1.073L8.14 9.047c-.108-.387-.392-2.74-.433-2.903-.085-.338-.302-.56-.6-.611a.848.848 0 00-.786.292C5.587 6.712 4.12 9.566 4.08 10.55c-.021.508.148.935.477 1.203.309.251.727.334 1.168.232l1.151-.265c.402-.092 1.972-.704 2.491-.393z"/></svg>
                    <span className="text-[13px] font-semibold text-[#111]">Yelp</span>
                    <span className="text-[10px] font-medium text-[#A8A29E] bg-[#F3F0EC] border border-[#E4DED8] px-1.5 py-0.5 rounded-full leading-none">Optional</span>
                  </div>
                  <input
                    type="url"
                    value={yelpUrl}
                    onChange={(e) => { setYelpUrl(e.target.value); setError('') }}
                    placeholder="https://yelp.com/biz/your-business-city"
                    maxLength={500}
                    className={inputClass}
                  />
                  <p className="text-xs text-[#A8A29E] leading-relaxed">
                    <a
                      href={`https://www.yelp.com/search?find_desc=${encodeURIComponent(businessName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E05A28] hover:underline font-medium"
                    >
                      Find your listing on Yelp →
                    </a>
                    {' '}then paste the URL here.
                  </p>
                </div>

              </div>

              {error && <div className="mt-3"><ErrorBox message={error} /></div>}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setStep(2); setError('') }}
                  className="flex-1 min-h-[48px] rounded-xl border border-[#E4DED8] bg-white hover:bg-[#F8F6F3] text-[#555] font-medium text-[13px] transition-all duration-150"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-[2] min-h-[48px] rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] active:scale-[0.98] text-white font-semibold text-[14px] transition-all duration-150 shadow-[0_2px_12px_rgba(224,90,40,0.25)]"
                >
                  Continue →
                </button>
              </div>
              </form>

              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={() => { setError(''); setStep(4) }}
                  className="text-[13px] font-medium text-[#57534E] border border-[#E4DED8] rounded-xl px-4 py-2.5 hover:bg-[#F8F6F3] transition-colors duration-150"
                >
                  Skip — I'll add these later
                </button>
              </div>
            </>
          )}

          {/* ── Step 4: Voice Training ─────────────────────────────── */}
          {step === 4 && (
            <>
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-[18px] font-bold text-[#111] tracking-[-0.02em]">Train Your Voice</h2>
                <span className="text-[11px] font-medium text-[#A8A29E] bg-[#F3F0EC] px-2 py-0.5 rounded-full mt-0.5">Optional</span>
              </div>
              <p className="text-[13px] text-[#A8A29E] mb-5">
                Paste 3–5 of your past review replies and we&apos;ll match your exact writing style.
              </p>
              <div className="space-y-4">
                <textarea
                  value={voiceTrainingText}
                  onChange={(e) => setVoiceTrainingText(e.target.value)}
                  placeholder="Paste your past review replies here…"
                  rows={6}
                  maxLength={1000}
                  className="w-full px-3.5 py-3 rounded-xl border border-[#E4DED8] hover:border-[#CEC8C1] text-[#111] text-[13px] placeholder:text-[#C4BEB8] bg-[#F8F6F3] hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] transition-all duration-150 resize-none leading-relaxed"
                />
                {error && <ErrorBox message={error} />}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => handleFinish(false)}
                    disabled={loading}
                    className="flex-1 h-11 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] active:scale-[0.98] text-white font-semibold text-[14px] transition-all duration-150 disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(224,90,40,0.25)]"
                  >
                    {loading && (
                      <svg className="animate-spin h-4 w-4 opacity-80" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {loading ? 'Saving…' : 'Save & continue'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinish(true)}
                    disabled={loading}
                    className="h-11 px-5 rounded-xl border border-[#E4DED8] bg-white hover:bg-[#F8F6F3] text-[#57534E] hover:text-[#333] font-medium text-[13px] transition-all duration-150 disabled:opacity-40"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Step indicator text */}
        <p className="text-center text-[11px] text-[#C4BEB8] mt-4">
          Step {step} of {totalSteps}
        </p>

      </div>
    </div>
  )
}
