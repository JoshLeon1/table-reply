'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Notice from '@/components/ui/Notice'
import AuthShell from '@/components/AuthShell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link href="/login" className="text-[#E05A28] hover:text-[#C94E21] font-semibold transition-colors">
          ← Back to sign in
        </Link>
      }
    >
      {success ? (
        <Notice variant="success">
          Check your email for a password reset link.
        </Notice>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourbusiness.com"
            required
            autoComplete="email"
          />
          {error && <Notice variant="error">{error}</Notice>}
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
            className="w-full h-11 text-[14px]"
          >
            Send Reset Link
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
