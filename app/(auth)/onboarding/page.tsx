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
  { value: 'casual_relaxed', label: 'Casual & Relaxed' },
  { value: 'upscale_refined', label: 'Upscale & Refined' },
  { value: 'family_friendly', label: 'Family-Friendly' },
  { value: 'trendy_modern', label: 'Trendy & Modern' },
]

const TONE_OPTIONS = [
  { value: 'warm_personal', label: 'Warm & Personal' },
  { value: 'professional_polished', label: 'Professional & Polished' },
  { value: 'fun_playful', label: 'Fun & Playful' },
  { value: 'formal_reserved', label: 'Formal & Reserved' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [restaurantName, setRestaurantName] = useState('')
  const [cuisineType, setCuisineType] = useState('')
  const [ownerName, setOwnerName] = useState('')

  // Step 2
  const [vibe, setVibe] = useState('')
  const [replyTone, setReplyTone] = useState('')

  // Step 3
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
    if (!user) {
      router.push('/login')
      return
    }

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

    // Mark onboarding complete in profiles table
    await supabase
      .from('profiles')
      .update({ onboarding_complete: true })
      .eq('id', user.id)

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#ECEAE6] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
          <circle cx="20" cy="20" r="20" fill="#F59E0B" fillOpacity="0.12" />
          <path d="M14 10v6a4 4 0 0 0 4 4v10" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 10v20" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 10c0 0 4 2 4 6s-4 6-4 6v8" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-[22px] font-bold text-[#0D0D0D] tracking-tight">TableReply</span>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        {/* Progress */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-medium text-[#6B6B6B]">Step {step} of 3</span>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-2 rounded-full transition-all duration-200 ${
                  s <= step ? 'bg-amber-500' : 'bg-stone-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Restaurant Basics */}
        {step === 1 && (
          <>
            <h2 className="text-lg font-bold text-[#0D0D0D] mb-1">Restaurant basics</h2>
            <p className="text-sm text-[#6B6B6B] mb-6">Tell us about your restaurant.</p>
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
                <label htmlFor="cuisine-type" className="block text-[13px] font-medium text-[#111111] mb-1.5">
                  Cuisine type
                </label>
                <select
                  id="cuisine-type"
                  value={cuisineType}
                  onChange={(e) => setCuisineType(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3E1DC] text-[#111111] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all duration-150"
                >
                  <option value="" disabled>Select a cuisine type</option>
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
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full h-[52px] rounded-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-sm transition-all duration-150 mt-2"
              >
                Continue
              </button>
            </form>
          </>
        )}

        {/* Step 2: Voice Setup */}
        {step === 2 && (
          <>
            <h2 className="text-lg font-bold text-[#0D0D0D] mb-1">Voice setup</h2>
            <p className="text-sm text-[#6B6B6B] mb-6">How should your replies feel?</p>
            <form onSubmit={handleStep2} className="space-y-5">
              <div>
                <p className="text-[13px] font-medium text-[#111111] mb-2">Restaurant vibe</p>
                <div className="grid grid-cols-2 gap-2">
                  {VIBE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setVibe(option.value)}
                      className={`px-3 py-2.5 rounded-xl text-[13px] font-medium border transition-all duration-150 text-left ${
                        vibe === option.value
                          ? 'bg-amber-50 border-amber-400 text-amber-700'
                          : 'bg-white border-[#E3E1DC] text-[#333] hover:border-[#E3E1DC]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[13px] font-medium text-[#111111] mb-2">Reply tone</p>
                <div className="grid grid-cols-2 gap-2">
                  {TONE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setReplyTone(option.value)}
                      className={`px-3 py-2.5 rounded-xl text-[13px] font-medium border transition-all duration-150 text-left ${
                        replyTone === option.value
                          ? 'bg-amber-50 border-amber-400 text-amber-700'
                          : 'bg-white border-[#E3E1DC] text-[#333] hover:border-[#E3E1DC]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError('') }}
                  className="flex-1 h-[52px] rounded-full border border-[#E3E1DC] bg-white hover:bg-[#F5F4F1] text-[#333] font-medium text-sm transition-all duration-150"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 h-[52px] rounded-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-sm transition-all duration-150"
                >
                  Continue
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 3: Voice Training */}
        {step === 3 && (
          <>
            <h2 className="text-lg font-bold text-[#0D0D0D] mb-1">Train your voice <span className="text-[#9E9E9E] font-normal text-sm">(optional)</span></h2>
            <p className="text-sm text-[#6B6B6B] mb-6">
              Paste 3–5 of your past review replies below. TableReply will match your exact writing style.
            </p>

            <div className="space-y-4">
              <div className="w-full">
                <textarea
                  value={voiceTrainingText}
                  onChange={(e) => setVoiceTrainingText(e.target.value)}
                  placeholder="Paste your past review replies here..."
                  rows={6}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3E1DC] text-[#111111] text-sm placeholder:text-[#BBBAB6] bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all duration-150 resize-none"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleFinish(true)}
                  disabled={loading}
                  className="flex-1 h-[52px] rounded-full border border-[#E3E1DC] bg-white hover:bg-[#F5F4F1] text-[#333] font-medium text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={() => handleFinish(false)}
                  disabled={loading}
                  className="flex-1 h-[52px] rounded-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
  )
}
