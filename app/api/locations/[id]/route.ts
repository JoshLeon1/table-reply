// app/api/locations/[id]/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Verify ownership and get location info
  const { data: location } = await supabaseAdmin
    .from('business_profiles')
    .select('id, is_primary')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!location) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (location.is_primary) return NextResponse.json({ error: 'Cannot remove the primary location' }, { status: 400 })

  // Ensure this isn't the last location
  const { count } = await supabaseAdmin
    .from('business_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) <= 1) {
    return NextResponse.json({ error: 'Cannot remove the only location' }, { status: 400 })
  }

  // Delete location — cascades to scraped_reviews and google_business_tokens
  const { error: deleteErr } = await supabaseAdmin
    .from('business_profiles')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (deleteErr) {
    console.error('[locations/delete] Delete failed:', deleteErr)
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 })
  }

  // Stripe quantity decrement
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      // Skip quantity updates on canceled/ended subs — Stripe will 400.
      const updatable = sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due'
      const item = sub.items.data[0]
      if (updatable && item) {
        const newQty = Math.max(1, (item.quantity ?? 1) - 1)
        await stripe.subscriptions.update(profile.stripe_subscription_id, {
          items: [{ id: item.id, quantity: newQty }],
          proration_behavior: 'create_prorations',
        })
      }
    } catch (stripeErr) {
      console.error('[locations/delete] Stripe update failed:', stripeErr)
    }
  }

  const response = NextResponse.json({ ok: true })
  // Clear the active-location cookie if it pointed at the just-deleted row.
  // Without this, every page that reads getActiveLocationId() would filter
  // to a non-existent profile and bounce the user to /onboarding.
  const activeCookie = request.cookies.get('active_location_id')?.value
  if (activeCookie === params.id) {
    response.cookies.set('active_location_id', '', { path: '/', maxAge: 0 })
  }
  return response
}
