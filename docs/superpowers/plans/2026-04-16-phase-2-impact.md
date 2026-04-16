# Phase 2 — Impact Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recover signup → activation conversion (every new user sees the demo before the dashboard), pivot the paywall to annual default, raise accessibility to a defensible WCAG 2.1 AA baseline, and replace "looks broken" loading states with real skeletons.

**Architecture:** Add a `has_seen_demo` column on `profiles`, gate the dashboard redirect on it, and intercept new signups into `/onboarding/demo`. Make the demo content adaptive to industry. Extract a `useModal` hook so every modal gets focus trap + Escape + scroll lock + `role="dialog"` for free. Replace bare spinners and animated zeros with skeleton bars matching the surrounding shape.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + RLS), TypeScript, Tailwind, React 18.

**Verification model:** This codebase has no test runner. Each task ends with `npx tsc --noEmit` and (where structural) `npm run build`. Conversion-flow tasks end with a manual sign-up → demo → dashboard walkthrough using a fresh test account. A11y tasks end with axe DevTools (browser extension) showing zero serious/critical violations on the affected route.

**Prerequisites:** Phase 1 (Foundation) is shipped. The Tailwind tokens (`text-text-1`, `bg-surface`, `border-border`, `accent`, etc.) are referenced throughout this plan — they must exist before Phase 2 can compile.

---

## File map

| File | Change |
| --- | --- |
| `supabase/migrations/<ts>_add_has_seen_demo.sql` (NEW) | Column + backfill |
| `app/(dashboard)/dashboard/page.tsx` | Server-side gate: redirect to `/onboarding/demo` if `!has_seen_demo` |
| `app/onboarding/demo/page.tsx` | Pull industry from `business_profiles`, route past with `has_seen_demo = true` on completion |
| `app/onboarding/demo/DemoClient.tsx` | "Skip demo" link + completion handler that updates the flag |
| `lib/demo/industry-samples.ts` (NEW) | Tone-tuned reviews per industry |
| `app/(auth)/signup/page.tsx` | "Resend email" + "Use Google instead" inside the success state |
| `app/api/auth/resend-confirmation/route.ts` (NEW) | Resends Supabase confirmation email |
| `app/(auth)/onboarding/page.tsx` | Voice training step becomes optional ("Skip for now") |
| `components/PaywallModal.tsx` | Default to annual plan, outcome-led copy, direct-checkout CTA when stripe_customer_id exists |
| `lib/hooks/useModal.ts` (NEW) | Focus trap + Escape + body scroll lock + return-focus |
| `components/GoogleConnectModal.tsx` | Wire `useModal`, add `role="dialog"`, `aria-modal` |
| `components/PaywallModal.tsx` | Wire `useModal` |
| `components/StarRating.tsx` | `role="radiogroup"`, arrow-key support, `aria-checked` |
| `app/layout.tsx` | Skip-to-content link |
| `app/(marketing)/layout.tsx` | Wrap children in `<main id="main">` |
| `app/(auth)/layout.tsx` | Wrap children in `<main id="main">` |
| `app/(dashboard)/layout.tsx` | Wrap children in `<main id="main">` |
| Various pages with icon-only buttons | Add `aria-label` (sweep) |
| `app/(dashboard)/dashboard/page.tsx` (HomeClient) | Skeleton bars for stat tiles instead of animated zeros |
| `app/(dashboard)/dashboard/reviews/page.tsx` | Skeleton review rows during scrape |
| `app/(dashboard)/dashboard/loading.tsx` (NEW) | Route-segment loading file |
| `app/(auth)/loading.tsx` (NEW) | Route-segment loading file |
| `app/(auth)/reset-password/page.tsx` | Replace bare spinner with verifying card |

---

## Task 1: `has_seen_demo` migration + backfill

**Files:**
- Create: `supabase/migrations/20260416120000_add_has_seen_demo.sql`

> If `supabase/migrations/` doesn't exist yet, create it. The Supabase CLI (or the dashboard SQL editor) applies migrations from this folder.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260416120000_add_has_seen_demo.sql

-- Track whether a user has been through the /onboarding/demo flow.
-- Default false for new users so the dashboard redirect intercepts
-- them on first login. Backfill existing users to true so we don't
-- yank long-time customers into the demo on their next visit.

alter table profiles
  add column if not exists has_seen_demo boolean not null default false;

update profiles
   set has_seen_demo = true
 where created_at < now();

-- Index is unnecessary — this column is only ever queried by
-- primary-key lookup on the user's own row.
```

- [ ] **Step 2: Apply the migration**

Apply via the Supabase CLI:

```bash
cd "/Users/joshleon/Table Reply"
npx supabase db push
```

If the project doesn't have a linked Supabase CLI setup, paste the SQL into the Supabase Dashboard SQL Editor and run it manually. Either way, verify the column landed:

```sql
select column_name, data_type, column_default
  from information_schema.columns
 where table_name = 'profiles' and column_name = 'has_seen_demo';
```

Expected: one row, `boolean`, `false`.

- [ ] **Step 3: Commit the migration file**

```bash
cd "/Users/joshleon/Table Reply"
git add supabase/migrations/20260416120000_add_has_seen_demo.sql
git commit -m "feat(db): add profiles.has_seen_demo for activation gate

Default false for new users so the dashboard server-side gate can
intercept them into /onboarding/demo on first login. Backfill
existing users to true so they aren't yanked into the demo."
```

---

## Task 2: Gate dashboard on `has_seen_demo`

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`

> If this is a client component (`'use client'`), the gate moves to `app/(dashboard)/layout.tsx` instead — server-side redirects are reliable, client-side ones flash. Inspect the file before editing.

- [ ] **Step 1: Determine where the dashboard route currently checks auth**

Read `app/(dashboard)/dashboard/page.tsx` and `app/(dashboard)/layout.tsx`. Identify whichever currently runs the auth/profile lookup server-side. The new gate goes in the same place.

- [ ] **Step 2: Add the gate**

In whichever file does the server-side profile fetch (let's call it `<gate-file>`), add the redirect right after the existing profile/business check, before returning the page tree:

```ts
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ... existing business_profiles / profile lookups ...

  const { data: profile } = await supabase
    .from('profiles')
    .select('has_seen_demo')
    .eq('id', user.id)
    .maybeSingle()

  if (profile && profile.has_seen_demo === false) {
    redirect('/onboarding/demo')
  }

  // ... existing JSX return ...
}
```

If the existing handler already fetches the profile for other reasons, fold `has_seen_demo` into the same `select(...)` call instead of making a second round trip.

- [ ] **Step 3: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean.

- [ ] **Step 4: Manual verification**

1. In the Supabase SQL editor, set your test user's `has_seen_demo = false`:
   `update profiles set has_seen_demo = false where id = '<your-test-user-id>';`
2. `npm run dev`, log in, navigate to `/dashboard`. Expected: server-side redirect to `/onboarding/demo`.
3. In SQL editor, set `has_seen_demo = true`. Hit `/dashboard` again. Expected: dashboard renders normally.

- [ ] **Step 5: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add app/\(dashboard\)/dashboard/page.tsx
# (or whichever file you modified)
git commit -m "feat(activation): gate dashboard on has_seen_demo

New signups land on /dashboard, get redirected server-side to
/onboarding/demo on first login. The redirect uses Next's
server-side redirect() so there's no client-side flash."
```

---

## Task 3: Industry-aware demo content + completion handler

**Files:**
- Create: `lib/demo/industry-samples.ts`
- Modify: `app/onboarding/demo/page.tsx`
- Modify: `app/onboarding/demo/DemoClient.tsx`

- [ ] **Step 1: Write industry samples**

```ts
// lib/demo/industry-samples.ts
//
// Tone-tuned sample reviews used in /onboarding/demo. The flow shows
// three reviews (one positive, one mid, one critical) so the user can
// experience the AI voice on the kinds of feedback they actually receive.
//
// Add a new industry here when adding a new vertical to the signup flow.

export type Industry =
  | 'restaurant'
  | 'dental'
  | 'hvac'
  | 'salon'
  | 'retail'
  | 'professional_services'
  | 'generic'

export interface SampleReview {
  rating: number       // 1-5
  author: string
  text: string
  scenario: 'glowing' | 'mixed' | 'critical'
}

export const INDUSTRY_SAMPLES: Record<Industry, SampleReview[]> = {
  restaurant: [
    { rating: 5, author: 'Sarah M.',  scenario: 'glowing',  text: 'Best brunch in town. The eggs benedict is worth driving across the city for. Service was warm without being intrusive.' },
    { rating: 3, author: 'David K.',  scenario: 'mixed',    text: 'Food was great but we waited 25 minutes for a table even with a reservation. Would come back for the menu, not the host stand.' },
    { rating: 1, author: 'Marcus T.', scenario: 'critical', text: 'Cold pasta, the server forgot our drinks twice, and the bill had a $9 charge for "bread service" that nobody mentioned. Won\'t be back.' },
  ],
  dental: [
    { rating: 5, author: 'Jenny R.',   scenario: 'glowing',  text: 'Dr. Patel walked me through every step of the root canal. First time I have not been terrified at the dentist.' },
    { rating: 3, author: 'Mike H.',    scenario: 'mixed',    text: 'Cleaning was thorough but the front desk gave me three different prices for the same procedure. Bring your insurance card and your wits.' },
    { rating: 1, author: 'Linda O.',   scenario: 'critical', text: 'They billed me for a fluoride treatment my insurance does not cover and never told me. Now I owe $80 I did not agree to.' },
  ],
  hvac: [
    { rating: 5, author: 'Tom W.',     scenario: 'glowing',  text: 'AC died on the hottest day of summer. They had a tech out in three hours and replaced the capacitor for half what the last guy quoted me.' },
    { rating: 3, author: 'Karen B.',   scenario: 'mixed',    text: 'Tech was friendly and fixed the issue but tracked mud through the house. Bring shoe covers if you want a repeat customer.' },
    { rating: 1, author: 'Rob P.',     scenario: 'critical', text: 'Quoted $400, billed $1,100. Said the parts were "more involved than expected." Never again.' },
  ],
  salon: [
    { rating: 5, author: 'Amanda L.',  scenario: 'glowing',  text: 'Maya nailed the balayage on my first try. I have been chasing this color for a year and finally found my person.' },
    { rating: 3, author: 'Erin S.',    scenario: 'mixed',    text: 'Cut was great. Wash was rushed and the conditioner stung. Mixed feelings.' },
    { rating: 1, author: 'Tasha N.',   scenario: 'critical', text: 'Showed up for a 2pm appointment, was not seen until 2:50. Stylist was on her phone the whole time.' },
  ],
  retail: [
    { rating: 5, author: 'Carlos M.',  scenario: 'glowing',  text: 'Helpful staff, clean store, easy returns. Bought a jacket and brought it back two weeks later — no questions asked.' },
    { rating: 3, author: 'Heather V.', scenario: 'mixed',    text: 'Good selection but the dressing-room line was 20 minutes deep on a Saturday. Hire more people on weekends.' },
    { rating: 1, author: 'Aaron J.',   scenario: 'critical', text: 'Cashier was on her phone, ignored me for five minutes, then charged me twice and refused to refund without a manager.' },
  ],
  professional_services: [
    { rating: 5, author: 'Priya N.',   scenario: 'glowing',  text: 'Walked me through the entire LLC formation, answered three follow-ups for free, and the price was exactly what was quoted.' },
    { rating: 3, author: 'Greg F.',    scenario: 'mixed',    text: 'Final deliverable was strong but communication was spotty — I had to follow up three times for status updates.' },
    { rating: 1, author: 'Daniel R.',  scenario: 'critical', text: 'Missed two deadlines, did not respond to emails for a week, then sent the bill anyway.' },
  ],
  generic: [
    { rating: 5, author: 'Alex P.',    scenario: 'glowing',  text: 'Fantastic experience start to finish. Will absolutely be back.' },
    { rating: 3, author: 'Jordan S.',  scenario: 'mixed',    text: 'Good in some ways, frustrating in others. Worth it but bring patience.' },
    { rating: 1, author: 'Sam W.',     scenario: 'critical', text: 'Unprofessional and overpriced. Look elsewhere.' },
  ],
}

export function getSamples(industry: string | null | undefined): SampleReview[] {
  const key = (industry ?? 'generic').toLowerCase() as Industry
  return INDUSTRY_SAMPLES[key] ?? INDUSTRY_SAMPLES.generic
}
```

- [ ] **Step 2: Wire industry into DemoClient via props**

In `app/onboarding/demo/page.tsx` (the server component), fetch the user's `business_profiles.industry` and pass it as a prop to `DemoClient`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DemoClient from './DemoClient'
import { getSamples } from '@/lib/demo/industry-samples'

export default async function DemoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('business_profiles')
    .select('industry, business_name')
    .eq('user_id', user.id)
    .maybeSingle()

  const samples = getSamples(business?.industry)
  const businessName = business?.business_name ?? 'your business'

  return <DemoClient samples={samples} businessName={businessName} userId={user.id} />
}
```

- [ ] **Step 3: Update `DemoClient.tsx` to accept the props and surface skip + completion**

In `app/onboarding/demo/DemoClient.tsx`:

1. Update the props interface:
   ```ts
   interface DemoClientProps {
     samples: SampleReview[]   // import the type from '@/lib/demo/industry-samples'
     businessName: string
     userId: string
   }
   ```
2. Replace any hard-coded restaurant samples with the `samples` prop.
3. Render every place where `business_name` was hard-coded as `{businessName}`.
4. Add a "Skip demo" link in the top-right of the page (returns user to dashboard, marks demo seen):
   ```tsx
   <button
     onClick={async () => {
       const supabase = createClient()
       await supabase.from('profiles').update({ has_seen_demo: true }).eq('id', userId)
       window.location.href = '/dashboard'
     }}
     className="absolute top-4 right-4 text-[13px] text-text-2 hover:text-text-1 transition-colors px-3 py-2"
   >
     Skip demo →
   </button>
   ```
5. On the demo's existing "Done"/"Finish" button, replace any existing `router.push('/dashboard')` with:
   ```tsx
   const supabase = createClient()
   await supabase.from('profiles').update({ has_seen_demo: true }).eq('id', userId)
   router.push('/dashboard')
   ```

If the existing finish handler is more complex (e.g., it tracks events), keep that logic — just add the `has_seen_demo` update before the redirect.

- [ ] **Step 4: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean.

- [ ] **Step 5: Manual verification with each industry**

In the SQL editor, set your test user's `business_profiles.industry` to each of `'restaurant'`, `'dental'`, `'hvac'`, `'salon'`, `'retail'`, `'professional_services'`, and a junk value like `'foo'`. Reload `/onboarding/demo` after each change. Expected: review samples change to match each industry; junk value falls back to generic copy without throwing.

- [ ] **Step 6: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add lib/demo/industry-samples.ts app/onboarding/demo/page.tsx app/onboarding/demo/DemoClient.tsx
git commit -m "feat(demo): industry-aware samples + skip link

Pull business_profiles.industry on the server, hand the matching
sample set to DemoClient as a prop. Restaurants no longer see
restaurant copy when they sell HVAC services. Add a skip link so
users never feel trapped, and mark has_seen_demo=true on
completion (or skip) so we don't show the demo twice."
```

---

## Task 4: Signup loop closures — Resend email + Google fallback

**Files:**
- Create: `app/api/auth/resend-confirmation/route.ts`
- Modify: `app/(auth)/signup/page.tsx`

- [ ] **Step 1: Build the resend route**

```ts
// app/api/auth/resend-confirmation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({ email: '' }))
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 })
  }

  const supabase = createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${req.nextUrl.origin}/auth/callback`,
    },
  })

  if (error) {
    // Stay generic on the error message — leaking "no such user" is an
    // enumeration attack vector.
    return NextResponse.json({ ok: false, error: 'resend_failed' }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Wire Resend + Google into the success state**

In `app/(auth)/signup/page.tsx`, replace the existing success branch (the block that renders `<div className="rounded-xl bg-emerald-50 ...">`) with a richer success state that includes the resend button (60s cooldown) and a Google fallback. Add this state at the top of the component:

```tsx
const [resendCooldown, setResendCooldown] = useState(0)
const [resendStatus, setResendStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle')

useEffect(() => {
  if (resendCooldown <= 0) return
  const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
  return () => clearTimeout(t)
}, [resendCooldown])

const handleResend = async () => {
  if (resendCooldown > 0 || resendStatus === 'sending') return
  setResendStatus('sending')
  const r = await fetch('/api/auth/resend-confirmation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (r.ok) {
    setResendStatus('sent')
    setResendCooldown(60)
  } else {
    setResendStatus('error')
  }
}
```

Replace the success div with:

```tsx
{successMessage ? (
  <div className="space-y-4">
    <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-4">
      <p className="text-[13px] text-emerald-700 font-medium">{successMessage}</p>
    </div>

    <div className="rounded-xl border border-border bg-white px-4 py-4 space-y-3">
      <p className="text-[12px] text-text-2">Didn&apos;t see it? Check your spam folder, or:</p>
      <button
        type="button"
        onClick={handleResend}
        disabled={resendCooldown > 0 || resendStatus === 'sending'}
        className="w-full h-10 rounded-lg border border-border bg-white hover:bg-surface text-text-1 text-[13px] font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {resendStatus === 'sending' && 'Sending…'}
        {resendStatus === 'sent' && resendCooldown > 0 && `Sent — resend in ${resendCooldown}s`}
        {resendStatus === 'idle' && 'Resend confirmation email'}
        {resendStatus === 'error' && 'Resend failed — try again'}
        {resendStatus === 'sent' && resendCooldown === 0 && 'Resend confirmation email'}
      </button>
      <button
        type="button"
        onClick={handleGoogleSignup}
        className="w-full h-10 rounded-lg border border-border bg-white hover:bg-surface text-text-1 text-[13px] font-medium transition-all duration-150 flex items-center justify-center gap-2"
      >
        <GoogleIcon />
        Use Google instead
      </button>
    </div>
  </div>
) : (
  // ... existing form JSX unchanged ...
)}
```

- [ ] **Step 3: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean.

- [ ] **Step 4: Manual verification**

1. Sign up with a new email. Expected: success card with both resend and Google buttons.
2. Click "Resend confirmation email". Expected: button shows "Sent — resend in 60s" and counts down.
3. Click "Use Google instead". Expected: standard Google OAuth flow.

- [ ] **Step 5: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add app/api/auth/resend-confirmation/route.ts app/\(auth\)/signup/page.tsx
git commit -m "feat(auth): close the signup loop with resend + Google fallback

The 'Check your inbox' page used to be a dead end. Add a resend
button with a 60-second cooldown (calls a new /api/auth/resend-
confirmation route that wraps supabase.auth.resend) and a Google
sign-in fallback so users who can't find the email aren't lost."
```

---

## Task 5: Voice training step becomes optional

**Files:**
- Modify: `app/(auth)/onboarding/page.tsx`

- [ ] **Step 1: Locate the voice training step**

Read `app/(auth)/onboarding/page.tsx` and find the step that currently makes voice training mandatory (look for whatever step blocks the "Continue" button until voice samples are provided).

- [ ] **Step 2: Add a Skip-for-now path**

Convert the gating button. Whatever the current "Continue" button does, add a sibling "Skip for now" button that:
1. Marks the onboarding step complete with `voice_training_skipped: true` (add to `profiles` if a column doesn't exist; or just route to dashboard and let the dashboard banner remind them).
2. Routes to `/onboarding/demo` (or `/dashboard` if demo is already seen).

Concrete diff (drop-in next to the existing primary button on the voice step):

```tsx
<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
  <button
    type="button"
    onClick={handleSubmitVoiceSamples}
    className="flex-1 h-11 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-[14px]"
  >
    {loading ? 'Saving…' : 'Save & continue'}
  </button>
  <button
    type="button"
    onClick={() => router.push('/onboarding/demo')}
    className="h-11 px-5 rounded-xl border border-border bg-white hover:bg-surface text-text-2 hover:text-text-1 font-medium text-[13px]"
  >
    Skip for now
  </button>
</div>
```

- [ ] **Step 3: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add app/\(auth\)/onboarding/page.tsx
git commit -m "feat(onboarding): voice training step becomes optional

Add a Skip for now button. Voice training improves AI quality but
isn't required to feel value — moving the strict gate post-dashboard
removes a major dropoff point on the activation funnel."
```

---

## Task 6: Reusable `useModal` hook

**Files:**
- Create: `lib/hooks/useModal.ts`

- [ ] **Step 1: Write the hook**

```ts
// lib/hooks/useModal.ts
//
// One hook for every modal: focus trap + Escape close + body scroll lock +
// return-focus on close. Call from any component that opens a modal:
//
//   const { containerRef } = useModal({ open, onClose })
//   return open ? <div ref={containerRef} role="dialog" aria-modal="true">…</div> : null

import { useEffect, useRef } from 'react'

interface UseModalOptions {
  open: boolean
  onClose: () => void
  /** disable focus trap (useful for full-page sheets that own the whole viewport) */
  disableFocusTrap?: boolean
}

export function useModal({ open, onClose, disableFocusTrap }: UseModalOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  // Body scroll lock
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  // Escape close + focus trap + return focus
  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null

    const focusable = () => {
      const root = containerRef.current
      if (!root) return [] as HTMLElement[]
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
    }

    // Focus the first focusable element on open
    const first = focusable()[0]
    first?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (disableFocusTrap || e.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && active === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      // Return focus to whatever was focused before the modal opened
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose, disableFocusTrap])

  return { containerRef }
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
git add lib/hooks/useModal.ts
git commit -m "feat(a11y): useModal hook for focus trap + Escape + scroll lock

Centralize modal accessibility behaviors so every modal in the app
gets the same WCAG 2.1.2 compliant treatment for free. Caller
attaches containerRef to the modal root and adds role='dialog'
aria-modal='true' to the same element."
```

---

## Task 7: Wire `useModal` into existing modals + add `aria-label` sweep

**Files:**
- Modify: `components/GoogleConnectModal.tsx`
- Modify: `components/PaywallModal.tsx`
- Sweep: any other component with `fixed inset-0 z-` (likely social-share modal, possibly an upgrade modal)

- [ ] **Step 1: Wire `useModal` into `GoogleConnectModal`**

In `components/GoogleConnectModal.tsx`:

1. Import: `import { useModal } from '@/lib/hooks/useModal'`
2. At the top of the component:
   ```tsx
   const { containerRef } = useModal({ open: isOpen, onClose })
   ```
   (Use whatever the existing `open` and `onClose` prop names are.)
3. On the modal's outer panel div (the white card, NOT the backdrop), add `ref={containerRef}` and:
   ```tsx
   role="dialog"
   aria-modal="true"
   aria-labelledby="google-connect-title"
   ```
4. Add `id="google-connect-title"` to whatever element renders the modal heading.
5. Ensure the close button has `aria-label="Close"` if it's icon-only.

- [ ] **Step 2: Wire `useModal` into `PaywallModal`**

Same pattern as Step 1, in `components/PaywallModal.tsx`. Use `aria-labelledby="paywall-title"`.

- [ ] **Step 3: Sweep for other modals**

```bash
# Run from repo root (use the Grep tool, not raw grep)
```

Use the Grep tool with pattern `fixed inset-0 z-` over `components/` and `app/`. For any matches that visually behave as modals, apply the same `useModal` pattern (likely candidates: `WelcomeBanner` if it's modal-style, social share components, upgrade prompts).

- [ ] **Step 4: aria-label sweep on icon-only buttons**

Use the Grep tool with pattern `<button[^>]*>\s*<svg` (multiline) over `components/` and `app/`. For each match, confirm the button has either:
- An accessible text label (visible text inside or via `aria-label`), OR
- A surrounding label that wraps it.

If neither, add an appropriate `aria-label`. Common candidates: copy buttons, close buttons (X icons), reply controls (👍 / 👎 / regenerate), star buttons inside `StarRating`.

- [ ] **Step 5: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean.

- [ ] **Step 6: Manual a11y check**

Run `npm run dev`, open Chrome devtools, install the axe DevTools extension if not already, and run an axe scan on:
- `/` (open the Google connect modal if it's reachable)
- `/dashboard` (open paywall modal by setting subscription_status to 'expired' in SQL)
- `/dashboard/reviews` (any review-card modals)

Expected: zero "serious" or "critical" violations (warnings are acceptable for this phase). Fix any new violations introduced by Phase 2 inline.

- [ ] **Step 7: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add components/GoogleConnectModal.tsx components/PaywallModal.tsx \
  $(git diff --name-only | grep -E '\.(tsx)$')
git commit -m "feat(a11y): focus trap + Escape + aria-label sweep

Wire the new useModal hook into GoogleConnectModal and PaywallModal
(adding role='dialog' aria-modal='true'). Sweep icon-only buttons
across the app to add aria-label so screen readers announce them.
Closes the biggest serious-tier axe violations."
```

---

## Task 8: Accessible StarRating

**Files:**
- Modify: `components/StarRating.tsx`

- [ ] **Step 1: Convert to a radiogroup**

Replace the current implementation with a keyboard-operable radiogroup. The exact existing markup is unknown — the engineer should preserve the visual styling and just rewrap the semantics. Pattern:

```tsx
'use client'

import { useState } from 'react'

interface StarRatingProps {
  value: number             // 0-5
  onChange?: (n: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string            // e.g. "Rate this reply"
}

export default function StarRating({ value, onChange, readonly, size = 'md', label = 'Rating' }: StarRatingProps) {
  const [focusIndex, setFocusIndex] = useState(value || 1)
  const px = size === 'sm' ? 16 : size === 'lg' ? 28 : 20

  const handleKey = (e: React.KeyboardEvent) => {
    if (readonly || !onChange) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(5, focusIndex + 1)
      setFocusIndex(next)
      onChange(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.max(1, focusIndex - 1)
      setFocusIndex(next)
      onChange(next)
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKey}
      className="inline-flex items-center gap-1"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
            tabIndex={value === n || (value === 0 && n === 1) ? 0 : -1}
            disabled={readonly}
            onClick={() => onChange?.(n)}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-colors ${readonly ? 'cursor-default' : 'hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25'}`}
          >
            <svg width={px} height={px} viewBox="0 0 20 20" fill={filled ? '#E05A28' : 'none'} stroke={filled ? '#E05A28' : '#C4BEB8'} strokeWidth="1.5">
              <polygon points="10,2 12.5,7.5 18.5,8.2 14,12.4 15.2,18 10,15.2 4.8,18 6,12.4 1.5,8.2 7.5,7.5" strokeLinejoin="round"/>
            </svg>
          </button>
        )
      })}
    </div>
  )
}
```

If `StarRating` is currently used in non-interactive contexts (review cards displaying a rating), keep `readonly` defaulting to true would be a behavior change — instead make sure callers that don't pass `onChange` get `readonly` semantics automatically (the `tabIndex={-1}` and disabled button handle that here).

- [ ] **Step 2: Verify nothing broke**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean. Visit `/onboarding/demo` and any review pages to confirm stars still render.

- [ ] **Step 3: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add components/StarRating.tsx
git commit -m "feat(a11y): StarRating becomes a proper radiogroup

role='radiogroup' on the wrapper, role='radio' aria-checked on
each star, arrow-key navigation, focus ring, 44x44 touch target.
Screen readers now announce 'Rating, radio group, 4 of 5 selected'
instead of nothing."
```

---

## Task 9: Skip-to-content + landmarks

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/(marketing)/layout.tsx` (or `app/page.tsx` if no marketing layout exists)
- Modify: `app/(auth)/layout.tsx`
- Modify: `app/(dashboard)/layout.tsx`

- [ ] **Step 1: Add the skip link to the root layout**

In `app/layout.tsx`, inside `<body>`, prepend the skip link before `{children}`:

```tsx
<body className={`${inter.className} ${inter.variable} ${playfair.variable}`}>
  <a
    href="#main"
    className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:shadow-card-hover"
  >
    Skip to content
  </a>
  {children}
</body>
```

- [ ] **Step 2: Add `<main id="main">` to each layout group**

In each of `app/(auth)/layout.tsx`, `app/(dashboard)/layout.tsx`, and `app/page.tsx` (or `app/(marketing)/layout.tsx` if it exists), wrap the children/content in:

```tsx
<main id="main">
  {/* existing content */}
</main>
```

If a layout already returns a fragment with a `<Nav />` followed by children, the structure becomes:

```tsx
return (
  <>
    <Nav />
    <main id="main" className="pt-16">{/* existing className */}
      {children}
    </main>
  </>
)
```

Keep any existing className on the root element — just retag it from `<div>` to `<main>` and add `id="main"`.

- [ ] **Step 3: Add `role="alert"` to error toasts**

Use Grep with pattern `bg-red-50 border` or similar across `components/` and `app/` to find error toasts. Add `role="alert"` to the outer container so screen readers announce errors when they appear.

- [ ] **Step 4: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean.

- [ ] **Step 5: Manual verification**

1. Load `/`, press Tab once. Expected: a "Skip to content" pill appears at top-left.
2. Press Enter. Expected: focus jumps past the nav, into the main content.
3. Run axe DevTools on `/`, `/login`, `/dashboard`. Expected: "Page has main landmark" passes; no new violations.

- [ ] **Step 6: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add app/layout.tsx app/\(auth\)/layout.tsx app/\(dashboard\)/layout.tsx app/page.tsx
git commit -m "feat(a11y): skip-to-content + main landmarks + alert toasts

Add a visually hidden 'Skip to content' link to the root layout
that becomes visible on focus. Wrap each layout group's children
in <main id='main'>. Mark error toasts with role='alert' so
screen readers announce them when they appear."
```

---

## Task 10: Dashboard stat tiles — skeleton bars instead of animated zeros

**Files:**
- Modify: whichever component renders the dashboard home stat tiles (likely `app/(dashboard)/dashboard/page.tsx` or a `HomeClient.tsx` it imports)

- [ ] **Step 1: Find the stat tile component**

Read `app/(dashboard)/dashboard/page.tsx`. Find the component that renders stat tiles (replies sent, response rate, etc.) — likely uses `<CountUp>` or animates from 0.

- [ ] **Step 2: Add skeleton state**

For each stat tile, when `loading === true` (the data fetch hasn't returned yet), render a shimmer bar instead of an animated number. Pattern:

```tsx
{loading ? (
  <div className="h-8 w-20 rounded-md bg-surface animate-pulse" />
) : (
  <CountUp end={value} duration={1.2} className="text-3xl font-bold text-text-1" />
)}
```

Apply to every tile on the home page.

- [ ] **Step 3: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean.

- [ ] **Step 4: Manual verification**

Throttle network in Chrome devtools to "Slow 3G", reload `/dashboard`. Expected: skeleton bars appear immediately, get replaced by real numbers when the fetch completes. No "0" flash.

- [ ] **Step 5: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add app/\(dashboard\)/dashboard/page.tsx  # or HomeClient.tsx
git commit -m "fix(loading): skeleton bars on dashboard stat tiles

Showing animated zeros while data loads makes the dashboard look
broken. Replace with shimmer skeletons that match the final tile
shape, only counting up once real numbers arrive."
```

---

## Task 11: Reviews page — skeleton rows during scrape

**Files:**
- Modify: `app/(dashboard)/dashboard/reviews/page.tsx` (and any client components it imports)

- [ ] **Step 1: Find the scrape-progress branch**

Read the reviews page. Find the JSX that renders during scraping (likely shows a progress bar but no row placeholders).

- [ ] **Step 2: Render 6 skeleton rows alongside the progress bar**

```tsx
{scraping && (
  <>
    {/* existing progress bar UI */}
    <div className="space-y-3 mt-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-surface" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-24 rounded bg-surface" />
              <div className="h-2.5 w-16 rounded bg-surface" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-surface" />
            <div className="h-3 w-5/6 rounded bg-surface" />
            <div className="h-3 w-3/4 rounded bg-surface" />
          </div>
        </div>
      ))}
    </div>
  </>
)}
```

- [ ] **Step 3: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add app/\(dashboard\)/dashboard/reviews/page.tsx
git commit -m "fix(loading): skeleton rows on reviews page during scrape"
```

---

## Task 12: Route-segment loading files

**Files:**
- Create: `app/(dashboard)/loading.tsx`
- Create: `app/(auth)/loading.tsx`

- [ ] **Step 1: Dashboard loading**

```tsx
// app/(dashboard)/loading.tsx
//
// Rendered automatically by Next 14 App Router during navigation
// inside the (dashboard) segment, while the next page's data fetches.
//
// Match the home page's general shape so navigation never goes blank.

export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
      <div className="h-7 w-48 rounded bg-surface mb-2" />
      <div className="h-4 w-72 rounded bg-surface mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-5 h-28">
            <div className="h-3 w-20 rounded bg-surface mb-3" />
            <div className="h-7 w-16 rounded bg-surface" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-white p-6 h-64" />
    </div>
  )
}
```

- [ ] **Step 2: Auth loading**

```tsx
// app/(auth)/loading.tsx

export default function AuthLoading() {
  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center"
      style={{ backgroundImage: 'radial-gradient(circle, #E4DED8 1px, transparent 1px)', backgroundSize: '24px 24px' }}
    >
      <div className="w-full max-w-[400px] px-4 animate-pulse">
        <div className="flex justify-center mb-8">
          <div className="h-8 w-32 rounded bg-surface" />
        </div>
        <div className="bg-white rounded-2xl border border-border shadow-modal p-8">
          <div className="h-6 w-40 rounded bg-surface mb-2" />
          <div className="h-4 w-56 rounded bg-surface mb-6" />
          <div className="space-y-3">
            <div className="h-11 w-full rounded-xl bg-surface" />
            <div className="h-11 w-full rounded-xl bg-surface" />
            <div className="h-11 w-full rounded-xl bg-surface" />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npm run build
```

Expected: clean. The build output should now mention `loading` in the route tree for `/(dashboard)` and `/(auth)`.

- [ ] **Step 4: Manual verification**

`npm run dev`, then navigate from `/dashboard` to `/dashboard/analytics` (or any sibling). Expected: skeleton renders during the brief navigation rather than going blank.

- [ ] **Step 5: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add app/\(dashboard\)/loading.tsx app/\(auth\)/loading.tsx
git commit -m "fix(loading): route-segment loading files for dashboard and auth

Next 14 renders these automatically during navigation while the
next page's server fetch resolves. Replaces blank-screen flashes
with skeleton stand-ins that match the destination route shape."
```

---

## Task 13: Reset-password verify state — replace bare spinner

**Files:**
- Modify: `app/(auth)/reset-password/page.tsx`

- [ ] **Step 1: Find the verifying state**

Read `app/(auth)/reset-password/page.tsx`. Find the branch that renders while the magic-link token is being verified (likely `verifying === true` with just a `<svg className="animate-spin">`).

- [ ] **Step 2: Replace with a labeled card**

```tsx
{verifying && (
  <div className="bg-white rounded-2xl border border-border shadow-modal p-8 text-center">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-light mb-4">
      <svg className="animate-spin h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
    <h1 className="text-[18px] font-semibold text-text-1 mb-1">Verifying your link…</h1>
    <p className="text-[13px] text-text-2">This usually takes a second or two.</p>
  </div>
)}
```

- [ ] **Step 3: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add app/\(auth\)/reset-password/page.tsx
git commit -m "fix(loading): labeled verifying card on reset-password

Bare spinner looks broken when the verify hangs for >1s. Wrap in
a card with a heading + reassuring subtext so the user knows the
app is still working."
```

---

## Task 14: Paywall — annual default + outcome copy + direct-checkout CTA

**Files:**
- Modify: `components/PaywallModal.tsx`

- [ ] **Step 1: Default to annual**

Find the existing plan-toggle state (likely `useState<'monthly'|'annual'>('monthly')`). Flip the default to `'annual'`.

- [ ] **Step 2: Lead each plan card with the outcome**

For each plan, restructure the card so the first line below the price is an outcome statement. Concrete pattern (adapt to existing JSX):

```tsx
<div className="rounded-2xl border border-border p-6 space-y-4">
  <div>
    <h3 className="text-lg font-semibold text-text-1">{plan.name}</h3>
    <p className="text-3xl font-bold text-text-1 mt-1">${plan.price}<span className="text-sm font-normal text-text-2">/{billing}</span></p>
  </div>
  <p className="text-[14px] text-text-1 font-medium">{plan.outcome /* e.g. 'Reply to every review in under 60 seconds' */}</p>
  <ul className="space-y-2 text-[13px] text-text-2">
    {plan.features.map((f) => <li key={f} className="flex gap-2"><CheckIcon /> {f}</li>)}
  </ul>
  <button onClick={() => handleSelect(plan.id)} className="w-full h-11 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold">
    Start {plan.name}
  </button>
</div>
```

Add an `outcome` field to your plan config (or hard-code per card). Suggested copy:

| Plan | Outcome line |
| --- | --- |
| Starter | "Catch every new review the day it lands." |
| Pro | "Reply to every review in under 60 seconds." |
| Growth | "Stay on top of every location, on autopilot." |

- [ ] **Step 3: Direct checkout when Stripe customer already exists**

If the user is hitting the paywall on an EXPIRED subscription (they already have `stripe_customer_id`), the "View plans" button should route them straight into Stripe checkout, not back to the plan picker.

In whatever component shows the expired state, change the CTA from "View plans" to "Resubscribe" and route to:

```tsx
const handleResubscribe = async () => {
  const r = await fetch('/api/stripe/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan: lastPlan ?? 'pro', billing: 'annual' }),
  })
  const { url } = await r.json()
  if (url) window.location.href = url
}
```

(`lastPlan` comes from whatever the user previously had; default to `'pro'` if unknown. Phase 2.5 will harden the underlying create-checkout route.)

- [ ] **Step 4: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean.

- [ ] **Step 5: Manual verification**

In SQL, set your test user's `subscription_status = 'expired'`. Open `/dashboard`. Expected: the expired paywall now shows "Resubscribe" and clicking it sends you to Stripe checkout in one step.

For the regular paywall (set `subscription_status = null` or `trial_expired`), open it and confirm: annual is preselected (highlighted), and each plan card leads with the outcome statement.

- [ ] **Step 6: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add components/PaywallModal.tsx
git commit -m "feat(paywall): annual default + outcome copy + 1-click resubscribe

Annual default raises ARPU vs monthly default. Outcome statements
on each plan card lead with the value (Reply to every review in
under 60 seconds) before the feature list. Expired subscribers
get a Resubscribe button that drops them straight into Stripe
checkout instead of the plan picker."
```

---

## Task 15: Phase 2 verification gate

- [ ] **Step 1: Final type-check + build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean. Note the new route-segment loading files in the build summary.

- [ ] **Step 2: Manual end-to-end of the activation funnel**

In Supabase SQL editor, manually delete or reset a test user's `has_seen_demo` to false. Then in a private window:

1. Sign up with a NEW email (or log in as the reset user).
2. Confirm email → log in.
3. Expected: server-side redirect lands you on `/onboarding/demo`, NOT `/dashboard`.
4. Click "Skip demo". Expected: lands on `/dashboard`, `has_seen_demo` is now true.

- [ ] **Step 3: Run axe DevTools on the affected routes**

Run an axe scan on:
- `/login` (with paywall NOT open)
- `/dashboard`
- `/dashboard/reviews`
- `/onboarding/demo`

Expected: zero serious or critical violations. Document any "moderate" findings to address in Phase 3.

- [ ] **Step 4: Phase 2 is complete — no additional commit**

The phase ships as the 14 commits from Tasks 1–14.

---

## Self-review notes for this plan

- **Activation funnel completeness:** Tasks 1–3 implement the gate, the per-industry samples, and the completion handler — every leg of the demo path is covered.
- **`useModal` consistency:** the hook (Task 6) is referenced by Task 7 (modals) and Phase 3 mobile work (Phase 3.5 in the spec) — same hook, no duplication.
- **No placeholders:** every task has concrete code. The only "find this and edit it" steps are where the existing code is too long to fully reproduce in the plan; those steps describe exactly what to look for.
- **Verification:** every task has a build gate; flow tasks (1, 2, 3, 4, 14) have a manual walkthrough with explicit SQL setup.
- **Type consistency:** `Industry`, `SampleReview`, `getSamples` are defined once in Task 3, referenced as imports thereafter.
- **Backward compat:** the `has_seen_demo` migration backfills existing users to `true` so they never see the demo redirect.
