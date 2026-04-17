'use client'

// NOTE: Email confirmations are ENABLED in Supabase.
// New users must confirm their email before signing in.
// The login page handles the "Email not confirmed" error gracefully.
//
// NOTE: While Google OAuth app is in testing mode, only test users can sign in.
// Go to console.cloud.google.com → OAuth consent screen → Test users → Add your email
// To allow all users, publish the app (Audience → Publish App)

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const accountDeleted = searchParams.get('deleted') === '1'
  const authError = searchParams.get('error')
  const redirectTo = searchParams.get('redirectTo')
  // Only honor redirectTo if it's a same-site absolute path (prevents open-redirect)
  const safeRedirect = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(() => {
    if (authError === 'auth_failed') return 'Sign-in link expired or invalid. Please try again.'
    return ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

      if (signInError) {
        console.error('[ReplyFi] Login error:', signInError.message)
        if (signInError.message === 'Email not confirmed') {
          setError('Please confirm your email before signing in.')
        } else if (signInError.message === 'Invalid login credentials') {
          setError('Invalid email or password.')
        } else {
          setError(signInError.message)
        }
        setLoading(false)
        return
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle()
        if (!profile) { router.push('/onboarding'); router.refresh(); return }
      }

      router.push(safeRedirect ?? '/dashboard')
      router.refresh()
    } catch (err) {
      console.error('[ReplyFi] Unexpected login error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const callbackUrl = safeRedirect
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeRedirect)}`
        : `${window.location.origin}/auth/callback`
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl },
      })
      if (oauthError) {
        console.error('[ReplyFi] Google OAuth error:', oauthError.message, oauthError)
        setError(`Google sign in failed: ${oauthError.message}`)
        setGoogleLoading(false)
      }
      if (data?.url) window.location.href = data.url
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[ReplyFi] Unexpected Google OAuth error:', msg, err)
      setError(`Google sign in error: ${msg}`)
      setGoogleLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Sign in to manage your reviews"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#E05A28] hover:text-[#C94E21] font-semibold transition-colors">
            Start free →
          </Link>
        </>
      }
    >
      {accountDeleted && (
        <Notice variant="success" className="mb-5">
          Your account and all data have been permanently deleted.
        </Notice>
      )}

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
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

      <form onSubmit={handleLogin} className="space-y-4">
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
        <div>
          <Input
            id="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          <div className="mt-1.5 text-right">
            <Link href="/forgot-password" className="text-[12px] text-[#E05A28] hover:text-[#C94E21] transition-colors py-2 inline-flex items-center">
              Forgot Password?
            </Link>
          </div>
        </div>

        {error && <Notice variant="error">{error}</Notice>}

        <Button
          type="submit"
          variant="accent"
          disabled={loading || googleLoading}
          loading={loading}
          className="w-full h-11 text-[14px] shadow-[0_2px_12px_rgba(224,90,40,0.3)]"
        >
          Sign In
        </Button>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F6F3]" style={{ backgroundImage: 'radial-gradient(circle, #E4DED8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
    }>
      <LoginForm />
    </Suspense>
  )
}
