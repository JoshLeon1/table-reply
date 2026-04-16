'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleManageBilling = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-portal', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'Could not open billing portal. Please try again.')
        setLoading(false)
        return
      }
      if (!data?.url) {
        setError('Could not open billing portal. Please try again.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="secondary" loading={loading} onClick={handleManageBilling}>
        Manage billing
      </Button>
      {error && (
        <p className="text-[12px] text-red-500 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
