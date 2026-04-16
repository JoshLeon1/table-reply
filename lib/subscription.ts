import { SupabaseClient } from '@supabase/supabase-js'

export const TRIAL_DAYS = 7

/**
 * Returns true if the given user has an active paid subscription or an active
 * trial (started within the last TRIAL_DAYS days).
 *
 * Uses a service-role client so it can read the `profiles` table regardless of
 * RLS policies.
 */
export async function hasActiveAccess(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_paid, trial_started_at')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) return false
  if (profile.is_paid) return true

  if (profile.trial_started_at) {
    const trialStart = new Date(profile.trial_started_at).getTime()
    const trialEnd = trialStart + TRIAL_DAYS * 24 * 60 * 60 * 1000
    if (Date.now() < trialEnd) return true
  }

  return false
}
