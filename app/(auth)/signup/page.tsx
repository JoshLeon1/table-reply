export const dynamic = 'force-dynamic'

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: authData, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Set trial_started_at immediately at signup so the 7-day clock starts now
    if (authData.user) {
      await supabase
        .from('profiles')
        .update({ trial_started_at: new Date().toISOString() })
        .eq('id', authData.user.id)
    }

    router.push('/onboarding')
    router.refresh()
  }

  return (
    <Card>
      <h2 className="text-xl font-bold text-stone-900 mb-1">Start your free week</h2>
      <p className="text-sm text-stone-500 mb-6">No credit card required. First 7 days free.</p>
      <form onSubmit={handleSignup} className="space-y-4">
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
        <Input
          id="password"
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
          minLength={6}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading} size="lg" className="w-full">
          Create account — it's free
        </Button>
      </form>
      <p className="mt-4 text-sm text-center text-stone-600">
        Already have an account?{' '}
        <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
          Sign in
        </Link>
      </p>
    </Card>
  )
}
