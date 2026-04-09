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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('[TableReply] Login error:', signInError.message)
        // Provide user-friendly messages for common errors
        if (signInError.message === 'Email not confirmed') {
          setError('Please confirm your email before signing in. Check your inbox for a confirmation link.')
        } else if (signInError.message === 'Invalid login credentials') {
          setError('Invalid email or password. Please try again.')
        } else {
          setError(signInError.message)
        }
        setLoading(false)
        return
      }

      // Use the user from the signInWithPassword response directly — no extra getUser() call
      if (data.user) {
        const { data: profile } = await supabase
          .from('restaurant_profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .single()

        if (!profile) {
          router.push('/onboarding')
          router.refresh()
          return
        }
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
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
        },
      })
      if (oauthError) {
        console.error('[TableReply] Google OAuth error:', oauthError.message)
        setError(oauthError.message)
        setGoogleLoading(false)
      }
    } catch (err) {
      console.error('[TableReply] Unexpected Google OAuth error:', err)
      setError('Something went wrong. Please try again.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
          <circle cx="20" cy="20" r="20" fill="#F59E0B" fillOpacity="0.12" />
          <path d="M14 10v6a4 4 0 0 0 4 4v10" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 10v20" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 10c0 0 4 2 4 6s-4 6-4 6v8" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-[22px] font-bold text-stone-900" style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.01em' }}>TableReply</span>
      </div>

      {/* Card */}
      <div className="w-full bg-white rounded-2xl shadow-xl p-8" style={{ maxWidth: '420px' }}>
        <h2 className="text-xl font-bold text-stone-900 mb-1 text-center">Welcome back</h2>
        <p className="text-sm text-stone-500 mb-6 text-center">Sign in to your account</p>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 h-[52px] rounded-full border border-[#E8E4DC] bg-white hover:bg-[#FAFAF8] text-stone-800 text-sm font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed mb-4"
        >
          {googleLoading ? (
            <svg className="animate-spin h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          )}
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[#E8E4DC]" />
          <span className="text-xs text-stone-400 font-medium">or</span>
          <div className="flex-1 h-px bg-[#E8E4DC]" />
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
              <Link
                href="/forgot-password"
                className="text-[12px] text-amber-600 hover:text-amber-700"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full h-[52px] rounded-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 opacity-80" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Sign in
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-stone-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-amber-600 hover:text-amber-700 font-medium">
            Start free →
          </Link>
        </p>
      </div>
    </div>
  )
}
