'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ReplyGenerator from '@/components/ReplyGenerator'
import TrialBanner from '@/components/TrialBanner'
import PaywallModal from '@/components/PaywallModal'

interface DashboardClientProps {
  isPaid: boolean
  daysRemaining: number
  trialExpired: boolean
  hasGeneratedReply: boolean
  hasAutoSync: boolean
}

export default function DashboardClient({
  isPaid,
  daysRemaining,
  trialExpired,
  hasAutoSync,
}: DashboardClientProps) {
  const [showPaywall, setShowPaywall] = useState(false)
  const generateRef = useRef<(() => void) | null>(null)

  const handleUpgrade = () => setShowPaywall(true)

  // Cmd+Enter / Ctrl+Enter triggers generate
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        generateRef.current?.()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      {showPaywall && (
        <PaywallModal onClose={isPaid ? () => setShowPaywall(false) : undefined} />
      )}

      <div className="space-y-5">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-white tracking-tight">Generate a reply</h1>
            <p className="text-[13px] text-white/40 mt-1">
              Paste any review and get a personalised response in seconds.{' '}
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/[0.12] text-[10px] font-mono text-white/35 bg-white/[0.08]">
                ⌘ Enter
              </kbd>
            </p>
          </div>

          {hasAutoSync ? (
            <Link
              href="/dashboard/reviews"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-900/30 text-[12px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors duration-150 flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
              Auto-sync on · View reviews
            </Link>
          ) : (
            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/[0.10] hover:border-[#E05A28]/40 text-[12px] font-medium text-white/40 hover:text-[#E05A28] transition-all duration-150 flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              Connect platforms
            </Link>
          )}
        </div>

        {!isPaid && (
          <TrialBanner
            daysRemaining={daysRemaining}
            trialExpired={trialExpired}
            onUpgrade={handleUpgrade}
          />
        )}

        <ReplyGenerator
          isPaid={isPaid}
          onUpgrade={handleUpgrade}
          onGenerateTriggerRef={(fn) => { generateRef.current = fn }}
        />
      </div>
    </>
  )
}
