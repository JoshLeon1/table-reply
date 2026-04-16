# ReplyFi Website Polish — Design Spec

**Date:** 2026-04-16
**Status:** Awaiting user review
**Scope:** Comprehensive polish pass across visual design, conversion, mobile, performance, accessibility, code quality, theming, and backend (Stripe + Supabase) integrations.

---

## Background

A 6-dimensional audit (visual · conversion · performance · mobile · accessibility · code quality) surfaced ~66 findings across the marketing site, auth flow, onboarding, dashboard, settings, and API routes. The highest-impact issues cluster into six themes:

1. **Design-system drift** — auth pages render flat (no `shadow-modal`), inconsistent logo glyph, focus-ring opacity drift, button color flips between sibling pages.
2. **Conversion leaks** — new signups never reach `/onboarding/demo` (the "aha" moment); demo only shows restaurant samples; paywall defaults to monthly; signup "check your inbox" is a dead end.
3. **Mobile fundamentals** — every input is < 16px → iOS zooms on focus; modals lack scroll lock + safe-area; many touch targets < 44px; `maximumScale: 1` violates WCAG 1.4.4.
4. **Loading states** — animated zeros on dashboard tiles look broken; no skeleton rows on Reviews scrape; bare spinner on reset-password verify.
5. **Accessibility baseline** — icon-only buttons missing `aria-label`; modals missing focus trap + Escape + `role="dialog"`; StarRating needs `role="radiogroup"`; no skip-to-content; missing landmarks.
6. **Performance & code quality** — empty `next.config.js`; recharts/D3/html2canvas/jspdf ship eagerly; 30+ raw `console.log` in scrape routes; `: any` in AnalyticsClient; several `.single()` that should be `.maybeSingle()`.

Plus two scope additions from the user:

7. **Consistent theming throughout** — token sources are split between `tailwind.config.ts` and `app/globals.css`, with subtle drift between the two. Centralize and unify.
8. **Stripe + Supabase connection improvements** — harden the webhook (idempotency, edge cases), tighten error paths in checkout/portal routes, audit Supabase queries for `.single()` misuse, and add typed row returns.

---

## Goals

- Ship a coherent visual system: one logo, one focus-ring, one button hierarchy, one shadow ladder.
- Remove the biggest revenue leak: every new signup sees the demo before the dashboard.
- Make the app feel native on mobile: no iOS zoom, real touch targets, working modals.
- Bring accessibility to a defensible WCAG 2.1 AA baseline.
- Cut first-load JS on analytics-heavy routes by code-splitting.
- Make Stripe + Supabase boring: idempotent webhook, typed queries, proper error surfaces.
- Ship without breaking existing flows — every phase ends with `npx tsc --noEmit` + `npm run build` green.

## Non-goals

- Visual redesign. We stay on the existing brand (Inter + Playfair, `#E05A28` accent, warm cream `#F8F6F3` background). All changes preserve the current look.
- New features. No new pages, no new entities, no new vendors.
- Marketing copy rewrite. Conversion fixes target structure (where the demo lives, what's preselected) and microcopy nudges, not landing-page rewrites.
- Test infrastructure. Existing tests stay; we don't add a new framework in this pass.

---

## Phasing

Foundation → Impact → Backend Hardening → Polish. Each phase ends with a clean `tsc` + `next build` and is committed as its own commit. The user can stop after any phase.

```
Phase 1  Foundation              ── tokens, theming, design-system primitives, mobile baseline
Phase 2  Impact                  ── conversion, accessibility, loading states
Phase 2.5 Backend Hardening      ── Stripe webhook + checkout + portal, Supabase query audit
Phase 3  Polish                  ── per-surface sweeps, code quality, bundle splits
```

---

## Phase 1 — Foundation

**Goal:** Establish a single source of truth for theme tokens, fix the most visible design-system breaks, and remove the iOS-zoom and pinch-zoom violations sitewide.

### 1.1 Theme token unification (NEW — addresses scope addition)

**Problem:** `tailwind.config.ts` defines the accent scale and shadow ladder. `app/globals.css` defines a parallel set of CSS variables (`--accent`, `--accent-hover`, `--bg`, `--card`, etc.) plus duplicate `.shadow-card` / `.shadow-card-hover` utilities. The two sources have already drifted (e.g. `.shadow-card` in globals.css uses different rgba values than `boxShadow.card` in tailwind.config).

**Fix:**
- Promote `app/globals.css` `:root` block to the single source of truth for raw color values.
- Rewrite `tailwind.config.ts` `colors` and `boxShadow` entries to read from those CSS variables (`background: 'var(--bg)'`, `accent: { DEFAULT: 'var(--accent)', hover: 'var(--accent-hover)', ... }`, etc.).
- Delete the duplicate `.shadow-card` / `.shadow-card-hover` utility blocks from globals.css — keep only the Tailwind config versions, since `shadow-modal` already lives there.
- Add the missing tokens to `:root` so they're addressable: `--shadow-card`, `--shadow-card-hover`, `--shadow-modal`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`.
- Ship `globals.css` `prefers-color-scheme: dark` block as `--bg`, `--card`, `--text-*` overrides only — we are not building a full dark mode in this pass, but the tokens stay one level deep so dark mode is achievable later without another refactor.

### 1.2 Auth surface rebuild

- `app/(auth)/login/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx`, `verify/page.tsx` — wrap the card in `shadow-modal` (already in tailwind config, just unused on these surfaces).
- Replace the bespoke logo glyph on auth pages with the shared `<Logo />` component used by `Nav.tsx`.
- Standardize primary button color to accent (`#E05A28`) on every auth page — current code flips between black and orange on sibling pages.
- Apply `<Input>` / `<Select>` / `<Textarea>` from `components/ui/` everywhere — auth pages currently roll their own.

### 1.3 Form primitive consistency

- `components/ui/Input.tsx`, `Select.tsx`, `Textarea.tsx` — single focus-ring spec: `focus:ring-2 focus:ring-accent/25 focus:ring-offset-1`. Audit all three and unify radius (`rounded-lg`), padding (`px-3 py-2.5`), label color (`text-text-2`).
- Add `font-size: 16px` minimum to all form fields (kills iOS zoom on focus everywhere — see 1.4).

### 1.4 Mobile baseline

- `app/layout.tsx` — remove `maximumScale: 1` from `viewport` (WCAG 1.4.4 violation, breaks pinch zoom for low-vision users).
- Add a global utility `.no-ios-zoom` on text inputs guaranteed to render at `font-size: 16px` on `< 640px` viewports — applied at the primitive level so we don't have to chase every page.
- Add `inputMode` and `autoCapitalize="none"` to email and URL inputs in `Input.tsx` when `type="email"` or `type="url"`.

### 1.5 Toggle + nav active-state fix

- `Toggle` off-state currently uses border color (`#D0C9C1`) as the track background — visually broken. Switch to `bg-surface` with a darker thumb shadow.
- `Nav.tsx` active and hover states drift: collapse to one `data-active` style with a single accent underline.

### 1.6 `next.config.js` hardening (Foundation, not Polish — affects every build from here on)

- `reactStrictMode: true`
- `compress: true`
- `images: { remotePatterns: [...] }` — allow Google avatar host, Supabase storage host, Unsplash for landing.
- `experimental: { optimizePackageImports: ['lucide-react', 'recharts'] }` — cuts unused tree-shaking misses.
- `poweredByHeader: false`

**Phase 1 verification:**
- `npx tsc --noEmit` clean
- `npm run build` clean
- Manual smoke: load `/login`, `/signup`, `/dashboard`, `/dashboard/settings` on a real iPhone — focus an input, confirm no zoom; pinch-zoom the page, confirm it zooms.
- Commit as `Phase 1: Foundation — theme tokens, auth surface, mobile baseline`.

---

## Phase 2 — Impact

**Goal:** Recover the conversion lost on signup → activation, raise accessibility to a defensible AA baseline, and kill the "looks broken" loading states.

### 2.1 Demo as the activation moment (single biggest revenue lever)

- New post-signup route: `/onboarding/demo` becomes the default landing for any user with `has_seen_demo = false` (new column on `profiles`, default `false`, set to `true` on demo completion).
- Existing route: `/onboarding/demo` already exists, currently only reachable from Settings — flip the gate so it intercepts the dashboard redirect for new users.
- Demo content adapts to industry from `business.industry` (restaurant, dental, HVAC, retail, generic) — currently hard-coded restaurant samples. Add `lib/demo/industry-samples.ts` with three tone-tuned reviews per industry.
- "Skip demo" link in top-right (records `has_seen_demo = true` and routes to dashboard) — never trap users.

### 2.2 Signup loop closures

- "Check your inbox" page: add a 60-second `Resend email` button + a "Use Google instead" link that doesn't lose the in-flight signup intent.
- Onboarding Step 4 (voice training) becomes optional — move the strict gate to post-dashboard. Add a Welcome banner on dashboard for incomplete voice training instead.

### 2.3 Paywall pivot

- Default the paywall plan toggle to **annual** (highest ARPU) — currently monthly.
- Paywall copy: each plan card leads with the outcome ("Reply to every review in under 60 seconds"), then features.
- Expired paywall CTA: "View plans" → "Resubscribe" and routes directly to Stripe checkout if the user already has a `stripe_customer_id`, skipping the plan-picker click.

### 2.4 Accessibility baseline

- Sweep all icon-only buttons for `aria-label` (the `lucide-react` icon imports are easy to grep).
- `GoogleConnectModal`, `PaywallModal`, `WelcomeBanner` (when modal), social-share modals: add `role="dialog"`, `aria-modal="true"`, focus trap, body scroll lock, Escape close. Extract a `useModal({ open, onClose })` hook in `lib/hooks/useModal.ts` that handles all four behaviors.
- `StarRating`: `role="radiogroup"`, each star is `role="radio"` with `aria-checked`, supports left/right arrow keys.
- Add a skip-to-content link in `app/layout.tsx` body (`<a href="#main">Skip to content</a>`).
- Wrap each page's main content in `<main id="main">` — `app/(marketing)/layout.tsx`, `app/(auth)/layout.tsx`, `app/dashboard/layout.tsx`.
- Error toasts get `role="alert"` so screen readers announce them.
- Audit heading hierarchy: dashboard pages currently jump h1 → h3. Add intermediate h2 or demote to h3 sections.

### 2.5 Loading states

- Dashboard Home: stat tiles show skeleton bars (not animated zeros) while `loading`, then count up only when data arrives.
- Reviews page: when scraping, render 6 skeleton review rows (instead of just the progress bar).
- `app/dashboard/loading.tsx` and `app/(auth)/loading.tsx` — add route-segment loading files so navigation is never blank.
- Reset-password verify: show a "Verifying your link…" card with a labeled spinner and an explicit "This usually takes a second or two" subtext, replacing the bare spinner.

**Phase 2 verification:**
- `npx tsc --noEmit` + `npm run build` clean.
- Manual: create a fresh test account, confirm signup → demo → dashboard flow lands the user on `/onboarding/demo`.
- Run `axe-core` (browser devtools) on `/`, `/login`, `/signup`, `/dashboard`, `/dashboard/reviews`, `/onboarding/demo` — confirm zero serious or critical violations.
- Commit as `Phase 2: Impact — demo activation, paywall, a11y, loading states`.

---

## Phase 2.5 — Backend Integration Hardening (NEW — addresses scope addition)

**Goal:** Make the Stripe webhook safe to retry, the checkout/portal routes safe to fail, and the Supabase data layer typed and consistent.

### 2.5.1 Stripe webhook idempotency

- `app/api/stripe/webhook/route.ts`: wrap event handling in an idempotency check against a new `stripe_webhook_events` table (columns: `event_id PK`, `type`, `processed_at`, `payload jsonb`). Stripe retries on 5xx — without this, retried events double-credit subscriptions.
- Handle the full lifecycle: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`. The current handler only listens for two of these.
- On `subscription.deleted`, set the user's `subscription_status = 'canceled'` AND clear `stripe_subscription_id` AND set `subscription_ends_at = current_period_end` (do NOT immediately revoke access — they paid through the period).
- On `invoice.payment_failed`, set `subscription_status = 'past_due'` and trigger a Resend email "Your card was declined."
- Verify the webhook signature using `stripe.webhooks.constructEvent` — confirm `STRIPE_WEBHOOK_SECRET` is read from env at module scope, not per-request (current code is fine but worth verifying).

### 2.5.2 Checkout + portal route hardening

- `app/api/stripe/create-checkout/route.ts`:
  - If the user already has `stripe_customer_id`, pass it as `customer:` (not `customer_email:`) so Stripe doesn't create duplicate customers.
  - Set `subscription_data: { metadata: { user_id, plan } }` so the webhook can recover the user from `subscription.metadata` even if the session is lost.
  - Set `allow_promotion_codes: true` (no reason not to).
  - Wrap the `stripe.checkout.sessions.create` call in `try/catch` and return a structured error (not a 500 with a stack trace).
- `app/api/stripe/create-portal/route.ts`:
  - 404 with friendly JSON if the user has no `stripe_customer_id` (not 500).
  - Set `return_url` to an absolute URL using `NEXT_PUBLIC_SITE_URL` (currently uses `request.url` which can land on a stale dev URL in production).

### 2.5.3 Supabase query audit + typed rows

- Run a sweep for `.single()` and convert any that may legitimately return zero rows to `.maybeSingle()`. Concrete suspects:
  - `lib/supabase/server.ts` and any `getProfile`/`getBusiness` helpers that look up by user id during onboarding.
  - Reviews page initial load when a business hasn't been connected yet.
- Generate the typed schema once with the Supabase MCP `generate_typescript_types` tool and save to `lib/supabase/database.types.ts`.
- Update `lib/supabase/client.ts` and `lib/supabase/server.ts` to import `Database` from that file and pass it as the generic to `createBrowserClient<Database>()` / `createServerClient<Database>()`. This catches column rename / drift bugs at compile time.
- Verify RLS coverage on `stripe_webhook_events` (service role only — never user-readable).

### 2.5.4 Subscription gate consistency

- `components/SubscriptionGateWrapper.tsx`: today checks `subscription_status` in one place and `is_trial_active` in another. Centralize into `lib/subscription/access.ts` exporting `hasAccess(user)` returning `{ ok, reason }`. Use everywhere a paywall decision is made (gate wrapper, paywall modal, server-side route protection in `app/dashboard/layout.tsx`).

**Phase 2.5 verification:**
- `npx tsc --noEmit` + `npm run build` clean.
- Stripe CLI: `stripe trigger checkout.session.completed` then re-trigger the same event id — confirm second call is a no-op (idempotency table records "already processed").
- Stripe CLI: `stripe trigger invoice.payment_failed` — confirm the user's `subscription_status` becomes `past_due` and Resend logs an outbound email.
- Manual: cancel a test subscription via portal, confirm access persists until `current_period_end`.
- Commit as `Phase 2.5: Backend hardening — Stripe webhook idempotency, Supabase types, subscription gate`.

---

## Phase 3 — Polish

**Goal:** Per-surface sweeps that pull every page onto the unified token system, plus code-quality and bundle wins.

### 3.1 Surface sweeps against the new tokens

- Settings sections: replace inline card scaffolding with `<Card>` from `components/ui/`.
- Landing feature cards: unify radius (`rounded-2xl`) and shadow (`shadow-card`) — currently three different combos.
- Grow tab: unify with the rest of the dashboard (currently uses a different card shadow + heading scale).
- HomeClient buttons: switch any leftover bespoke buttons to `<Button>` from `components/ui/`.
- Icon stroke-width: standardize on `strokeWidth={1.75}` for `lucide-react` icons across all surfaces.

### 3.2 Loading + empty-state polish

- Empty states across dashboard: replace emoji-only states with the same illustration + heading + subtext + primary action pattern from landing. Reusable component: `components/EmptyState.tsx`.

### 3.3 Bundle splitting

- `html2canvas` and `jspdf`: convert imports to `dynamic(() => import('html2canvas'), { ssr: false })` in the share-card and PDF-export paths. Currently shipped on every dashboard load.
- `recharts`: dynamic import the analytics charts in `app/dashboard/analytics/AnalyticsClient.tsx` and `app/dashboard/grow/GrowClient.tsx`. Wrap in a skeleton placeholder while loading.

### 3.4 Code quality

- Remove `: any` from `AnalyticsClient` tooltip — replace with the `recharts` `TooltipProps` generic.
- Wrap the 30+ raw `console.log` in `app/api/scrape/**` with a `lib/log.ts` helper that no-ops in production. Same for `console.error` that leaks PII.
- Delete the stale `.claude/worktrees/*` directories committed to git.
- Move the trial-banner copy to use loss-aversion phrasing ("3 days left to save your AI replies" vs "Trial ends in 3 days").

### 3.5 Mobile touch targets

- Reply tone chips, 👍/👎 buttons, regenerate, settings toggle: bump to `min-h-[44px] min-w-[44px]`.
- Star-filter pills, Reviews tabs, Settings tab bar: same.
- Competitors table on mobile: pin the "You" column with `position: sticky; left: 0` so it never scrolls off-screen.
- `PaywallModal` mobile: wire up `useModal()` from Phase 2.4 so it gets scroll lock + `pb-[env(safe-area-inset-bottom)]`.
- Nav drawer: same treatment.

### 3.6 Testimonials credibility

- Fix the count contradiction (200+ vs 500+) on landing — pick one number, use it everywhere.
- Add at least one real testimonial with a real name + role + business name (or remove the section until we have it).

**Phase 3 verification:**
- `npx tsc --noEmit` + `npm run build` clean.
- Run `next build` and check `First Load JS` for `/dashboard/analytics` and `/dashboard/grow` — should drop by ~150–200 kB after dynamic imports.
- Commit as `Phase 3: Polish — surface sweeps, bundle splits, code quality`.

---

## Risks and mitigations

- **Theme refactor cascade.** Promoting CSS variables and rewriting `tailwind.config.ts` color references could break a class somewhere unexpectedly. Mitigation: do this as the very first step of Phase 1, then visually diff every top-level route before committing.
- **Demo gate intercepts existing users.** Setting `has_seen_demo` default to `false` would force every existing user through the demo on next login. Mitigation: backfill SQL — `UPDATE profiles SET has_seen_demo = true WHERE created_at < now()` runs before the gate ships.
- **Stripe webhook idempotency table missing on prod.** The webhook can't write to a table that doesn't exist. Mitigation: ship the migration first, deploy webhook handler second.
- **`.maybeSingle()` callers expect a row.** Some call sites currently rely on the throw behavior of `.single()` to short-circuit. Mitigation: every conversion gets explicit null handling at the call site, not just at the query.
- **Bundle splits hide load failures.** A failed `dynamic()` import in production would silently render nothing. Mitigation: every `dynamic()` call gets `loading:` and `error:` fallbacks that match the surrounding skeleton style.
- **Phase ordering.** A user could stop after Phase 1 and ship; everything before Phase 2 must be independently complete and revertible. Each phase commits as a single revertible commit.

## Out of scope (explicit)

- Dark mode (Phase 1 leaves the tokens dark-mode-ready but does not flip the switch).
- Real-time review feed.
- Mobile native apps.
- Internationalization.
- New Stripe plans or pricing changes.
- Schema rewrites to existing tables (only adds: `profiles.has_seen_demo`, new `stripe_webhook_events` table).

## Open questions

- None at this writing — user has approved scope including the two additions (theming + Stripe/Supabase). Any new questions surfaced during the implementation plan will be resolved in the writing-plans phase.
