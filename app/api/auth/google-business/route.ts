export const dynamic = 'force-dynamic'

// Initiates Google Business Profile OAuth flow.
// Redirects to Google with the business.manage scope.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SCOPE = 'https://www.googleapis.com/auth/business.manage'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'GOOGLE_BUSINESS_CLIENT_ID not configured' }, { status: 500 })
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  const redirectUri = `${appUrl}/api/auth/google-business/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state: user.id,
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}
