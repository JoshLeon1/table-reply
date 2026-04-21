// lib/locations/active.ts
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

const COOKIE_NAME = 'active_location_id'

export function getActiveLocationId(): string | undefined {
  return cookies().get(COOKIE_NAME)?.value
}

/**
 * Resolve which business_profile row a user-initiated request should operate on.
 *
 * Prefers the `active_location_id` cookie when it points at a row the user
 * owns, otherwise falls back to the user's primary location. Returns null if
 * the user has no business profile at all.
 *
 * Use this in API routes that act on behalf of a signed-in user and need to
 * pick "the location they're currently looking at" rather than the primary
 * by default (e.g. manual review syncs, settings saves, reply generation).
 */
export async function resolveActiveOrPrimaryLocationId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const cookieId = getActiveLocationId()
  if (cookieId) {
    const { data } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('id', cookieId)
      .maybeSingle()
    if (data?.id) return data.id
  }
  const { data } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .maybeSingle()
  return data?.id ?? null
}
