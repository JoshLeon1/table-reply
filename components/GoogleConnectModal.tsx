'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface GoogleConnectModalProps {
  userId: string
  userEmail: string
  onClose: () => void
}

type Status = 'idle' | 'loading' | 'success' | 'exists' | 'error'

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

export default function GoogleConnectModal({
  userId,
  userEmail,
  onClose,
}: GoogleConnectModalProps) {
  const [email, setEmail] = useState(userEmail)
  const [status, setStatus] = useState<Status>('idle')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    // Check if this user is already on the waitlist
    const { data: existing } = await supabase
      .from('google_waitlist')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      setStatus('exists')
      return
    }

    const { error } = await supabase
      .from('google_waitlist')
      .insert({ user_id: userId, email: email.trim() })

    setStatus(error ? 'error' : 'success')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[480px] p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#A8A29E] hover:text-[#111] hover:bg-[#F3F0EC] rounded-md transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── Success state ──────────────────────────────────────────────── */}
        {status === 'success' ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#111] mb-2">
              You&apos;re on the list!
            </h3>
            <p className="text-[#7C7672] text-sm mb-8">We&apos;ll be in touch soon.</p>
            <button
              onClick={onClose}
              className="w-full px-6 min-h-[44px] bg-[#E05A28] hover:bg-[#C94E21] text-white font-semibold rounded-xl transition-colors text-[14px]"
            >
              Close
            </button>
          </div>
        ) : (
          /* ── Default / form state ──────────────────────────────────────── */
          <>
            {/* Google logo */}
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-full border border-[#EDE9E4] shadow-sm flex items-center justify-center bg-white">
                <GoogleLogo className="w-7 h-7" />
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-xl font-bold text-[#111] text-center mb-2">
              Auto-sync your Google reviews
            </h2>
            <p className="text-[#7C7672] text-sm text-center leading-relaxed mb-7">
              We&apos;re building direct Google Business Profile integration. Connect once
              and Replyfi will automatically pull new reviews and generate replies —
              no copy-paste needed.
            </p>

            {/* Feature list */}
            <ul className="space-y-2.5 mb-7">
              {[
                'Auto-import new reviews within minutes',
                'One-click post replies directly to Google',
                'Get notified when new reviews arrive',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-[#444]">
                  <svg
                    className="w-4 h-4 text-green-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Status messages */}
            {status === 'exists' && (
              <div className="flex items-center gap-2 bg-[#FEF0E8] border border-[#F5C9AD] rounded-lg px-4 py-3 mb-4 text-sm text-[#B34419]">
                <svg className="w-4 h-4 text-[#E05A28] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                You&apos;re already on the list!
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Something went wrong. Please try again.
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                id="waitlist-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DED8] bg-[#F8F6F3] text-[#111] placeholder:text-[#C4BEB8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] transition-all text-[14px]"
              />
              <button
                type="submit"
                disabled={status === 'loading' || status === 'exists'}
                className="w-full px-6 min-h-[44px] bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-[14px] flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Joining...
                  </>
                ) : (
                  'Join the waitlist →'
                )}
              </button>
            </form>

            <p className="text-xs text-[#A8A29E] text-center mt-3">
              We&apos;ll email you the moment it launches. No spam.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
