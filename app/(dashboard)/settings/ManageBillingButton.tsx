'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false)

  const handleManageBilling = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  return (
    <Button variant="secondary" loading={loading} onClick={handleManageBilling}>
      Manage billing
    </Button>
  )
}
