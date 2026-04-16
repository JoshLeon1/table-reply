export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') // e.g. /reset-password

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // If a specific next page was requested (e.g. password reset), go there.
      // Only allow same-origin paths (must start with "/" but not "//") to
      // prevent open-redirect phishing via crafted magic-link URLs.
      if (next && /^\/(?!\/)/.test(next)) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Otherwise route by onboarding status
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (!profile) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    if (error) {
      console.error('[Replyfi] Auth callback error:', error.message)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
