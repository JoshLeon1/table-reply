export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { stripe, planFromPriceId } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = adminClient()

  switch (event.type) {
    // ── Subscription created / first payment succeeded ──────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const plan = session.metadata?.plan ?? 'monthly'

      if (userId) {
        await supabase
          .from('profiles')
          .update({
            is_paid: true,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            stripe_plan: plan,
          })
          .eq('id', userId)
      }
      break
    }

    // ── Plan changed (upgrade monthly→annual or downgrade) ──────────────────
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const priceId = subscription.items.data[0]?.price?.id
      const plan = priceId ? planFromPriceId(priceId) : null

      const updates: Record<string, unknown> = {
        stripe_subscription_id: subscription.id,
        // Mark as paid if subscription is active or trialing
        is_paid: ['active', 'trialing'].includes(subscription.status),
      }
      if (plan) updates.stripe_plan = plan

      await supabase
        .from('profiles')
        .update(updates)
        .eq('stripe_customer_id', customerId)
      break
    }

    // ── Subscription cancelled / expired ────────────────────────────────────
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await supabase
        .from('profiles')
        .update({ is_paid: false, stripe_plan: null, stripe_subscription_id: null })
        .eq('stripe_customer_id', customerId)
      break
    }

    // ── Payment failed (card declined, expired, etc.) ───────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      // Mark as unpaid so the paywall shows again
      await supabase
        .from('profiles')
        .update({ is_paid: false })
        .eq('stripe_customer_id', customerId)

      console.warn(`Payment failed for customer ${customerId}`)
      break
    }
  }

  return NextResponse.json({ received: true })
}
