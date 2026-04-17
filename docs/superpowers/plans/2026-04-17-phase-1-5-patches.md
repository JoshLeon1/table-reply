# Phase 1.5 Patches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the high-leverage follow-ups identified by the Phase 1 final code review — DRY out duplicate primitives, remove dead code, and knock out the two Analytics code-quality items (typed `AXIS_TICK`, dynamic-imported Recharts) to cut `/dashboard/analytics` First Load JS from 219 kB.

**Architecture:** Single feature branch off `main` (`feature/phase-1-5-patches`), one commit per task, each commit fully self-contained so bisect/revert is clean. No new user-facing features — pure cleanup + perf.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, existing Phase 1 primitives (Eyebrow, KPI, Card, Stars), Recharts, `next/dynamic` for code-splitting.

---

## Context: Where this plan came from

Two inputs:

1. **Phase 1 final cross-phase code reviewer** (spec review after task 15) flagged as "Phase 2 handoff notes":
   - Collapse local `StarRow`/`Stars` duplicates in `HomeClient`, `AnalyticsClient`, `SocialClient`
   - Extract shared `PlatformBadge` (duplicated in `HomeClient` and `ReviewsClient`)
   - Port Reviews `ConnectedPanel` stat cards to `<KPI variant="secondary">`
   - Remove dead `.nav-active-glow` utility
   - Drop unused `showStatus` prop on `ReviewCard`
   - Consider extracting `AXIS_TICK`/chart-color constants to a shared module (done locally in `9caf5eb`, not yet shared — leave for Phase 2)
   - Tighten `as any` cast on `AXIS_TICK` — a typed constant would remove the cast from 7 use sites

2. **Stale `docs/superpowers/plans/2026-04-16-phase-3-patches.md`** (written against a `feature/website-polish` HEAD that no longer exists; references 4 commits not in this repo's history). Salvageable tasks were **T8** (remove dead `html2canvas` dep) and **T9** (dynamic-import Recharts). Others in that doc are either already done by Phase 1, not relevant, or deferred to Phase 2.

## Verification gate between tasks

After each task's commit, run:

```bash
npx tsc --noEmit
```

Expected: clean. If it errors, look at the error, not the patch — the patches below assume `main` HEAD (currently `ae7b10a`).

---

## Task 1: Archive the stale Phase 3 patches doc

**Why:** The doc at `docs/superpowers/plans/2026-04-16-phase-3-patches.md` was salvaged by this plan but should not be executed as-is (line numbers and file state no longer match `main`). Rename it so future sessions don't mistake it for an active plan.

**Files:**
- Move: `docs/superpowers/plans/2026-04-16-phase-3-patches.md` → `docs/superpowers/plans/_archive/2026-04-16-phase-3-patches-SUPERSEDED.md`
- Create: `docs/superpowers/plans/_archive/README.md`

- [ ] **Step 1: Create archive directory and move the doc**

```bash
cd "/Users/joshleon/Table Reply/.worktrees/phase-1-5-patches"
mkdir -p docs/superpowers/plans/_archive
git mv docs/superpowers/plans/2026-04-16-phase-3-patches.md docs/superpowers/plans/_archive/2026-04-16-phase-3-patches-SUPERSEDED.md
```

Note: The file is currently untracked on `main` (was preserved when the Phase 1 worktree was removed). If `git mv` fails because it's untracked, use plain `mv` then `git add -A`.

- [ ] **Step 2: Write archive README**

Create `docs/superpowers/plans/_archive/README.md` with exactly this content:

```markdown
# Archived plans

Plans in this directory were written but never executed, or were superseded by later plans. They are kept for provenance but should NOT be used as a basis for new work — their line numbers, file paths, and commit references may no longer match the current codebase.

## Index

- `2026-04-16-phase-3-patches-SUPERSEDED.md` — Pre-Phase-1 patch set. References a `feature/website-polish` HEAD state that no longer exists. High-value tasks from this doc (T8 html2canvas removal, T9 Recharts dynamic import, T10 `as any` cleanup) were absorbed into Phase 1.5. Other tasks were either completed by Phase 1, deferred to Phase 2, or dropped.
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/_archive/
git commit -m "docs(plans): archive stale phase-3-patches doc"
```

---

## Task 2: Remove dead `.nav-active-glow` utility from globals.css

**Why:** Phase 1 Task 10 (`f6b6982`) migrated Nav's active state from the pill-with-glow to a 2px underline. The `.nav-active-glow` CSS utility is no longer referenced by any code. Grep-verified: 0 matches in `app/` or `components/`.

**Files:**
- Modify: `app/globals.css:143-148`

- [ ] **Step 1: Verify zero callers**

Run:

```bash
cd "/Users/joshleon/Table Reply/.worktrees/phase-1-5-patches"
grep -rn "nav-active-glow" app/ components/
```

Expected: no output (zero matches outside `globals.css` itself). If anything turns up, STOP — there's a live caller that the Phase 1 review missed.

- [ ] **Step 2: Delete the block**

Open `app/globals.css`. Find this block around line 143-148:

```css
  /* nav active pill glow */
  .nav-active-glow {
    box-shadow: 0 0 0 1px rgba(224,90,40,0.15), 0 2px 8px rgba(224,90,40,0.12);
  }
```

Delete it (including the comment line and the blank line after, if any). Surrounding `@layer utilities { ... }` block stays intact.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "chore(ui): remove dead .nav-active-glow utility

Nav migrated to 2px underline in f6b6982; this utility had no
remaining callers."
```

---

## Task 3: Drop unused `showStatus` prop from `ReviewCard`

**Why:** `ReviewCard`'s `showStatus` prop is declared (`ReviewsClient.tsx:230`) and passed by one caller (`:951`), but the component body never reads it. Dead surface area that confuses the next implementer.

**Files:**
- Modify: `app/(dashboard)/dashboard/reviews/ReviewsClient.tsx:225-230, :951`

- [ ] **Step 1: Verify the prop is unread**

```bash
grep -n "showStatus" "app/(dashboard)/dashboard/reviews/ReviewsClient.tsx"
```

Expected: exactly 3 matches — the destructuring at line 225-ish, the type declaration at line 230, and the call site at line 951 passing `showStatus` as a flag. If you find reads inside the `ReviewCard` function body, STOP and report — the prop may have been intended to be used.

- [ ] **Step 2: Remove from destructure, type, and call site**

In `app/(dashboard)/dashboard/reviews/ReviewsClient.tsx` around line 225, the function signature currently looks like:

```tsx
function ReviewCard({ review: initialReview, onApprove, onDismiss, onRestore, showStatus, profileUrls, isCopied }: {
  review: ScrapedReview
  onApprove: (id: string) => void
  onDismiss: (id: string) => void
  onRestore?: (id: string) => void
  showStatus?: boolean
  profileUrls?: { google?: string | null; yelp?: string | null; tripadvisor?: string | null }
  isCopied?: boolean
}) {
```

Change to:

```tsx
function ReviewCard({ review: initialReview, onApprove, onDismiss, onRestore, profileUrls, isCopied }: {
  review: ScrapedReview
  onApprove: (id: string) => void
  onDismiss: (id: string) => void
  onRestore?: (id: string) => void
  profileUrls?: { google?: string | null; yelp?: string | null; tripadvisor?: string | null }
  isCopied?: boolean
}) {
```

At the call site around line 951, the JSX currently looks like:

```tsx
<ReviewCard review={r} onApprove={onApprove} onDismiss={onDismiss} onRestore={onRestore} showStatus profileUrls={{ google: profile.google_maps_url, yelp: profile.yelp_url, tripadvisor: profile.tripadvisor_url }}/>
```

Remove the `showStatus` token:

```tsx
<ReviewCard review={r} onApprove={onApprove} onDismiss={onDismiss} onRestore={onRestore} profileUrls={{ google: profile.google_maps_url, yelp: profile.yelp_url, tripadvisor: profile.tripadvisor_url }}/>
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/dashboard/reviews/ReviewsClient.tsx"
git commit -m "chore(reviews): remove unused showStatus prop from ReviewCard"
```

---

## Task 4: Extract `PlatformBadge` primitive and DRY the two call sites

**Why:** `PlatformBadge` is defined verbatim twice — `HomeClient.tsx:104` and `ReviewsClient.tsx:29`. Same 3-branch (yelp/tripadvisor/google) color-badge. Extract once, import everywhere.

**Files:**
- Create: `components/ui/PlatformBadge.tsx`
- Modify: `app/(dashboard)/dashboard/HomeClient.tsx` (remove local def, add import)
- Modify: `app/(dashboard)/dashboard/reviews/ReviewsClient.tsx` (remove local def, add import)

- [ ] **Step 1: Create the primitive**

Write `components/ui/PlatformBadge.tsx` with exactly this content:

```tsx
import { cn } from '@/lib/utils'

interface PlatformBadgeProps {
  /** 'yelp' | 'tripadvisor' | anything else renders as Google. */
  source?: string | null
  className?: string
}

const VARIANTS = {
  yelp:        { label: 'YELP', classes: 'text-red-500 bg-red-50 border-red-200' },
  tripadvisor: { label: 'TA',   classes: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  google:      { label: 'G',    classes: 'text-blue-500 bg-blue-50 border-blue-200' },
} as const

/**
 * Small platform attribution badge shown next to a review's reviewer name.
 * Source is permissive (string | null | undefined) — unknown values fall
 * back to Google branding.
 */
export default function PlatformBadge({ source, className }: PlatformBadgeProps) {
  const variant = source === 'yelp' ? VARIANTS.yelp : source === 'tripadvisor' ? VARIANTS.tripadvisor : VARIANTS.google
  return (
    <span className={cn('inline-flex items-center text-[10px] font-bold rounded-md px-1.5 py-0.5 leading-none border', variant.classes, className)}>
      {variant.label}
    </span>
  )
}
```

- [ ] **Step 2: Replace in `HomeClient.tsx`**

Open `app/(dashboard)/dashboard/HomeClient.tsx`.

a) Add the import near the top (alongside other `@/components/ui/*` imports):

```tsx
import PlatformBadge from '@/components/ui/PlatformBadge'
```

b) Delete the local `PlatformBadge` function. Currently around line 104, looks like:

```tsx
function PlatformBadge({ source }: { source?: string | null }) {
  if (source === 'yelp') return (
    <span className="inline-flex items-center text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 rounded-md px-1.5 py-0.5 leading-none">YELP</span>
  )
  if (source === 'tripadvisor') return (
    <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5 leading-none">TA</span>
  )
  return (
    <span className="inline-flex items-center text-[10px] font-bold text-blue-500 bg-blue-50 border border-blue-200 rounded-md px-1.5 py-0.5 leading-none">G</span>
  )
}
```

Delete the whole function (including the comment line just above it, if it's a standalone "Platform badge" comment). Call sites are unchanged — they already render `<PlatformBadge source={...} />`.

- [ ] **Step 3: Replace in `ReviewsClient.tsx`**

Open `app/(dashboard)/dashboard/reviews/ReviewsClient.tsx`.

a) Add the import near the top:

```tsx
import PlatformBadge from '@/components/ui/PlatformBadge'
```

b) Delete the local `PlatformBadge` function around line 29:

```tsx
function PlatformBadge({ source }: { source?: string | null }) {
  if (source === 'yelp') return (
    <span className="inline-flex items-center text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 rounded-md px-1.5 py-0.5 leading-none">YELP</span>
  )
  if (source === 'tripadvisor') return (
    <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5 leading-none">TA</span>
  )
  return (
    <span className="inline-flex items-center text-[10px] font-bold text-blue-500 bg-blue-50 border border-blue-200 rounded-md px-1.5 py-0.5 leading-none">G</span>
  )
}
```

Call sites at `:371`, `:402` already use `<PlatformBadge source={...} />` — no change needed there.

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add components/ui/PlatformBadge.tsx "app/(dashboard)/dashboard/HomeClient.tsx" "app/(dashboard)/dashboard/reviews/ReviewsClient.tsx"
git commit -m "refactor(ui): extract PlatformBadge primitive

Same 3-source (yelp/tripadvisor/google) badge was defined verbatim
in HomeClient and ReviewsClient. Canonical primitive in
components/ui/, call sites unchanged."
```

---

## Task 5: Consolidate local `StarRow`/`Stars` helpers to the canonical `<Stars>` primitive

**Why:** The canonical `components/ui/Stars.tsx` was created in Phase 1 and already has three sizes (sm/md/lg). Four local duplicates still exist:

- `HomeClient.tsx:95` — `StarRow({ rating, size = 'sm' })`
- `ReviewsClient.tsx:27` — `StarRow({ rating })`
- `AnalyticsClient.tsx:70` — `Stars({ rating })`
- `SocialClient.tsx:34` — `Stars({ rating })`

All four render yellow-filled stars. Replace each with `<Stars rating={...} size="sm" />` from `components/ui/Stars`.

**Note on imports:** `ReviewsClient.tsx` and `HomeClient.tsx` likely already import `Stars` from Phase 1 work. `AnalyticsClient.tsx` and `SocialClient.tsx` don't and will need the import added.

**Files:**
- Modify: `app/(dashboard)/dashboard/HomeClient.tsx`
- Modify: `app/(dashboard)/dashboard/reviews/ReviewsClient.tsx`
- Modify: `app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx`
- Modify: `app/(dashboard)/dashboard/social/SocialClient.tsx`

- [ ] **Step 1: Check which files already import `Stars`**

```bash
grep -n "from '@/components/ui/Stars'" "app/(dashboard)/dashboard/HomeClient.tsx" "app/(dashboard)/dashboard/reviews/ReviewsClient.tsx" "app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx" "app/(dashboard)/dashboard/social/SocialClient.tsx"
```

Record which files need the import added vs. already have it.

- [ ] **Step 2: Replace in `HomeClient.tsx`**

Open `app/(dashboard)/dashboard/HomeClient.tsx`.

a) If the file does NOT already import `Stars`, add:

```tsx
import Stars from '@/components/ui/Stars'
```

b) Delete the local `StarRow` definition around line 95-101 (roughly 6-10 lines).

c) Find every usage of `<StarRow rating={...} />` or `<StarRow rating={...} size="md" />` in this file and replace:
   - `<StarRow rating={x} />` → `<Stars rating={x} size="sm" />`
   - `<StarRow rating={x} size="md" />` → `<Stars rating={x} size="md" />`

The canonical `<Stars>` already supports size variants, so preserve whichever size was passed.

- [ ] **Step 3: Replace in `ReviewsClient.tsx`**

Open `app/(dashboard)/dashboard/reviews/ReviewsClient.tsx`.

a) If the file does NOT already import `Stars`, add the import.

b) Delete the local `StarRow` definition around line 27-37 (yellow-star SVG loop).

c) Replace call sites at `:372` and `:416` — `<StarRow rating={review.star_rating} />` or `<StarRow rating={review.star_rating}/>` — with:

```tsx
<Stars rating={review.star_rating} size="sm" />
```

- [ ] **Step 4: Replace in `AnalyticsClient.tsx`**

Open `app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx`.

a) Add the import if missing:

```tsx
import Stars from '@/components/ui/Stars'
```

b) Delete the local `Stars` definition around line 70. Currently looks like a function that returns a 5-star amber SVG loop.

c) Find every `<Stars rating={...} />` usage in this file and verify the signature matches the canonical primitive (`rating: number`, optional `size`, optional `className`). If any usage passes a prop the canonical doesn't support, STOP and report — the local version may have diverged.

d) No call-site changes needed if all usages are `<Stars rating={x} />`.

- [ ] **Step 5: Replace in `SocialClient.tsx`**

Open `app/(dashboard)/dashboard/social/SocialClient.tsx`.

a) Add the import:

```tsx
import Stars from '@/components/ui/Stars'
```

b) Delete the local `Stars` definition around line 34.

c) Find every `<Stars rating={...} />` usage in this file and verify no extra props. No call-site changes needed if clean.

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean. If any call site was passing an unsupported prop, tsc will catch it and point at the line — resolve by either extending the canonical `Stars` primitive or adjusting the call site.

- [ ] **Step 7: Visual spot-check (optional)**

Run `npm run dev`. Visit `/dashboard`, `/dashboard/reviews`, `/dashboard/analytics`, `/dashboard/social`. Stars should render identically to before — same color, same size, same position. If anything looks off, check the `size` prop values.

- [ ] **Step 8: Commit**

```bash
git add "app/(dashboard)/dashboard/HomeClient.tsx" "app/(dashboard)/dashboard/reviews/ReviewsClient.tsx" "app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx" "app/(dashboard)/dashboard/social/SocialClient.tsx"
git commit -m "refactor(ui): consolidate local StarRow/Stars to canonical <Stars>

Four local duplicates (HomeClient, ReviewsClient, AnalyticsClient,
SocialClient) all replaced with the Phase 1 <Stars> primitive from
components/ui/Stars. Identical render."
```

---

## Task 6: Port Reviews `ConnectedPanel` stat cards to `<Card variant="flat"> + <KPI variant="secondary">`

**Why:** Phase 1 final reviewer flagged this as the only page where the stat-card idiom diverged from Home and Analytics. Migrating to the shared primitives gives visual consistency (same typography, same chrome) and removes bespoke Tailwind.

**Note:** The current implementation at `ReviewsClient.tsx:680-692` includes per-card semantic color (`text-red-600` for negative reviews, `text-amber-600` for pending). The `KPI` primitive intentionally renders all values in `text-[#111111]` per the monochrome design system. This is an intentional information-density tradeoff matching what Phase 1 Task 13 already did to Analytics — keep the monochrome.

**Files:**
- Modify: `app/(dashboard)/dashboard/reviews/ReviewsClient.tsx:673-694`

- [ ] **Step 1: Verify Card + KPI imports exist**

```bash
grep -n "from '@/components/ui/Card'\|from '@/components/ui/KPI'" "app/(dashboard)/dashboard/reviews/ReviewsClient.tsx"
```

If either is missing, add these to the imports near the top of the file:

```tsx
import { Card } from '@/components/ui/Card'
import KPI from '@/components/ui/KPI'
```

- [ ] **Step 2: Replace the stat cards block**

In `app/(dashboard)/dashboard/reviews/ReviewsClient.tsx` around lines 673-694, the current block is:

```tsx
{/* Stat cards */}
{reviews.length > 0 && (() => {
  const negCount = reviews.filter(r => r.star_rating <= 2).length
  const avgRat = reviews.filter(r => r.star_rating).length > 0
    ? (reviews.reduce((s, r) => s + (r.star_rating || 0), 0) / reviews.filter(r => r.star_rating).length).toFixed(1)
    : '—'
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: 'Total Reviews', value: reviews.length, color: 'text-[#111111]' },
        { label: 'Negative Reviews', value: negCount, color: 'text-red-600' },
        { label: 'Avg Rating', value: `${avgRat} / 5`, color: 'text-[#111111]' },
        { label: 'Pending', value: pending.length, color: 'text-amber-600' },
      ].map(({ label, value, color }) => (
        <div key={label} className="bg-white rounded-xl border border-[#E4DED8] p-4">
          <p className="text-[12px] text-[#A8A29E] font-medium">{label}</p>
          <p className={`text-[22px] font-bold mt-1 tnum ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  )
})()}
```

Replace with:

```tsx
{/* Stat cards */}
{reviews.length > 0 && (() => {
  const negCount = reviews.filter(r => r.star_rating <= 2).length
  const avgRat = reviews.filter(r => r.star_rating).length > 0
    ? (reviews.reduce((s, r) => s + (r.star_rating || 0), 0) / reviews.filter(r => r.star_rating).length).toFixed(1)
    : '—'
  const tiles = [
    { label: 'TOTAL REVIEWS',    value: reviews.length },
    { label: 'NEGATIVE REVIEWS', value: negCount },
    { label: 'AVG RATING',       value: `${avgRat} / 5` },
    { label: 'PENDING',          value: pending.length },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {tiles.map(({ label, value }) => (
        <Card key={label} variant="flat" padding="md">
          <KPI variant="secondary" label={label} value={value} />
        </Card>
      ))}
    </div>
  )
})()}
```

Changes:
- Labels uppercased to match the Eyebrow convention (KPI renders the label through `<Eyebrow>`).
- `sm:grid-cols-4` → `lg:grid-cols-4` to match Analytics' responsive breakpoint (2×2 on mobile, 1×4 at `lg`).
- Dropped the `color` semantic overrides — monochrome now, per the Phase 1 system.
- Dropped `text-[22px] font-bold` and `text-[12px]` explicit sizing — the `KPI variant="secondary"` primitive owns those.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Visual spot-check**

Run `npm run dev`, visit `/dashboard/reviews` after connecting a profile (or seed a mocked session). The four stat cards should render identically to Analytics' top-of-page KPI strip — same typography, same eyebrow labels, same tnum values, same card chrome.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/dashboard/reviews/ReviewsClient.tsx"
git commit -m "refactor(reviews): port ConnectedPanel stat cards to <Card>+<KPI>

Unifies Reviews stat tiles with the pattern used in Analytics and
Dashboard home. Monochrome values per Phase 1 design system."
```

---

## Task 7: Remove the `html2canvas` dependency

**Why:** `package.json` declares `"html2canvas": "^1.4.1"` but zero files under `app/`, `components/`, or `lib/` import it. Grep-verified. Shipping an unused 48 KB (gzipped) dependency is waste.

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (auto-updated by `npm uninstall`)

- [ ] **Step 1: Re-verify zero imports**

```bash
cd "/Users/joshleon/Table Reply/.worktrees/phase-1-5-patches"
grep -rn "html2canvas" app/ components/ lib/
```

Expected: no output. If anything matches, STOP and reassess — a dynamic import or string-literal lookup could have been missed.

- [ ] **Step 2: Uninstall**

```bash
npm uninstall html2canvas
```

This updates both `package.json` and `package-lock.json`.

- [ ] **Step 3: Type-check + build**

```bash
npx tsc --noEmit
```

Expected: clean.

```bash
STRIPE_SECRET_KEY=sk_test_dummy STRIPE_WEBHOOK_SECRET=whsec_dummy STRIPE_PRICE_ID_MONTHLY=price_dummy STRIPE_PRICE_ID_ANNUAL=price_dummy NEXT_PUBLIC_APP_URL=https://replyfi.app RESEND_API_KEY=re_dummy npm run build 2>&1 | tail -20
```

Expected: all 25 routes build successfully. No missing-module errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): remove unused html2canvas

Zero imports in app/, components/, or lib/. Ships ~48 KB gzipped
that nothing uses."
```

---

## Task 8: Type `AXIS_TICK` properly to remove the 7× `as any` cast

**Why:** Phase 1 follow-up commit `9caf5eb` extracted `AXIS_TICK` as a const with `as const`, but the 7 use sites still read `tick={AXIS_TICK as any}` because Recharts' `tick` prop accepts a loose union (`SVGProps<SVGTextElement> | ReactElement | Function | boolean`). Declaring the constant with an explicit `React.SVGProps<SVGTextElement>` type and letting `fontFeatureSettings` live in `style` removes the cast from every call site.

**Files:**
- Modify: `app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx:43` (constant)
- Modify: `app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx` (7 call sites)

- [ ] **Step 1: Update the constant**

In `app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx` around line 43, the current line is:

```tsx
const AXIS_TICK = { fontSize: 11, fontFeatureSettings: '"tnum" 1', fill: '#A8A29E' } as const
```

The issue: Recharts internally spreads this onto an SVG `<text>` element, and `fontFeatureSettings` is a CSS property (belongs in `style`), not an SVG attribute. The `as any` at use sites papers over this.

Replace with a typed object that splits SVG attrs from CSS style:

```tsx
import type { SVGProps } from 'react'

const AXIS_TICK: SVGProps<SVGTextElement> = {
  fontSize: 11,
  fill: '#A8A29E',
  style: { fontFeatureSettings: '"tnum" 1' },
}
```

Place the `import type { SVGProps } from 'react'` alongside the other react imports at the top of the file (if `SVGProps` isn't already imported). If `import { ..., type SVGProps } from 'react'` or a separate `import type` already exists, merge into it.

- [ ] **Step 2: Remove `as any` from all 7 call sites**

Find every occurrence of `tick={AXIS_TICK as any}` in this file. There should be 7 of them (per the review report). Replace each with:

```tsx
tick={AXIS_TICK}
```

Suggested grep to find them all:

```bash
grep -n "AXIS_TICK as any" "app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx"
```

Expected before: 7 lines. After: 0 lines.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean. If Recharts' types reject the `SVGProps<SVGTextElement>` shape (e.g. narrow it to a specific subset), fall back to casting the constant ONCE instead of 7 times:

```tsx
const AXIS_TICK = {
  fontSize: 11,
  fill: '#A8A29E',
  style: { fontFeatureSettings: '"tnum" 1' },
} as SVGProps<SVGTextElement>
```

Then use at call sites bare: `tick={AXIS_TICK}`. The goal is one cast, not seven.

- [ ] **Step 4: Visual spot-check**

Run `npm run dev`, visit `/dashboard/analytics`. Axis labels should render identically to before — 11px stone-gray digits with tabular numerals. If labels suddenly lack tnum spacing, `style` isn't being applied — inspect the rendered DOM to confirm `font-feature-settings: "tnum" 1` is on the `<text>` element.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx"
git commit -m "refactor(analytics): type AXIS_TICK as SVGProps, drop 7× as any

Moving fontFeatureSettings from a direct property into style lets
AXIS_TICK satisfy SVGProps<SVGTextElement> without a cast. Drops
7 'as any' escapes from the tick={...} call sites."
```

---

## Task 9: Dynamic-import Recharts in Analytics to cut First Load JS

**Why:** `/dashboard/analytics` is the heaviest route at 219 kB First Load JS, with Recharts accounting for most of it. Recharts only needs to load when the user actually views the Analytics page — splitting it into a dynamic import keeps the initial dashboard bundle lean and only pays the Recharts cost when rendering charts.

The trick: create a thin wrapper component that re-exports the handful of Recharts symbols AnalyticsClient uses, and dynamic-import that wrapper instead of reorganizing AnalyticsClient itself.

**Files:**
- Create: `components/charts/LazyRecharts.tsx`
- Modify: `app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx` (imports only)

- [ ] **Step 1: Inspect which Recharts symbols are used**

```bash
grep -n "^import\|} from 'recharts'" "app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx" | head -10
```

Per Phase 1 inspection, the import at line 4-7 is:

```tsx
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, BarChart, Bar, Cell, ComposedChart,
} from 'recharts'
```

Those 12 symbols are what we need to re-export lazily.

- [ ] **Step 2: Create the lazy wrapper**

Write `components/charts/LazyRecharts.tsx` with exactly this content:

```tsx
'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

// Next.js dynamic() with ssr: false ensures Recharts (which uses the DOM for
// ResizeObserver) never runs on the server and gets code-split into its own
// chunk. The chunk is fetched on first render of any chart component.
//
// Each symbol is a separate dynamic() call, so Next's bundler generates one
// shared chunk for Recharts rather than twelve. Tree-shaking within Recharts
// itself is not affected.

function lazy<T extends ComponentType<unknown>>(load: () => Promise<T>) {
  return dynamic(load, { ssr: false }) as T
}

// Chart containers
export const LineChart        = lazy(() => import('recharts').then(m => m.LineChart))
export const AreaChart        = lazy(() => import('recharts').then(m => m.AreaChart))
export const BarChart         = lazy(() => import('recharts').then(m => m.BarChart))
export const ComposedChart    = lazy(() => import('recharts').then(m => m.ComposedChart))
export const ResponsiveContainer = lazy(() => import('recharts').then(m => m.ResponsiveContainer))

// Series primitives
export const Line  = lazy(() => import('recharts').then(m => m.Line))
export const Area  = lazy(() => import('recharts').then(m => m.Area))
export const Bar   = lazy(() => import('recharts').then(m => m.Bar))
export const Cell  = lazy(() => import('recharts').then(m => m.Cell))

// Axes and overlays
export const XAxis   = lazy(() => import('recharts').then(m => m.XAxis))
export const YAxis   = lazy(() => import('recharts').then(m => m.YAxis))
export const Tooltip = lazy(() => import('recharts').then(m => m.Tooltip))
```

- [ ] **Step 3: Swap the import in AnalyticsClient**

In `app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx`, replace the block at lines 4-7:

```tsx
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, BarChart, Bar, Cell, ComposedChart,
} from 'recharts'
```

With:

```tsx
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, BarChart, Bar, Cell, ComposedChart,
} from '@/components/charts/LazyRecharts'
```

The symbol names are unchanged — only the source module changes.

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean. If tsc complains about `as ComponentType` casts in the wrapper, relax the generic to `any` at the `lazy` helper's internal return — it's a thin wrapper and type-purity is sacrificed for bundler simplicity. The call-site types come from AnalyticsClient using these components as JSX, which ultimately resolves to `ReactNode`.

- [ ] **Step 5: Measure the win**

Production build with tree-shaking:

```bash
STRIPE_SECRET_KEY=sk_test_dummy STRIPE_WEBHOOK_SECRET=whsec_dummy STRIPE_PRICE_ID_MONTHLY=price_dummy STRIPE_PRICE_ID_ANNUAL=price_dummy NEXT_PUBLIC_APP_URL=https://replyfi.app RESEND_API_KEY=re_dummy npm run build 2>&1 | grep -E "analytics|dashboard" | head -10
```

Baseline (before Task 9): `/dashboard/analytics` was 20.6 kB / 219 kB First Load JS.

Expected after: `/dashboard/analytics` First Load JS should drop noticeably (target: -50 kB or better). The route-specific size may go up slightly (more glue code) but **First Load** should drop because Recharts moves out of the initial client bundle into a lazy chunk.

If First Load JS did NOT drop, check that the dynamic import's `ssr: false` flag is actually applied — run `npm run build` with `--debug` or inspect `.next/analyze/client.html` (enable `@next/bundle-analyzer` if not already) to confirm Recharts lives in a separate chunk.

- [ ] **Step 6: Visual spot-check (important)**

Run `npm run dev`. Visit `/dashboard/analytics`. On first paint:
- There may be a brief moment where chart areas are blank/skeletal while the Recharts chunk loads (expected — `ssr: false` means client-only render).
- After the chunk loads, all 4 charts should render identically to before.
- Hover tooltips, axis labels, and colors should match the Phase 1 monochrome design.
- Sparklines inside Competitors and Social pages use Recharts too — verify those also still render. (Competitors imports Recharts directly at `CompetitorsClient.tsx:14` — this task does NOT lazy-load that; Competitors will be swapped in Phase 2 if its bundle warrants it.)

If charts fail to render or hang forever, revert and investigate — `ssr: false` + React 18 streaming can interact oddly with certain component trees.

- [ ] **Step 7: Commit**

```bash
git add components/charts/LazyRecharts.tsx "app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx"
git commit -m "perf(analytics): dynamic-import Recharts to shrink First Load JS

Analytics was the heaviest route at 219 kB First Load, with Recharts
as the dominant contributor. Routing Recharts through a thin dynamic()
wrapper code-splits it into its own chunk that loads only when a chart
actually renders. SSR is disabled for the chart components to avoid
DOM-only Recharts internals running on the server.

Competitors and Social keep their direct Recharts import for now —
a follow-up in Phase 2 will audit those bundles."
```

---

## Task 10: Phase 1.5 verification gate

**Files:** no code changes — verification only.

- [ ] **Step 1: Full tsc**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 2: Full build with all routes**

```bash
STRIPE_SECRET_KEY=sk_test_dummy STRIPE_WEBHOOK_SECRET=whsec_dummy STRIPE_PRICE_ID_MONTHLY=price_dummy STRIPE_PRICE_ID_ANNUAL=price_dummy NEXT_PUBLIC_APP_URL=https://replyfi.app RESEND_API_KEY=re_dummy npm run build 2>&1 | tail -40
```

Expected: all 25 routes compile. Record the First Load JS sizes for `/dashboard`, `/dashboard/analytics`, `/dashboard/reviews` and compare to the Phase 1 baseline (Dashboard 170 kB, Analytics 219 kB, Reviews 159 kB).

Record any route whose First Load JS regressed by >5 kB — unexpected regression means Task 9 introduced eager imports somewhere.

- [ ] **Step 3: Dev smoke test**

```bash
npm run dev
```

Visit each of:
- `/dashboard` — hero KPI + action strip + recent reviews list; `<Stars>` and `<PlatformBadge>` render identically
- `/dashboard/reviews` — dense rows + status chips + 4-tile KPI stat strip (newly ported); `<Stars>` renders identically
- `/dashboard/analytics` — monochrome charts + eyebrow tooltips + 4-tile KPI strip; axis labels in tabular numerals; brief blank-chart moment on first paint is acceptable (Task 9 effect)
- `/dashboard/social` — `<Stars>` render identically

No console errors on any page. Nav 2px underline still works.

- [ ] **Step 4: Mobile iOS smoke (375px)**

Chrome DevTools responsive mode at 375×812. Check each page:
- No horizontal scrollbar
- Stat strips collapse to 2×2 (not 4×1)
- Chart tooltips don't get clipped by viewport edge
- Tap-highlight flash is absent (verify by tapping a button/link)

- [ ] **Step 5: Final state check**

```bash
git status
```

Expected: clean working tree. If anything is dirty, either commit it (if it's part of a task's scope) or stash/revert.

```bash
git log --oneline main..HEAD
```

Expected: 8 commits (one per task, skipping Task 10 which has no code changes).

- [ ] **Step 6: Push**

```bash
git push -u origin feature/phase-1-5-patches
```

- [ ] **Step 7: Report bundle-size win**

Include in the final PR description:
- Before: `/dashboard/analytics` First Load JS = 219 kB
- After: `/dashboard/analytics` First Load JS = <measured value> kB
- Delta: <measured delta>
- Task count: 8 code commits + 1 archive commit

---

## Done

Phase 1.5 complete. Eight small commits, one meaningful perf win, one meaningful type-safety win, four follow-ups from Phase 1 review closed. Clean base for Phase 2.

Phase 2 (Grow / Competitors / Settings / Paywall / Trial banner — applying the Phase 1 primitive system to the remaining dashboard pages) is a separate plan to be written after this merges.

---

## Self-review checklist (run before handoff)

- [x] Spec coverage: All 6 final-review follow-ups (`Stars` consolidation, `PlatformBadge` extraction, ConnectedPanel KPI port, `.nav-active-glow` removal, `showStatus` prop, `AXIS_TICK` typing) are mapped to tasks (5, 4, 6, 2, 3, 8). Salvaged patch tasks T8 (html2canvas, Task 7) and T9 (Recharts lazy, Task 9) included. Stale doc archived (Task 1).
- [x] No placeholders: each step has explicit file paths, code blocks for every code change, exact commands with expected output.
- [x] Type consistency: `<Stars>` primitive signature matches across all call sites (Task 5 explicitly verifies). `<PlatformBadge>` exported as default, consistent with other primitives.
- [x] Bite-sized: each task has 4-8 numbered steps. No step is longer than "write code + run check". Most tasks commit in under 15 minutes.
