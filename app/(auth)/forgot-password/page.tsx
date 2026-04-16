'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E05A28] flex items-center justify-center">
              <svg className="text-white" width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 2v4a2 2 0 002 2v6M8 2v10M11 2s2 1 2 3-2 3-2 3v4"/>
              </svg>
            </div>
            <span className="text-[16px] font-bold text-[#111] tracking-tight">Replyfi</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4DED8] shadow-modal p-7 sm:p-8">
          <h1 className="text-[20px] font-bold text-[#111] tracking-[-0.02em] mb-1">Reset your password</h1>
          <p className="text-[14px] text-[#7C7672] mb-6">Enter your email and we'll send you a reset link.</p>

          {success ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-4">
              <p className="text-[13px] text-emerald-700 font-medium">Check your email for a password reset link.</p>
            </div>
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
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
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
                Send Reset Link
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
