'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from './ui/Input'
import Textarea from './ui/Textarea'
import Select from './ui/Select'
import Button from './ui/Button'
import type { RestaurantProfile } from '@/types'

interface RestaurantProfileFormProps {
  userId: string
  existingProfile?: RestaurantProfile | null
  redirectTo?: string
}

const cuisineOptions = [
  { value: '', label: 'Select cuisine type...' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Mexican', label: 'Mexican' },
  { value: 'American', label: 'American' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Indian', label: 'Indian' },
  { value: 'Mediterranean', label: 'Mediterranean' },
  { value: 'French', label: 'French' },
  { value: 'Thai', label: 'Thai' },
  { value: 'Greek', label: 'Greek' },
  { value: 'BBQ', label: 'BBQ' },
  { value: 'Seafood', label: 'Seafood' },
  { value: 'Steakhouse', label: 'Steakhouse' },
  { value: 'Pizza', label: 'Pizza' },
  { value: 'Burger', label: 'Burger' },
  { value: 'Farm-to-Table', label: 'Farm-to-Table' },
  { value: 'Other', label: 'Other' },
]

const vibeOptions = [
  { value: '', label: 'Select vibe...' },
  { value: 'casual', label: 'Casual & family-friendly' },
  { value: 'upscale', label: 'Upscale & fine dining' },
  { value: 'trendy', label: 'Trendy & modern' },
  { value: 'cozy', label: 'Cozy & intimate' },
  { value: 'lively', label: 'Lively & social' },
  { value: 'rustic', label: 'Rustic & homey' },
  { value: 'fast-casual', label: 'Fast casual' },
]

const voiceOptions = [
  { value: '', label: 'Select voice style...' },
  { value: 'warm and personal', label: 'Warm & personal' },
  { value: 'professional and polished', label: 'Professional & polished' },
  { value: 'friendly and casual', label: 'Friendly & casual' },
  { value: 'sincere and humble', label: 'Sincere & humble' },
  { value: 'enthusiastic and energetic', label: 'Enthusiastic & energetic' },
]

export default function RestaurantProfileForm({
  userId,
  existingProfile,
  redirectTo = '/dashboard',
}: RestaurantProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    restaurant_name: existingProfile?.restaurant_name ?? '',
    cuisine_type: existingProfile?.cuisine_type ?? '',
    vibe: existingProfile?.vibe ?? '',
    voice_style: existingProfile?.voice_style ?? '',
    description: existingProfile?.description ?? '',
    owner_name: existingProfile?.owner_name ?? '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    let result
    if (existingProfile) {
      result = await supabase
        .from('restaurant_profiles')
        .update(form)
        .eq('id', existingProfile.id)
    } else {
      result = await supabase
        .from('restaurant_profiles')
        .insert({ ...form, user_id: userId })
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
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
      <Input
        id="restaurant_name"
        label="Restaurant name"
        required
        value={form.restaurant_name}
        onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })}
        placeholder="e.g. Bella Napoli"
      />
      <Input
        id="owner_name"
        label="Your name (owner)"
        required
        value={form.owner_name}
        onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
        placeholder="e.g. Marco"
      />
      <Select
        id="cuisine_type"
        label="Cuisine type"
        required
        value={form.cuisine_type}
        onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })}
        options={cuisineOptions}
      />
      <Select
        id="vibe"
        label="Restaurant vibe"
        required
        value={form.vibe}
        onChange={(e) => setForm({ ...form, vibe: e.target.value })}
        options={vibeOptions}
      />
      <Select
        id="voice_style"
        label="Reply voice style"
        required
        value={form.voice_style}
        onChange={(e) => setForm({ ...form, voice_style: e.target.value })}
        options={voiceOptions}
      />
      <Textarea
        id="description"
        label="Tell us about your restaurant"
        required
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="A brief description — what makes your restaurant special, your story, what guests love most..."
        rows={4}
      />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-2.5">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full">
        {existingProfile ? 'Save changes' : 'Set up my restaurant →'}
      </Button>
    </form>
  )
}
