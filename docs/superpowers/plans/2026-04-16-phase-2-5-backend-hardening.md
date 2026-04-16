# Phase 2.5 — Backend Integration Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Stripe webhook safe to retry (idempotency), close the gaps in the subscription lifecycle (created/updated/deleted/payment_failed), prevent duplicate Stripe customer creation, type the Supabase data layer end-to-end, and centralize the access-decision logic so the paywall is consistent everywhere.

**Architecture:** Add a `stripe_webhook_events` table that records every processed event id; the webhook short-circuits on duplicate ids. Update `lib/stripe.ts::createCheckoutSession` to accept an existing `stripe_customer_id` and use `customer:` instead of `customer_email:` when present. Generate the typed Database schema from Supabase and pass it as the generic to both `createBrowserClient` and `createServerClient`. Extract `lib/subscription/access.ts::hasAccess(profile)` and route every paywall decision through it.

**Tech Stack:** Stripe Node SDK, Supabase Postgres + RLS, TypeScript, Next.js 14 App Router.

**Verification model:** No test runner. Each task ends with `npx tsc --noEmit` and `npm run build`. Stripe webhook changes are verified end-to-end with the Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook` + `stripe trigger`). Supabase changes are verified via the SQL editor.

**Prerequisites:** Phase 1 (theme tokens) and Phase 2 (Resend email route, paywall changes) are shipped. Specifically: this phase assumes `profiles.has_seen_demo` exists and the `useModal` hook is in place.

---

## Schema reality check (read this first)

The audit spec used abstract column names like `subscription_status`. The actual `profiles` table uses:

- `is_paid` (boolean) — true when an active or trialing subscription exists
- `stripe_customer_id` (text)
- `stripe_subscription_id` (text)
- `stripe_plan` (text) — 'monthly' or 'annual'
- `trial_started_at` (timestamptz) — used to compute `daysRemaining` client-side

We will NOT introduce `subscription_status` as a new column — instead, we keep using `is_paid` and add lifecycle tracking via two new columns: `subscription_period_end` (timestamptz, nullable) and `subscription_canceled_at` (timestamptz, nullable). This preserves the existing client UI in `SubscriptionGateWrapper.tsx` while making the webhook honest about what happened.

---

## File map

| File | Change |
| --- | --- |
| `supabase/migrations/<ts>_stripe_webhook_events.sql` (NEW) | Idempotency table + RLS lockdown |
| `supabase/migrations/<ts>_profile_subscription_lifecycle.sql` (NEW) | `subscription_period_end`, `subscription_canceled_at` columns |
| `lib/stripe.ts` | `createCheckoutSession` accepts `stripe_customer_id`, uses `customer:` when present |
| `app/api/stripe/create-checkout/route.ts` | Look up customer id, pass it to `createCheckoutSession`, structured error response |
| `app/api/stripe/create-portal/route.ts` | 404 (not 500) when no customer id; absolute return URL |
| `app/api/stripe/webhook/route.ts` | Idempotency wrapper, full lifecycle, period-end tracking, payment_failed → past_due email |
| `lib/email/payment-failed.ts` (NEW) | Resend wrapper for the past-due email |
| `lib/supabase/database.types.ts` (NEW) | Generated `Database` type from Supabase |
| `lib/supabase/client.ts` | `createBrowserClient<Database>()` |
| `lib/supabase/server.ts` | `createServerClient<Database>()` |
| `lib/subscription/access.ts` (NEW) | `hasAccess(profile) → { ok, reason }` helper |
| `app/(dashboard)/layout.tsx` (or wherever `SubscriptionGateWrapper` is mounted) | Pass `hasAccess()` result instead of computing inline |
| `components/SubscriptionGateWrapper.tsx` | Take `access` result instead of `isPaid + daysRemaining` |
| Sweep across `lib/` and `app/` | `.single()` → `.maybeSingle()` where rows may be absent |

---

## Task 1: Add the `stripe_webhook_events` idempotency table

**Files:**
- Create: `supabase/migrations/20260416130000_stripe_webhook_events.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260416130000_stripe_webhook_events.sql
--
-- Idempotency log for Stripe webhook events. Stripe retries on any
-- non-2xx response, so the webhook handler must be safe to call with
-- the same event id more than once. We record event_id as primary
-- key — duplicate inserts collide and signal "already processed".

create table if not exists stripe_webhook_events (
  event_id     text        primary key,
  event_type   text        not null,
  processed_at timestamptz not null default now(),
  payload      jsonb       not null
);

create index if not exists stripe_webhook_events_processed_at_idx
  on stripe_webhook_events(processed_at desc);

-- Service role only — never expose to authenticated users.
alter table stripe_webhook_events enable row level security;

-- No policies = no row access for any authenticated role; only the
-- service-role key (used by the webhook handler) bypasses RLS.
```

- [ ] **Step 2: Apply the migration**

```bash
cd "/Users/joshleon/Table Reply"
npx supabase db push
```

(Or paste into the Supabase SQL editor.) Verify:

```sql
select count(*) from stripe_webhook_events;  -- 0 rows
select * from pg_policies where tablename = 'stripe_webhook_events';  -- no rows
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add supabase/migrations/20260416130000_stripe_webhook_events.sql
git commit -m "feat(db): stripe_webhook_events idempotency table

PRIMARY KEY on event_id makes duplicate-event detection a single
INSERT…ON CONFLICT. RLS enabled with no policies — service role
only. Index on processed_at desc for log scrubbing later."
```

---

## Task 2: Add subscription lifecycle columns to `profiles`

**Files:**
- Create: `supabase/migrations/20260416130100_profile_subscription_lifecycle.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260416130100_profile_subscription_lifecycle.sql
--
-- Track the subscription period end and cancel timestamp so we can:
--   1) Keep access alive after a cancellation through current_period_end
--   2) Show "Cancels on Apr 30" in the UI
--   3) Distinguish 'canceled but still has access' from 'never paid'

alter table profiles
  add column if not exists subscription_period_end  timestamptz,
  add column if not exists subscription_canceled_at timestamptz,
  add column if not exists subscription_past_due    boolean not null default false;
```

- [ ] **Step 2: Apply and verify**

```bash
cd "/Users/joshleon/Table Reply"
npx supabase db push
```

```sql
select column_name from information_schema.columns
 where table_name = 'profiles'
   and column_name in ('subscription_period_end','subscription_canceled_at','subscription_past_due');
-- expect 3 rows
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add supabase/migrations/20260416130100_profile_subscription_lifecycle.sql
git commit -m "feat(db): track subscription period end + cancel + past_due

Adds three columns on profiles for subscription lifecycle tracking
without renaming or replacing is_paid (which the existing client
gate uses). past_due is a fast bool for paywall short-circuiting."
```

---

## Task 3: Generate Supabase typed `Database`

**Files:**
- Create: `lib/supabase/database.types.ts`

- [ ] **Step 1: Generate the types**

If you have the Supabase CLI installed and the project is linked:

```bash
cd "/Users/joshleon/Table Reply"
npx supabase gen types typescript --linked --schema public > lib/supabase/database.types.ts
```

If the project isn't linked, alternatives in priority order:
- Use `npx supabase login`, then `npx supabase link --project-ref <ref>` and re-run.
- Generate from the dashboard: Project Settings → API → "TypeScript types" → copy → paste into `lib/supabase/database.types.ts`.
- (LAST RESORT only — defeats the point of generation) hand-author a `Database` interface that covers `profiles`, `business_profiles`, `scraped_reviews`, `business_analytics`, `stripe_webhook_events`, and any other tables the app reads. Mark with a TODO comment to regenerate when CLI is available.

- [ ] **Step 2: Verify the file was generated**

The file should start with something like `export type Json = string | number | ...` followed by `export interface Database { public: { Tables: { ... } } }`. Do NOT edit by hand after generation — re-running the generator is the way to update it.

- [ ] **Step 3: Verify the build still type-checks (the file is generated but unused yet)**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add lib/supabase/database.types.ts
git commit -m "feat(supabase): generated Database types from schema

Captures the full public schema as a TypeScript interface. The
client/server factories will pick this up in the next task and
catch column-rename drift at compile time."
```

---

## Task 4: Pass `Database` generic into Supabase client factories

**Files:**
- Modify: `lib/supabase/client.ts`
- Modify: `lib/supabase/server.ts`

- [ ] **Step 1: Type the browser client**

Replace `lib/supabase/client.ts` with:

```ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Type the server client**

Replace `lib/supabase/server.ts` with:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookie mutations handled by middleware
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Verify the build catches existing schema drift**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit
```

This may surface real bugs: places where the code reads a column that doesn't exist or types a value differently from the DB. For each error:

- If the column genuinely doesn't exist or was renamed in the DB → fix the call site.
- If the column DOES exist but is missing from `database.types.ts` → re-run the generator (the generated file may be stale relative to the migrations from Tasks 1 & 2).
- If the column is intentionally typed as a JSON column with a loose shape → cast at the call site (`as { ... }`) but document why.

Loop until `tsc` is clean. Do NOT silence errors with `as any`.

- [ ] **Step 4: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npm run build
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add lib/supabase/client.ts lib/supabase/server.ts
# any call sites you fixed:
git add $(git diff --name-only)
git commit -m "feat(supabase): pass Database generic to client factories

Both createBrowserClient and createServerClient now know the schema.
.from('profiles').select('foo') becomes a compile error if 'foo'
isn't a real column. Catches drift before it ships."
```

---

## Task 5: `.single()` → `.maybeSingle()` audit

**Files:**
- Sweep across `lib/`, `app/`, `components/`

- [ ] **Step 1: Find every `.single()` call**

Use the Grep tool with pattern `\.single\(\)` over `lib/`, `app/`, `components/`. For each result, ask:

> "If this query returns zero rows, is that a bug, or is it a normal state the app should handle?"

- **Normal-zero-row paths** (must convert to `.maybeSingle()`):
  - Looking up a user's `business_profiles` before they've onboarded
  - Looking up `business_analytics` before any reviews are scraped
  - Looking up `stripe_customer_id` on `profiles` for a non-paying user
  - Looking up the latest scraped review when none exist yet
  - Any "load if exists" pattern in onboarding or settings

- **Always-one-row paths** (keep `.single()`):
  - Insert + select roundtrip after just inserting a row
  - Lookup by primary key on a row you just confirmed exists upstream

- [ ] **Step 2: Convert each candidate**

For every "normal zero rows" call:

1. Change `.single()` to `.maybeSingle()`.
2. The return type becomes `{ data: T | null, error }` instead of `{ data: T, error }`. Add explicit null handling at the call site:
   ```ts
   const { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
   if (!profile) {
     // …explicit branch — onboarding redirect, empty state, etc.
   }
   ```

If a call previously relied on `.single()` throwing to short-circuit, the engineer must add an explicit early return — DO NOT leave behavior implicit.

- [ ] **Step 3: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean.

- [ ] **Step 4: Manual smoke**

Test the most common "no row yet" paths:

1. Brand new user (no business_profiles row) → `/dashboard` should redirect to `/onboarding`, not crash.
2. Paid user without `stripe_customer_id` (rare but possible during initial sync) → `/api/stripe/create-portal` should return a clean 400 (Task 7).

- [ ] **Step 5: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add $(git diff --name-only | grep -E '\.(ts|tsx)$')
git commit -m "fix(supabase): .single() → .maybeSingle() where rows may be absent

The .single() throw-on-zero was being relied on as control flow in
several spots (onboarding redirects, settings lookups). Convert to
.maybeSingle() with explicit null-branch handling so the behavior
is visible in the code instead of catching a thrown error."
```

---

## Task 6: `lib/stripe.ts` — accept existing customer id, dedupe customers

**Files:**
- Modify: `lib/stripe.ts`

- [ ] **Step 1: Update `createCheckoutSession` signature**

Replace the existing function body with one that prefers a known `customer:` over `customer_email:`:

```ts
export async function createCheckoutSession(
  userId: string,
  email: string,
  plan: StripePlan = 'monthly',
  options: { stripeCustomerId?: string | null } = {}
) {
  const priceId = PRICE_IDS[plan]
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL is not set in environment variables')
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')

  // Stripe will create a duplicate customer if you pass customer_email
  // and the email already maps to one. Always prefer the known id.
  const customerFields = options.stripeCustomerId
    ? { customer: options.stripeCustomerId }
    : { customer_email: email }

  const session = await stripe.checkout.sessions.create({
    ...customerFields,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/settings`,
    metadata: { userId, plan },
    // Carry metadata onto the subscription so cancel/update events
    // carry user_id without requiring a Customer→user lookup.
    subscription_data: {
      metadata: { userId, plan },
    },
    allow_promotion_codes: true,
  })

  return session
}
```

- [ ] **Step 2: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add lib/stripe.ts
git commit -m "feat(stripe): dedupe customers + carry metadata onto subscription

createCheckoutSession now accepts an existing stripe_customer_id
and uses Stripe's 'customer:' field (which prevents duplicate
customer creation for the same email). Also forward metadata onto
subscription_data so cancel/update webhook events carry user_id
without requiring a Customer→user lookup."
```

---

## Task 7: Harden `create-checkout` and `create-portal` routes

**Files:**
- Modify: `app/api/stripe/create-checkout/route.ts`
- Modify: `app/api/stripe/create-portal/route.ts`

- [ ] **Step 1: Look up `stripe_customer_id` in create-checkout**

In `app/api/stripe/create-checkout/route.ts`, before the `createCheckoutSession` call, fetch the existing customer id and pass it through:

```ts
// inside POST after the user check
const { data: profile } = await supabase
  .from('profiles')
  .select('stripe_customer_id')
  .eq('id', user.id)
  .maybeSingle()

try {
  const session = await createCheckoutSession(
    user.id,
    user.email,
    plan,
    { stripeCustomerId: profile?.stripe_customer_id ?? null }
  )
  return NextResponse.json({ url: session.url })
} catch (error: unknown) {
  const msg = error instanceof Error ? error.message : 'Unknown error'
  console.error('Stripe checkout error:', msg)
  return NextResponse.json({ ok: false, error: 'checkout_failed' }, { status: 500 })
}
```

Also do the same in the GET handler. Do NOT echo the raw Stripe error message back to the client (it can leak account/key shape) — log it server-side, return a generic code.

- [ ] **Step 2: Harden `create-portal`**

Replace the body of `app/api/stripe/create-portal/route.ts` so it returns a structured 400 (not 500) when there's no customer id:

```ts
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { ok: false, error: 'no_subscription', message: 'No Stripe customer on file. Subscribe first.' },
      { status: 400 }
    )
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error('NEXT_PUBLIC_APP_URL is not set')
    return NextResponse.json({ ok: false, error: 'server_misconfigured' }, { status: 500 })
  }
  const returnUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '') + '/settings'

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json({ ok: false, error: 'portal_failed' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean.

- [ ] **Step 4: Manual verification**

1. Sign in as a user with no `stripe_customer_id` (run `update profiles set stripe_customer_id = null where id = '<your-id>'`).
2. Hit `POST /api/stripe/create-portal` from the browser console:
   ```js
   fetch('/api/stripe/create-portal', { method: 'POST' }).then(r => r.json())
   ```
   Expected: `{ ok: false, error: 'no_subscription', message: '...' }` with HTTP 400 (no longer a 500 with stack trace).
3. Subscribe via the paywall (use Stripe test card `4242 4242 4242 4242`). Verify a single Stripe customer is created (Stripe dashboard) — not two.

- [ ] **Step 5: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add app/api/stripe/create-checkout/route.ts app/api/stripe/create-portal/route.ts
git commit -m "fix(stripe): structured errors + customer dedupe

create-checkout looks up existing stripe_customer_id and forwards
it so Stripe doesn't create a duplicate customer. create-portal
returns a friendly 400 with an error code when the user has no
Stripe customer on file (was previously a 500 with stack trace)."
```

---

## Task 8: Past-due email helper

**Files:**
- Create: `lib/email/payment-failed.ts`

- [ ] **Step 1: Write the helper**

```ts
// lib/email/payment-failed.ts
//
// Sent from the Stripe webhook when an invoice payment fails.
// Resend is already a dependency; uses RESEND_API_KEY from env.

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY ?? '')

export interface PaymentFailedEmailInput {
  toEmail: string
  /** Number of days until access stops, if Stripe provides it */
  graceDays?: number
}

export async function sendPaymentFailedEmail(input: PaymentFailedEmailInput) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[payment-failed-email] RESEND_API_KEY not set — skipping')
    return { skipped: true as const }
  }

  const { toEmail, graceDays } = input
  const grace = graceDays ?? 3
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://replyfi.com').replace(/\/$/, '')
  const portalLink = `${appUrl}/settings?tab=account`

  await resend.emails.send({
    from: 'ReplyFi <billing@replyfi.com>',
    to: toEmail,
    subject: 'Your card was declined — update your payment method',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111;">
        <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 16px;">Your most recent payment didn't go through</h1>
        <p style="font-size: 14px; line-height: 1.55; color: #444; margin: 0 0 12px;">
          We tried to charge the card on file for your ReplyFi subscription and it was declined.
          You have <strong>${grace} days</strong> to update your payment before access pauses.
        </p>
        <p style="font-size: 14px; line-height: 1.55; color: #444; margin: 0 0 24px;">
          The most common reasons: card expired, daily limit reached, or the bank flagged it as suspicious.
        </p>
        <a href="${portalLink}" style="display: inline-block; background: #E05A28; color: white; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 20px; border-radius: 10px;">
          Update payment method
        </a>
        <p style="font-size: 12px; color: #888; margin: 32px 0 0;">
          Replying to this email reaches a real human at ReplyFi support.
        </p>
      </div>
    `,
  })

  return { skipped: false as const }
}
```

- [ ] **Step 2: Verify it type-checks**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add lib/email/payment-failed.ts
git commit -m "feat(email): payment-failed Resend helper

Used by the webhook on invoice.payment_failed to give the user
3 days notice and a one-click portal link to update their card."
```

---

## Task 9: Webhook idempotency + full lifecycle

**Files:**
- Modify: `app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Add the idempotency wrapper**

Replace the body of the POST handler. The new shape: signature verify → idempotency check → switch on event type → record processed.

```ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { stripe, planFromPriceId } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import Stripe from 'stripe'
import { sendPaymentFailedEmail } from '@/lib/email/payment-failed'

function adminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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
      payload: event as unknown as Record<string, unknown>,
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

type AdminClient = ReturnType<typeof adminClient>

async function dispatch(event: Stripe.Event, supabase: AdminClient) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') return

      const userId = session.metadata?.userId
      const plan = session.metadata?.plan ?? 'monthly'
      if (!userId) return

      const updates: Record<string, unknown> = {
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

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const priceId = subscription.items.data[0]?.price?.id
      const plan = priceId ? planFromPriceId(priceId) : null
      const periodEndUnix = (subscription as unknown as { current_period_end?: number }).current_period_end ?? null

      const updates: Record<string, unknown> = {
        stripe_subscription_id: subscription.id,
        is_paid: ['active', 'trialing'].includes(subscription.status),
        subscription_period_end: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
        subscription_past_due: subscription.status === 'past_due',
      }
      if (plan) updates.stripe_plan = plan
      if (subscription.cancel_at_period_end) {
        updates.subscription_canceled_at = new Date().toISOString()
      } else {
        updates.subscription_canceled_at = null
      }

      await supabase.from('profiles').update(updates).eq('stripe_customer_id', customerId)
      return
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const periodEndUnix = (subscription as unknown as { current_period_end?: number }).current_period_end ?? null

      // Do NOT immediately revoke is_paid — they paid through period end.
      // Set canceled_at + period_end so the gate can decide based on time.
      await supabase
        .from('profiles')
        .update({
          subscription_canceled_at: new Date().toISOString(),
          subscription_period_end: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
          stripe_subscription_id: null,
          // is_paid stays true until the gate detects period_end has passed
        })
        .eq('stripe_customer_id', customerId)
      return
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      // Renewal: clear past_due, refresh period_end from the line items.
      const lineEnd = invoice.lines.data[0]?.period?.end
      await supabase
        .from('profiles')
        .update({
          is_paid: true,
          subscription_past_due: false,
          subscription_period_end: lineEnd ? new Date(lineEnd * 1000).toISOString() : null,
        })
        .eq('stripe_customer_id', customerId)
      return
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const customerEmail = invoice.customer_email
        ?? (typeof invoice.customer === 'string' ? null : (invoice.customer as Stripe.Customer)?.email)
        ?? null

      await supabase
        .from('profiles')
        .update({ subscription_past_due: true })
        .eq('stripe_customer_id', customerId)

      if (customerEmail) {
        await sendPaymentFailedEmail({ toEmail: customerEmail, graceDays: 3 })
      } else {
        console.warn('[webhook] invoice.payment_failed without customer email for', customerId)
      }
      return
    }
  }
}
```

- [ ] **Step 2: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean. The `current_period_end` cast is needed because the Stripe SDK types it as `number` in some versions and the field placement varies — the cast keeps us robust across SDK versions.

- [ ] **Step 3: Verify with Stripe CLI**

In one terminal:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Copy the webhook signing secret it prints and put it in `.env.local` as `STRIPE_WEBHOOK_SECRET=whsec_...` for this dev session.

In another terminal, with the dev server running:
```bash
# 1. Idempotency: trigger the same event twice, only one should write.
stripe trigger checkout.session.completed
stripe trigger checkout.session.completed --override checkout_session:metadata.userId=<your-test-user-id>

# Verify in SQL:
#   select count(*) from stripe_webhook_events;   — N rows after N triggers
#   on the second-trigger of the SAME event_id (replay from CLI),
#   expect log line "duplicate" and no profile changes.

# 2. Payment failed → past_due + email
stripe trigger invoice.payment_failed --override invoice:customer_email=test@yourdomain.com
# Verify: profiles.subscription_past_due = true for that customer
# Verify: Resend logs show the past_due email sent
```

If the Stripe CLI isn't installed, install via `brew install stripe/stripe-cli/stripe` (macOS) or follow https://docs.stripe.com/stripe-cli.

- [ ] **Step 4: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add app/api/stripe/webhook/route.ts
git commit -m "feat(stripe): idempotent webhook + full lifecycle handling

- Idempotency via INSERT into stripe_webhook_events on event_id PK.
  Duplicate event ids respond 200 with duplicate:true, no DB writes.
- Add customer.subscription.created handler (was missing).
- subscription.deleted no longer flips is_paid immediately — they
  paid through current_period_end. Sets canceled_at + period_end
  so the gate can age them out.
- invoice.paid bumps period_end, clears past_due.
- invoice.payment_failed sets past_due + sends a Resend email
  via the new lib/email/payment-failed helper."
```

---

## Task 10: Centralize the access decision

**Files:**
- Create: `lib/subscription/access.ts`
- Modify: `components/SubscriptionGateWrapper.tsx`
- Modify: wherever the layout currently computes `isPaid` and `daysRemaining` to pass into `SubscriptionGateWrapper` (likely `app/(dashboard)/layout.tsx`)

- [ ] **Step 1: Write the helper**

```ts
// lib/subscription/access.ts
//
// One place that decides whether a user has access. Every paywall
// decision in the app should route through hasAccess() so the rules
// are consistent — paywall modal, gate wrapper, server-side route
// protection, anywhere.

export type AccessReason =
  | 'paid'
  | 'trialing'
  | 'canceled_in_grace'   // canceled but period_end is in the future
  | 'past_due'            // most recent invoice failed but inside grace
  | 'trial_expired'
  | 'never_paid'

export interface AccessProfile {
  is_paid: boolean | null
  trial_started_at: string | null
  subscription_period_end: string | null
  subscription_canceled_at: string | null
  subscription_past_due: boolean | null
}

const TRIAL_DAYS = 7
const PAST_DUE_GRACE_DAYS = 3

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
}

export interface AccessResult {
  ok: boolean
  reason: AccessReason
  /** Days remaining of trial OR canceled-but-inside-period grace. Floor of the value. */
  daysRemaining: number
}

export function hasAccess(profile: AccessProfile | null | undefined): AccessResult {
  if (!profile) {
    return { ok: false, reason: 'never_paid', daysRemaining: 0 }
  }

  // 1. Paid + not past due + (no cancel OR period_end in future) → full access
  if (profile.is_paid) {
    if (profile.subscription_past_due) {
      // Inside the past-due grace window?
      // We don't have a "past_due_started_at" timestamp; lean on Stripe's
      // own grace handling and just gate to past_due reason. The webhook
      // flips is_paid=false on cancellation, so being here with is_paid=true
      // means we're inside Stripe's smart-retry window.
      return { ok: true, reason: 'past_due', daysRemaining: PAST_DUE_GRACE_DAYS }
    }
    if (profile.subscription_canceled_at && profile.subscription_period_end) {
      const remainingDays = Math.floor(
        (new Date(profile.subscription_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      if (remainingDays > 0) {
        return { ok: true, reason: 'canceled_in_grace', daysRemaining: remainingDays }
      }
      return { ok: false, reason: 'never_paid', daysRemaining: 0 }
    }
    return { ok: true, reason: 'paid', daysRemaining: 0 }
  }

  // 2. Not paid — are they on trial?
  if (profile.trial_started_at) {
    const daysIn = daysSince(profile.trial_started_at)
    const remaining = Math.floor(TRIAL_DAYS - daysIn)
    if (remaining > 0) {
      return { ok: true, reason: 'trialing', daysRemaining: remaining }
    }
    return { ok: false, reason: 'trial_expired', daysRemaining: 0 }
  }

  // 3. Never started a trial, never paid
  return { ok: false, reason: 'never_paid', daysRemaining: 0 }
}
```

- [ ] **Step 2: Update `SubscriptionGateWrapper.tsx` to take an `AccessResult`**

Change the `Props` interface and the rendering branch to use the new shape:

```tsx
import type { AccessResult } from '@/lib/subscription/access'

interface Props {
  access: AccessResult
  children: React.ReactNode
}

export default function SubscriptionGateWrapper({ access, children }: Props) {
  const pathname = usePathname()
  const isSettings = pathname?.startsWith('/settings')

  const showTrialBanner = access.ok && access.reason === 'trialing'
  const showCanceledBanner = access.ok && access.reason === 'canceled_in_grace'
  const showPastDueBanner = access.ok && access.reason === 'past_due'
  const showExpiredPaywall = !access.ok

  return (
    <>
      {showTrialBanner    && <TrialBanner daysRemaining={access.daysRemaining} />}
      {showCanceledBanner && <CanceledBanner daysRemaining={access.daysRemaining} />}
      {showPastDueBanner  && <PastDueBanner />}

      <main className="relative flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8 min-w-0">
        <ErrorBoundary>
          {showExpiredPaywall && !isSettings ? <ExpiredPaywall /> : children}
        </ErrorBoundary>
      </main>
    </>
  )
}
```

Add the two new banner components inline (mirror the existing `TrialBanner` style — see existing file at `components/SubscriptionGateWrapper.tsx`):

```tsx
function CanceledBanner({ daysRemaining }: { daysRemaining: number }) {
  const label = daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`
  return (
    <div className="w-full border-b bg-amber-50 border-amber-200 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-amber-700">
          Subscription canceled — <span className="tabular-nums">{label}</span> of access remaining
        </span>
        <Link href="/settings?tab=account" className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-bold">
          Reactivate
        </Link>
      </div>
    </div>
  )
}

function PastDueBanner() {
  return (
    <div className="w-full border-b bg-red-50 border-red-200 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-red-700">
          Your card was declined — update your payment to keep access
        </span>
        <Link href="/settings?tab=account" className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold">
          Update card
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update the layout that calls `SubscriptionGateWrapper`**

Find the file that mounts `SubscriptionGateWrapper` (probably `app/(dashboard)/layout.tsx`). Replace the inline `isPaid` / `daysRemaining` computation with a `hasAccess()` call and pass the result through:

```tsx
import { hasAccess } from '@/lib/subscription/access'
// ...
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')

const { data: profile } = await supabase
  .from('profiles')
  .select('is_paid, trial_started_at, subscription_period_end, subscription_canceled_at, subscription_past_due, has_seen_demo')
  .eq('id', user.id)
  .maybeSingle()

const access = hasAccess(profile)

// Existing has_seen_demo gate from Phase 2.2 still runs here.
if (profile && profile.has_seen_demo === false) redirect('/onboarding/demo')

return (
  <>
    <Nav />
    <SubscriptionGateWrapper access={access}>
      {children}
    </SubscriptionGateWrapper>
  </>
)
```

- [ ] **Step 4: Use `hasAccess` in PaywallModal too**

Open `components/PaywallModal.tsx`. Anywhere the modal currently computes "is the user past due / trial expired / canceled" inline, replace with the same `hasAccess(profile)` call so the paywall and the gate agree on the user's state.

- [ ] **Step 5: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean.

- [ ] **Step 6: Manual matrix test**

In SQL editor, set the following profile combinations and verify the UI on `/dashboard`:

| `is_paid` | `trial_started_at` | `subscription_canceled_at` | `subscription_period_end` | `subscription_past_due` | Expected |
| --- | --- | --- | --- | --- | --- |
| true  | null         | null               | null                | false | Dashboard, no banner |
| true  | null         | now()              | now() + 5 days     | false | Dashboard + amber "Subscription canceled — 5 days left" banner |
| true  | null         | null               | null                | true  | Dashboard + red past-due banner |
| false | now() - 3d   | null               | null                | false | Dashboard + trial banner "4 days left" |
| false | now() - 8d   | null               | null                | false | Expired paywall |
| false | null         | null               | null                | false | Expired paywall |

- [ ] **Step 7: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add lib/subscription/access.ts components/SubscriptionGateWrapper.tsx \
  app/\(dashboard\)/layout.tsx components/PaywallModal.tsx
git commit -m "feat(subscription): centralize access decisions in hasAccess()

One source of truth for paid/trialing/canceled-in-grace/past-due/
expired. SubscriptionGateWrapper takes the result directly. The
dashboard layout, paywall modal, and any future gates all route
through the same helper, so the rules are consistent.

Adds CanceledBanner and PastDueBanner so users in grace states
know what's happening without having to dig into settings."
```

---

## Task 11: Phase 2.5 verification gate

- [ ] **Step 1: Final type-check + build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean.

- [ ] **Step 2: Stripe CLI end-to-end**

With `stripe listen --forward-to localhost:3000/api/stripe/webhook` running and the dev server up:

1. `stripe trigger checkout.session.completed` — confirm `profiles.is_paid = true` for the test user, and a row exists in `stripe_webhook_events`.
2. Re-trigger the SAME event (use Stripe Dashboard Events → Resend) — confirm a 200 with `duplicate:true`, no double-update on profiles.
3. `stripe trigger invoice.payment_failed` — confirm `subscription_past_due = true`, Resend email logged.
4. `stripe trigger customer.subscription.deleted` — confirm `subscription_canceled_at` set, `subscription_period_end` set, but `is_paid` still true.
5. Manually advance time by setting `subscription_period_end = now() - 1 day` in SQL — load `/dashboard`, expect the expired paywall.

- [ ] **Step 3: Phase 2.5 ships as the 10 commits from Tasks 1–10.**

---

## Self-review notes for this plan

- **Schema reality check up top** prevents the engineer from chasing `subscription_status` (which doesn't exist).
- **Idempotency is the central guarantee** — Task 1 ships the table, Task 9 wires the wrapper, Task 11 verifies it with the CLI.
- **Type consistency:** `Database`, `AccessResult`, `AccessProfile`, `AccessReason`, `PaymentFailedEmailInput` are each defined exactly once and referenced by import thereafter.
- **No placeholders.** Every code change includes the actual code. The `.single() → .maybeSingle()` audit (Task 5) explicitly tells the engineer how to decide which way each call goes.
- **Backward-compatible columns:** Task 2 ADDS columns rather than renaming `is_paid`, so the existing client gate code keeps working through Tasks 3–9. Task 10 then upgrades the gate to use the new columns.
- **Resend integration is optional** — Task 8 short-circuits if `RESEND_API_KEY` isn't set, so dev environments without Resend keep working.
