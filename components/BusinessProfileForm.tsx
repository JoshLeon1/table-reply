'use client'

import { useState } from 'react'
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
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    let result
    if (existingProfile) {
      result = await supabase
        .from('business_profiles')
        .update(form)
        .eq('id', existingProfile.id)
    } else {
      result = await supabase
        .from('business_profiles')
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
        id="business_name"
        label="Business Name"
        required
        value={form.business_name}
        onChange={(e) => setForm({ ...form, business_name: e.target.value })}
        placeholder="e.g. Bright Smile Dental"
      />
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
        label="Restaurant Vibe"
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
        label="Tell Us About Your Restaurant"
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
        {existingProfile ? 'Save Changes' : 'Set Up My Business →'}
      </Button>
    </form>
  )
}
