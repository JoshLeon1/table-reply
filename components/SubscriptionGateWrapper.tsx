'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import ErrorBoundary from '@/components/ErrorBoundary'

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

            {/* CTA */}
            <Link
              href="/settings?tab=account"
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white text-[14px] font-bold shadow-[0_4px_16px_rgba(224,90,40,0.35)] hover:shadow-[0_6px_24px_rgba(224,90,40,0.45)] transition-all duration-200 active:scale-[0.97]"
            >
              <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              View subscription plans
            </Link>

            <p className="mt-3.5 text-[11px] text-[#A8A29E]">
              Annual plan · $239/yr · under $20/month
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main wrapper ──────────────────────────────────────────────────────────────
interface Props {
  isPaid: boolean
  daysRemaining: number
  children: React.ReactNode
}

export default function SubscriptionGateWrapper({ isPaid, daysRemaining, children }: Props) {
  const pathname = usePathname()
  const isSettings = pathname?.startsWith('/settings')

  const isExpired  = !isPaid && daysRemaining <= 0
  const isOnTrial  = !isPaid && daysRemaining > 0

  return (
    <>
      {/* Trial countdown bar — shown on all pages while on trial */}
      {isOnTrial && <TrialBanner daysRemaining={daysRemaining} />}

      {/* Main content area */}
      <main className="relative flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8 min-w-0">
        <ErrorBoundary>
          {isExpired && !isSettings ? <ExpiredPaywall /> : children}
        </ErrorBoundary>
      </main>
    </>
  )
}
