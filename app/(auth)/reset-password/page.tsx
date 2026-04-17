'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Logo from '@/components/Logo'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  // Guard: only allow showing the form if the user came here via a PASSWORD_RECOVERY
  // event or already has a valid session (the typical callback flow). This prevents
  // anyone landing directly on /reset-password from silently changing an unrelated
  // user's password.
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    // Listen for Supabase's PASSWORD_RECOVERY event fired after the recovery token is consumed
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setAuthorized(true)
    })

    // Also check existing session in case the listener fires before we subscribe
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      if (data.session) setAuthorized(true)
      else setAuthorized((prev) => (prev === true ? prev : false))
    })

    return () => { cancelled = true; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => router.push('/dashboard'), 2000)
    return () => clearTimeout(t)
  }, [success, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F8F6F3] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] animate-fade-up">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-modal p-7 sm:p-8">
          <h1 className="text-[20px] font-bold text-[#111] tracking-[-0.02em] mb-1">Set New Password</h1>
          <p className="text-[14px] text-[#7C7672] mb-6">Choose a strong password for your account.</p>

          {authorized === null ? (
            <div className="py-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-light mb-4">
                <svg className="animate-spin h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h2 className="text-[18px] font-semibold text-text-1 mb-1">Verifying your link…</h2>
              <p className="text-[13px] text-text-2">This usually takes a second or two.</p>
            </div>
          ) : authorized === false ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-4 text-[13px] text-amber-800">
              <p className="font-semibold mb-1">This link has expired.</p>
              <p className="text-amber-700">Password reset links are only valid for a short time. Request a new one from the{' '}
                <Link href="/forgot-password" className="underline underline-offset-2 font-semibold">forgot password page</Link>.
              </p>
            </div>
          ) : success ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-4">
              <p className="text-[13px] text-emerald-700 font-medium">Password updated! Redirecting to your dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="password"
                type="password"
                label="New Password"
                hint="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={8}
              />
              <Input
                id="confirm-password"
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              {error && (
                <div role="alert" className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-[13px] text-red-600">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-[#111] hover:bg-[#1E1E1E] text-white font-semibold text-[14px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Update Password
              </button>
            </form>
          )}

          <p className="mt-6 text-[13px] text-center text-[#7C7672]">
            <Link href="/login" className="text-[#E05A28] hover:text-[#C94E21] font-semibold transition-colors">
              ← Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
