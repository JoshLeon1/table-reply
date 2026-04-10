'use client'

import { useState } from 'react'
import Button from './ui/Button'

interface PaywallModalProps {
  onClose?: () => void
}

export default function PaywallModal({ onClose }: PaywallModalProps) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#FCDCCA] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#C94E21]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Your trial has ended</h2>
          <p className="text-stone-600 mb-6">
            Keep replying to every review with AI — just $29/month. No contracts, cancel anytime.
          </p>

          <ul className="text-left space-y-3 mb-8">
            {[
              'Unlimited AI-powered review replies',
              'Restaurant-specific voice and tone',
              'Google, Yelp, TripAdvisor & more',
              'Social post generator',
              'Review request templates',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-stone-700">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <Button onClick={handleUpgrade} loading={loading} size="lg" className="w-full">
            Upgrade — $29/month
          </Button>
          <p className="mt-3 text-xs text-stone-400">No surprises. Cancel anytime.</p>
        </div>
      </div>
    </div>
  )
}
