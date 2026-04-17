'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Notice from '@/components/ui/Notice'
import Spinner from '@/components/ui/Spinner'
import AuthShell from '@/components/AuthShell'

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
    <AuthShell
      title="Set New Password"
      subtitle="Choose a strong password for your account."
      footer={
        <Link href="/login" className="text-[#E05A28] hover:text-[#C94E21] font-semibold transition-colors">
          ← Back to sign in
        </Link>
      }
    >
      {authorized === null ? (
        <div className="py-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-light mb-4 text-accent">
            <Spinner size="lg" />
          </div>
          <h2 className="text-[18px] font-semibold text-text-1 mb-1">Verifying your link…</h2>
          <p className="text-[13px] text-text-2">This usually takes a second or two.</p>
        </div>
      ) : authorized === false ? (
        <Notice variant="warning">
          <p className="font-semibold mb-1">This link has expired.</p>
          <p>
            Password reset links are only valid for a short time. Request a new one from the{' '}
            <Link href="/forgot-password" className="underline underline-offset-2 font-semibold">forgot password page</Link>.
          </p>
        </Notice>
      ) : success ? (
        <Notice variant="success">Password updated! Redirecting to your dashboard…</Notice>
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
          {error && <Notice variant="error">{error}</Notice>}
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
            className="w-full h-11 text-[14px]"
          >
            Update Password
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
