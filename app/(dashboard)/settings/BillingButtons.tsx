'use client'

import { useState } from 'react'

export default function BillingButtons() {
  const [loading, setLoading] = useState<'annual' | 'monthly' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function startCheckout(plan: 'annual' | 'monthly') {
    setLoading(plan)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(null)
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {/* Annual — best value */}
      <button
        onClick={() => startCheckout('annual')}
        disabled={loading !== null}
        className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-[#111] hover:bg-[#2a2a2a] disabled:opacity-60 text-white transition-all duration-150 group ring-2 ring-[#E05A28]/20"
      >
        <div className="text-left">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13px] font-semibold">Annual plan</span>
            <span className="px-1.5 py-0.5 rounded bg-[#E05A28] text-white text-[9px] font-bold uppercase tracking-wide leading-none">
              Best value
            </span>
          </div>
          <p className="text-white/50 text-[11px]">$239/yr · save $109 · under $20/month</p>
        </div>
        <span className="text-[#E05A28] text-[13px] font-semibold flex items-center gap-1 flex-shrink-0">
          {loading === 'annual' ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            '$239/yr →'
          )}
        </span>
      </button>

      {/* Monthly */}
      <button
        onClick={() => startCheckout('monthly')}
        disabled={loading !== null}
        className="w-full flex items-center justify-between px-5 py-3 rounded-xl border border-[#E4DED8] hover:border-[#D4CFC6] disabled:opacity-60 bg-white text-[#111] text-[13px] transition-all duration-150"
      >
        <span className="font-medium">Monthly plan</span>
        <span className="text-[#888] flex items-center gap-1">
          {loading === 'monthly' ? (
            <svg className="w-4 h-4 animate-spin text-[#E05A28]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            '$29/mo →'
          )}
        </span>
      </button>
    </div>
  )
}
