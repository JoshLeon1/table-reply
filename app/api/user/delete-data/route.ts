export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

export async function DELETE() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // ── 1. Read Stripe subscription ID BEFORE deleting the profiles row ──────
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .maybeSingle()

  // ── 2. Cancel Stripe subscription ────────────────────────────────────────
  if (profile?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(profile.stripe_subscription_id)
    } catch (err) {
      console.error('Failed to cancel Stripe subscription:', err)
      // Don't block account deletion if Stripe cancel fails
    }
  }

  // ── 3. Delete all user data — leaf tables first, then parents ─────────────
  // Wave 1: all rows that reference scraped_reviews / business_profiles / user_id
  await Promise.all([
    serviceClient.from('scraped_reviews').delete().eq('user_id', user.id),
    serviceClient.from('competitor_profiles').delete().eq('user_id', user.id),
    serviceClient.from('keyword_alerts').delete().eq('user_id', user.id),
    serviceClient.from('business_analytics').delete().eq('user_id', user.id),
    serviceClient.from('google_waitlist').delete().eq('user_id', user.id),
    serviceClient.from('replies').delete().eq('user_id', user.id),
  ])

  // Wave 2: business profile + user profile (after all child rows are gone)
  await Promise.all([
    serviceClient.from('business_profiles').delete().eq('user_id', user.id),
    serviceClient.from('profiles').delete().eq('id', user.id),
  ])

  // ── 4. Delete the Supabase auth user (hard delete) ────────────────────────
  const { error: authError } = await serviceClient.auth.admin.deleteUser(user.id)
  if (authError) {
    console.error('Failed to delete auth user:', authError)
    return NextResponse.json({ error: 'Failed to delete account. Please contact support.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
