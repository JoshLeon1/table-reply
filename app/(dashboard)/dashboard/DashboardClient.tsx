'use client'

import { useState, useEffect, useRef } from 'react'
import ReplyGenerator from '@/components/ReplyGenerator'
import TrialBanner from '@/components/TrialBanner'
import PaywallModal from '@/components/PaywallModal'
import GoogleConnectModal from '@/components/GoogleConnectModal'
import WelcomeBanner from '@/components/WelcomeBanner'

interface DashboardClientProps {
  isPaid: boolean
  daysRemaining: number
  trialExpired: boolean
  userId: string
  userEmail: string
  hasGeneratedReply: boolean
  hasAutoSync: boolean
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export default function DashboardClient({
  isPaid,
  daysRemaining,
  trialExpired,
  userId,
  userEmail,
  hasGeneratedReply,
  hasAutoSync,
}: DashboardClientProps) {
  const [showPaywall, setShowPaywall] = useState(false)
  const [showGoogleModal, setShowGoogleModal] = useState(false)
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
      {showGoogleModal && (
        <GoogleConnectModal
          userId={userId}
          userEmail={userEmail}
          onClose={() => setShowGoogleModal(false)}
        />
      )}

      <div className="space-y-5">
        <WelcomeBanner hasGeneratedReply={hasGeneratedReply} hasAutoSync={hasAutoSync} />

        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#111]">Generate a reply</h1>
            <p className="text-[13px] text-[#888] mt-0.5">
              Paste any review and get a personalised response in seconds.{' '}
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#E8E4DC] text-[10px] font-mono text-[#AAA] bg-[#F9F8F6]">
                ⌘ Enter
              </kbd>
            </p>
          </div>

          <button
            onClick={() => setShowGoogleModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E8E4DC] hover:border-[#D4CFC6] rounded-xl text-[13px] font-medium text-[#555] hover:text-[#111] transition-all duration-150 flex-shrink-0"
          >
            <GoogleLogo className="w-4 h-4 flex-shrink-0" />
            Auto-sync
            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-md border border-amber-200 uppercase tracking-wide leading-none">
              Soon
            </span>
          </button>
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
