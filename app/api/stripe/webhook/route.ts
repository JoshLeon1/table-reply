export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { stripe, planFromPriceId } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/database.types'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
import Stripe from 'stripe'
import { sendPaymentFailedEmail } from '@/lib/email/payment-failed'

function adminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type AdminClient = ReturnType<typeof adminClient>

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ ok: false, error: 'no_signature' }, { status: 400 })
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ ok: false, error: 'misconfigured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[webhook] signature verification failed:', err)
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 400 })
  }

  const supabase = adminClient()

  // Idempotency: try to claim this event id. If a row already exists,
  // this returns an error with code '23505' (unique_violation) — that
  // means we've already processed it, so respond 200 and exit.
  const { error: claimError } = await supabase
    .from('stripe_webhook_events')
    .insert({
      event_id: event.id,
      event_type: event.type,
      payload: event as unknown as Json,
    })

  if (claimError && claimError.code === '23505') {
    // Duplicate event — Stripe is retrying. Acknowledge so it stops.
    return NextResponse.json({ ok: true, duplicate: true })
  }
  if (claimError) {
    console.error('[webhook] failed to record event:', claimError)
    // Still try to process — the dup case is the only one we care about
    // protecting against. A failed log is recoverable.
  }

  try {
    await dispatch(event, supabase)
  } catch (err) {
    console.error('[webhook] handler threw for', event.type, err)
    // Return 500 so Stripe retries — but the idempotency row is still
    // there, so on retry we'll bail at the duplicate check. That's
    // intentional: the row is a "we're aware of this event" marker, not
    // a "we processed it successfully" marker. If the handler is broken
    // for a class of events, we want to know via Stripe's retry alerts
    // even if the dup check eats subsequent retries.
    return NextResponse.json({ ok: false, error: 'handler_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

async function dispatch(event: Stripe.Event, supabase: AdminClient) {
  switch (event.type) {
    // ── Subscription created / first payment succeeded ────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') return

      const userId = session.metadata?.userId
      const plan = session.metadata?.plan ?? 'monthly'
      if (!userId) return

      const updates: ProfileUpdate = {
        is_paid: true,
        stripe_customer_id: session.customer as string,
        stripe_plan: plan,
        subscription_canceled_at: null,
        subscription_past_due: false,
      }
      if (session.subscription) {
        updates.stripe_subscription_id = session.subscription as string
      }
      await supabase.from('profiles').update(updates).eq('id', userId)
      return
    }

    // ── Subscription created or plan changed ──────────────────────────────
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const priceId = subscription.items.data[0]?.price?.id
      const plan = priceId ? planFromPriceId(priceId) : null
      const periodEndUnix =
        (subscription as unknown as { current_period_end?: number }).current_period_end ?? null

      const updates: ProfileUpdate = {
        stripe_subscription_id: subscription.id,
        is_paid: ['active', 'trialing'].includes(subscription.status),
        subscription_period_end: periodEndUnix
          ? new Date(periodEndUnix * 1000).toISOString()
          : null,
        subscription_past_due: subscription.status === 'past_due',
      }
      if (plan) updates.stripe_plan = plan
      updates.subscription_canceled_at = subscription.cancel_at_period_end
        ? new Date().toISOString()
        : null

      await supabase
        .from('profiles')
        .update(updates)
        .eq('stripe_customer_id', customerId)
      return
    }

    // ── Subscription canceled (stays in grace until period end) ───────────
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const periodEndUnix =
        (subscription as unknown as { current_period_end?: number }).current_period_end ?? null

      // Do NOT immediately revoke is_paid — they paid through period end.
      // Set canceled_at + period_end so the gate can decide based on time.
      await supabase
        .from('profiles')
        .update({
          subscription_canceled_at: new Date().toISOString(),
          subscription_period_end: periodEndUnix
            ? new Date(periodEndUnix * 1000).toISOString()
            : null,
          stripe_subscription_id: null,
          // is_paid stays true until the gate detects period_end has passed
        })
        .eq('stripe_customer_id', customerId)
      return
    }

    // ── Invoice paid (renewal) — clear past_due, refresh period_end ───────
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const lineEnd = invoice.lines.data[0]?.period?.end
      await supabase
        .from('profiles')
        .update({
          is_paid: true,
          subscription_past_due: false,
          subscription_period_end: lineEnd
            ? new Date(lineEnd * 1000).toISOString()
            : null,
        })
        .eq('stripe_customer_id', customerId)
      return
    }

    // ── Payment failed — mark past_due and email the user ─────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const customerEmail =
        invoice.customer_email ??
        (typeof invoice.customer === 'string'
          ? null
          : (invoice.customer as Stripe.Customer)?.email) ??
        null

      await supabase
        .from('profiles')
        .update({ subscription_past_due: true })
        .eq('stripe_customer_id', customerId)

      if (customerEmail) {
        await sendPaymentFailedEmail({ toEmail: customerEmail, graceDays: 3 })
      } else {
        console.warn(
          '[webhook] invoice.payment_failed without customer email for',
          customerId
        )
      }
      return
    }
  }
}
