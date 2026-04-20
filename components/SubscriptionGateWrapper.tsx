'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import ErrorBoundary from '@/components/ErrorBoundary'
import type { AccessResult } from '@/lib/subscription/access'

// ── Trial countdown banner ────────────────────────────────────────────────────
function TrialBanner({ daysRemaining }: { daysRemaining: number }) {
  const isUrgent = daysRemaining <= 2
  const isWarning = daysRemaining <= 4

  const bg      = isUrgent  ? 'bg-red-50 border-red-200'           : isWarning ? 'bg-amber-50 border-amber-200'       : 'bg-[#FEF0E8] border-[#F5C9AD]'
  const dot     = isUrgent  ? 'bg-red-500'                          : isWarning ? 'bg-amber-500'                        : 'bg-[#E05A28]'
  const text    = isUrgent  ? 'text-red-700'                        : isWarning ? 'text-amber-700'                      : 'text-[#7C3010]'
  const subtext = isUrgent  ? 'text-red-500'                        : isWarning ? 'text-amber-500'                      : 'text-[#C06030]'
  const btn     = isUrgent  ? 'bg-red-600 hover:bg-red-700 shadow-[0_2px_8px_rgba(220,38,38,0.3)]'
                : isWarning ? 'bg-amber-600 hover:bg-amber-700 shadow-[0_2px_8px_rgba(217,119,6,0.3)]'
                :             'bg-[#E05A28] hover:bg-[#C94E21] shadow-[0_2px_8px_rgba(224,90,40,0.25)]'

  const label = daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`

  return (
    <div className={`w-full border-b ${bg} px-4 py-2.5`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot} ${isUrgent ? 'animate-pulse' : ''}`} />
          <div className="min-w-0">
            <span className={`text-[13px] font-semibold ${text}`}>
              Free trial — <span className="tabular-nums">{label}</span>
            </span>
            <span className={`hidden sm:inline text-[12px] ml-1.5 ${subtext}`}>
              {isUrgent
                ? 'Upgrade now to keep your replies, analytics, and syncs.'
                : isWarning
                ? 'Upgrade before your trial ends to keep uninterrupted access.'
                : 'Enjoying ReplyFi? Upgrade to keep full access after your trial.'}
            </span>
          </div>
        </div>
        <Link
          href="/settings?tab=account"
          className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-[12px] font-bold transition-all duration-150 active:scale-[0.97] ${btn}`}
        >
          Upgrade now
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

// ── Expired paywall ───────────────────────────────────────────────────────────
function ExpiredPaywall() {
  const [loading, setLoading] = useState<'annual' | 'monthly' | null>(null)
  const [error, setError] = useState('')

  const handleResubscribe = async (plan: 'annual' | 'monthly') => {
    setLoading(plan)
    setError('')
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data?.error ?? 'Could not start checkout. Please try again.')
      }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div className="relative flex-1 flex items-center justify-center px-4 py-16 min-h-[60vh]">
      {/* Blurred background hint */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-[#111] blur-sm" />
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        <div className="bg-white rounded-2xl border border-[#E4DED8] shadow-[0_8px_40px_rgba(0,0,0,0.10)] overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-[#E05A28] via-[#F07040] to-[#E05A28]" />

          <div className="px-8 py-8 text-center">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-[#FEF0E8] border border-[#F5C9AD] flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#E05A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>

            <h2 className="text-[20px] font-bold text-[#111] tracking-tight mb-2">
              Your free trial has ended
            </h2>
            <p className="text-[13px] text-[#57534E] leading-relaxed mb-6">
              Choose a plan to keep your reviews syncing, AI replies generating, and analytics running.
            </p>

            {/* Value props */}
            <div className="space-y-2.5 mb-7 text-left">
              {[
                'Auto-sync Google, Yelp & TripAdvisor reviews',
                'AI-drafted replies ready in seconds',
                'Competitor tracking & keyword alerts',
                'Review analytics & theme insights',
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#E05A28]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-[#E05A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <span className="text-[12px] text-[#444]">{item}</span>
                </div>
              ))}
            </div>

            {/* CTAs — annual (primary) + monthly */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleResubscribe('annual')}
                disabled={loading !== null}
                className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white shadow-[0_4px_16px_rgba(224,90,40,0.35)] hover:shadow-[0_6px_24px_rgba(224,90,40,0.45)] transition-all duration-200 active:scale-[0.97] disabled:opacity-70 disabled:cursor-wait"
              >
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-bold">Annual Plan</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-white text-[9px] font-bold uppercase tracking-wide leading-none">
                      Best Value
                    </span>
                  </div>
                  <p className="text-white/80 text-[11px]">$239/yr · save $109 · under $20/month</p>
                </div>
                <span className="text-[13px] font-bold flex items-center gap-1 flex-shrink-0">
                  {loading === 'annual' ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    '$239/yr →'
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleResubscribe('monthly')}
                disabled={loading !== null}
                className="w-full flex items-center justify-between px-5 py-3 rounded-xl border border-[#E4DED8] hover:border-[#D4CFC6] bg-white text-[#111] text-[13px] transition-all duration-150 disabled:opacity-70"
              >
                <span className="font-medium">Monthly Plan</span>
                <span className="text-[#888] flex items-center gap-1">
                  {loading === 'monthly' ? (
                    <svg className="w-4 h-4 animate-spin text-[#E05A28]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    '$29/mo →'
                  )}
                </span>
              </button>
            </div>

            {error ? (
              <p role="alert" className="mt-2 text-[12px] text-red-500">
                {error}{' '}
                <Link href="/settings?tab=account" className="underline">
                  Go to settings
                </Link>
              </p>
            ) : (
              <p className="mt-3.5 text-[11px] text-[#A8A29E]">
                Cancel anytime · no hidden fees
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Canceled-but-in-grace banner ──────────────────────────────────────────────
function CanceledBanner({ daysRemaining }: { daysRemaining: number }) {
  const label = daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`
  return (
    <div className="w-full border-b bg-amber-50 border-amber-200 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-amber-700">
          Subscription canceled — <span className="tabular-nums">{label}</span> of access remaining
        </span>
        <Link
          href="/settings?tab=account"
          className="flex-shrink-0 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-bold"
        >
          Reactivate
        </Link>
      </div>
    </div>
  )
}

// ── Past-due banner ───────────────────────────────────────────────────────────
function PastDueBanner() {
  return (
    <div className="w-full border-b bg-red-50 border-red-200 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-red-700">
          Your card was declined — update your payment to keep access
        </span>
        <Link
          href="/settings?tab=account"
          className="flex-shrink-0 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold"
        >
          Update card
        </Link>
      </div>
    </div>
  )
}

// ── Main wrapper ──────────────────────────────────────────────────────────────
interface Props {
  access: AccessResult
  children: React.ReactNode
}

export default function SubscriptionGateWrapper({ access, children }: Props) {
  const pathname = usePathname()
  const isSettings = pathname?.startsWith('/settings')

  const showTrialBanner    = access.ok && access.reason === 'trialing'
  const showCanceledBanner = access.ok && access.reason === 'canceled_in_grace'
  const showPastDueBanner  = access.ok && access.reason === 'past_due'
  const showExpiredPaywall = !access.ok

  return (
    <>
      {showTrialBanner    && <TrialBanner    daysRemaining={access.daysRemaining} />}
      {showCanceledBanner && <CanceledBanner daysRemaining={access.daysRemaining} />}
      {showPastDueBanner  && <PastDueBanner />}

      {/* Inner content region — NOT a <main>; the parent layout already
          provides the single page <main id="main"> landmark. */}
      <div className="relative flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8 min-w-0">
        <ErrorBoundary>
          {showExpiredPaywall && !isSettings ? <ExpiredPaywall /> : children}
        </ErrorBoundary>
      </div>
    </>
  )
}
