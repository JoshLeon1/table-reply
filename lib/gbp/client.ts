// lib/gbp/client.ts
import { createClient } from '@supabase/supabase-js'

const GBP_BASE = 'https://mybusiness.googleapis.com/v4'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

export interface GbpToken {
  user_id: string
  business_profile_id: string | null
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

export async function getGbpToken(userId: string, businessProfileId?: string): Promise<GbpToken | null> {
  const supabase = adminClient()
  let query = supabase
    .from('google_business_tokens')
    .select('*')
    .eq('user_id', userId)

  if (businessProfileId) {
    // (user_id, business_profile_id) is unique — safe to maybeSingle()
    query = query.eq('business_profile_id', businessProfileId)
    const { data } = await query.maybeSingle()
    return data ?? null
  }

  // Fallback: no businessProfileId provided. Multi-location users may have
  // multiple rows; .maybeSingle() returns PGRST116 here. Pick the most
  // recently updated token deterministically.
  const { data } = await query
    .order('updated_at', { ascending: false })
    .limit(1)
  return data?.[0] ?? null
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
  // Scope the update to this specific location's token row. Different
  // business_profiles can be connected to DIFFERENT Google accounts with
  // different refresh_tokens; updating all rows for the user would overwrite
  // unrelated locations' access_tokens with one derived from a different grant.
  let updateQuery = supabase
    .from('google_business_tokens')
    .update({
      access_token: json.access_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', token.user_id)

  if (token.business_profile_id) {
    updateQuery = updateQuery.eq('business_profile_id', token.business_profile_id)
  }

  await updateQuery

  return { ...token, access_token: json.access_token, expires_at: expiresAt }
}

async function getValidToken(userId: string, businessProfileId?: string): Promise<GbpToken> {
  const token = await getGbpToken(userId, businessProfileId)
  if (!token) throw new Error('No GBP token for user')

  const expiresAt = new Date(token.expires_at).getTime()
  if (Date.now() >= expiresAt - 120_000) {
    return refreshAccessToken(token)
  }
  return token
}

export async function gbpFetch(
  userId: string,
  path: string,
  options: RequestInit = {},
  businessProfileId?: string,
): Promise<Response> {
  const token = await getValidToken(userId, businessProfileId)
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
  businessProfileId: string
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
      business_profile_id: params.businessProfileId,
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      expires_at: expiresAt,
      account_name: params.accountName,
      location_name: params.locationName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,business_profile_id' },
  )
}

export async function deleteGbpToken(userId: string, businessProfileId?: string) {
  const supabase = adminClient()
  let query = supabase.from('google_business_tokens').delete().eq('user_id', userId)
  if (businessProfileId) {
    query = query.eq('business_profile_id', businessProfileId)
  }
  await query
}

export async function resolveAccountAndLocation(
  userId: string,
  businessProfileId?: string,
): Promise<{ accountName: string; locationName: string } | null> {
  const accRes = await gbpFetch(userId, '/accounts', {}, businessProfileId)
  if (!accRes.ok) {
    console.error('[gbp] Failed to list accounts:', await accRes.text())
    return null
  }
  const accJson = await accRes.json()
  const accounts: Array<{ name: string }> = accJson.accounts ?? []
  if (accounts.length === 0) return null

  const accountName = accounts[0].name
  const locRes = await gbpFetch(userId, `/${accountName}/locations?pageSize=1`, {}, businessProfileId)
  if (!locRes.ok) {
    console.error('[gbp] Failed to list locations:', await locRes.text())
    return null
  }
  const locJson = await locRes.json()
  const locations: Array<{ name: string }> = locJson.locations ?? []
  if (locations.length === 0) return null

  return { accountName, locationName: locations[0].name }
}
