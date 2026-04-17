# Phase 3: Polish — Patch-Ready Execution Doc

**For Josh.** Work through this top to bottom. Each section is one commit. Apply → `npx tsc --noEmit` → (optional `npm run build`) → commit with the suggested message → move on.

**Already committed this session:**

| SHA | Task | Message |
|---|---|---|
| `212083f` | P2.5-T10 | feat(subscription): centralize access decisions in hasAccess() |
| `a49e2cc` | P3-T1 | chore: remove committed worktree dirs and ignore .claude/worktrees |
| `d913b99` | P3-T2 | refactor(settings): use shared Toggle + Card primitives |
| `8ea315c` | P3-T3 | style(landing): unify feature card radius and shadow |
| `a8af914` | P3-T4 | style(grow): align with dashboard token ladder |

**In-flight (uncommitted) in worktree:** `app/(dashboard)/dashboard/HomeClient.tsx` — `Button` import added (line 8); Connect CTA migrated (~lines 390-400). Two CTAs still inline. Finish in T5 below.

**Verification gate between tasks:** after applying a section and before committing, run:

```bash
npx tsc --noEmit
```

If it's clean, commit. If it errors, look at the error, not the patch — the patches below assume the files match the state on branch `feature/website-polish` HEAD + the in-flight HomeClient edit described above.

---

## T5 (finish): HomeClient bespoke buttons → `<Button>`

**Two remaining migrations:** Generate Reply (line ~561) and Sync Reviews (~line 781). Leave the "View Reviews" `<Link>` and the copied-state Approve button alone — both have conditional styling too tangled for a clean primitive migration.

**File:** `app/(dashboard)/dashboard/HomeClient.tsx`

### Patch A — Generate Reply

**Find this block** (currently at lines 561-567):

```tsx
        <button
          onClick={onGenerate}
          disabled={loading || !review.trim()}
          className="w-full py-2.5 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(224,90,40,0.2)] hover:shadow-[0_4px_14px_rgba(224,90,40,0.3)]"
        >
          {loading ? <><svg className="animate-spin w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Generating…</> : <><svg className="w-3.5 h-3.5 opacity-70" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>Generate Reply</>}
        </button>
```

**Replace with:**

```tsx
        <Button
          variant="accent"
          onClick={onGenerate}
          disabled={loading || !review.trim()}
          loading={loading}
          className="w-full h-auto py-2.5 text-[13px] font-semibold gap-2 shadow-[0_2px_8px_rgba(224,90,40,0.2)] hover:shadow-[0_4px_14px_rgba(224,90,40,0.3)] active:scale-[0.98]"
        >
          {loading ? 'Generating…' : (
            <>
              <svg className="w-3.5 h-3.5 opacity-70" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>
              Generate Reply
            </>
          )}
        </Button>
```

**Notes:**
- `loading={loading}` lets Button render its built-in spinner, so the inline `<svg className="animate-spin …>` is dropped.
- `h-auto` overrides Button's fixed size-height so `py-2.5` takes effect.
- `variant="accent"` maps to the orange background.

### Patch B — Sync Reviews

**Find this block** (currently at lines 781-784):

```tsx
              <button onClick={handleSync} disabled={syncing} className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] text-white text-[13px] font-semibold shadow-[0_2px_8px_rgba(224,90,40,0.2)] active:scale-[0.97] disabled:opacity-50 transition-all duration-200 whitespace-nowrap">
                <svg className={`w-4 h-4 flex-shrink-0 transition-transform duration-700 ${syncing ? 'animate-spin' : 'group-hover:rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                {syncing ? 'Syncing…' : 'Sync Reviews'}
              </button>
```

**Replace with:**

```tsx
              <Button
                variant="accent"
                onClick={handleSync}
                disabled={syncing}
                className="group h-auto px-5 py-2.5 text-[13px] font-semibold gap-2.5 shadow-[0_2px_8px_rgba(224,90,40,0.2)] active:scale-[0.97] whitespace-nowrap"
              >
                <svg className={`w-4 h-4 flex-shrink-0 transition-transform duration-700 ${syncing ? 'animate-spin' : 'group-hover:rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                {syncing ? 'Syncing…' : 'Sync Reviews'}
              </Button>
```

**Notes:**
- We deliberately do **not** pass `loading={syncing}`. The custom sync icon's `group-hover:rotate-180` + `animate-spin-when-syncing` dance is more meaningful than Button's generic spinner. Keep the icon as child content.
- `group` class stays on the root so `group-hover:rotate-180` keeps working.

### Commit

```bash
npx tsc --noEmit
git add "app/(dashboard)/dashboard/HomeClient.tsx"
git commit -m "refactor(home): use shared Button for dashboard CTAs"
```

---

## T6: Icon strokeWidth standardization to 1.75

**Goal:** every `lucide-react` icon in `app/` and `components/` has `strokeWidth={1.75}`. Inline `<svg>` / `<path>` elements are NOT touched.

### Step 1 — find every file that imports from lucide-react

```bash
grep -rln "from 'lucide-react'" app/ components/ | sort -u > /tmp/lucide-files.txt
cat /tmp/lucide-files.txt
```

### Step 2 — per file, patch each lucide usage

In each file, for every lucide icon element:

- If it already has `strokeWidth={2}` or `strokeWidth={1.5}`: change the number to `1.75`.
- If it has `strokeWidth="2"` (string): change to `strokeWidth={1.75}`.
- If it has no `strokeWidth` prop at all: add `strokeWidth={1.75}` after `className`.

**Example before:**

```tsx
import { ChevronRight, Plus } from 'lucide-react'
// ...
<ChevronRight className="w-4 h-4" />
<Plus className="w-5 h-5" strokeWidth={2} />
```

**Example after:**

```tsx
import { ChevronRight, Plus } from 'lucide-react'
// ...
<ChevronRight className="w-4 h-4" strokeWidth={1.75} />
<Plus className="w-5 h-5" strokeWidth={1.75} />
```

### Step 3 — sanity-check you didn't touch raw SVGs

```bash
# This should show 0 hits with "strokeWidth" near a raw <svg> tag:
grep -rnE '<svg[^>]*>[^<]*<path[^>]*strokeWidth=\{1.75\}' app/ components/
```

If it matches anything, revert those — raw SVGs use their own stroke widths and changing them is a visual regression.

### Step 4 — commit

```bash
npx tsc --noEmit
git add -u app/ components/
git commit -m "style: standardize lucide-react icon strokeWidth to 1.75"
```

---

## T7: `components/EmptyState.tsx` + dashboard sweep

### Step 1 — create the component

Create new file `components/EmptyState.tsx`:

```tsx
import { ReactNode } from 'react'

interface EmptyStateProps {
  /** The illustration element (lucide icon, custom SVG, or image). */
  icon: ReactNode
  /** Short headline, e.g., "No reviews yet". */
  heading: string
  /** One-sentence explanation of what will appear here and how to get it. */
  body: string
  /** Optional primary action — rendered as a button. */
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon, heading, body, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6 py-12 rounded-2xl border border-dashed border-border bg-[#FAFAF8]"
      role="status"
    >
      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#A8A29E] mb-4 border border-border">
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold text-[#111111] mb-1">{heading}</h3>
      <p className="text-[13px] text-[#57534E] max-w-[36ch] mb-4">{body}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl bg-accent text-white font-semibold text-[14px] hover:bg-accent/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
```

### Step 2 — find dashboard empty states

```bash
grep -rnE '(No reviews|No competitors|No alerts|Nothing here|no-data|text-[0-9]+xl">🌱|text-[0-9]+xl">📭)' "app/(dashboard)/"
```

For each legit empty-state surface, replace the inline emoji+text block with an `<EmptyState>` import. Use judgement on the copy — the plan suggests one sentence per surface that says what will appear and how to trigger it.

**Typical replacement** (adapt `icon`, `heading`, `body`, `action` to the surface):

```tsx
import EmptyState from '@/components/EmptyState'
import { MessageSquare } from 'lucide-react'
// ...
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

Icon map suggestions:
- Reviews: `MessageSquare`
- Competitors: `Users`
- Alerts: `Bell`
- Analytics: `BarChart`
- Social: `Zap`

### Step 3 — commit

```bash
npx tsc --noEmit
git add components/EmptyState.tsx
git add -u "app/(dashboard)/"
git commit -m "feat(ui): add EmptyState component and apply across dashboard"
```

---

## T8: Remove dead html2canvas

```bash
# Sanity — confirm zero imports (should print nothing):
grep -rn "html2canvas" app/ components/ lib/ 2>/dev/null

# Remove:
npm uninstall html2canvas

# Verify build still works:
npm run build

# Commit:
git add package.json package-lock.json
git commit -m "chore: remove unused html2canvas dependency"
```

If `grep` returns hits, **stop and investigate** — something actually uses it and we'd be breaking a feature.

---

## T9: Dynamic-import recharts

### Step 1 — create `components/charts/LazyRecharts.tsx`

```tsx
'use client'

import dynamic from 'next/dynamic'

// Each chart primitive is dynamically imported. SSR disabled because recharts
// uses window for ResponsiveContainer measurement. Loading fallback matches
// the surrounding dashboard skeleton style.

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="w-full rounded-2xl bg-[#F3F0EC] animate-pulse"
      style={{ height }}
      aria-label="Loading chart"
      role="status"
    />
  )
}

export const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
) as unknown as typeof import('recharts').LineChart

export const BarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
) as unknown as typeof import('recharts').BarChart

export const AreaChart = dynamic(
  () => import('recharts').then((mod) => mod.AreaChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
) as unknown as typeof import('recharts').AreaChart

// Sub-components re-export statically — once the parent chart chunk loads,
// these come with it. Only the top-level chart containers need dynamic loading.
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

### Step 2 — swap the import in AnalyticsClient

**File:** `app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx`

On line 7 (the recharts import), change:

```tsx
} from 'recharts'
```

to:

```tsx
} from '@/components/charts/LazyRecharts'
```

The named imports on the same line stay the same. If the file also imports `PieChart`, `Pie`, `Cell`, or any other top-level chart type that's NOT in the `export const ... dynamic(...)` block above, **add a dynamic entry for it in `LazyRecharts.tsx`** before saving — otherwise the re-export pattern silently re-bundles it statically.

### Step 3 — swap the import in CompetitorsClient

**File:** `app/(dashboard)/dashboard/competitors/CompetitorsClient.tsx`

Same swap on line 14: `'recharts'` → `'@/components/charts/LazyRecharts'`.

### Step 4 — build + capture bundle numbers

```bash
# Capture the baseline first (stash the LazyRecharts swap), if you want clean before/after:
git stash
npm run build   # note /dashboard/analytics and /dashboard/competitors First Load JS
git stash pop
npm run build   # note same routes — should drop 100-180 kB
```

### Step 5 — commit

```bash
git add components/charts/LazyRecharts.tsx
git add -u "app/(dashboard)/dashboard/analytics/" "app/(dashboard)/dashboard/competitors/"
git commit -m "perf: dynamic-import recharts on analytics + competitors"
```

---

## T10: Remove `: any` from AnalyticsClient tooltip

**File:** `app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx`

### Step 1 — add the type imports

At the top of the file, add:

```tsx
import type { TooltipProps } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
```

### Step 2 — patch line 1390

Find the existing tooltip content callback signature (was `({ active, payload, label }: any)`). Change to:

```tsx
content={({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
```

### Step 3 — patch line 1395

Inside that callback, find `payload.map((p: any, i: number) => ...)` (or similar). Change to:

```tsx
payload.map((p, i) => {
```

TypeScript will infer `p` as the recharts Payload type. If the body reads `p.payload.<customField>`, narrow with an assertion:

```tsx
const row = p.payload as { myField: string; otherField: number }
```

### Step 4 — tsc + commit

```bash
npx tsc --noEmit
git add "app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx"
git commit -m "fix(types): replace any in analytics tooltip with TooltipProps"
```

---

## T11: `lib/log.ts` helper + scrape-route sweep

### Step 1 — create `lib/log.ts`

```ts
/**
 * Dev-only logging. debug/info become no-ops in production; warn/error always
 * print so Vercel's log drain captures them.
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

### Step 2 — per-file sweep

For each file below:

1. Add `import { log } from '@/lib/log'` at the top.
2. Replace `console.log` → `log.debug`.
3. Replace `console.info` → `log.info`.
4. Replace `console.warn` → `log.warn`.
5. Replace `console.error` → `log.error`.

**Files:**
- `app/api/scrape-reviews/route.ts`
- `app/api/scrape-yelp-reviews/route.ts`
- `app/api/scrape-tripadvisor-reviews/route.ts`
- `app/api/find-business-urls/route.ts`
- `app/api/digest/route.ts`

**Speedup:** in each file, `sed` or a multi-file editor find/replace with these four pairs works. Just keep them scoped to this file set — other API routes may have console calls that are intentional (e.g., webhook deadletter logging).

If a `console.error(err)` prints a full request body, Authorization header, or secret — **delete that log entirely** rather than swap to `log.error`.

### Step 3 — verify + commit

```bash
npx tsc --noEmit
npm run build
git add lib/log.ts app/api/scrape-reviews/route.ts app/api/scrape-yelp-reviews/route.ts app/api/scrape-tripadvisor-reviews/route.ts app/api/find-business-urls/route.ts app/api/digest/route.ts
git commit -m "refactor(logs): route scrape noise through lib/log.ts helper"
```

---

## T12: TrialBanner loss-aversion copy

**File:** `components/TrialBanner.tsx`

### Patch — line 33-34 area

Find (inside the active-trial branch):

```tsx
<span className="font-semibold text-white">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</span>
{' '}left in your free trial
```

Replace with:

```tsx
<span className="font-semibold text-white">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left</span>
{' '}to save your AI replies
```

Leave the expired-trial branch (line ~53-54) alone — "upgrade to keep generating replies" is already loss-framed.

### Commit

```bash
npx tsc --noEmit
git add components/TrialBanner.tsx
git commit -m "copy(trial): reframe banner as loss-aversion"
```

---

## T13: Reply touch targets

**File:** `components/ReplyGenerator.tsx`

### Patch A — Regenerate button (around line 307)

Change `min-h-[34px]` → `min-h-[44px]` (one character substitution). Everything else on that className stays.

Optionally, while you're in the file, replace hex literals in the regenerate button's className with tokens:

- `text-[#A8A29E]` → `text-[#A8A29E]` (leave — Phase 1 didn't tokenize this specific shade)
- If you want to be thorough: leave as-is for this task; that's Phase 1 scope creep.

### Patch B — Tone chips (around lines 332-346)

Find the chip map. Replace the outer wrapper + chip block with:

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
          ? 'bg-[#E05A28] text-white border border-[#E05A28]'
          : 'bg-white text-[#57534E] border border-[#E4DED8] hover:bg-[#F8F6F3]'
      }`}
    >
      {label}
    </button>
  ))}
</div>
```

If the existing code uses a different loop variable shape (`TONES` may destructure differently), keep the existing destructure — only the `role`, `aria-checked`, and className changes are what this task ships.

### Patch C — Feedback thumbs (around lines 354-369)

Find the 👍 button. Replace its className and add aria attrs:

```tsx
<button
  onClick={() => handleFeedback('good')}
  aria-label="Mark this reply as good"
  aria-pressed={feedback === 'good'}
  className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-all ${
    feedback === 'good' ? 'bg-emerald-50 text-emerald-600' : 'text-[#A8A29E] hover:text-emerald-600 hover:bg-emerald-50'
  }`}
>
  {/* existing <svg> stays exactly as-is */}
</button>
```

Same for the 👎 button — swap `good` for `bad`, `emerald` for `red-500`/`red-50`, and update aria-label.

### Commit

```bash
npx tsc --noEmit
git add components/ReplyGenerator.tsx
git commit -m "a11y(reply): enforce 44px touch targets + radiogroup semantics"
```

---

## T14: Star-filter pills, Reviews tabs, Settings tab bar

**Procedure (not a single diff — find the surfaces, apply the same pattern):**

```bash
# Find candidates:
grep -rnE '(star.*filter|rating.*filter|starfilter)' "app/(dashboard)/"
grep -rnE 'tab.*bar|role="tab"|aria-selected' "app/(dashboard)/"
```

For every `<button>` or `<a>` that serves as a star-filter pill or tab button:

1. Add `min-h-[44px]` to the className.
2. If it's icon-only (narrow content), add `min-w-[44px]`.
3. If the element isn't already a flex container, add `inline-flex items-center`.
4. Make sure horizontal padding (`px-4` or similar) is present so the hit zone extends beyond the label.

**Typical before:**

```tsx
<button className="px-3 py-1.5 rounded-full text-[13px] ..." />
```

**Typical after:**

```tsx
<button className="inline-flex items-center px-3 min-h-[44px] rounded-full text-[13px] ..." />
```

(You're dropping `py-1.5` because `min-h-[44px] items-center` takes over.)

### Commit

```bash
npx tsc --noEmit
git add -u "app/(dashboard)/"
git commit -m "a11y: enforce 44px touch targets on review/settings controls"
```

---

## T15: Competitors — sticky "You" column

**File:** `app/(dashboard)/dashboard/competitors/CompetitorsClient.tsx`

### Step 1 — inspect the table

Grep for `<table`, `<thead`, `<tr`, and a row marker like `isOwn`, `isUser`, or `userId === ...` to find the row representing the user's business.

### Step 2 — wrapper

Confirm the table is wrapped in an overflow-x-auto container:

```tsx
<div className="overflow-x-auto">
  <table className="min-w-full">
    {/* ... */}
  </table>
</div>
```

If not, add that wrapper.

### Step 3 — sticky first column

On the first-column `<th>` (header) add:

```tsx
className="sticky left-0 z-10 bg-white"
```

On the first `<td>` of each body row (except the user row) add:

```tsx
className="sticky left-0 z-10 bg-white"
```

On the user's first `<td>` specifically:

```tsx
className="sticky left-0 z-10 bg-[#E05A28]/5 border-r border-[#E05A28]/20"
```

### Commit

```bash
npx tsc --noEmit
git add "app/(dashboard)/dashboard/competitors/CompetitorsClient.tsx"
git commit -m "mobile(competitors): sticky first column for your-own-row context"
```

---

## T16: `useModal` in PaywallModal + Nav drawer

### Step 1 — PaywallModal

**File:** `components/PaywallModal.tsx`

Delete lines 14-56 (the bespoke `modalRef` + focus trap `useEffect` + Escape handler). You should be removing roughly the code between the component's first `useState` and the start of the return-JSX.

Add near the top:

```tsx
import { useModal } from '@/lib/hooks/useModal'
```

Inside the component, after the existing `useState` calls:

```tsx
const { containerRef } = useModal({
  open: true,
  onClose: onClose ?? (() => {}),
})
```

On the root modal `<div>` of the returned JSX:

1. Add `ref={containerRef}`.
2. Ensure these attrs are present: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="paywall-title"`, `tabIndex={-1}`.
3. Append `pb-[env(safe-area-inset-bottom)]` to the existing className.
4. On the heading element inside the modal (the `<h2>` or `<h3>` that names the modal), add `id="paywall-title"`.

### Step 2 — Nav drawer

**File:** `components/Nav.tsx`

Find the mobile drawer JSX (usually a conditionally-rendered panel gated by a `mobileOpen` / `menuOpen` state). If there's an existing `useEffect` for body scroll lock or Escape, delete it.

Add at the top:

```tsx
import { useModal } from '@/lib/hooks/useModal'
```

Inside the component:

```tsx
const { containerRef } = useModal({
  open: mobileOpen,
  onClose: () => setMobileOpen(false),
})
```

(Use whatever the actual state variable is named — `mobileOpen` / `menuOpen` / `isOpen`.)

Wire `ref={containerRef}` to the drawer's root div.

### Commit

```bash
npx tsc --noEmit
npm run build
git add components/PaywallModal.tsx components/Nav.tsx
git commit -m "refactor(modals): route PaywallModal and Nav drawer through useModal"
```

---

## T17: Landing testimonial contradiction

**File:** `app/page.tsx`

### Patch A — line 656 area

Find:

```tsx
<p className="text-[13px] font-semibold text-[#57534E]">Trusted by 200+ local businesses</p>
```

Replace with:

```tsx
<p className="text-[13px] font-semibold text-[#57534E]">Built for local businesses that care what customers say</p>
```

### Patch B — line 811 area

Find:

```tsx
<span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">500+ local businesses</span>
```

Replace with:

```tsx
<span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">Local businesses, real replies</span>
```

### Patch C — fabricated testimonials

Grep the page:

```bash
grep -nE '"[A-Z][a-z]+ [A-Z]\."|Sarah|Michael|Jennifer|James' app/page.tsx
```

If there's a testimonials `<section>` with made-up names and quotes (the usual suspects are `Sarah K.`, `Michael R.`, etc.), **delete the entire `<section>` block** until you have real testimonials. Keep the rest of the page intact.

If you'd rather keep the visual weight of that section, replace the cards with example reply excerpts labeled "Sample reply" (no fake attribution).

### Commit

```bash
npx tsc --noEmit
git add app/page.tsx
git commit -m "copy(landing): fix trust-number contradiction, drop fake testimonials"
```

---

## T18: Phase 3 Verification Gate

No new code. Run each step; all must pass.

### Step 1 — TypeScript

```bash
npx tsc --noEmit
```

Expected: zero errors.

### Step 2 — Production build

```bash
npm run build
```

Expected: zero errors. Warnings about the Stripe env var are environmental (module-load-time `new Stripe(process.env.STRIPE_SECRET_KEY!)`); the compile itself should say `✓ Compiled successfully`.

### Step 3 — Bundle size capture

From the build output, record the First Load JS for:

| Route | Before (Phase 2.5) | After (Phase 3) | Δ |
|---|---|---|---|
| `/dashboard/analytics` |  |  |  |
| `/dashboard/competitors` |  |  |  |
| `/dashboard` |  |  |  |

Expected: analytics and competitors drop 100-180 kB; `/dashboard` unchanged.

If the drops are small, re-check `components/charts/LazyRecharts.tsx` — make sure the top-level containers are the only things going through `dynamic(() => import('recharts').then(...))`.

### Step 4 — Lighthouse (desktop, incognito Chrome)

Load `/dashboard`. Run Lighthouse.

Targets:
- Performance ≥ 85
- Accessibility ≥ 95
- Best Practices ≥ 95
- SEO ≥ 95

Most likely regression: icon-only buttons without `aria-label`. Fix any a11y audit failures before merging.

### Step 5 — Mobile smoke

DevTools → iPhone 14 viewport → Fast 3G. Walk:

1. `/` — no horizontal scroll, hero CTA comfortable.
2. `/signup` — inputs don't zoom on focus.
3. `/dashboard` — stat tiles show skeletons; drawer opens; Escape closes it.
4. `/dashboard/competitors` — horizontal scroll; first column sticks; "You" row tinted.
5. `/dashboard/reviews` — tap tone chip, 👍, 👎, regenerate — all comfortable.
6. Paywall modal — open, press Tab (cycles within), press Escape (closes).

### Step 6 — no commit

T18 doesn't produce code. Don't create an empty commit.

---

## Final PR

Once T18 passes:

```bash
git push -u origin feature/website-polish
```

Then:

```bash
gh pr create --title "Website polish: Phase 1 foundation → Phase 3 polish" --body "$(cat <<'EOF'
## Summary

Four-phase sweep pulling the app onto a unified design system, hardening the subscription lifecycle, and trimming the bundle.

- **Phase 1 (Foundation):** token system (accent/border/shadow-card), shared `<Input>`/`<Button>`/`<Card>`, shared `<Logo />`, single `<main>` landmark.
- **Phase 2 (Impact):** `useModal` hook (focus trap + Escape + scroll lock), demo activation (`has_seen_demo`), skeleton loaders, paywall-annual default, subscription-gate wrapper.
- **Phase 2.5 (Backend hardening):** `hasAccess()` centralized access decisions, Stripe webhook idempotency via `stripe_webhook_events` + unique-violation pattern, subscription-lifecycle columns (`subscription_period_end`, `subscription_canceled_at`, `subscription_past_due`), past-due Resend email notifications, canceled-in-grace + past-due banners.
- **Phase 3 (Polish):** shared `<Toggle>`, unified landing feature cards, Grow token alignment, HomeClient buttons on `<Button>`, lucide `strokeWidth={1.75}`, `<EmptyState>` component + sweep, dead `html2canvas` removed, recharts dynamic-imported (~120-180 kB First Load JS drop on analytics + competitors), `any` removed from analytics tooltip, `lib/log.ts` helper, TrialBanner loss-aversion copy, 44×44 touch targets on reply tone chips / thumbs / regenerate / star-filters / tabs, Competitors sticky "You" column, `useModal` in PaywallModal + Nav drawer, 200+/500+ testimonial contradiction fixed.

## Human blockers before merge

- Apply migrations: `20260416120000_add_has_seen_demo.sql`, `20260416130000_stripe_webhook_events.sql`, `20260416130100_profile_subscription_lifecycle.sql`
- Regenerate typed Database: `supabase gen types typescript --linked > types/supabase.ts`
- Stripe CLI end-to-end: verify `customer.subscription.updated` + `invoice.payment_failed` webhooks land and flip `subscription_past_due`

## Test plan

- [ ] `npx tsc --noEmit` — clean
- [ ] `npm run build` — clean (`✓ Compiled successfully`)
- [ ] Lighthouse `/dashboard` — Performance ≥ 85, Accessibility ≥ 95
- [ ] Mobile smoke: landing, signup, dashboard, competitors, reviews, paywall modal (see verification plan)
- [ ] Bundle: `/dashboard/analytics` and `/dashboard/competitors` First Load JS down 100-180 kB vs phase 2.5 baseline
- [ ] Trial: 7-day trial → expires → paywall. Active trial shows "N days left to save your AI replies"
- [ ] Paid → canceled: banner shows "Access until [date]"; access remains until `subscription_period_end`
- [ ] Past due: Resend email sent; banner shows; 3-day grace; then paywall
- [ ] Stripe webhook: retried event doesn't double-write (unique_violation handled)

EOF
)"
```

---

## Quick cheat-sheet — order of operations

1. **T5 finish** — commit `refactor(home): use shared Button for dashboard CTAs`
2. **T6** — commit `style: standardize lucide-react icon strokeWidth to 1.75`
3. **T7** — commit `feat(ui): add EmptyState component and apply across dashboard`
4. **T8** — commit `chore: remove unused html2canvas dependency`
5. **T9** — commit `perf: dynamic-import recharts on analytics + competitors`
6. **T10** — commit `fix(types): replace any in analytics tooltip with TooltipProps`
7. **T11** — commit `refactor(logs): route scrape noise through lib/log.ts helper`
8. **T12** — commit `copy(trial): reframe banner as loss-aversion`
9. **T13** — commit `a11y(reply): enforce 44px touch targets + radiogroup semantics`
10. **T14** — commit `a11y: enforce 44px touch targets on review/settings controls`
11. **T15** — commit `mobile(competitors): sticky first column for your-own-row context`
12. **T16** — commit `refactor(modals): route PaywallModal and Nav drawer through useModal`
13. **T17** — commit `copy(landing): fix trust-number contradiction, drop fake testimonials`
14. **T18** — verification only, no commit
15. **Final PR** — `git push -u origin feature/website-polish` + `gh pr create ...`

That's the whole phase. Each task is designed to be safely committable on its own, so if you pause mid-phase the branch stays in a known-good state.
