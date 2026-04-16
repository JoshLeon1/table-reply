# Dashboard Premium Polish — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the "Private Dashboard" visual system (tabular numerals, eyebrow labels, Inter-only, restrained orange, Lucide icons, card hierarchy, 2px underline nav) to Dashboard home, Reviews, Analytics, and the global Nav. Mobile iOS behavior is a binding constraint, not an afterthought.

**Architecture:** Foundation-first. Ship design tokens + 5 new primitives (`Eyebrow`, `KPI`, `Delta`, `Stars`, `SectionDivider`) + `Card` variant extension + Lucide migration as mechanical scaffolding. Then apply those primitives to pages via surgical edits (not rewrites) so we keep all business logic and data-fetching intact.

**Tech Stack:** Next.js 14 App Router · Tailwind CSS with CSS-variable tokens · TypeScript strict · Lucide React (new) · Recharts (existing).

**Design spec:** `docs/superpowers/specs/2026-04-16-dashboard-premium-polish-design.md`

**Mobile verification baseline:** 375×812 (iPhone SE / 12 mini). Every page task ends with a mobile check. No horizontal scroll at 375px. All tap targets ≥44pt.

---

## Task Index

- **Task 1:** Install Lucide + add design tokens to `globals.css`
- **Task 2:** Add `.tnum` utility + tabular-nums audit
- **Task 3:** New primitive — `components/ui/Eyebrow.tsx`
- **Task 4:** New primitive — `components/ui/Delta.tsx`
- **Task 5:** New primitive — `components/ui/Stars.tsx`
- **Task 6:** New primitive — `components/ui/KPI.tsx`
- **Task 7:** New primitive — `components/ui/SectionDivider.tsx`
- **Task 8:** Extend `Card` with `variant` prop
- **Task 9:** Retire `.text-gradient-orange` and `.shadow-accent-lg` utilities
- **Task 10:** Nav rework — desktop 2px underline + mobile left-rail (visual only)
- **Task 11:** Dashboard home rework (hero metric + action strip + reviews list)
- **Task 12:** Reviews list rework (dense rows + eyebrow status badges)
- **Task 13:** Analytics rework (monochrome charts + KPI strip + eyebrow titles)
- **Task 14:** Global typography audit — eyebrow sweep + `tnum` sweep on number cells
- **Task 15:** Phase 1 verification gate — desktop + iOS 375px smoke test

---

## Task 1: Install Lucide + add design tokens to `globals.css`

**Files:**
- Modify: `package.json`
- Modify: `app/globals.css`

- [ ] **Step 1: Install `lucide-react`**

Run in `/Users/joshleon/Table Reply/.worktrees/website-polish`:
```bash
npm install lucide-react
```
Expected: adds `lucide-react` to `dependencies`. No peer-dep warnings.

- [ ] **Step 2: Open `app/globals.css` and locate the `:root {` block**

It currently ends with `--ring-accent: 0 0 0 2px rgba(224,90,40,0.25);` then `}`.

- [ ] **Step 3: Append new token values inside `:root {}`**

Insert these lines immediately before the closing `}` of `:root`:

```css
  /* Slate scale — new gray system for inset/flat surfaces */
  --slate-50:  #FAF8F5;
  --slate-100: #F0EDE8;
  --slate-300: #CEC8C1;

  /* Status tokens (data, not brand) */
  --positive: #0B8A5B;
  --negative: #B8281E;
  --neutral:  #6B6862;

  /* Hover-only shadow (replaces ambient --shadow-card on interactive cards) */
  --shadow-hover: 0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);
```

- [ ] **Step 4: Add global iOS safety rules inside `@layer base { ... }`**

Immediately after the existing `* { box-sizing: border-box; }` line, add:

```css
  button, a, [role="button"] { -webkit-tap-highlight-color: transparent; }
  input, textarea, select { font-size: 16px; }   /* prevent iOS zoom-on-focus */
```

> Note: 16px applies to the form control itself — downstream styles that set a larger size (e.g. 18px in an auth page) still win via specificity.

- [ ] **Step 5: Verify no build errors**

Run: `npx tsc --noEmit` (expect: clean). Then start dev: `npm run dev`, load `/dashboard` — expect no visual change yet, no console errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json app/globals.css
git commit -m "feat(tokens): install lucide-react + add slate/status/shadow tokens

- Add slate-50/100/300 for inset and hover surfaces
- Add positive/negative/neutral status colors (data, not brand)
- Add --shadow-hover (replaces ambient --shadow-card on interactive cards)
- iOS safety: -webkit-tap-highlight-color transparent on buttons/links,
  16px min font-size on form inputs to prevent zoom-on-focus"
```

---

## Task 2: Add `.tnum` utility

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add `.tnum` utility inside `@layer utilities`**

Find the `@layer utilities {` block in `app/globals.css`. After the `.animate-*` utilities, add:

```css
  .tnum { font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat(tokens): add .tnum utility for tabular numerals

Silent but material: every KPI, table cell, and axis label will use
this via component primitives or explicit className. Aligns column
numbers (4.7 and 1.2 become the same width)."
```

---

## Task 3: New primitive — `components/ui/Eyebrow.tsx`

**Files:**
- Create: `components/ui/Eyebrow.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface EyebrowProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'default' | 'muted' | 'accent'
}

/**
 * Small-caps section label. 11px / 600 weight / uppercase / 0.09em tracking.
 * Default tone: --text-3 (#A8A29E). Use above KPIs, card titles, and
 * page section dividers to create the "private dashboard" feel.
 */
export default function Eyebrow({ className, tone = 'default', children, ...props }: EyebrowProps) {
  const tones = {
    default: 'text-[#A8A29E]',
    muted:   'text-[#C4BEB8]',
    accent:  'text-[#E05A28]',
  }
  return (
    <span
      className={cn(
        'inline-block text-[11px] font-semibold uppercase tracking-[0.09em] leading-4',
        tones[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean

- [ ] **Step 3: Commit**

```bash
git add components/ui/Eyebrow.tsx
git commit -m "feat(ui): Eyebrow primitive (small-caps section label)"
```

---

## Task 4: New primitive — `components/ui/Delta.tsx`

**Files:**
- Create: `components/ui/Delta.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeltaProps {
  /** Percent or absolute number. Positive = up, negative = down, 0 = flat. */
  value: number
  /** Render as "+0.2" / "-0.1" / "0" — the label text. If omitted, formats value with sign. */
  label?: string
  /** Unit suffix (e.g. "%" or "pts"). Default none. */
  unit?: string
  /** When true, up is bad and down is good (use for things like response-time). */
  inverted?: boolean
  className?: string
  size?: 'sm' | 'md'
}

/**
 * Colored delta chip: ▲ +0.2 (green) / ▼ -0.1 (red) / — 0 (gray).
 * Uses lucide ArrowUpRight/ArrowDownRight/Minus, tabular numerals.
 */
export default function Delta({ value, label, unit = '', inverted = false, className, size = 'md' }: DeltaProps) {
  const dir: 'up' | 'down' | 'flat' = value > 0 ? 'up' : value < 0 ? 'down' : 'flat'
  const good = inverted ? dir === 'down' : dir === 'up'
  const bad  = inverted ? dir === 'up' : dir === 'down'

  const color =
    dir === 'flat' ? 'text-[#6B6862]' :
    good           ? 'text-[#0B8A5B]' :
    bad            ? 'text-[#B8281E]' :
                     'text-[#6B6862]'

  const Icon = dir === 'up' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus
  const sizes = {
    sm: { text: 'text-[11px]', icon: 12, gap: 'gap-0.5' },
    md: { text: 'text-[12px]', icon: 14, gap: 'gap-1' },
  }[size]

  const text = label ?? `${value > 0 ? '+' : ''}${value}${unit}`

  return (
    <span className={cn('inline-flex items-center font-medium tnum', sizes.text, sizes.gap, color, className)}>
      <Icon size={sizes.icon} strokeWidth={2} className="flex-shrink-0" />
      {text}
    </span>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean

- [ ] **Step 3: Commit**

```bash
git add components/ui/Delta.tsx
git commit -m "feat(ui): Delta primitive (colored +/- trend chip with tnum)"
```

---

## Task 5: New primitive — `components/ui/Stars.tsx`

**Files:**
- Create: `components/ui/Stars.tsx`

**Why:** Today ReviewsClient, AnalyticsClient, and HomeClient each inline their own `<Stars>`/`<StarRow>` SVG. Unifying means one source of truth for rating presentation.

- [ ] **Step 1: Create the component**

```tsx
import { cn } from '@/lib/utils'

interface StarsProps {
  /** 0 to 5, supports decimals (rounded to nearest int for fill). */
  rating: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'w-3 h-3',        // 12px — table cells
  md: 'w-4 h-4',        // 16px — review cards
  lg: 'w-5 h-5',        // 20px — hero metric
}

/**
 * Canonical star rating display. Amber filled, border-color empty.
 * Used everywhere a rating is shown in the UI. Rounds input to nearest
 * whole star for fill state.
 */
export default function Stars({ rating, size = 'md', className }: StarsProps) {
  const filled = Math.round(Math.max(0, Math.min(5, rating)))
  return (
    <div className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={cn(SIZES[size], i <= filled ? 'text-amber-400' : 'text-[#E4DED8]')}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean

- [ ] **Step 3: Commit**

```bash
git add components/ui/Stars.tsx
git commit -m "feat(ui): Stars primitive (canonical rating display)"
```

---

## Task 6: New primitive — `components/ui/KPI.tsx`

**Files:**
- Create: `components/ui/KPI.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import Eyebrow from './Eyebrow'

interface KPIProps extends HTMLAttributes<HTMLDivElement> {
  /** Text above the number, e.g. "RATING — LAST 30 DAYS". */
  label: string
  /** The number itself. String lets callers pass "4.7" or formatted currency. */
  value: ReactNode
  /** Smaller text below the number, e.g. "from 182 reviews". */
  sub?: ReactNode
  /** Right-aligned slot next to label, typically a <Delta /> chip. */
  trailing?: ReactNode
  /** Bottom slot, for a sparkline or secondary detail. */
  footer?: ReactNode
  variant?: 'hero' | 'secondary'
}

/**
 * Single KPI block — eyebrow / big tabular number / optional sub / optional sparkline.
 * Two sizes:
 *   - 'hero':      44px / 36px below 640px. One per page.
 *   - 'secondary': 28px / 24px below 640px. Action strip and sub-metrics.
 */
export default function KPI({ label, value, sub, trailing, footer, variant = 'hero', className, ...props }: KPIProps) {
  const sizes = variant === 'hero'
    ? 'text-[36px] sm:text-[44px] leading-[1.1]'
    : 'text-[24px] sm:text-[28px] leading-[1.2]'

  return (
    <div className={cn('flex flex-col gap-1', className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <Eyebrow>{label}</Eyebrow>
        {trailing}
      </div>
      <div className={cn('font-semibold tracking-[-0.02em] text-[#111111] tnum', sizes)}>
        {value}
      </div>
      {sub && <div className="text-[12px] text-[#57534E] tnum">{sub}</div>}
      {footer && <div className="mt-2">{footer}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean

- [ ] **Step 3: Commit**

```bash
git add components/ui/KPI.tsx
git commit -m "feat(ui): KPI primitive (eyebrow + big tnum number + optional delta/sparkline)"
```

---

## Task 7: New primitive — `components/ui/SectionDivider.tsx`

**Files:**
- Create: `components/ui/SectionDivider.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { cn } from '@/lib/utils'
import Eyebrow from './Eyebrow'

interface SectionDividerProps {
  /** Optional centered eyebrow label inside the rule. */
  label?: string
  className?: string
}

/**
 * Hairline rule with optional centered eyebrow label. Use to separate
 * page-level sections without stacking cards.
 */
export default function SectionDivider({ label, className }: SectionDividerProps) {
  if (!label) {
    return <hr className={cn('border-0 border-t border-[#EDE9E4]', className)} />
  }
  return (
    <div className={cn('flex items-center gap-4', className)} role="separator">
      <span className="flex-1 h-px bg-[#EDE9E4]" aria-hidden="true" />
      <Eyebrow>{label}</Eyebrow>
      <span className="flex-1 h-px bg-[#EDE9E4]" aria-hidden="true" />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean

- [ ] **Step 3: Commit**

```bash
git add components/ui/SectionDivider.tsx
git commit -m "feat(ui): SectionDivider primitive (hairline rule + optional eyebrow label)"
```

---

## Task 8: Extend `Card` with `variant` prop

**Files:**
- Modify: `components/ui/Card.tsx`

- [ ] **Step 1: Replace `components/ui/Card.tsx` contents**

```tsx
import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type CardVariant = 'hero' | 'standard' | 'flat' | 'inset'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: CardVariant
  /** When true, applies hover shadow. Use for card-as-link. Default false. */
  interactive?: boolean
}

const PADDINGS: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-5 sm:p-6',
  lg:   'p-6 sm:p-8',
}

const VARIANTS: Record<CardVariant, string> = {
  hero:     'bg-white rounded-[20px] border-0',
  standard: 'bg-white rounded-2xl border border-[#E4DED8]',
  flat:     'bg-transparent rounded-xl border border-[#E4DED8]',
  inset:    'bg-[#FAF8F5] rounded-xl border-0',
}

/**
 * Card variants:
 *   - hero:     The single most important card on a page (no border, 20px radius)
 *   - standard: Default — most cards (white, 16px radius, 1px border)
 *   - flat:     Blends into bg (transparent, 12px radius, 1px border). Dense info.
 *   - inset:    Callouts inside other cards (slate-50, 12px radius, no border)
 *
 * Hero gets a persistent soft shadow. Standard with interactive=true gets a
 * hover shadow. Flat and inset never show shadows.
 */
export function Card({ className, padding = 'md', variant = 'standard', interactive = false, children, ...props }: CardProps) {
  const base =
    variant === 'hero'
      ? 'shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]'
      : variant === 'standard' && interactive
      ? 'transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]'
      : ''

  return (
    <div
      className={cn(VARIANTS[variant], PADDINGS[padding], base, className)}
      {...props}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Verify existing callers still compile**

Run: `npx tsc --noEmit`
Expected: clean (existing callers pass no `variant` prop; default `standard` matches prior behavior minus the ambient `shadow-card`).

- [ ] **Step 3: Visual regression check**

Run: `npm run dev`, load `/settings`, `/dashboard/grow`, `/dashboard/competitors`. These use `<Card>` heavily. Expect: cards now have flat white + border only (ambient shadow gone). That's intentional. Verify no layout breakage.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Card.tsx
git commit -m "feat(ui): Card variants (hero/standard/flat/inset)

- hero: no border, 20px radius, persistent soft shadow (one per page)
- standard: current style minus the ambient shadow
- flat: transparent bg + border, for dense info
- inset: slate-50 callouts inside other cards
- interactive prop: hover shadow for card-as-link on standard"
```

---

## Task 9: Retire `.text-gradient-orange` and `.shadow-accent-lg`

**Files:**
- Modify: `app/globals.css`
- Modify: callers of `.text-gradient-orange` (grep for usages)
- Modify: callers of `.shadow-accent-lg` (grep for usages)

- [ ] **Step 1: Find callers**

Run in worktree root:
```bash
grep -rn "text-gradient-orange\|shadow-accent-lg" app/ components/ --include="*.tsx" --include="*.ts"
```
Record the results — expect ~3–8 matches.

- [ ] **Step 2: Replace each caller**

For each `text-gradient-orange` match: replace `text-gradient-orange` with `text-[#111111]` (plain dark text — the whole point is to stop using gradient text in the dashboard).

For each `shadow-accent-lg` match: remove the class entirely (the replacement is the existing `shadow-accent` CSS variable applied only to Button-accent hover, which is already there).

- [ ] **Step 3: Remove the utilities from `app/globals.css`**

Find this block in `@layer utilities`:
```css
  /* premium card shadow system */
  .shadow-lifted     { box-shadow: 0 8px 30px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06); }
  .shadow-accent-lg  { box-shadow: 0 6px 22px rgba(224,90,40,0.35); }
```
Delete **only** the `.shadow-accent-lg` line (keep `.shadow-lifted` — still used by modals).

Find this block:
```css
  /* gradient text */
  .text-gradient-orange {
    background: linear-gradient(135deg, #E05A28 0%, #F07040 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
```
Delete the entire block.

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit` (expect clean), then `npm run build` (expect clean — no unused class errors).

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/ components/
git commit -m "refactor(ui): retire gradient text + accent-lg shadow utilities

- .text-gradient-orange deleted (replaced with #111111 plain dark)
- .shadow-accent-lg deleted (Button-accent hover already uses --shadow-accent)
- These two utilities were the two strongest 'template' tells"
```

---

## Task 10: Nav rework — desktop 2px underline + mobile left-rail (visual only)

**Files:**
- Modify: `components/Nav.tsx`

**Why this is visual-only:** We leave the IconHome/IconReviews/etc. inline SVG components alone for now. The nav rework is specifically about the active-state treatment. Lucide migration for nav icons is out of scope for Phase 1 — they're custom-tuned and trading them 1:1 is risk without payoff.

- [ ] **Step 1: Change the desktop active-tab treatment**

In `components/Nav.tsx`, find the desktop links block (around line 182–208). Locate this `<Link>` (the active-state styling):

```tsx
className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-medium transition-all duration-150 active:scale-[0.97] ${
  active
    ? 'text-[#111111] bg-[#F3F0EC] border border-[#E4DED8]'
    : 'text-[#111111]/60 hover:text-[#111111]/70 hover:bg-[#F3F0EC]'
}`}
style={active ? { boxShadow: '0 1px 0 rgba(0,0,0,0.04) inset' } : undefined}
```

Replace with:

```tsx
className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] transition-colors duration-150 ${
  active
    ? 'text-[#111111] font-semibold'
    : 'text-[#57534E] font-medium hover:text-[#111111] hover:bg-[#F0EDE8]'
}`}
```

Remove the inline `style={active ? {...} : undefined}` prop entirely.

- [ ] **Step 2: Add the 2px underline element inside the active link**

Inside the desktop `<Link>`, just before the closing `</Link>` tag, add:

```tsx
{active && (
  <span
    aria-hidden="true"
    className="absolute left-3 right-3 -bottom-[14px] h-[2px] bg-[#E05A28] rounded-full"
  />
)}
```

The `-bottom-[14px]` places the underline beneath the nav bar's horizontal padding, right at the bottom border line. Adjust if visually off by 1-2px.

- [ ] **Step 3: Change the `active` state color on the icon**

In the same desktop `<Link>` block, find:
```tsx
<span className={active ? 'text-[#E05A28]' : 'opacity-60'}>{link.icon(active)}</span>
```

Replace with:
```tsx
<span className={active ? 'text-[#111111]' : 'text-[#A8A29E]'}>{link.icon(active)}</span>
```

(The underline now carries the accent; the icon stays neutral. This is the key "less orange" move.)

- [ ] **Step 4: Apply the same active-state change to the desktop Settings link**

Around line 218, find:
```tsx
<Link
  href="/settings"
  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[14px] font-medium transition-all duration-150 active:scale-[0.97] ${
    pathname === '/settings'
      ? 'text-[#E05A28] bg-[#F3F0EC] border border-[#E4DED8]'
      : 'text-[#111111]/60 hover:text-[#111111]/70 hover:bg-[#F3F0EC]'
  }`}
>
```

Replace with:

```tsx
<Link
  href="/settings"
  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-[14px] transition-colors duration-150 ${
    pathname === '/settings'
      ? 'text-[#111111] font-semibold'
      : 'text-[#57534E] font-medium hover:text-[#111111] hover:bg-[#F0EDE8]'
  }`}
>
```

And inside this Settings link, before the closing `</Link>`, add the same underline conditional:
```tsx
{pathname === '/settings' && (
  <span aria-hidden="true" className="absolute left-3 right-3 -bottom-[14px] h-[2px] bg-[#E05A28] rounded-full" />
)}
```

- [ ] **Step 5: Mobile drawer — keep the left-rail, but switch its active-row bg to slate-50**

Find the mobile drawer `<Link>` block (around line 288):

```tsx
className={`flex items-center gap-3 px-4 rounded-xl text-[14px] font-medium transition-all duration-150 min-h-[48px] ${
  active
    ? 'bg-[#F3F0EC] text-[#111111]'
    : 'text-[#111111]/60 hover:text-[#111111]/90 hover:bg-[#F3F0EC]'
}`}
```

Replace with:

```tsx
className={`flex items-center gap-3 px-4 rounded-xl text-[14px] transition-colors duration-150 min-h-[48px] ${
  active
    ? 'bg-[#FAF8F5] text-[#111111] font-semibold'
    : 'text-[#57534E] font-medium hover:text-[#111111] hover:bg-[#F0EDE8]'
}`}
```

(Left-rail element `<span className={`w-0.5 h-5 rounded-full ... ${active ? 'bg-[#E05A28]' : 'bg-transparent'}`} />` is already there — keep it. Same for Settings and Sign Out rows in the drawer.)

- [ ] **Step 6: Mobile drawer Settings + Sign Out rows — consistency sweep**

Lines ~315 and ~326, change the className strings for Settings and Sign Out the same way — `text-[#57534E] font-medium` default, `text-[#111111] font-semibold` with `bg-[#FAF8F5]` when active.

- [ ] **Step 7: Remove the hamburger glow**

Around line 199–201, find the pending-count badge:
```tsx
<span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#E05A28] text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-[0_0_8px_rgba(224,90,40,0.5)]">
```

Replace with (drop the shadow, tighten weight):
```tsx
<span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#E05A28] text-white text-[10px] font-semibold flex items-center justify-center leading-none tnum">
```

Apply the same change to the mobile drawer badge (around line 302) — drop its `shadow-[0_0_8px_rgba(224,90,40,0.4)]` and change `font-bold` to `font-semibold` + add `tnum`.

And the `analyticsStale` dot (around line 204, 306) — remove `animate-pulse` and the `shadow-[0_0_6px_rgba(224,90,40,0.6)]`:

```tsx
{link.dot && !link.badge && (
  <span className="w-1.5 h-1.5 rounded-full bg-[#E05A28] flex-shrink-0" />
)}
```

- [ ] **Step 8: Type-check + visual verify**

Run: `npx tsc --noEmit` (expect clean).

Start dev server: `npm run dev`. Visit `/dashboard`. Verify:
- **Desktop:** active tab shows the 2px orange underline beneath the nav bar. No pill, no border, no fill. Inactive tabs are dim stone gray. Hover turns them darker + slight slate bg.
- **Mobile (DevTools responsive mode, 375px):** open drawer. Active row has orange left-rail + slight slate bg + bold text. Inactive rows are stone gray.
- **Badges** no longer glow.

- [ ] **Step 9: Commit**

```bash
git add components/Nav.tsx
git commit -m "refactor(nav): retire pill active-state in favor of 2px underline

Desktop:
- Active tab: text-[#111] + semibold + 2px orange underline (no pill bg)
- Inactive: text-[#57534E] + medium weight
- Icon color neutralized (underline carries the accent)

Mobile drawer:
- Active row keeps left-rail treatment, updated bg to slate-50
- Badges: drop glow shadows, switch to tnum for count alignment

The pill active-state was the single most template-y UI element."
```

---

## Task 11: Dashboard home rework

**Files:**
- Modify: `app/(dashboard)/dashboard/HomeClient.tsx` (targeted edits)

**Scope note:** HomeClient is 914 lines with many sub-components (SetupPanel, ConnectedPanel, stats, etc.). We are NOT rewriting it. We target the main render path to introduce the hero metric + action strip + recent reviews list, while leaving setup/connect flows alone.

- [ ] **Step 1: Read the current main render**

In `app/(dashboard)/dashboard/HomeClient.tsx`, find the component `HomeClient` (the default export, probably near the bottom of the file around line 700+). Note how the top-level `return` branches between the setup flow and the connected flow.

Identify the "connected / stats-showing" branch — the code that renders when the user has a profile and reviews. That's what we're redesigning.

- [ ] **Step 2: Introduce imports at top of file**

Add to the imports at lines 1–8:
```tsx
import KPI from '@/components/ui/KPI'
import Eyebrow from '@/components/ui/Eyebrow'
import Delta from '@/components/ui/Delta'
import Stars from '@/components/ui/Stars'
import { Card } from '@/components/ui/Card'
import { ArrowRight, MessageSquare, RefreshCw, CheckCircle2 } from 'lucide-react'
```

- [ ] **Step 3: Build the new hero row component inline**

Just above the main `HomeClient` component's `return`, add this helper (it uses the existing `reviews` / `trendCalc` helpers already in the file):

```tsx
function HeroRow({ reviews }: { reviews: ScrapedReview[] }) {
  // Last 30 days
  const now = Date.now()
  const THIRTY_D = 30 * 24 * 60 * 60 * 1000
  const recent = reviews.filter(r => now - new Date(r.review_date).getTime() < THIRTY_D)
  const previous = reviews.filter(r => {
    const age = now - new Date(r.review_date).getTime()
    return age >= THIRTY_D && age < THIRTY_D * 2
  })

  const avg = (arr: ScrapedReview[]) =>
    arr.length ? arr.reduce((s, r) => s + (r.review_rating ?? 0), 0) / arr.length : 0

  const recentAvg = avg(recent)
  const prevAvg = avg(previous)
  const ratingDelta = Number((recentAvg - prevAvg).toFixed(1))

  const volumeDelta = recent.length - previous.length

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Hero metric — rating */}
      <Card variant="hero" padding="lg" className="md:col-span-2">
        <KPI
          variant="hero"
          label="RATING — LAST 30 DAYS"
          value={recentAvg ? recentAvg.toFixed(1) : '—'}
          trailing={recent.length > 0 && previous.length > 0 ? <Delta value={ratingDelta} unit="" /> : undefined}
          sub={recent.length > 0 ? (
            <span className="inline-flex items-center gap-2">
              <Stars rating={recentAvg} size="sm" />
              <span>from {recent.length} review{recent.length === 1 ? '' : 's'}</span>
            </span>
          ) : 'No reviews in the last 30 days'}
        />
      </Card>

      {/* Secondary — volume */}
      <Card variant="standard" padding="lg">
        <KPI
          variant="secondary"
          label="REVIEW VOLUME"
          value={recent.length}
          trailing={previous.length > 0 ? <Delta value={volumeDelta} unit="" /> : undefined}
          sub={`vs ${previous.length} previous 30d`}
        />
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Build the action strip component inline**

Just below `HeroRow`, add:

```tsx
function ActionStrip({ pendingCount, unrepliedCount, lastSyncAt }: {
  pendingCount: number
  unrepliedCount: number
  lastSyncAt: string | null
}) {
  const lastSyncLabel = lastSyncAt ? formatTimeAgo(lastSyncAt) : 'never'

  const actions = [
    {
      href: '/dashboard/reviews?tab=pending',
      icon: <MessageSquare size={16} strokeWidth={1.5} />,
      label: 'PENDING REPLIES',
      value: pendingCount,
    },
    {
      href: '/dashboard/reviews',
      icon: <CheckCircle2 size={16} strokeWidth={1.5} />,
      label: 'UNREPLIED',
      value: unrepliedCount,
    },
    {
      href: '/settings?tab=integrations',
      icon: <RefreshCw size={16} strokeWidth={1.5} />,
      label: 'LAST SYNC',
      value: lastSyncLabel,
    },
  ]

  return (
    <div className="flex gap-3 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none pb-2 sm:pb-0">
      {actions.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className="group flex-1 min-w-[240px] sm:min-w-0 snap-start"
        >
          <Card variant="flat" padding="md" className="h-full hover:bg-white transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#57534E] flex-shrink-0">
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <Eyebrow>{a.label}</Eyebrow>
                <div className="text-[18px] font-semibold text-[#111] tnum leading-tight mt-0.5 truncate">
                  {a.value}
                </div>
              </div>
              <ArrowRight size={16} strokeWidth={1.5} className="text-[#A8A29E] group-hover:text-[#111] transition-colors flex-shrink-0" />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Build the recent reviews list component inline**

```tsx
function RecentReviewsList({ reviews }: { reviews: ScrapedReview[] }) {
  const recent = reviews.slice(0, 5)
  if (recent.length === 0) return null

  return (
    <Card variant="standard" padding="none">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#EDE9E4]">
        <Eyebrow>RECENT REVIEWS</Eyebrow>
        <Link href="/dashboard/reviews" className="text-[12px] font-medium text-[#57534E] hover:text-[#111] inline-flex items-center gap-1">
          See all <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </div>
      <ul className="divide-y divide-[#EDE9E4]">
        {recent.map((r) => (
          <li key={r.id} className="px-5 sm:px-6 py-3.5">
            <div className="flex items-start sm:items-center gap-3 flex-col sm:flex-row">
              <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                <div className="w-8 h-8 rounded-full bg-[#F0EDE8] text-[#57534E] flex items-center justify-center text-[12px] font-semibold flex-shrink-0">
                  {(r.author_title ?? 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[#111] truncate">{r.author_title ?? 'Anonymous'}</span>
                    <Stars rating={r.review_rating ?? 0} size="sm" />
                  </div>
                  <p className="text-[13px] text-[#57534E] truncate mt-0.5">{r.review_text}</p>
                </div>
              </div>
              <span className="text-[11px] text-[#A8A29E] tnum self-end sm:self-auto flex-shrink-0">
                {formatTimeAgo(r.review_date)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
```

- [ ] **Step 6: Wire the new pieces into the main render**

Find the existing "connected user" render branch in `HomeClient` — the section that shows KPIs/stats today. Replace the top portion of that render with:

```tsx
<div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
  {/* Page title */}
  <div>
    <h1 className="text-[22px] sm:text-[26px] font-semibold text-[#111] tracking-[-0.01em]">
      Welcome back{ownerName ? `, ${ownerName}` : ''}
    </h1>
    <p className="text-[13px] text-[#57534E] mt-1">Here's how your reputation is trending.</p>
  </div>

  <HeroRow reviews={reviews} />
  <ActionStrip
    pendingCount={pendingCount}
    unrepliedCount={unrepliedCount}
    lastSyncAt={lastSyncAt}
  />
  <RecentReviewsList reviews={reviews} />

  {/* keep the rest of the existing connected-state render below this block */}
</div>
```

> Note: `ownerName`, `pendingCount`, `unrepliedCount`, `lastSyncAt` may already be in scope in HomeClient. If not, they need to be derived from existing state/props. If adapting to existing variable names changes the code, that's fine — the KPI values are what matters, not the exact variable path.

- [ ] **Step 7: Remove bespoke hero elements the new render replaces**

Delete the pre-existing "top stats" block that `HeroRow` + `ActionStrip` replace. Keep all other sub-renders (setup flow, sync prompt, paywall triggers, connect CTA) untouched. If you're unsure whether a block is "replaced" or "kept," leave it and you'll see it rendered in dev — then delete it when it's obvious it's duplicated.

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: clean. If `ownerName` etc. aren't in scope, pull them from the existing data fetch in HomeClient and wire them through.

- [ ] **Step 9: Verify desktop**

Run: `npm run dev`, load `/dashboard`. Expect:
- One prominent rating card (big 44px tabular number + stars + delta chip)
- A smaller volume card to its right
- A three-action strip below
- Recent reviews as a clean list, no card-in-card

- [ ] **Step 10: Verify mobile at 375px**

In DevTools, toggle device mode to iPhone SE (375×667). Expect:
- Hero row stacks vertically (rating on top, volume below)
- Action strip scrolls horizontally with snap
- Recent reviews rows wrap to two lines (avatar+name+stars on line 1, quote on line 2, timestamp bottom-right)
- No horizontal scrollbar on the page itself

- [ ] **Step 11: Commit**

```bash
git add app/\(dashboard\)/dashboard/HomeClient.tsx
git commit -m "refactor(dashboard): rework home with hero KPI + action strip + reviews list

- Single hero metric: 30-day rating + delta, using KPI variant=hero
- Secondary: review volume with delta
- Action strip: 3 flat cards, horizontal scroll with snap on mobile
- Recent reviews: dense list (table-style), not card-in-card
- Mobile (<768): hero stacks, strip snap-scrolls, rows collapse to 2 lines"
```

---

## Task 12: Reviews list rework

**Files:**
- Modify: `app/(dashboard)/dashboard/reviews/ReviewsClient.tsx` (targeted edits)

**Scope:** Change the presentation of the review list items and the star filter. Leave the pending/approved/dismissed tab logic and the reply generation/editing logic alone.

- [ ] **Step 1: Add imports**

Add to the imports at top of `ReviewsClient.tsx`:
```tsx
import Stars from '@/components/ui/Stars'
import Eyebrow from '@/components/ui/Eyebrow'
```

- [ ] **Step 2: Replace the inline `StarRow` component (lines ~27–37)**

Delete the inline `StarRow` definition. Then search/replace `<StarRow rating=` with `<Stars rating=` and `StarRow` with `Stars` (2 replacements typical). Verify it imports from the new primitive.

- [ ] **Step 3: Update status badge presentation**

Find the status pill JSX (search for `bg-orange-50` or `bg-green-50` or `bg-amber-100` inside the review row render — the pill/chip that shows "Pending" / "Approved" / "Dismissed"). Replace the existing chip with this eyebrow-style chip:

```tsx
{status === 'pending' && (
  <span className="inline-flex items-center rounded-md border border-[#F5C9AD] bg-[#FEF0E8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#C94E21] tnum">
    PENDING
  </span>
)}
{status === 'approved' && (
  <span className="inline-flex items-center rounded-md border border-[#C9E4D3] bg-[#E8F5EE] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#0B8A5B] tnum">
    APPROVED
  </span>
)}
{status === 'dismissed' && (
  <span className="inline-flex items-center rounded-md border border-[#E4DED8] bg-[#F0EDE8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#6B6862] tnum">
    DISMISSED
  </span>
)}
```

Adapt the surrounding conditional (`status === ...`) to match the variable name used in ReviewsClient (it may be `reply_status` or similar).

- [ ] **Step 4: Review row container — switch card-in-card to list row**

Find the main review list render (probably a `.map((review) => <Card ...>` block). The current pattern wraps each review in a `<Card>`. Change to a single outer `<Card>` containing an unordered list, with each review as a `<li>` with a bottom border:

Wrap the map in:
```tsx
<Card variant="standard" padding="none">
  <ul className="divide-y divide-[#EDE9E4]">
    {filteredReviews.map((review) => (
      <li key={review.id} className="px-4 sm:px-6 py-4">
        {/* existing review row JSX goes here — just remove the individual <Card> wrapper */}
      </li>
    ))}
  </ul>
</Card>
```

Locate the existing per-review `<Card ...>` wrapper inside the map and remove it (keep its children). If each review's expanded-reply state also renders a Card, leave that one alone — we want the expanded state to still feel like a focused panel.

- [ ] **Step 5: Star filter — ensure 44pt tap targets on mobile**

Find the star-filter segmented control (search for `onClick.*setStarFilter` or similar). Each star button should have `min-w-[44px] min-h-[44px]` and `-webkit-tap-highlight-color: transparent` (the global rule from Task 1 handles the latter). Add `min-w-[44px] min-h-[44px] flex items-center justify-center` to each filter button's className.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 7: Verify desktop + mobile**

Run dev, visit `/dashboard/reviews`. Expect:
- **Desktop:** reviews render as dense horizontal rows in a single bordered card with hairline row dividers. No nested card shadows. Status chips are eyebrow-style.
- **Mobile (375px):** rows collapse to two lines (avatar+name+stars+status on line 1, quote+platform+date on line 2). Tap targets ≥44pt. No horizontal overflow.

- [ ] **Step 8: Commit**

```bash
git add app/\(dashboard\)/dashboard/reviews/ReviewsClient.tsx
git commit -m "refactor(reviews): dense list rows + eyebrow status chips

- Replace per-review <Card> wrappers with a single outer card + <ul>
  with hairline dividers. Kills the card-in-card shadow stack.
- Status badges become eyebrow-style (uppercase + letter-spacing + tnum).
- Star filter segmented control: 44pt tap targets on mobile.
- Switch inline StarRow to unified <Stars /> primitive."
```

---

## Task 13: Analytics rework

**Files:**
- Modify: `app/(dashboard)/dashboard/analytics/AnalyticsClient.tsx` (targeted edits)

**Scope:** This file is 1544 lines. We are NOT rewriting it. Three surgical changes:
1. Remove gradient text from the page heading
2. Apply monochrome+orange-accent color scheme to the charts' `<Line>` / `<Bar>` stroke/fill colors
3. Apply the new tooltip shell

- [ ] **Step 1: Add imports**

At top of `AnalyticsClient.tsx`:
```tsx
import Eyebrow from '@/components/ui/Eyebrow'
```

- [ ] **Step 2: Find and replace the page heading**

Search for `text-gradient-orange` inside this file (should be 0 matches after Task 9, but double-check). Find the `<h1>` — likely something like:
```tsx
<h1 className="text-[28px] sm:text-[32px] font-bold text-gradient-orange">Analytics</h1>
```

Replace with:
```tsx
<h1 className="text-[22px] sm:text-[26px] font-semibold text-[#111] tracking-[-0.01em]">Analytics</h1>
```

If a descriptive subtitle exists below it, keep it but set to `text-[13px] text-[#57534E]`.

- [ ] **Step 3: Replace chart colors (monochrome + orange accent)**

Find Recharts `<Line stroke=` and `<Bar fill=` props throughout the file. The pattern is: **primary series = `#111111`, comparison/secondary series = `#CEC8C1`, one highlighted datum = `#E05A28`**.

Common replacements:
- `stroke="#E05A28"` (primary line) → `stroke="#111111"` (keep accent only for the *single most recent* or *highlighted* point)
- `stroke="#3B82F6"` / any blue → `stroke="#CEC8C1"` (comparison line)
- `fill="#E05A28"` (bar) → `fill="#111111"` (primary bars)
- `fill="#34D399"` / any green → `fill="#CEC8C1"` (comparison)

For any `<Cell fill={...}>` that marks the "today"/"latest" point — keep `#E05A28` there (that's the one accent we want to preserve).

- [ ] **Step 4: Redesign the Recharts tooltip**

Find the custom `CustomTooltip` / `RechartsTooltip` / `TooltipContent` component in this file. Replace its container div with:

```tsx
<div className="bg-white rounded-xl border border-[#E4DED8] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] p-3 min-w-[140px]">
  <Eyebrow className="block mb-1">{label}</Eyebrow>
  {payload?.map((entry) => (
    <div key={entry.name} className="flex items-baseline justify-between gap-3 text-[13px] tnum">
      <span className="text-[#57534E]">{entry.name}</span>
      <span className="font-semibold text-[#111]" style={{ color: entry.color }}>{entry.value}</span>
    </div>
  ))}
</div>
```

Adapt the props destructuring to match the existing tooltip's prop shape.

- [ ] **Step 5: Tabular numerals on axis labels**

For every `<XAxis />` and `<YAxis />`, add `tick={{ fontSize: 11, fontFeatureSettings: '"tnum" 1', fill: '#A8A29E' }}`.

Replace all existing tick fill colors and font sizes with this. Grep: `tick=\{\{` to find each.

- [ ] **Step 6: Mobile — responsive ticks**

For each chart where the x-axis has many labels (monthly or daily data), add or update the XAxis `interval` prop based on viewport. The existing pattern may already handle this; if not, a simple `interval="preserveStartEnd"` prop on charts with >10 ticks is sufficient.

- [ ] **Step 7: KPI strip at the top of Analytics**

The existing AnalyticsClient likely has a "top stats" row. Leave its data logic alone, but replace the cards with the same `Card variant="flat"` + `KPI variant="secondary"` pattern used in Dashboard's ActionStrip. Specifically, find the top stats render (look for `Total reviews`, `Average rating`, `Reply rate` — phrases like those) and wrap each in:

```tsx
<Card variant="flat" padding="md">
  <KPI variant="secondary" label="TOTAL REVIEWS" value={totalReviews} />
</Card>
```

Layout: `grid grid-cols-2 lg:grid-cols-4 gap-3`.

Add the imports at top: `import KPI from '@/components/ui/KPI'` and `import { Card } from '@/components/ui/Card'` if not already there.

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 9: Verify**

Run dev, visit `/dashboard/analytics`. Expect:
- Plain dark H1 (no gradient)
- 4-up KPI strip at top (2x2 on mobile)
- Charts are monochrome (black + stone gray) with orange only on highlighted data points
- Tooltips have clean white card style with eyebrow label
- Axis labels are in tabular numerals and stone-gray

At 375px wide: KPI strip is 2×2, charts don't overflow, tooltips don't get cut off by the viewport edge.

- [ ] **Step 10: Commit**

```bash
git add app/\(dashboard\)/dashboard/analytics/AnalyticsClient.tsx
git commit -m "refactor(analytics): monochrome charts + eyebrow tooltips + KPI strip

- Remove gradient-text H1 → plain 26/22px semibold
- Primary series #111111, comparison #CEC8C1, accent #E05A28
  reserved for the highlighted datum only
- Recharts tooltip redesigned: white card + eyebrow label + tnum
- Axis labels: tabular numerals + 11px + stone-gray
- Top 'stats' block unified into Card variant=flat + KPI primitive
- Mobile: KPI strip is 2x2, not 4-up"
```

---

## Task 14: Global typography audit — eyebrow sweep + `tnum` sweep

**Files:** repo-wide, shallow edits

**Goal:** Catch the remaining places where a number is displayed without `tnum`, or a section label is rendered as plain text instead of an eyebrow.

- [ ] **Step 1: Grep for common number display patterns**

Run:
```bash
cd "/Users/joshleon/Table Reply/.worktrees/website-polish"
grep -rn "text-\[2[0-9]px\]\|text-\[3[0-9]px\]\|text-\[4[0-9]px\]" app/\(dashboard\) --include="*.tsx" | head -40
```

For each match where the element displays a number (rating, count, price), add `tnum` to its className. Skip matches that display pure text.

- [ ] **Step 2: Audit table cells**

Grep:
```bash
grep -rn "<td" app/\(dashboard\) --include="*.tsx" | head -30
```

For any `<td>` containing a number, add `tnum` to its className.

- [ ] **Step 3: Audit Competitors + Settings + Grow for number displays**

Visit `/dashboard/competitors`, `/settings`, `/dashboard/grow`. For each number that looks misaligned or that you want to make feel premium, add `tnum` via a quick edit.

> Note: These pages are Phase 2, but a single-class tnum sweep now is cheap and materially improves feel.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "chore(ui): global tnum sweep on numeric displays

Add tnum class to KPI-style numbers, table cells with counts,
pricing, and star-count displays across the dashboard. Alignment is
silent but material — '4.7' and '1.2' now render at the same width."
```

---

## Task 15: Phase 1 verification gate

**Files:** no code changes — verification + bug-fix if needed.

- [ ] **Step 1: Full tsc + build**

```bash
npx tsc --noEmit
```
Expected: clean.

```bash
STRIPE_SECRET_KEY=sk_test_dummy STRIPE_WEBHOOK_SECRET=whsec_dummy STRIPE_PRICE_ID_MONTHLY=price_dummy STRIPE_PRICE_ID_ANNUAL=price_dummy NEXT_PUBLIC_APP_URL=https://replyfi.app npm run build
```
Expected: all pages build successfully; no new TypeScript errors.

- [ ] **Step 2: Desktop smoke test**

Run `npm run dev`. Visit each page and verify:

- [ ] `/dashboard` — hero row, action strip, recent reviews list visible. No console errors.
- [ ] `/dashboard/reviews` — dense rows, eyebrow status chips, working tab switch.
- [ ] `/dashboard/analytics` — monochrome charts, eyebrow tooltips, KPI strip.
- [ ] Nav — 2px orange underline under active tab, no pill. Badges not glowing.

- [ ] **Step 3: iOS mobile smoke test (375px viewport)**

In Chrome DevTools, switch to responsive mode, set width to 375, height to 812, toggle "iPhone" user agent.

For each page above:
- [ ] No horizontal scrollbar appears
- [ ] Hero row stacks vertically on Dashboard
- [ ] Action strip on Dashboard scrolls horizontally with snap
- [ ] Recent reviews collapse to 2-line rows on Dashboard
- [ ] Reviews list rows collapse to 2-line rows
- [ ] Analytics KPI strip is 2×2 grid
- [ ] Mobile nav drawer opens, active row has left-rail, bg is slate-50, rows ≥48px tall
- [ ] Tapping a review row (if interactive) has no iOS tap-highlight flash
- [ ] No input/textarea triggers zoom on focus (16px minimum rule)

- [ ] **Step 4: Lighthouse spot-check (optional)**

Run Lighthouse on `/dashboard`. Expect: performance within 5 points of baseline, accessibility ≥ baseline, no new CLS issues.

- [ ] **Step 5: File any bugs found**

If any check fails, fix inline. Do not proceed to Phase 2 until all checkboxes above pass.

- [ ] **Step 6: Final commit + push**

If there were fix-ups during verification:
```bash
git add -u
git commit -m "fix(dashboard): phase 1 verification fixes"
```

Then push to remote:
```bash
git push
```

- [ ] **Step 7: Mark phase 1 done**

Update TodoWrite list: mark "Dashboard Premium Polish Phase 1" complete, note that Phase 2 (Grow / Competitors / Settings / Paywall / Trial banner) is a separate plan to be written later.

---

## Done

Phase 1 complete. The logged-in app now feels like a premium private dashboard, not a template. Phase 2 (written as a separate plan after Phase 1 merges) will apply the same system to Grow, Competitors, Settings, the Paywall modal, and the Trial banner.
