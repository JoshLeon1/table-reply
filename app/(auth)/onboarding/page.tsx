'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const BUSINESS_TYPE_OPTIONS = ['Restaurant', 'Dental Practice', 'Hair Salon', 'Med Spa', 'Auto Repair', 'Law Firm', 'Home Services', 'Retail', 'Other']

const VIBE_OPTIONS = [
  { value: 'casual',          label: 'Casual & Relaxed' },
  { value: 'upscale',         label: 'Upscale & Refined' },
  { value: 'family_friendly', label: 'Family-Friendly' },
  { value: 'trendy',          label: 'Trendy & Modern' },
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
      className={`px-3.5 py-3 rounded-xl text-[13px] font-medium border transition-all duration-150 text-left ${
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
    <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-2.5">
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
  const [taUrl, setTaUrl] = useState('')

  // Step 4 — training
  const [voiceTrainingText, setVoiceTrainingText] = useState('')

  // Auth guard
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
      setChecking(false)
    }
    checkAuth()
  }, [router])

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
      setError("That Google Maps URL doesn't look right. Search your restaurant on maps.google.com and copy the URL from your browser.")
      return
    }
    if (yelpUrl.trim() && !yelpUrl.includes('yelp.com/biz/')) {
      setError("That Yelp URL doesn't look right. It should look like: yelp.com/biz/your-restaurant-city")
      return
    }
    if (taUrl.trim() && !taUrl.includes('tripadvisor.com')) {
      setError("That TripAdvisor URL doesn't look right.")
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

      const { error: upsertError } = await supabase.from('business_profiles').upsert(
        {
          user_id: user.id,
          business_name: businessName.trim(),
          business_type: businessType,
          owner_name: ownerName.trim(),
          vibe,
          voice_style: replyTone,
          description: skip ? '' : (voiceTrainingText.trim() || ''),
          ...(googleUrl.trim() && { google_maps_url: googleUrl.trim() }),
          ...(yelpUrl.trim() && { yelp_url: yelpUrl.trim() }),
          ...(taUrl.trim() && { tripadvisor_url: taUrl.trim() }),
        },
        { onConflict: 'user_id' }
      )

      if (upsertError) {
        console.error('[Replyfi] Onboarding upsert error:', upsertError)
        setError(upsertError.message || 'Failed to save your profile. Please try again.')
        setLoading(false)
        return
      }

      await supabase
        .from('profiles')
        .update({ trial_started_at: new Date().toISOString() })
        .eq('id', user.id)

      // Kick off first sync if any platform was connected
      if (googleUrl.trim() || yelpUrl.trim() || taUrl.trim()) {
        fetch('/api/sync-all', { method: 'POST', headers: { 'Content-Type': 'application/json' } }).catch(() => {})
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('[Replyfi] Unexpected onboarding error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const stepLabels = ['Basics', 'Voice', 'Platforms', 'Training']
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
        <div className="w-8 h-8 rounded-lg bg-[#E05A28] flex items-center justify-center">
          <svg className="text-white" width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 2v4a2 2 0 002 2v6M8 2v10M11 2s2 1 2 3-2 3-2 3v4"/>
          </svg>
        </div>
        <span className="text-[16px] font-bold text-[#111] tracking-tight">Replyfi</span>
      </div>

      <div className="w-full max-w-sm animate-fade-up">

        {/* Progress */}
        <div className="mb-5">
          <div className="h-1.5 bg-[#EDE9E4] rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-[#E05A28] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
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
              <h2 className="text-[18px] font-bold text-[#111] tracking-[-0.02em] mb-1">Restaurant Basics</h2>
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.10em] text-[#A8A29E] mb-2.5">Restaurant Vibe</p>
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
                Paste your listing URLs — Replyfi syncs your reviews daily from each one.
              </p>

              <div className="space-y-3">

                {/* Google — primary */}
                <div className="rounded-xl border border-[#E4DED8] bg-[#FAFAF8] p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <GoogleIcon />
                    <span className="text-[13px] font-semibold text-[#111]">Google Maps</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full leading-none">Recommended</span>
                  </div>
                  <input
                    type="url"
                    value={googleUrl}
                    onChange={(e) => { setGoogleUrl(e.target.value); setError('') }}
                    placeholder="https://maps.google.com/place/Your-Restaurant/..."
                    className={inputClass}
                  />
                  <p className="text-[11px] text-[#A8A29E] leading-relaxed">
                    Open maps.google.com, search your restaurant, then copy the URL from your browser address bar.
                  </p>
                </div>

                {/* Yelp — optional */}
                <div className="rounded-xl border border-[#E4DED8] bg-[#FAFAF8] p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 flex items-center justify-center font-black text-[#FF1A1A] text-[12px] leading-none">y!</span>
                    <span className="text-[13px] font-semibold text-[#111]">Yelp</span>
                    <span className="text-[10px] font-medium text-[#A8A29E] bg-[#F3F0EC] border border-[#E4DED8] px-1.5 py-0.5 rounded-full leading-none">Optional</span>
                  </div>
                  <input
                    type="url"
                    value={yelpUrl}
                    onChange={(e) => { setYelpUrl(e.target.value); setError('') }}
                    placeholder="https://yelp.com/biz/your-restaurant-city"
                    className={inputClass}
                  />
                </div>

                {/* TripAdvisor — optional */}
                <div className="rounded-xl border border-[#E4DED8] bg-[#FAFAF8] p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 flex items-center justify-center font-black text-[#34E0A1] text-[10px] leading-none">TA</span>
                    <span className="text-[13px] font-semibold text-[#111]">TripAdvisor</span>
                    <span className="text-[10px] font-medium text-[#A8A29E] bg-[#F3F0EC] border border-[#E4DED8] px-1.5 py-0.5 rounded-full leading-none">Optional</span>
                  </div>
                  <input
                    type="url"
                    value={taUrl}
                    onChange={(e) => { setTaUrl(e.target.value); setError('') }}
                    placeholder="https://tripadvisor.com/Restaurant_Review-..."
                    className={inputClass}
                  />
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
                  type="button"
                  onClick={handleStep3}
                  className="flex-[2] min-h-[48px] rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] active:scale-[0.98] text-white font-semibold text-[14px] transition-all duration-150 shadow-[0_2px_12px_rgba(224,90,40,0.25)]"
                >
                  Continue →
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setError(''); setStep(4) }}
                className="w-full mt-2 text-[12px] text-[#C4BEB8] hover:text-[#A8A29E] transition-colors duration-150 py-1"
              >
                Skip — I'll add these later
              </button>
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
                  className="w-full px-3.5 py-3 rounded-xl border border-[#E4DED8] hover:border-[#CEC8C1] text-[#111] text-[13px] placeholder:text-[#C4BEB8] bg-[#F8F6F3] hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] transition-all duration-150 resize-none leading-relaxed"
                />
                {error && <ErrorBox message={error} />}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleFinish(true)}
                    disabled={loading}
                    className="flex-1 min-h-[48px] rounded-xl border border-[#E4DED8] bg-white hover:bg-[#F8F6F3] text-[#57534E] font-medium text-[13px] transition-all duration-150 disabled:opacity-40"
                  >
                    Skip for Now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinish(false)}
                    disabled={loading}
                    className="flex-[2] min-h-[52px] rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] active:scale-[0.98] text-white font-semibold text-[15px] transition-all duration-150 disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(224,90,40,0.25)]"
                  >
                    {loading && (
                      <svg className="animate-spin h-4 w-4 opacity-80" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {loading ? 'Setting Up…' : 'Go to Dashboard →'}
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
