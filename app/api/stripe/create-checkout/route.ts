export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, StripePlan } from '@/lib/stripe'

function parsePlan(raw: string | null | undefined): StripePlan {
  return raw === 'annual' ? 'annual' : 'monthly'
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let plan: StripePlan = 'monthly'
  try {
    const body = await request.json()
    plan = parsePlan(body?.plan)
  } catch {
    // body may be empty — default to monthly
  }

  if (!user.email) {
    return NextResponse.json(
      { ok: false, error: 'no_email', message: 'An email address is required to subscribe.' },
      { status: 400 }
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  try {
    const session = await createCheckoutSession(user.id, user.email, plan, {
      stripeCustomerId: (profile as { stripe_customer_id?: string | null } | null)?.stripe_customer_id ?? null,
    })
    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[stripe] create-checkout POST error:', msg)
    // Do not leak raw Stripe errors to the client — they can reveal
    // account/key shape. Return a generic code; logs have details.
    return NextResponse.json({ ok: false, error: 'checkout_failed' }, { status: 500 })
  }
}

// GET handler — used by settings page <Link href="/api/stripe/create-checkout?plan=annual">
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user.email) {
    return NextResponse.redirect(new URL('/settings?error=no-email', request.url))
  }

  const plan = parsePlan(request.nextUrl.searchParams.get('plan'))

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  try {
    const session = await createCheckoutSession(user.id, user.email, plan, {
      stripeCustomerId: (profile as { stripe_customer_id?: string | null } | null)?.stripe_customer_id ?? null,
    })
    return NextResponse.redirect(session.url!)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[stripe] create-checkout GET error:', msg)
    return NextResponse.redirect(new URL('/settings?error=checkout_failed', request.url))
  }
}
