export const dynamic = 'force-dynamic'

// Handles the OAuth callback from Google after the user grants access.
// Exchanges the authorization code for tokens, resolves the first
// account/location, then stores everything in google_business_tokens.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { saveGbpToken, resolveAccountAndLocation } from '@/lib/gbp/client'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'

export async function GET(request: NextRequest) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  const { searchParams } = request.nextUrl

  const code = searchParams.get('code')
  const userId = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    console.error('[gbp-callback] OAuth error:', error)
    return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
  }

  if (!code || !userId) {
    return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
  }

  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error('[gbp-callback] Missing client credentials')
    return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
  }

  const redirectUri = `${appUrl}/api/auth/google-business/callback`

  // Exchange code for tokens
  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    const body = await tokenRes.text()
    console.error('[gbp-callback] Token exchange failed:', tokenRes.status, body.slice(0, 300))
    return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
  }

  const tokens = await tokenRes.json()

  if (!tokens.refresh_token) {
    console.error('[gbp-callback] No refresh_token in response — user may need to re-authorize')
    return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
  }

  // Look up the user's primary business profile ID
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: bp } = await supabaseAdmin
    .from('business_profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .maybeSingle()

  const businessProfileId: string | null = bp?.id ?? null

  if (!businessProfileId) {
    console.error('[gbp-callback] No primary business profile found for user', userId)
    return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
  }

  // Store tokens (without account/location first so we can call the API)
  await saveGbpToken({
    userId,
    businessProfileId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in ?? 3600,
    accountName: null,
    locationName: null,
  })

  // Resolve account + first location, update row
  const resolved = await resolveAccountAndLocation(userId, businessProfileId)
  if (resolved) {
    await saveGbpToken({
      userId,
      businessProfileId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in ?? 3600,
      accountName: resolved.accountName,
      locationName: resolved.locationName,
    })
  }

  return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=connected`)
}
