'use client'

// IMPORTANT: In Supabase dashboard go to:
// Authentication → Settings → turn OFF "Enable email confirmations"
// This allows users to sign in immediately after signup without email verification
//
// IMPORTANT: While Google OAuth app is in testing mode, only test users can sign in.
// Go to console.cloud.google.com → OAuth consent screen → Test users → Add your email
// To allow all users, publish the app (Audience → Publish App)

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-[#E05A28] flex items-center justify-center flex-shrink-0">
        <svg className="w-4.5 h-4.5 text-white" width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 2v4a2 2 0 002 2v6M8 2v10M11 2s2 1 2 3-2 3-2 3v4"/>
        </svg>
      </div>
      <span className="text-[16px] font-bold text-[#111] tracking-tight">TableReply</span>
    </div>
  )
}

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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        console.error('[TableReply] Login error:', signInError.message)
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
          .from('restaurant_profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .single()
        if (!profile) { router.push('/onboarding'); router.refresh(); return }
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('[TableReply] Unexpected login error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `https://table-reply.vercel.app/auth/callback` },
      })
      if (oauthError) {
        console.error('[TableReply] Google OAuth error:', oauthError.message, oauthError)
        setError(`Google sign in failed: ${oauthError.message}`)
        setGoogleLoading(false)
      }
      if (data?.url) window.location.href = data.url
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[TableReply] Unexpected Google OAuth error:', msg, err)
      setError(`Google sign in error: ${msg}`)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center px-4 py-10 sm:py-12 relative" style={{ backgroundImage: 'radial-gradient(circle, #E4DED8 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      <div className="w-full max-w-[400px] animate-fade-up">

        {/* Logo */}
        <div className="flex justify-center mb-7 sm:mb-8">
          <Logo />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E4DED8] shadow-modal p-6 sm:p-8">
          <h1 className="text-[20px] font-bold text-[#111] tracking-[-0.02em] mb-1">Welcome Back</h1>
          <p className="text-[13px] text-[#A8A29E] mb-6">Sign in to manage your reviews</p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-[#E4DED8] bg-white hover:bg-[#F8F6F3] hover:border-[#CEC8C1] text-[#111] text-[14px] font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed mb-4"
          >
            {googleLoading ? (
              <svg className="animate-spin h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : <GoogleIcon />}
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
              placeholder="you@restaurant.com"
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
                <Link href="/forgot-password" className="text-[12px] text-[#E05A28] hover:text-[#C94E21] transition-colors">
                  Forgot Password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-2.5">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[13px] text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-11 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white font-semibold text-[14px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(224,90,40,0.3)]"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Sign In
            </button>
          </form>

          <p className="mt-6 text-[13px] text-center text-[#A8A29E]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#E05A28] hover:text-[#C94E21] font-semibold transition-colors">
              Start free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
