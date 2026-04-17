export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(_request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  const stripeCustomerId = (profile as { stripe_customer_id?: string | null } | null)?.stripe_customer_id
  if (!stripeCustomerId) {
    // No customer on file — this is a known "user hasn't subscribed yet"
    // state, not a server error. Return a 400 with a recognisable code
    // so the client can route them to the checkout flow instead.
    return NextResponse.json(
      { ok: false, error: 'no_subscription', message: 'No Stripe customer on file. Subscribe first.' },
      { status: 400 }
    )
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error('[stripe] create-portal: NEXT_PUBLIC_APP_URL is not set')
    return NextResponse.json({ ok: false, error: 'server_misconfigured' }, { status: 500 })
  }
  const returnUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '') + '/settings'

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[stripe] create-portal error:', error)
    return NextResponse.json({ ok: false, error: 'portal_failed' }, { status: 500 })
  }
}
