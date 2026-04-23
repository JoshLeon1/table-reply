export const dynamic = 'force-dynamic'

// Handles the OAuth callback from Google after the user grants access.
// Exchanges the authorization code for tokens, resolves the first
// account/location, then stores everything in google_business_tokens.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { saveGbpToken, resolveAccountAndLocation } from '@/lib/gbp/client'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'

export async function GET(request: NextRequest) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  const { searchParams } = request.nextUrl

  const code = searchParams.get('code')
  const rawState = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    console.error('[gbp-callback] OAuth error:', error)
    return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
  }

  if (!code || !rawState) {
    return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
  }

  // state is either "userId" or "userId:locationId". The state round-trips
  // through the user's own browser, so we can't trust either field without
  // checking it against the authenticated session + ownership of the row.
  const [stateUserId, stateLocationId] = rawState.split(':')

  // Verify the browser session matches the userId encoded in state.
  // Without this check, an attacker could craft state=victimUserId:someLocation
  // before hitting /api/auth/google-business and subsequently bind tokens
  // against someone else's account.
  const authSupabase = createClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user || user.id !== stateUserId) {
    console.error('[gbp-callback] Session user does not match OAuth state user')
    return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
  }
  const userId = user.id

  // Verify the locationId (if supplied) actually belongs to this user —
  // prevents authenticated user B from binding their GBP tokens to a
  // business_profile owned by user A.
  const adminSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  let locationId: string | undefined
  if (stateLocationId) {
    const { data: ownedLocation } = await adminSupabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('id', stateLocationId)
      .maybeSingle()
    if (!ownedLocation) {
      console.error('[gbp-callback] State locationId does not belong to user')
      return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
    }
    locationId = ownedLocation.id
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

  // Resolve businessProfileId: use locationId from state (already ownership-checked
  // above), or fall back to user's primary profile.
  let businessProfileId = locationId
  if (!businessProfileId) {
    const { data: primary } = await adminSupabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .maybeSingle()
    businessProfileId = primary?.id
  }

  if (!businessProfileId) {
    console.error('[gbp-callback] Could not resolve businessProfileId')
    return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
  }

  // Store tokens
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
