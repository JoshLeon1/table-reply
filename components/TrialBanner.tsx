'use client'

import { useState, useEffect } from 'react'

interface TrialBannerProps {
  daysRemaining: number
  trialExpired: boolean
  onUpgrade: () => void
}

const SESSION_KEY = 'tablereply_expired_banner_dismissed'

export default function TrialBanner({ daysRemaining, trialExpired, onUpgrade }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (trialExpired && typeof window !== 'undefined') {
      setDismissed(sessionStorage.getItem(SESSION_KEY) === '1')
    }
  }, [trialExpired])

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, '1')
    setDismissed(true)
  }

  // Active trial banner
  if (!trialExpired && daysRemaining > 0) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#111111] text-white">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
          <p className="text-[13px]">
            <span className="font-semibold text-white">
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
            </span>
            <span className="text-white/50"> remaining in your free trial</span>
          </p>
        </div>
        <button
          onClick={onUpgrade}
          className="text-[13px] font-semibold text-amber-400 hover:text-amber-300 transition-colors ml-6 whitespace-nowrap"
        >
          Upgrade — $29/mo →
        </button>
      </div>
    )
  }

  // Expired banner (dismissable per session)
  if (trialExpired && !dismissed) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#111111] text-white gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
          <p className="text-[13px] truncate">
            <span className="font-semibold text-white">Your free trial has ended</span>
            <span className="text-white/50 hidden sm:inline"> — upgrade to keep generating replies</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onUpgrade}
            className="text-[13px] font-semibold text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
          >
            Upgrade — $29/mo →
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/30 hover:text-white/60 transition-colors p-1"
            aria-label="Dismiss"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return null
}
