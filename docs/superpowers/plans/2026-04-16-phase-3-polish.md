# Phase 3: Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Per-surface sweeps that pull every page onto the unified token system, plus code-quality wins (no `: any`, no raw console noise, no dead deps), bundle splits (dynamic recharts), mobile touch-target compliance, and modal ergonomics — with trial-banner copy flipped to loss-aversion phrasing.

**Architecture:** No new entities. We lean on primitives from Phase 1 (`<Input>`, `<Button>`, `<Card>`) and the `useModal` hook from Phase 2. Bundle-splitting uses `next/dynamic` with SSR disabled where appropriate. Touch targets hit via Tailwind's `min-h-[44px] min-w-[44px]` utility combo.

**Tech Stack:** Next.js 14, Tailwind CSS, lucide-react icons, recharts (now code-split), Resend email.

**Prerequisites:** Phase 1 shipped (tokens, shared `<Logo />`, form primitives). Phase 2 shipped (`lib/hooks/useModal.ts`, demo activation, skeletons, paywall-annual default). Phase 2.5 shipped (`hasAccess()` + `CanceledBanner` / `PastDueBanner` in `SubscriptionGateWrapper`).

**Scope reality check:** Before writing this plan, the actual code was inspected. Corrections applied:
- `html2canvas` is a **dead dependency** — it appears in `package.json` but has **zero imports** across the app. It just gets removed.
- `jspdf` is already dynamically imported at `app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx:449`. We leave it alone and note it in the plan so nobody re-splits it.
- `recharts` static imports live in **two files**, not the one the spec mentioned: `AnalyticsClient.tsx:7` and `app/(dashboard)/dashboard/competitors/CompetitorsClient.tsx:14`. `GrowClient.tsx` does **not** import recharts.
- `.claude/worktrees/*` has **2 files tracked in git** and `.claude/` is **not** in `.gitignore`. We clean up and ignore.
- `components/PaywallModal.tsx` already ships a bespoke focus trap + Escape handler inline (lines 14-56). Task 16 replaces it with `useModal()` from Phase 2, deleting the dupe.
- `TrialBanner.tsx` copy is literally `"left in your free trial"` on line 34 — not `"Trial ends in N days"` as the spec implied. Loss-aversion rewrite still applies.

---

## Task 1: Delete stale worktrees from git + add to gitignore

**Files:**
- Delete (tracked): `.claude/worktrees/agent-a711bb36` (and any nested files)
- Delete (tracked): `.claude/worktrees/agent-a94a36cd` (and any nested files)
- Modify: `.gitignore`

- [ ] **Step 1: Confirm what's tracked**

Run:
```bash
git ls-files .claude/worktrees/
```
Expected: a small list (2 entries in the current repo). Copy the list — these are the files we'll remove from the index.

- [ ] **Step 2: Remove worktree directories from git index**

Run:
```bash
git rm -rf --cached .claude/worktrees
rm -rf .claude/worktrees
```

Using `--cached` is not used here — we want them gone from both the index and the working tree. `git rm -rf` removes both.

- [ ] **Step 3: Add `.claude/` exclusion to .gitignore**

Open `.gitignore` and append this block at the end (keep existing contents intact):

```gitignore

# Claude Code local scratch — agent worktrees, local caches, dashboard state.
# The superpowers skill metadata stays with the project; this only ignores
# ephemeral per-session dirs that shouldn't be committed.
.claude/worktrees/
.claude/agent-state/
.superpowers/agent-dashboard/state/
```

- [ ] **Step 4: Verify**

Run:
```bash
git status --short .claude/ .gitignore
```
Expected: `.gitignore` modified, the two `.claude/worktrees/*` paths deleted. No other surprises.

- [ ] **Step 5: Commit**

```bash
git add .gitignore
git add -u .claude/worktrees/
git commit -m "chore: remove committed worktree dirs and ignore .claude/worktrees"
```

---

## Task 2: Extract surface sweep — Settings inline Toggle + cards onto shared primitives

The current `SettingsPageClient.tsx` defines a local `Toggle` component (lines 40-58) and wraps sections in ad-hoc `<div>` card scaffolding with inline `bg-white rounded-2xl border ...` classes. Phase 3 pulls these onto the token-driven `<Card>` and a new shared `<Toggle>`.

**Files:**
- Create: `components/ui/Toggle.tsx`
- Modify: `app/(dashboard)/settings/SettingsPageClient.tsx`

- [ ] **Step 1: Create the shared Toggle**

Create `components/ui/Toggle.tsx`:

```tsx
'use client'

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  /** Used as the toggle's accessible name. Required — screen readers must have a label. */
  ariaLabel: string
}

export default function Toggle({ checked, onChange, disabled, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] items-center ${
        checked ? 'bg-accent' : 'bg-border'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
```

Note two changes from the inline version:
1. **Height 20px track → 24px track, wrapped in a 44×44 tap surface** via `min-h-[44px] min-w-[44px] items-center`. The visual toggle stays compact; only the hit area grows.
2. **`bg-[#D0C9C1]` off-color → `bg-border`** — uses the Phase 1 token (`--border` = `#E4DED8`, close enough to the old `#D0C9C1` and already a defined token). If `bg-border` doesn't read as distinct enough from the page, promote a new `--switch-track` token in Phase 1 globals.css and revisit; do not re-introduce a hex literal here.

- [ ] **Step 2: Replace inline Toggle in Settings**

In `app/(dashboard)/settings/SettingsPageClient.tsx`:

1. Delete the local `Toggle` function (lines ~40-70 — the whole `function Toggle({ checked, onChange, disabled }: ...) { ... }` block).
2. Add import at the top:
   ```tsx
   import Toggle from '@/components/ui/Toggle'
   ```
3. At every `<Toggle ... />` usage site, add the required `ariaLabel` prop describing what the toggle controls. Examples:
   - Reply-preference toggles: `ariaLabel="End replies with your name"`, `ariaLabel="Include business name in replies"`, `ariaLabel="Invite the customer back"`.
   - Email notification toggle: `ariaLabel="Weekly digest emails"`.

Grep `<Toggle` within the file to catch every callsite — add a real, specific label at each.

- [ ] **Step 3: Replace inline card scaffolding with `<Card>`**

Within the same file, scan for inline wrapper divs that look like:

```tsx
<div className="bg-white rounded-2xl border border-[#E4DED8] shadow-card p-6 ...">
```

Replace each with:

```tsx
<Card className="p-6 ...">
```

Add this import at the top:

```tsx
import Card from '@/components/ui/Card'
```

If any wrapper has extra layout classes (`mb-8`, `space-y-6`, etc.), pass them through via the `className` prop. If `<Card>` doesn't already accept `className`, check `components/ui/Card.tsx` — Phase 1 Task 1.3 should have built it to accept one. If it doesn't, add it before proceeding (see `Input.tsx` for the pattern — `className={cn(baseClasses, className)}`).

- [ ] **Step 4: TypeScript + build sanity**

Run:
```bash
npx tsc --noEmit
```
Expected: clean.

Run:
```bash
npm run build
```
Expected: clean.

- [ ] **Step 5: Manual smoke**

Visit `/settings`. Confirm every toggle still works (flip each one, confirm the network request fires and the state persists on reload). Confirm cards look identical to before except for the shadow/radius being token-driven.

- [ ] **Step 6: Commit**

```bash
git add components/ui/Toggle.tsx app/(dashboard)/settings/SettingsPageClient.tsx
git commit -m "refactor(settings): use shared Toggle + Card primitives"
```

---

## Task 3: Landing feature cards — unify radius and shadow

The landing page (`app/page.tsx`) currently has three slightly different feature-card styles. Unify to `rounded-2xl shadow-card` everywhere.

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Grep for card-like wrappers**

Run:
```bash
grep -nE "rounded-(xl|2xl|3xl)" app/page.tsx | grep -iE "feature|card|benefit"
```

Review each match. The goal: every feature-benefit-card uses the same radius and shadow.

- [ ] **Step 2: Unify**

For each card, set:
- Radius: `rounded-2xl`
- Shadow: `shadow-card` (the Phase 1 token — warmer, softer)
- Background: `bg-white`
- Border: `border border-border` (Phase 1 token — `--border` = `#E4DED8`)

If any card uses `rounded-xl` or `rounded-3xl` — change to `rounded-2xl`. If any uses `shadow-none`, `shadow-sm`, `shadow-md`, or a bespoke box-shadow — change to `shadow-card`.

Leave the testimonial cards and pricing cards alone in this task — those are handled by landing-specific work, not the feature-card sweep.

- [ ] **Step 3: Build + visual diff**

Run:
```bash
npm run build
```
Expected: clean.

Load `/` in a browser. Scroll through the feature sections. All feature cards should look consistent side-by-side.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "style(landing): unify feature card radius and shadow"
```

---

## Task 4: Grow tab — align with dashboard token ladder

`app/(dashboard)/dashboard/grow/GrowClient.tsx` uses a different card shadow scale and heading scale than the rest of the dashboard. Align it.

**Files:**
- Modify: `app/(dashboard)/dashboard/grow/GrowClient.tsx`

- [ ] **Step 1: Inspect current state**

Open the file. Note every `shadow-*` class and every heading class (`text-lg`, `text-xl`, `text-2xl`, etc.). Compare against `HomeClient.tsx` for the canonical dashboard style.

- [ ] **Step 2: Align tokens**

Replace any bespoke shadow (e.g., `shadow-[0_8px_24px_rgba(...)]`) with `shadow-card`. Replace any section heading that currently uses a one-off size with the dashboard convention:
- Page H1: `text-[22px] font-semibold text-text-1`
- Section H2: `text-[15px] font-semibold text-text-1`
- Label text: `text-[11px] font-semibold uppercase tracking-[0.12em] text-text-3`

Use the actual values used in `HomeClient.tsx` — if the dashboard convention differs from what's above, match the dashboard, not this plan.

- [ ] **Step 3: Card scaffolding**

Scan for the same inline `<div className="bg-white rounded-2xl border ...">` wrappers as Task 2. Replace with `<Card>` from `components/ui/`.

- [ ] **Step 4: Build**

```bash
npm run build
```
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/dashboard/grow/GrowClient.tsx
git commit -m "style(grow): align with dashboard token ladder"
```

---

## Task 5: HomeClient bespoke buttons → `<Button>`

`HomeClient.tsx` (908 lines) has numerous inline `<button className="...">` calls. The primary ones that should be shared primitives: the "Connect Google" CTA, "Generate reply" CTA, and any "See all" / "Upgrade" buttons that render a branded primary/secondary style.

**Files:**
- Modify: `app/(dashboard)/dashboard/HomeClient.tsx`

- [ ] **Step 1: Identify migration candidates**

Run:
```bash
grep -n '<button' app/(dashboard)/dashboard/HomeClient.tsx
```

For each hit:
- **Migrate** if the button looks like a primary/secondary CTA (filled orange, outlined black, etc.).
- **Leave** if the button is an icon-only control, a chip in a group, or has very specific layout tied to the surrounding panel.

A `<Button>` from `components/ui/Button.tsx` typically supports `variant="primary" | "secondary" | "ghost"` and `size="sm" | "md" | "lg"`. Pick the closest match.

- [ ] **Step 2: Migrate primary CTAs**

Example: if there's an `Upgrade to Pro` button inline, replace:

```tsx
<button
  onClick={handleUpgrade}
  className="px-4 py-2 rounded-xl bg-accent text-white font-semibold ..."
>
  Upgrade to Pro
</button>
```

with:

```tsx
<Button variant="primary" onClick={handleUpgrade}>Upgrade to Pro</Button>
```

Add at the top:

```tsx
import Button from '@/components/ui/Button'
```

If the inline button has additional state (loading, disabled, aria-label), pass it through the `<Button>` prop API. If `<Button>` doesn't support a prop that was inline (e.g. `startIcon`), add it to `components/ui/Button.tsx` rather than reverting to inline.

- [ ] **Step 3: Build + visual diff**

```bash
npm run build
```
Expected: clean.

Open `/dashboard`, walk the page, confirm every migrated button still looks and behaves identically.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Button.tsx app/(dashboard)/dashboard/HomeClient.tsx
git commit -m "refactor(home): use shared Button for dashboard CTAs"
```

---

## Task 6: Icon strokeWidth standardization

Lucide-react icons have inconsistent `strokeWidth` — some are `2` (default), some are `1.5`, some aren't set. Standardize on `1.75` (slightly finer than default, reads well on both mobile and desktop).

**Files:**
- Modify: every file that uses lucide-react icons (dashboard, auth, landing). No file list up front — use grep to find them.

- [ ] **Step 1: Find all lucide imports**

Run:
```bash
grep -rln "from 'lucide-react'" app/ components/ | sort -u
```

- [ ] **Step 2: Sweep each file**

For each file in the list, grep for icon usage:

```bash
grep -nE '<[A-Z][a-zA-Z]+ (className|strokeWidth)' <file>
```

For each lucide-react icon element:
- If it has `strokeWidth={N}`, change to `strokeWidth={1.75}`.
- If it doesn't have `strokeWidth` at all, add `strokeWidth={1.75}`.

Exception: if the icon is explicitly a heavy-weight marker (a filled indicator dot that visually needs more weight), leave it — but that's rare with lucide.

Do **not** touch inline SVG paths (the `<svg><path d="..." /></svg>` elements scattered through the app). Those are handcrafted and removing their `strokeWidth={2}` would be a visual regression. This task is lucide-only.

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: clean.

- [ ] **Step 4: Visual diff**

Load `/`, `/dashboard`, `/settings` and one review-card page. Scan for icons — they should all read consistently. If one stands out as too thin or too heavy, check whether it's a lucide icon (adjust) or an inline SVG (leave).

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "style: standardize lucide-react icon strokeWidth to 1.75"
```

---

## Task 7: EmptyState component + sweep

The dashboard has emoji-only empty states (e.g., `🌱 No reviews yet`). Replace with a structured component: illustration + heading + subtext + optional primary action.

**Files:**
- Create: `components/EmptyState.tsx`
- Modify: every dashboard route that currently has an emoji-only empty state

- [ ] **Step 1: Create the component**

```tsx
// components/EmptyState.tsx
import { ReactNode } from 'react'

interface EmptyStateProps {
  /** The illustration element (lucide icon, custom SVG, or image). */
  icon: ReactNode
  /** Short headline, e.g., "No reviews yet". */
  heading: string
  /** One-sentence explanation of what will appear here and how to get it. */
  body: string
  /** Optional primary action — rendered as a Button. */
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon, heading, body, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6 py-12 rounded-2xl border border-dashed border-border bg-bg"
      role="status"
    >
      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-text-3 mb-4">
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold text-text-1 mb-1">{heading}</h3>
      <p className="text-[13px] text-text-2 max-w-[36ch] mb-4">{body}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl bg-accent text-white font-semibold text-[14px] hover:bg-accent-hover transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Sweep dashboard routes for empty states**

Run:
```bash
grep -rnE '(No reviews|No competitors|No alerts|Nothing here|Empty|no-data)' app/(dashboard)/
```

Review each hit. For each legitimate empty-state surface (one that renders when a list is empty), replace the inline markup with:

```tsx
<EmptyState
  icon={<MessageSquare className="w-6 h-6" strokeWidth={1.75} />}
  heading="No reviews yet"
  body="Once we scrape your Google listing, new reviews will appear here. This usually takes a minute."
  action={{
    label: 'Connect Google',
    onClick: () => router.push('/settings'),
  }}
/>
```

Pick an appropriate lucide icon for each surface (`MessageSquare`, `Users`, `Bell`, `BarChart`, `Zap`). Leave the body copy to the engineer — it should be specific to each surface, one sentence, factual.

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/EmptyState.tsx
git add -u app/(dashboard)/
git commit -m "feat(ui): add EmptyState component and apply across dashboard"
```

---

## Task 8: Remove dead html2canvas dependency

`html2canvas` is in `package.json` (`^1.4.1`) but has zero imports across the app. Remove it. `jspdf` stays — it's already dynamically imported in AnalyticsClient.tsx line 449.

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (regenerated)

- [ ] **Step 1: Confirm zero imports**

Run:
```bash
grep -rn "html2canvas" app/ components/ lib/ 2>/dev/null
```
Expected: no output. If there are imports, **stop** and investigate — don't remove a live dependency.

- [ ] **Step 2: Remove from package.json**

```bash
npm uninstall html2canvas
```

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: clean. If the build fails, something imports html2canvas that grep missed — re-grep with `grep -rn "html2canvas"`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove unused html2canvas dependency"
```

---

## Task 9: Dynamic import recharts

`recharts` is imported statically in two files and ships eagerly:
- `app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx` line 7
- `app/(dashboard)/dashboard/competitors/CompetitorsClient.tsx` line 14

Both files are Analytics-heavy and used by a small fraction of sessions. Dynamic-import the charts so the primary dashboard doesn't pay the recharts cost.

**Files:**
- Modify: `app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx`
- Modify: `app/(dashboard)/dashboard/competitors/CompetitorsClient.tsx`
- Create: `components/charts/LazyRecharts.tsx`

- [ ] **Step 1: Create a dynamic-loader module**

```tsx
// components/charts/LazyRecharts.tsx
'use client'

import dynamic from 'next/dynamic'

// Each chart primitive is dynamically imported. SSR disabled because recharts
// uses window for ResponsiveContainer measurement. Loading fallback matches
// the surrounding dashboard skeleton style.

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="w-full rounded-2xl bg-surface animate-pulse"
      style={{ height }}
      aria-label="Loading chart"
      role="status"
    />
  )
}

export const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
) as typeof import('recharts').LineChart

export const BarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
) as typeof import('recharts').BarChart

export const AreaChart = dynamic(
  () => import('recharts').then((mod) => mod.AreaChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
) as typeof import('recharts').AreaChart

// Sub-components (XAxis, YAxis, Tooltip, Legend, Line, Bar, Area, CartesianGrid, ResponsiveContainer)
// are re-exported directly — they are tiny helper components that live inside a chart parent.
// Only the top-level chart container needs dynamic loading.
export {
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Bar,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
```

The trick: dynamic-import only the top-level `LineChart` / `BarChart` / `AreaChart` containers. The sub-components (`XAxis`, `Line`, `Tooltip`, etc.) re-export statically because (a) they need to be synchronously available to compose inside a chart parent's JSX, and (b) once the parent chart chunk is loaded, all the children are part of that same module — no additional network cost.

This means the recharts module itself is still code-split; it's just that once a user lands on `/analytics`, the whole thing loads once.

- [ ] **Step 2: Update AnalyticsClient.tsx**

Replace line 1-15 recharts import block:

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer /* etc. */ } from 'recharts'
```

with:

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer /* etc. */ } from '@/components/charts/LazyRecharts'
```

Match the exact import set the file was using before — add anything additional to `LazyRecharts.tsx`'s export list if it's missing.

- [ ] **Step 3: Update CompetitorsClient.tsx**

Same swap at the top of the file.

- [ ] **Step 4: Build + bundle check**

```bash
npm run build
```

The Next.js build output prints a table per route. Find the row for `/dashboard/analytics`. The **First Load JS** column should drop noticeably vs. the Phase 2.5 baseline — recharts + d3 together are ~180 kB, so a 120-180 kB drop is expected.

Write down the before/after numbers (from the previous build's terminal scrollback, or run `git stash && npm run build` on the pre-Task-9 state first to capture baseline).

- [ ] **Step 5: Smoke test**

Load `/dashboard/analytics`. Confirm charts still render correctly. Loading state should flash briefly (ChartSkeleton) before the chart paints.

Load `/dashboard/competitors`. Same check.

- [ ] **Step 6: Commit**

```bash
git add components/charts/LazyRecharts.tsx
git add -u app/(dashboard)/dashboard/analytics/ app/(dashboard)/dashboard/competitors/
git commit -m "perf: dynamic-import recharts on analytics + competitors"
```

---

## Task 10: Remove `: any` from AnalyticsClient tooltip

At `app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx` lines 1390 and 1395, the recharts `<Tooltip>` content callback uses `: any` for its args. Replace with the proper recharts `TooltipProps` generic.

**Files:**
- Modify: `app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx`

- [ ] **Step 1: Inspect current code**

The current call looks like:

```tsx
<Tooltip content={({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div>
      {payload.map((p: any, i: number) => (
        // ...
      ))}
    </div>
  )
}} />
```

- [ ] **Step 2: Import TooltipProps**

Add to the top of the file:

```tsx
import type { TooltipProps } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
```

- [ ] **Step 3: Replace the `any` with a proper generic**

```tsx
<Tooltip
  content={({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (!active || !payload?.length) return null
    return (
      <div>
        {payload.map((p, i) => (
          // p is now typed as Payload<ValueType, NameType>
          // ...
        ))}
      </div>
    )
  }}
/>
```

Remove the `: any` at line 1390 and the `: any` at line 1395. Let inference do the rest — `p` will be properly typed.

If the tooltip body touches `p.color`, `p.value`, `p.name`, `p.dataKey` — those are all on the Payload type. If it touches custom fields that you stuffed into the data, they'll need to be asserted narrowly: `(p.payload as MyDataRow).myField`.

- [ ] **Step 4: TypeScript**

```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx
git commit -m "fix(types): replace any in analytics tooltip with TooltipProps"
```

---

## Task 11: `lib/log.ts` helper + scrape-route sweep

There are 118 `console.{log,error,warn,info}` calls across `app/api/`. The noisy ones are in scrape routes (`scrape-reviews`, `scrape-yelp-reviews`, `scrape-tripadvisor-reviews` — 69 calls between the three). A production build should ship zero debug logs; errors stay.

**Files:**
- Create: `lib/log.ts`
- Modify: `app/api/scrape-reviews/route.ts`
- Modify: `app/api/scrape-yelp-reviews/route.ts`
- Modify: `app/api/scrape-tripadvisor-reviews/route.ts`
- Modify: `app/api/find-business-urls/route.ts`
- Modify: `app/api/digest/route.ts` (15 calls — also worth sweeping)

- [ ] **Step 1: Create the helper**

```ts
// lib/log.ts
/**
 * Dev-only logging. Debug calls become no-ops in production builds; errors
 * are always printed so Vercel's log drain captures them.
 *
 * Usage:
 *   import { log } from '@/lib/log'
 *   log.debug('scraper: starting page', { page, url })
 *   log.error('scraper: parse failed', err)
 */

const isProd = process.env.NODE_ENV === 'production'

export const log = {
  debug: (...args: unknown[]): void => {
    if (!isProd) console.log(...args)
  },
  info: (...args: unknown[]): void => {
    if (!isProd) console.info(...args)
  },
  warn: (...args: unknown[]): void => {
    console.warn(...args)
  },
  error: (...args: unknown[]): void => {
    console.error(...args)
  },
}
```

Rationale:
- `debug` / `info` go quiet in prod.
- `warn` / `error` always print — you want those in Vercel logs.

- [ ] **Step 2: Sweep scrape-reviews**

Open `app/api/scrape-reviews/route.ts`. Add at the top:

```ts
import { log } from '@/lib/log'
```

Replace:
- `console.log(...)` → `log.debug(...)`
- `console.info(...)` → `log.info(...)`
- `console.warn(...)` → `log.warn(...)` (no behavior change, but consistency).
- `console.error(...)` → `log.error(...)` (same).

Review each `console.error(err)` — if it includes a full stack trace with PII (request body, user IDs in error messages), consider whether the production log should include it. For now, keep them — Vercel strips most PII at the transport layer, and debugging is more valuable than stripped logs. If you spot a specific log that prints the full request body or Authorization header, remove it.

- [ ] **Step 3: Sweep the other scrape routes**

Same replacement for:
- `app/api/scrape-yelp-reviews/route.ts`
- `app/api/scrape-tripadvisor-reviews/route.ts`
- `app/api/find-business-urls/route.ts`
- `app/api/digest/route.ts`

- [ ] **Step 4: Build**

```bash
npx tsc --noEmit
npm run build
```
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add lib/log.ts app/api/scrape-reviews/route.ts app/api/scrape-yelp-reviews/route.ts app/api/scrape-tripadvisor-reviews/route.ts app/api/find-business-urls/route.ts app/api/digest/route.ts
git commit -m "refactor(logs): route scrape noise through lib/log.ts helper"
```

---

## Task 12: Loss-aversion TrialBanner copy

Current copy at `components/TrialBanner.tsx:33-34`:

```tsx
<span className="font-semibold text-white">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</span>
{' '}left in your free trial
```

This is neutral framing. Loss-aversion reframes to what they'd lose — the AI replies they've generated.

**Files:**
- Modify: `components/TrialBanner.tsx`

- [ ] **Step 1: Update trial-active copy**

Replace lines 32-35 (the active-trial state) with:

```tsx
<p className="text-[13px] text-white/60 truncate">
  <span className="font-semibold text-white">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left</span>
  {' '}to save your AI replies
</p>
```

Rationale: "save your AI replies" triggers loss-aversion — they've already generated replies during the trial; upgrading keeps them. (If the product doesn't persist trial-generated replies, swap "save your AI replies" for "keep replying to customers".)

- [ ] **Step 2: Update expired-trial copy (optional polish)**

Line 53-54 currently:

```tsx
<span className="font-semibold text-white">Trial Ended</span>
<span className="text-white/45 hidden sm:inline"> — upgrade to keep generating replies</span>
```

Leave as-is. "keep generating replies" is already loss-framed. No change needed.

- [ ] **Step 3: TypeScript + build**

```bash
npx tsc --noEmit
npm run build
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/TrialBanner.tsx
git commit -m "copy(trial): reframe banner as loss-aversion"
```

---

## Task 13: Touch targets — reply tone chips, feedback thumbs, regenerate

Current offenders in `components/ReplyGenerator.tsx`:
- Line 307 "Regenerate" button: `min-h-[34px]` — below 44.
- Line 338 tone chips: `py-1.5` (~30px tall) — no min-h.
- Line 356-369 👍/👎 buttons: `p-1.5` (~28px tall × 28px wide) — below 44 in both dimensions.

**Files:**
- Modify: `components/ReplyGenerator.tsx`

- [ ] **Step 1: Regenerate button (line 307)**

Change:

```tsx
className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[#A8A29E] hover:text-[#111111] hover:bg-[#F8F6F3] border border-transparent hover:border-[#E4DED8] disabled:opacity-40 transition-all min-h-[34px]"
```

to:

```tsx
className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-text-3 hover:text-text-1 hover:bg-surface border border-transparent hover:border-border disabled:opacity-40 transition-all min-h-[44px]"
```

Two changes: bumped `min-h-[34px]` → `min-h-[44px]`, and token-ified the colors (part of Phase 1 debt sweeping through).

- [ ] **Step 2: Tone chips (line 332-346)**

Replace the entire chip block with a wrapped `role="radiogroup"` version with 44-height chips:

```tsx
<div
  className="flex gap-1.5 flex-wrap"
  role="radiogroup"
  aria-label="Reply tone"
>
  {TONES.map(({ value, label }) => (
    <button
      key={value}
      role="radio"
      aria-checked={activeTone === value}
      onClick={() => handleGenerate(value)}
      disabled={loading}
      className={`px-3 rounded-lg text-[12px] font-medium transition-all active:scale-[0.97] disabled:opacity-40 min-h-[44px] inline-flex items-center ${
        activeTone === value
          ? 'bg-accent text-white border border-accent'
          : 'bg-bg text-text-2 border border-border hover:bg-surface'
      }`}
    >
      {label}
    </button>
  ))}
</div>
```

Changes:
1. Removed `py-1.5`, added `min-h-[44px] inline-flex items-center`.
2. Added `role="radiogroup"` on wrapper and `role="radio"` / `aria-checked` on chips — this is tone selection, which is semantically a single-select radio group.
3. Token-ified colors (`bg-accent`, `bg-surface`, `text-text-2`, etc.) — reuses Phase 1 tokens.

- [ ] **Step 3: Feedback thumbs (lines 354-369)**

Replace both thumb buttons:

```tsx
<button
  onClick={() => handleFeedback('good')}
  aria-label="Mark this reply as good"
  aria-pressed={feedback === 'good'}
  className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-all ${
    feedback === 'good' ? 'bg-emerald-50 text-emerald-600' : 'text-text-3 hover:text-emerald-600 hover:bg-emerald-50'
  }`}
>
  <svg className="w-4 h-4" fill={feedback === 'good' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
  </svg>
</button>
<button
  onClick={() => handleFeedback('bad')}
  aria-label="Mark this reply as bad"
  aria-pressed={feedback === 'bad'}
  className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-all ${
    feedback === 'bad' ? 'bg-red-50 text-red-500' : 'text-text-3 hover:text-red-500 hover:bg-red-50'
  }`}
>
  {/* same svg as before */}
</button>
```

Changes:
1. `p-1.5` → `min-h-[44px] min-w-[44px] flex items-center justify-center`.
2. Added `aria-label` and `aria-pressed` — icon-only buttons need accessible names.
3. Token-ified the default text color.

- [ ] **Step 4: Build**

```bash
npm run build
```
Expected: clean.

- [ ] **Step 5: Mobile smoke**

In a mobile-width browser preview (or dev tools viewport = 390×844 iPhone 14), load a review card with the ReplyGenerator. Tap each: tone chip, 👍, 👎, regenerate. All should be comfortable, not fingertip-hostile.

- [ ] **Step 6: Commit**

```bash
git add components/ReplyGenerator.tsx
git commit -m "a11y(reply): enforce 44px touch targets + radiogroup semantics"
```

---

## Task 14: Touch targets — Star-filter pills, Reviews tabs, Settings tab bar

Same treatment as Task 13, applied across the other tap-heavy surfaces.

**Files:**
- Modify: `app/(dashboard)/dashboard/reviews/*` (ReviewsClient or equivalent — find it)
- Modify: `app/(dashboard)/settings/SettingsPageClient.tsx` (the tab bar if present)

- [ ] **Step 1: Find the files**

```bash
grep -rnE 'star.*filter|tabs?.*bar|starfilter|rating filter' app/(dashboard)/
```

Review the hits. The star-filter pills are typically in the Reviews page header; the Settings tab bar is at the top of `SettingsPageClient.tsx`.

- [ ] **Step 2: Star-filter pills**

For each pill button, ensure:
- `min-h-[44px]` on the element (usually `<button>`).
- `min-w-[44px]` if the content is narrow (e.g., a single star icon).
- `inline-flex items-center` if adding min-h to a non-flex element.

- [ ] **Step 3: Reviews tabs**

For each tab `<button>` or `<a>`:
- `min-h-[44px]`
- `inline-flex items-center`
- Adequate horizontal padding (`px-4`) so the hitbox extends beyond the label.

- [ ] **Step 4: Settings tab bar (if present)**

Same treatment.

- [ ] **Step 5: Build + mobile smoke**

```bash
npm run build
```

Mobile viewport, tap each target. Confirm no cramped tap zones.

- [ ] **Step 6: Commit**

```bash
git add -u
git commit -m "a11y: enforce 44px touch targets on review/settings controls"
```

---

## Task 15: Competitors table — sticky "You" column on mobile

`app/(dashboard)/dashboard/competitors/CompetitorsClient.tsx` renders a wide table that horizontally scrolls on mobile. The "You" row (first row) should stick to the left edge so the user always sees their own column while scrolling through competitor metrics.

**Files:**
- Modify: `app/(dashboard)/dashboard/competitors/CompetitorsClient.tsx`

- [ ] **Step 1: Find the table**

Grep for `<table` or `<tr` in the file. Locate the "You" row — typically a `<tr>` with a class or a data attribute marking it as the user's own business.

- [ ] **Step 2: Apply sticky column styling**

In the table wrapper, confirm horizontal scroll is enabled:

```tsx
<div className="overflow-x-auto">
  <table className="min-w-full">
```

For the `<th>` of the first column (usually "Business name" or similar) and the first `<td>` of each row, add:

```tsx
className="sticky left-0 z-10 bg-white"
```

For the "You" row's first cell specifically, reinforce the sticky background:

```tsx
className="sticky left-0 z-10 bg-accent/5 border-r border-accent/20"
```

This keeps the user's label and current score visible as they scroll right through competitor columns.

- [ ] **Step 3: Build + mobile smoke**

```bash
npm run build
```

Mobile viewport. Open `/dashboard/competitors`. Scroll horizontally — the first column stays pinned. The user's row has a subtle accent tint so it's findable.

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/dashboard/competitors/CompetitorsClient.tsx
git commit -m "mobile(competitors): sticky first column for your-own-row context"
```

---

## Task 16: Wire useModal into PaywallModal and Nav drawer

`components/PaywallModal.tsx` ships a bespoke focus-trap + Escape handler inline (lines 14-56). `components/Nav.tsx` has a mobile drawer that (per Phase 2 prep) already has scroll lock but not Escape.

Replace both inline implementations with `useModal()` from Phase 2. Deletes ~40 lines of duplicated logic per site.

**Files:**
- Modify: `components/PaywallModal.tsx`
- Modify: `components/Nav.tsx`

- [ ] **Step 1: PaywallModal — swap in useModal**

Open `components/PaywallModal.tsx`.

Delete lines 14-56 (the `modalRef` ref, the Focus trap + Escape `useEffect`, and related boilerplate).

Add at the top:

```tsx
import { useModal } from '@/lib/hooks/useModal'
```

Use the hook:

```tsx
export default function PaywallModal({ onClose }: PaywallModalProps) {
  const [plan, setPlan] = useState<'annual' | 'monthly'>('annual') // Phase 2 default
  const [loading, setLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  const { containerRef } = useModal({
    open: true,
    onClose: onClose ?? (() => {}),
  })

  // ... rest of logic
```

Update the modal root JSX:

```tsx
<div
  ref={containerRef}
  role="dialog"
  aria-modal="true"
  aria-labelledby="paywall-title"
  tabIndex={-1}
  className="... existing classes ... pb-[env(safe-area-inset-bottom)]"
>
```

Add `pb-[env(safe-area-inset-bottom)]` so iPhone bottom-notch doesn't eat the CTA. Add an `id="paywall-title"` to the heading element the aria-labelledby points at.

- [ ] **Step 2: Nav drawer — swap in useModal**

Open `components/Nav.tsx`. Find the mobile drawer JSX (look for `role="dialog"` or the hamburger-toggled panel).

If the drawer already has a `useEffect` managing body scroll lock (Phase 2 said it did), delete it. Add `useModal` at the top of the component:

```tsx
import { useModal } from '@/lib/hooks/useModal'

// inside the component:
const [mobileOpen, setMobileOpen] = useState(false)
const { containerRef } = useModal({
  open: mobileOpen,
  onClose: () => setMobileOpen(false),
  disableFocusTrap: false,
})
```

Wire `ref={containerRef}` to the drawer root div.

- [ ] **Step 3: TypeScript + build**

```bash
npx tsc --noEmit
npm run build
```
Expected: clean.

- [ ] **Step 4: Keyboard smoke**

Open `/dashboard` on desktop. Trigger the paywall (simulate expired trial). Press Tab — focus should cycle within the modal. Press Escape — modal closes.

Open the mobile drawer (shrink viewport, tap hamburger). Press Escape — drawer closes. Tab cycles within drawer.

- [ ] **Step 5: Commit**

```bash
git add components/PaywallModal.tsx components/Nav.tsx
git commit -m "refactor(modals): route PaywallModal and Nav drawer through useModal"
```

---

## Task 17: Fix 200+ vs 500+ testimonial count contradiction

The landing page says "Trusted by 200+ local businesses" at line 656 and "500+ local businesses" at line 811. Pick one.

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Decide the number**

Pick the defensible number. If neither is true, use the honest number or remove the claim.

For this plan: assume we don't yet have 200+ paying customers. Replace both with a non-numeric trust signal.

- [ ] **Step 2: Rewrite line 656**

Change:

```tsx
<p className="text-[13px] font-semibold text-[#57534E]">Trusted by 200+ local businesses</p>
```

to:

```tsx
<p className="text-[13px] font-semibold text-[#57534E]">Built for local businesses that care what customers say</p>
```

- [ ] **Step 3: Rewrite line 811**

Change:

```tsx
<span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">500+ local businesses</span>
```

to:

```tsx
<span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">Local businesses, real replies</span>
```

If the user prefers to keep a number, change both lines to the **same** real number. Do not use a larger number than the smaller one in the previous copy (don't go from 200 to 500) unless the number is true.

- [ ] **Step 4: Testimonials section — real or removed**

Scan `app/page.tsx` for the testimonials section (grep for quote marks, `testimonial`, or placeholder names like "Sarah" / "John"). If the section contains fabricated testimonials (made-up names and quotes), either:

a) **Remove the section entirely** until real testimonials are available.
b) **Keep the section but mark it clearly** as "sample replies" or "example outcomes" — not attributed to real customers.

For this plan, default to option (a): remove the fabricated-testimonial block.

Explicit change: delete the `<section>` that contains the fake testimonials. Keep the rest of the landing page intact.

- [ ] **Step 5: Build**

```bash
npm run build
```
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "copy(landing): fix trust-number contradiction, drop fake testimonials"
```

---

## Task 18: Phase 3 Verification Gate

This task does not ship new code. It validates the phase before cutting a PR.

- [ ] **Step 1: TypeScript compile clean**

```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 2: Production build clean**

```bash
npm run build
```
Expected: zero errors, zero warnings about missing deps, zero console deprecation noise.

- [ ] **Step 3: First Load JS — measure the win**

In the build output, find these route rows and record the First Load JS:

| Route | Phase 2.5 baseline | Phase 3 target | Actual |
|---|---|---|---|
| `/dashboard/analytics` | (write it down) | baseline − 120-180 kB | |
| `/dashboard/competitors` | (write it down) | baseline − 100-150 kB | |
| `/dashboard` | (write it down) | no significant change | |

If the drops are less than half the expected range, the dynamic imports in Task 9 may be falling back to a static chunk. Inspect `.next/analyze/` (if bundle analyzer is installed) or rebuild with `ANALYZE=true` to confirm the recharts chunk is isolated.

- [ ] **Step 4: Lighthouse pass on desktop Chrome**

Open `/dashboard` in incognito. Run Lighthouse → Performance + Accessibility. Targets:
- Performance ≥ 85
- Accessibility ≥ 95
- Best Practices ≥ 95
- SEO ≥ 95

If Accessibility drops below 95, note which audit failed and fix before merging. The most common Phase 3 regressions: missing `aria-label` on a new icon button, color contrast on tokens (Phase 1 should have covered this — re-check if it surfaces here).

- [ ] **Step 5: Mobile smoke — real device preferred**

On a real iPhone (or Chrome DevTools set to iPhone 14, throttled to Fast 3G):

1. Load `/` — no horizontal scroll, no cramped tap targets in the hero CTA.
2. Load `/signup` — inputs don't zoom on focus (Phase 1 verifies this, but re-check).
3. Load `/dashboard` — stat tiles have skeleton (Phase 2), the nav drawer opens, Escape closes it.
4. Load `/dashboard/competitors` — horizontal scroll works, first column sticks.
5. Load `/dashboard/reviews` — tap a reply tone chip, 👍, 👎, regenerate. All comfortable.
6. Trigger the paywall (set `is_paid = false` and `trial_ends_at` in the past on a test account). Modal opens, Escape closes, Tab cycles within.

- [ ] **Step 6: Bundle analyzer (optional, nice-to-have)**

If `@next/bundle-analyzer` is easy to add:

```bash
npm install --save-dev @next/bundle-analyzer
```

Add to `next.config.js`:

```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' })
module.exports = withBundleAnalyzer({ /* existing config */ })
```

Run `ANALYZE=true npm run build`. Confirm recharts is in its own chunk (not in the shared framework chunk) and that the chunk is only loaded by `/dashboard/analytics` and `/dashboard/competitors`.

If the analyzer shows recharts still bundled into the main dashboard chunk, the dynamic imports in Task 9 need to be revisited — possibly the wrapper module is being statically imported somewhere it shouldn't be.

- [ ] **Step 7: Final commit**

No code changes in this task — just verification. Do not create an empty commit.

---

## Phase 3 done — summary of what shipped

| Area | Deliverable |
|---|---|
| Hygiene | `.claude/worktrees` deleted + gitignored; dead `html2canvas` dependency removed |
| Surface sweep | Settings cards on `<Card>`, shared `<Toggle>` primitive, landing feature cards unified, Grow tab aligned, HomeClient buttons on `<Button>` |
| Icon consistency | lucide strokeWidth standardized at 1.75 |
| Empty states | `<EmptyState>` component + sweep across dashboard |
| Bundle | recharts dynamic-imported — `/dashboard/analytics` and `/dashboard/competitors` drop ~120-180 kB First Load JS |
| Code quality | `any` removed from analytics tooltip, `lib/log.ts` routing scrape noise silently in prod |
| Copy | TrialBanner reframed to loss-aversion; 200+/500+ contradiction resolved; fabricated testimonials removed |
| Touch targets | Tone chips, thumbs, regenerate, star-filters, review tabs, settings tabs all ≥ 44×44 |
| Mobile | Competitors table first-column sticky for horizontal-scroll context |
| Modals | PaywallModal + Nav drawer wired through `useModal` — scroll lock, Escape, focus trap, safe-area bottom padding, focus return |

At this point the four phases are fully shipped. The user can open a single PR per phase, or one rollup PR. Either way, the design spec is fulfilled.
