'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'

const CUISINE_OPTIONS = [
  'American', 'Italian', 'Mexican', 'Japanese', 'Chinese', 'Thai', 'Indian',
  'Mediterranean', 'French', 'Greek', 'Spanish', 'Korean', 'Vietnamese',
  'Middle Eastern', 'Seafood', 'Steakhouse', 'Pizza', 'Burgers', 'Cafe & Brunch',
  'Bakery', 'Vegan & Vegetarian', 'Food Truck', 'Bar & Grill', 'Fine Dining', 'Other',
]

const VIBE_OPTIONS = [
  { value: 'casual_relaxed',    label: 'Casual & Relaxed' },
  { value: 'upscale_refined',   label: 'Upscale & Refined' },
  { value: 'family_friendly',   label: 'Family-Friendly' },
  { value: 'trendy_modern',     label: 'Trendy & Modern' },
]

const TONE_OPTIONS = [
  { value: 'warm_personal',         label: 'Warm & Personal' },
  { value: 'professional_polished', label: 'Professional & Polished' },
  { value: 'fun_playful',           label: 'Fun & Playful' },
  { value: 'formal_reserved',       label: 'Formal & Reserved' },
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

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [restaurantName, setRestaurantName] = useState('')
  const [cuisineType, setCuisineType] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [vibe, setVibe] = useState('')
  const [replyTone, setReplyTone] = useState('')
  const [voiceTrainingText, setVoiceTrainingText] = useState('')

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!restaurantName.trim() || !cuisineType || !ownerName.trim()) {
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

  const handleFinish = async (skip: boolean) => {
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: upsertError } = await supabase.from('restaurant_profiles').upsert(
      {
        user_id: user.id,
        restaurant_name: restaurantName,
        cuisine_type: cuisineType,
        owner_name: ownerName,
        vibe,
        reply_tone: replyTone,
        voice_training_text: skip ? null : (voiceTrainingText.trim() || null),
      },
      { onConflict: 'user_id' }
    )

    if (upsertError) {
      setError(upsertError.message)
      setLoading(false)
      return
    }

    await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id)
    router.push('/dashboard')
    router.refresh()
  }

  const stepLabels = ['Basics', 'Voice', 'Training']

  return (
    <div className="min-h-screen bg-[#F8F6F3] flex flex-col items-center justify-center px-4 py-10 sm:py-12">

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-7">
        <div className="w-8 h-8 rounded-lg bg-[#E05A28] flex items-center justify-center">
          <svg className="text-white" width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 2v4a2 2 0 002 2v6M8 2v10M11 2s2 1 2 3-2 3-2 3v4"/>
          </svg>
        </div>
        <span className="text-[16px] font-bold text-[#111] tracking-tight">TableReply</span>
      </div>

      <div className="w-full max-w-sm animate-fade-up">

        {/* Progress bar + step labels */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
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
          {/* Progress bar */}
          <div className="h-1 bg-[#E4DED8] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E05A28] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / (stepLabels.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E4DED8] shadow-modal p-6 sm:p-8">

          {/* Step 1 */}
          {step === 1 && (
            <>
              <h2 className="text-[18px] font-bold text-[#111] tracking-[-0.02em] mb-1">Restaurant basics</h2>
              <p className="text-[13px] text-[#A8A29E] mb-5">Takes 30 seconds — we only need the essentials.</p>
              <form onSubmit={handleStep1} className="space-y-4">
                <Input
                  id="restaurant-name"
                  label="Restaurant name"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="The Golden Fork"
                  required
                />
                <div className="w-full">
                  <label htmlFor="cuisine-type" className="block text-[13px] font-medium text-[#111] mb-1.5">
                    Cuisine type
                  </label>
                  <select
                    id="cuisine-type"
                    value={cuisineType}
                    onChange={(e) => setCuisineType(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DED8] hover:border-[#CEC8C1] text-[#111] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] transition-all duration-150 appearance-none"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A8A29E' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  >
                    <option value="" disabled>Select cuisine type</option>
                    {CUISINE_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <Input
                  id="owner-name"
                  label="Your first name"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Alex"
                  required
                />
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[13px] text-red-600">{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white font-semibold text-[14px] transition-all duration-150 mt-1 shadow-[0_2px_12px_rgba(224,90,40,0.25)]"
                >
                  Continue →
                </button>
              </form>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <h2 className="text-[18px] font-bold text-[#111] tracking-[-0.02em] mb-1">Your voice</h2>
              <p className="text-[13px] text-[#A8A29E] mb-5">This shapes how all your replies will sound.</p>
              <form onSubmit={handleStep2} className="space-y-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.10em] text-[#A8A29E] mb-2.5">Restaurant vibe</p>
                  <div className="grid grid-cols-2 gap-2">
                    {VIBE_OPTIONS.map((opt) => (
                      <OptionButton key={opt.value} selected={vibe === opt.value} onClick={() => setVibe(opt.value)}>
                        {opt.label}
                      </OptionButton>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.10em] text-[#A8A29E] mb-2.5">Reply tone</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TONE_OPTIONS.map((opt) => (
                      <OptionButton key={opt.value} selected={replyTone === opt.value} onClick={() => setReplyTone(opt.value)}>
                        {opt.label}
                      </OptionButton>
                    ))}
                  </div>
                </div>
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[13px] text-red-600">{error}</p>
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError('') }}
                    className="flex-1 h-11 rounded-xl border border-[#E4DED8] bg-white hover:bg-[#F8F6F3] text-[#555] font-medium text-[13px] transition-all duration-150"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] h-11 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white font-semibold text-[14px] transition-all duration-150 shadow-[0_2px_12px_rgba(224,90,40,0.25)]"
                  >
                    Continue →
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-[18px] font-bold text-[#111] tracking-[-0.02em]">Train your voice</h2>
                <span className="text-[11px] font-medium text-[#A8A29E] bg-[#F3F0EC] px-2 py-0.5 rounded-full mt-0.5">optional</span>
              </div>
              <p className="text-[13px] text-[#A8A29E] mb-5">
                Paste 3–5 of your past review replies and we'll match your exact writing style.
              </p>
              <div className="space-y-4">
                <textarea
                  value={voiceTrainingText}
                  onChange={(e) => setVoiceTrainingText(e.target.value)}
                  placeholder="Paste your past review replies here…"
                  rows={6}
                  className="w-full px-3.5 py-3 rounded-xl border border-[#E4DED8] hover:border-[#CEC8C1] text-[#111] text-[13px] placeholder:text-[#C4BEB8] bg-[#F8F6F3] hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] transition-all duration-150 resize-none leading-relaxed"
                />
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[13px] text-red-600">{error}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleFinish(true)}
                    disabled={loading}
                    className="flex-1 h-11 rounded-xl border border-[#E4DED8] bg-white hover:bg-[#F8F6F3] text-[#57534E] font-medium text-[13px] transition-all duration-150 disabled:opacity-40"
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinish(false)}
                    disabled={loading}
                    className="flex-[2] h-11 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white font-semibold text-[14px] transition-all duration-150 disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(224,90,40,0.25)]"
                  >
                    {loading && (
                      <svg className="animate-spin h-4 w-4 opacity-80" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {loading ? 'Setting up…' : 'Finish setup →'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
