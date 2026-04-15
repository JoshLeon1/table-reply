'use client'

import { useState } from 'react'
import Button from './ui/Button'

interface PaywallModalProps {
  onClose?: () => void
}

export default function PaywallModal({ onClose }: PaywallModalProps) {
  const [plan, setPlan] = useState<'annual' | 'monthly'>('annual')
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md px-6 pt-7 pb-8 sm:p-8">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[#A8A29E] hover:text-[#111] hover:bg-[#F3F0EC] transition-all"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="text-center">
          <div className="w-14 h-14 bg-[#FEF0E8] border border-[#F5C9AD] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#E05A28]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-[22px] font-semibold text-[#111] tracking-tight mb-1.5">Your Trial Has Ended</h2>
          <p className="text-[#7C7672] text-[14px] mb-5 leading-relaxed">
            Keep replying to every review with AI. No contracts, cancel anytime.
          </p>

          {/* Plan toggle */}
          <div className="flex rounded-xl border border-[#E4DED8] bg-[#F8F6F3] p-1 mb-5 gap-1">
            <button
              onClick={() => setPlan('annual')}
              className={`flex-1 flex flex-col items-center py-2.5 px-3 rounded-lg text-[12px] font-medium transition-all duration-150 ${
                plan === 'annual'
                  ? 'bg-white shadow-sm text-[#111] border border-[#E4DED8]'
                  : 'text-[#A8A29E] hover:text-[#57534E]'
              }`}
            >
              <span className="font-semibold text-[13px]">Annual</span>
              <span className={plan === 'annual' ? 'text-[#E05A28]' : 'text-[#C4BEB8]'}>
                $239/yr · save $109
              </span>
              {plan === 'annual' && (
                <span className="mt-1 px-1.5 py-0.5 rounded bg-[#E05A28] text-white text-[9px] font-bold uppercase tracking-wide leading-none">
                  Best Value
                </span>
              )}
            </button>
            <button
              onClick={() => setPlan('monthly')}
              className={`flex-1 flex flex-col items-center py-2.5 px-3 rounded-lg text-[12px] font-medium transition-all duration-150 ${
                plan === 'monthly'
                  ? 'bg-white shadow-sm text-[#111] border border-[#E4DED8]'
                  : 'text-[#A8A29E] hover:text-[#57534E]'
              }`}
            >
              <span className="font-semibold text-[13px]">Monthly</span>
              <span className={plan === 'monthly' ? 'text-[#57534E]' : 'text-[#C4BEB8]'}>$29/mo</span>
            </button>
          </div>

          <ul className="text-left space-y-2 mb-6 bg-[#F8F6F3] rounded-xl p-4 border border-[#EDE9E4]">
            {[
              'Unlimited AI-powered review replies',
              'Restaurant-specific voice and tone',
              'Google, Yelp, TripAdvisor & more',
              'Social post generator',
              'Review request templates',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-[13px] text-[#444]">
                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <Button
            onClick={handleUpgrade}
            loading={loading}
            size="lg"
            className="w-full min-h-[48px] bg-[#E05A28] hover:bg-[#C94E21] text-white font-semibold rounded-xl"
          >
            {plan === 'annual' ? 'Get started — $239/yr' : 'Get started — $29/mo'}
          </Button>
          <p className="mt-3 text-[12px] text-[#A8A29E]">No surprises. Cancel anytime.</p>
        </div>
      </div>
    </div>
  )
}
