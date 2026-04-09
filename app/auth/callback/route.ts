export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[TableReply] Auth callback error:', error.message)
      return NextResponse.redirect(`${origin}/login?error=Could+not+verify+session`)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
