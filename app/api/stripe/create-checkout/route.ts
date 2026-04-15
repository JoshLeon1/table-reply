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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let plan: StripePlan = 'monthly'
  try {
    const body = await request.json()
    plan = parsePlan(body?.plan)
  } catch {
    // body may be empty — default to monthly
  }

  try {
    const session = await createCheckoutSession(user.id, user.email!, plan)
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
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

  const plan = parsePlan(request.nextUrl.searchParams.get('plan'))

  try {
    const session = await createCheckoutSession(user.id, user.email!, plan)
    return NextResponse.redirect(session.url!)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Stripe checkout error:', msg)
    return NextResponse.redirect(new URL('/settings', request.url))
  }
}
