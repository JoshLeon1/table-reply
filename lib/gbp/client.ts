// lib/gbp/client.ts
// Google Business Profile API client.
// Handles token storage/refresh and wraps the mybusiness v4 REST API.

import { createClient } from '@supabase/supabase-js'

const GBP_BASE = 'https://mybusiness.googleapis.com/v4'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

export interface GbpToken {
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  account_name: string | null
  location_name: string | null
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function getGbpToken(userId: string): Promise<GbpToken | null> {
  const supabase = adminClient()
  const { data } = await supabase
    .from('google_business_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return data ?? null
}

async function refreshAccessToken(token: GbpToken): Promise<GbpToken> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token,
      client_id: process.env.GOOGLE_BUSINESS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GBP token refresh failed: ${res.status} ${body.slice(0, 200)}`)
  }

  const json = await res.json()
  const expiresAt = new Date(Date.now() + json.expires_in * 1000).toISOString()

  const supabase = adminClient()
  await supabase
    .from('google_business_tokens')
    .update({
      access_token: json.access_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', token.user_id)

  return { ...token, access_token: json.access_token, expires_at: expiresAt }
}

async function getValidToken(userId: string): Promise<GbpToken> {
  const token = await getGbpToken(userId)
  if (!token) throw new Error('No GBP token for user')

  const expiresAt = new Date(token.expires_at).getTime()
  // Refresh if expires within 2 minutes
  if (Date.now() >= expiresAt - 120_000) {
    return refreshAccessToken(token)
  }
  return token
}

export async function gbpFetch(
  userId: string,
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getValidToken(userId)
  return fetch(`${GBP_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
}

export async function saveGbpToken(params: {
  userId: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  accountName: string | null
  locationName: string | null
}) {
  const supabase = adminClient()
  const expiresAt = new Date(Date.now() + params.expiresIn * 1000).toISOString()
  await supabase.from('google_business_tokens').upsert(
    {
      user_id: params.userId,
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      expires_at: expiresAt,
      account_name: params.accountName,
      location_name: params.locationName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
}

export async function deleteGbpToken(userId: string) {
  const supabase = adminClient()
  await supabase.from('google_business_tokens').delete().eq('user_id', userId)
}

// Fetch all accounts for the authenticated user and resolve their first location.
// Returns { accountName, locationName } or null if none found.
export async function resolveAccountAndLocation(
  userId: string,
): Promise<{ accountName: string; locationName: string } | null> {
  // List accounts
  const accRes = await gbpFetch(userId, '/accounts')
  if (!accRes.ok) {
    console.error('[gbp] Failed to list accounts:', await accRes.text())
    return null
  }
  const accJson = await accRes.json()
  const accounts: Array<{ name: string }> = accJson.accounts ?? []
  if (accounts.length === 0) return null

  const accountName = accounts[0].name

  // List locations under first account
  const locRes = await gbpFetch(userId, `/${accountName}/locations?pageSize=1`)
  if (!locRes.ok) {
    console.error('[gbp] Failed to list locations:', await locRes.text())
    return null
  }
  const locJson = await locRes.json()
  const locations: Array<{ name: string }> = locJson.locations ?? []
  if (locations.length === 0) return null

  return { accountName, locationName: locations[0].name }
}
