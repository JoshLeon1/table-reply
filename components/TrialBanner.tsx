'use client'

import { useState, useEffect } from 'react'

interface TrialBannerProps {
  daysRemaining: number
  trialExpired: boolean
  onUpgrade: () => void
}

const SESSION_KEY = 'replyfi_expired_banner_dismissed'

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

  if (!trialExpired && daysRemaining > 0) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#111] border border-[#E05A28]/20 animate-fade-in">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E05A28] flex-shrink-0 animate-pulse" />
          <p className="text-[13px] text-white/60 truncate">
            <span className="font-semibold text-white">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</span>
            {' '}left in your free trial
          </p>
        </div>
        <button
          onClick={onUpgrade}
          className="text-[13px] font-semibold text-[#E05A28] hover:text-[#F07040] transition-colors ml-4 whitespace-nowrap flex-shrink-0"
        >
          Upgrade — from $20/mo →
        </button>
      </div>
    )
  }

  if (trialExpired && !dismissed) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-red-950/40 border border-red-900/40 gap-4 animate-fade-in">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
          <p className="text-[13px] truncate">
            <span className="font-semibold text-white">Trial Ended</span>
            <span className="text-white/45 hidden sm:inline"> — upgrade to keep generating replies</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onUpgrade}
            className="text-[13px] font-semibold text-[#E05A28] hover:text-[#F07040] transition-colors whitespace-nowrap"
          >
            Upgrade — from $20/mo →
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/25 hover:text-white/55 transition-colors p-1 rounded"
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
