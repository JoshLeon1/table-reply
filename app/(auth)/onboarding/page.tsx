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
    <div className="min-h-screen bg-[#F8F6F3] flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 rounded-lg bg-[#E05A28] flex items-center justify-center">
          <svg className="text-white" width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 2v4a2 2 0 002 2v6M8 2v10M11 2s2 1 2 3-2 3-2 3v4"/>
          </svg>
        </div>
        <span className="text-[16px] font-bold text-[#111] tracking-tight">TableReply</span>
      </div>

      <div className="w-full max-w-sm animate-fade-up">

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-6">
          {stepLabels.map((label, i) => {
            const s = i + 1
            const done = step > s
            const active = step === s
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-1.5 ${active ? 'opacity-100' : done ? 'opacity-100' : 'opacity-35'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    done ? 'bg-emerald-500 text-white' : active ? 'bg-[#E05A28] text-white' : 'bg-[#E4DED8] text-[#A8A29E]'
                  }`}>
                    {done ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : s}
                  </div>
                  <span className={`text-[12px] font-medium ${active ? 'text-[#111]' : 'text-[#A8A29E]'}`}>{label}</span>
                </div>
                {s < 3 && <div className="flex-1 h-px bg-[#E4DED8]" />}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E4DED8] shadow-modal p-6 sm:p-8">

          {/* Step 1 */}
          {step === 1 && (
            <>
              <h2 className="text-[18px] font-bold text-[#111] tracking-[-0.02em] mb-1">Restaurant basics</h2>
              <p className="text-[13px] text-[#7C7672] mb-5">Tell us about your restaurant — takes 30 seconds.</p>
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DED8] hover:border-[#CEC8C1] text-[#111] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] transition-all duration-150"
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
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                    <p className="text-[13px] text-red-600">{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#111] hover:bg-[#1E1E1E] text-white font-semibold text-[14px] transition-all duration-150 mt-1"
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
              <p className="text-[13px] text-[#7C7672] mb-5">How should your replies feel?</p>
              <form onSubmit={handleStep2} className="space-y-5">
                <div>
                  <p className="text-[13px] font-semibold text-[#111] mb-2">Restaurant vibe</p>
                  <div className="grid grid-cols-2 gap-2">
                    {VIBE_OPTIONS.map((opt) => (
                      <OptionButton key={opt.value} selected={vibe === opt.value} onClick={() => setVibe(opt.value)}>
                        {opt.label}
                      </OptionButton>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#111] mb-2">Reply tone</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TONE_OPTIONS.map((opt) => (
                      <OptionButton key={opt.value} selected={replyTone === opt.value} onClick={() => setReplyTone(opt.value)}>
                        {opt.label}
                      </OptionButton>
                    ))}
                  </div>
                </div>
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                    <p className="text-[13px] text-red-600">{error}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError('') }}
                    className="flex-1 h-11 rounded-xl border border-[#E4DED8] bg-white hover:bg-[#F8F6F3] text-[#333] font-medium text-[13px] transition-all duration-150"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 rounded-xl bg-[#111] hover:bg-[#1E1E1E] text-white font-semibold text-[14px] transition-all duration-150"
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
              <h2 className="text-[18px] font-bold text-[#111] tracking-[-0.02em] mb-1">
                Train your voice
                <span className="text-[#A8A29E] font-normal text-[13px] ml-2">optional</span>
              </h2>
              <p className="text-[13px] text-[#7C7672] mb-5">
                Paste 3–5 of your past review replies. TableReply will match your exact writing style.
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
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
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
                    className="flex-1 h-11 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] text-white font-semibold text-[14px] transition-all duration-150 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {loading && (
                      <svg className="animate-spin h-4 w-4 opacity-80" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    Finish setup →
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
