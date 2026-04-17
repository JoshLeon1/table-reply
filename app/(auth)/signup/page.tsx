'use client'

// NOTE: Email confirmations are ENABLED in Supabase.
// signUp() returns session: null — user sees "Check your inbox" and must confirm before signing in.
// On confirmation, the link hits /auth/callback which redirects to /onboarding (new) or /dashboard (returning).
//
// NOTE: While Google OAuth app is in testing mode, only test users can sign in.
// Go to console.cloud.google.com → OAuth consent screen → Test users → Add your email
// To allow all users, publish the app (Audience → Publish App)

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Notice from '@/components/ui/Notice'
import Spinner from '@/components/ui/Spinner'
import AuthShell from '@/components/AuthShell'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function SignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleResend = async () => {
    if (resendCooldown > 0 || resendStatus === 'sending') return
    setResendStatus('sending')
    const r = await fetch('/api/auth/resend-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (r.ok) {
      setResendStatus('sent')
      setResendCooldown(60)
    } else {
      setResendStatus('error')
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        console.error('[ReplyFi] Signup error:', signUpError.message)
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Try signing in instead.')
        } else if (signUpError.message.includes('password')) {
          setError('Password must be at least 8 characters.')
        } else {
          setError(signUpError.message)
        }
        setLoading(false)
        return
      }

      if (data.user) {
        await supabase
          .from('profiles')
          .update({ trial_started_at: new Date().toISOString() })
          .eq('id', data.user.id)
      }

      if (data.session) {
        router.push('/onboarding')
        router.refresh()
      } else {
        setSuccessMessage(`Check your inbox — we sent a confirmation link to ${email}.`)
        setLoading(false)
      }
    } catch (err) {
      console.error('[ReplyFi] Unexpected signup error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (oauthError) {
        console.error('[ReplyFi] Google OAuth error:', oauthError.message, oauthError)
        setError(`Google sign up failed: ${oauthError.message}`)
        setGoogleLoading(false)
      }
      if (data?.url) window.location.href = data.url
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[ReplyFi] Unexpected Google OAuth error:', msg, err)
      setError(`Google sign up error: ${msg}`)
      setGoogleLoading(false)
    }
  }

  return (
    <AuthShell
      title="Start Your Free Trial"
      subtitle="7 days free — no credit card required."
      maxWidth={440}
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-[#E05A28] hover:text-[#C94E21] font-semibold transition-colors">
            Sign in →
          </Link>
        </>
      }
    >
      {successMessage ? (
        <div className="space-y-4">
          <Notice variant="success">{successMessage}</Notice>

          <div className="rounded-xl border border-border bg-white px-4 py-4 space-y-3">
            <p className="text-[12px] text-text-2">Didn&apos;t see it? Check your spam folder, or:</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendStatus === 'sending'}
              className="w-full h-10 rounded-lg border border-border bg-white hover:bg-surface text-text-1 text-[13px] font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resendStatus === 'sending' && 'Sending…'}
              {resendStatus === 'sent' && resendCooldown > 0 && `Sent — resend in ${resendCooldown}s`}
              {resendStatus === 'idle' && 'Resend confirmation email'}
              {resendStatus === 'error' && 'Resend failed — try again'}
              {resendStatus === 'sent' && resendCooldown === 0 && 'Resend confirmation email'}
            </button>
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full h-10 rounded-lg border border-border bg-white hover:bg-surface text-text-1 text-[13px] font-medium transition-all duration-150 flex items-center justify-center gap-2"
            >
              <GoogleIcon />
              Use Google instead
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-[#E4DED8] bg-white hover:bg-[#F8F6F3] hover:border-[#CEC8C1] text-[#111] text-[14px] font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed mb-4"
          >
            {googleLoading ? <Spinner size="md" className="opacity-60" /> : <GoogleIcon />}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#EDE9E4]" />
            <span className="text-[12px] text-[#A8A29E] font-medium">or</span>
            <div className="flex-1 h-px bg-[#EDE9E4]" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
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
            <Input
              id="password"
              type="password"
              label="Password"
              hint="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              minLength={8}
            />

            {error && <Notice variant="error">{error}</Notice>}

            <Button
              type="submit"
              variant="accent"
              disabled={loading || googleLoading}
              loading={loading}
              className="w-full h-11 text-[14px] shadow-[0_2px_12px_rgba(224,90,40,0.3)]"
            >
              Create Free Account
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F6F3]" style={{ backgroundImage: 'radial-gradient(circle, #E4DED8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
    }>
      <SignupForm />
    </Suspense>
  )
}
