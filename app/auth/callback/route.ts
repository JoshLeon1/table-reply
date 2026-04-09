export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('restaurant_profiles')
        .select('id')
        .eq('user_id', data.user.id)
        .single()

      if (!profile) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    if (error) {
      console.error('[TableReply] Auth callback error:', error.message)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
