# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize theme tokens, fix the most visible design-system drift, kill iOS zoom and pinch-zoom violations sitewide, and harden `next.config.js` for the rest of the polish pass.

**Architecture:** Promote `app/globals.css` `:root` CSS variables to the single source of truth and rewrite `tailwind.config.ts` to read from them. Sweep duplicate utilities. Apply 16px minimum font-size at the form primitive level so every page inherits the iOS-zoom fix without per-page edits.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, TypeScript, CSS variables.

**Verification model:** This codebase has no test runner. Each task ends with `npx tsc --noEmit` and (where the change is structural) `npm run build`. Visual verification is manual — load the listed routes locally with `npm run dev`. Commits happen at the end of each task block.

---

## File map

| File | Change |
| --- | --- |
| `app/globals.css` | Add radius/shadow tokens, remove duplicate `.shadow-card` utilities |
| `tailwind.config.ts` | Rewrite `colors`/`boxShadow` to read from CSS variables |
| `app/layout.tsx` | Remove `maximumScale: 1` |
| `components/ui/Input.tsx` | Bump body text to 16px on mobile, add `inputMode`/`autoCapitalize` defaults |
| `components/ui/Select.tsx` | Match Input's focus-ring opacity, radius, label color, 16px on mobile |
| `components/ui/Textarea.tsx` | Match Input's focus-ring opacity (currently `/20`, should be `/25`), 16px on mobile |
| `components/ui/Toggle.tsx` (NEW) | Replace bespoke toggles; off-state uses `bg-surface` not `border` |
| `components/Logo.tsx` (NEW) | Promote `Nav.tsx::LogoMark` into a shared component |
| `app/(auth)/login/page.tsx` | Replace bespoke `Logo` with shared `<Logo />` |
| `app/(auth)/signup/page.tsx` | Replace bespoke `Logo` with shared `<Logo />` |
| `app/(auth)/forgot-password/page.tsx` | Replace bespoke `Logo`, add `shadow-modal` if missing |
| `app/(auth)/reset-password/page.tsx` | Replace bespoke `Logo`, add `shadow-modal` if missing |
| `next.config.js` | Add image patterns, compress, optimizePackageImports, reactStrictMode |

---

## Task 1: Lift CSS variables into the single source of truth

**Files:**
- Modify: `app/globals.css` (the existing `:root` block, add tokens; remove duplicate `.shadow-card` / `.shadow-card-hover` utilities later in the file)
- Modify: `tailwind.config.ts` (rewrite `colors` and `boxShadow` to read from CSS vars)

- [ ] **Step 1: Add radius and shadow tokens to `:root`**

In `app/globals.css`, find the `:root {` block (currently ends with `--accent-border: #F5C9AD;`). Append these tokens before the closing `}`:

```css
  /* Radii — used by Tailwind via theme.borderRadius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;

  /* Shadows — used by Tailwind via theme.boxShadow */
  --shadow-card:       0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05);
  --shadow-card-hover: 0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
  --shadow-modal:      0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08);
  --shadow-accent:     0 2px 12px rgba(224,90,40,0.30);

  /* Focus ring */
  --ring-accent: 0 0 0 2px rgba(224,90,40,0.25);
```

- [ ] **Step 2: Delete the duplicate `.shadow-card` / `.shadow-card-hover` utilities from globals.css**

Find this block in `app/globals.css` (inside `@layer utilities`):

```css
  /* premium card shadow system */
  .shadow-card       { box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05); }
  .shadow-card-hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04); }
```

Delete both lines (Tailwind generates these from `boxShadow.card` / `boxShadow.card-hover`, and we're about to wire those into the variables in the next step).

- [ ] **Step 3: Rewrite `tailwind.config.ts` colors to read from CSS variables**

Replace the existing `colors` block with:

```ts
      colors: {
        background: 'var(--bg)',
        card:       'var(--card)',
        surface:    'var(--surface)',
        border:     'var(--border)',
        divider:    'var(--divider)',
        text: {
          DEFAULT:    'var(--text-1)',
          1:          'var(--text-1)',
          2:          'var(--text-2)',
          3:          'var(--text-3)',
          placeholder:'var(--text-ph)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover:   'var(--accent-hover)',
          light:   'var(--accent-light)',
          border:  'var(--accent-border)',
          50:      '#FEF0E8',
          100:     '#FCDCCA',
          500:     '#E05A28',
          600:     '#C94E21',
          700:     '#A83E18',
        },
      },
```

The numbered accent shades (`50`, `100`, etc.) stay as raw hex because they don't have CSS-var equivalents yet and are referenced in scattered components. We'll consolidate them in a follow-up if needed.

- [ ] **Step 4: Rewrite `tailwind.config.ts` boxShadow to read from CSS variables**

Replace the existing `boxShadow` block with:

```ts
      boxShadow: {
        card:        'var(--shadow-card)',
        'card-hover':'var(--shadow-card-hover)',
        modal:       'var(--shadow-modal)',
        accent:      'var(--shadow-accent)',
      },
```

- [ ] **Step 5: Verify the build still compiles**

Run:

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit
```

Expected: clean (no output, exit 0).

```bash
cd "/Users/joshleon/Table Reply" && npm run build
```

Expected: `Compiled successfully`. The "Generating static pages" stage may complete with warnings for routes that hit Supabase at build time — those are pre-existing and not introduced by this task. Confirm no new errors mention `colors.accent.DEFAULT` or `boxShadow.modal`.

- [ ] **Step 6: Smoke-test in dev**

Run `npm run dev` and load:
- `/` (landing)
- `/login`
- `/dashboard` (will redirect to login if not signed in — that's fine)

Confirm: backgrounds are `#F8F6F3`, accent buttons are orange, cards have shadows, no console errors about missing classes.

- [ ] **Step 7: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add app/globals.css tailwind.config.ts
git commit -m "feat(theme): centralize design tokens via CSS variables

Promote app/globals.css :root variables to the single source of
truth for color, radius, shadow, and focus-ring tokens. Rewrite
tailwind.config.ts to reference those variables. Remove the
duplicate .shadow-card / .shadow-card-hover utility blocks from
globals.css (Tailwind now generates them from boxShadow.card)."
```

---

## Task 2: Remove `maximumScale: 1` from the root viewport

**Files:**
- Modify: `app/layout.tsx:15-22`

- [ ] **Step 1: Edit the viewport export**

In `app/layout.tsx`, find the `viewport` export and remove `maximumScale: 1`. The file ends up:

```ts
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // Cover extends page behind the iOS notch/status bar so we can
  // fill the gap with the nav background using safe-area-inset-top
  viewportFit: 'cover',
}
```

- [ ] **Step 2: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Manual verification**

Run `npm run dev`, open Safari on an iPhone (or Chrome devtools mobile emulator), and try to pinch-zoom the landing page. Expected: zoom works (previously was blocked).

- [ ] **Step 4: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add app/layout.tsx
git commit -m "fix(a11y): allow pinch-zoom on all pages

Remove maximumScale:1 from the root viewport. Blocking pinch-zoom
violates WCAG 2.1 SC 1.4.4 Resize Text (Level AA) and is hostile
to low-vision users."
```

---

## Task 3: Bump form primitives to 16px on mobile (kills iOS zoom)

**Files:**
- Modify: `components/ui/Input.tsx`
- Modify: `components/ui/Select.tsx`
- Modify: `components/ui/Textarea.tsx`

- [ ] **Step 1: Update `Input.tsx` to use a 16px minimum on mobile**

In `components/ui/Input.tsx`, the `<input>` currently has `text-sm` (14px). Replace `text-sm` with `text-base sm:text-sm`. Tailwind compiles `text-base` to `font-size: 1rem` (16px) below the `sm` breakpoint, then drops to 14px from `sm` (640px) up — desktop keeps the smaller text, mobile gets the iOS-safe size.

The full className becomes:

```tsx
className={cn(
  'w-full px-3.5 py-2.5 rounded-xl border text-text-1 text-base sm:text-sm placeholder:text-text-placeholder bg-white',
  'transition-all duration-150',
  'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent',
  'disabled:bg-surface disabled:cursor-not-allowed disabled:text-text-3',
  error
    ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400'
    : 'border-border hover:border-[#CEC8C1]',
  className
)}
```

Note the secondary cleanup: hard-coded hex colors (`#111`, `#C4BEB8`, `#E4DED8`, `#F3F0EC`, `#999`) are replaced with the new Tailwind token names from Task 1 (`text-text-1`, `text-text-placeholder`, `border-border`, `bg-surface`, `text-text-3`). The `#CEC8C1` hover stays as a hex because it's a one-off mid-tone we haven't tokenized yet.

- [ ] **Step 2: Add inputMode/autoCapitalize defaults to Input.tsx**

Still in `components/ui/Input.tsx`, derive sensible defaults from the `type` prop. Replace the function body so it computes them and merges with any caller-provided overrides:

```tsx
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, type, inputMode, autoCapitalize, autoCorrect, ...props }, ref) => {
    const t = type ?? 'text'
    const derived = (() => {
      if (t === 'email') return { inputMode: 'email' as const, autoCapitalize: 'none', autoCorrect: 'off' }
      if (t === 'url')   return { inputMode: 'url'   as const, autoCapitalize: 'none', autoCorrect: 'off' }
      if (t === 'tel')   return { inputMode: 'tel'   as const }
      if (t === 'number')return { inputMode: 'numeric' as const }
      return {}
    })()

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-[13px] font-medium text-text-1 mb-1.5">
            {label}
          </label>
        )}
        {hint && <p className="text-[12px] text-text-2 mb-1.5">{hint}</p>}
        <input
          ref={ref}
          id={id}
          type={t}
          inputMode={inputMode ?? derived.inputMode}
          autoCapitalize={autoCapitalize ?? derived.autoCapitalize}
          autoCorrect={autoCorrect ?? derived.autoCorrect}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-xl border text-text-1 text-base sm:text-sm placeholder:text-text-placeholder bg-white',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent',
            'disabled:bg-surface disabled:cursor-not-allowed disabled:text-text-3',
            error
              ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400'
              : 'border-border hover:border-[#CEC8C1]',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-[12px] text-red-500">{error}</p>}
      </div>
    )
  }
)
```

- [ ] **Step 3: Bring `Select.tsx` in line with `Input.tsx`**

Replace the `<select>` className in `components/ui/Select.tsx` to match the Input radius (`rounded-xl` not `rounded-lg`), focus-ring opacity (`/25` not `/20`), label color (`text-text-1` to match Input), padding (`px-3.5 py-2.5`), and the 16px-on-mobile fix:

```tsx
return (
  <div className="w-full">
    {label && (
      <label htmlFor={id} className="block text-[13px] font-medium text-text-1 mb-1.5">
        {label}
      </label>
    )}
    <select
      ref={ref}
      id={id}
      className={cn(
        'w-full px-3.5 py-2.5 border rounded-xl text-text-1 text-base sm:text-sm bg-white',
        'transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent',
        'disabled:bg-surface disabled:cursor-not-allowed',
        error ? 'border-red-400' : 'border-border hover:border-[#CEC8C1]',
        className
      )}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1.5 text-[12px] text-red-500">{error}</p>}
  </div>
)
```

- [ ] **Step 4: Bring `Textarea.tsx` in line with `Input.tsx`**

In `components/ui/Textarea.tsx`, change `focus:ring-[#E05A28]/20` to `focus:ring-accent/25`, swap hex colors to tokens, and add the 16px-on-mobile fix:

```tsx
className={cn(
  'w-full px-3.5 py-3 rounded-xl border text-text-1 text-base sm:text-sm placeholder:text-text-placeholder bg-white resize-y',
  'transition-all duration-150',
  'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent',
  'disabled:bg-surface disabled:cursor-not-allowed',
  error ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : 'border-border hover:border-[#CEC8C1]',
  className
)}
```

Also change the label color to `text-text-1` and hint to `text-text-2` for consistency with Input.

- [ ] **Step 5: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean.

- [ ] **Step 6: Manual verification on a real iPhone**

Open `/login` on an iPhone (or use Safari devtools' "Responsive Design Mode" with an iPhone preset). Tap the email field. Expected: NO zoom occurs (previously the page would zoom in on focus).

- [ ] **Step 7: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add components/ui/Input.tsx components/ui/Select.tsx components/ui/Textarea.tsx
git commit -m "fix(forms): unify primitives, kill iOS zoom on focus

- Bump form fields to 16px on mobile (Tailwind text-base sm:text-sm)
  so iOS Safari stops auto-zooming when the field receives focus.
- Unify focus-ring opacity (accent/25), radius (rounded-xl), label
  colors, and padding across Input/Select/Textarea.
- Auto-derive inputMode and autoCapitalize='none' on email/url
  inputs so users get the right mobile keyboard and aren't auto-
  capitalized into typos.
- Replace hard-coded hex colors with the new Tailwind tokens."
```

---

## Task 4: Promote `LogoMark` into a shared component

**Files:**
- Create: `components/Logo.tsx`
- Modify: `components/Nav.tsx` (re-export from new location, keep backward-compat alias)
- Modify: `app/(auth)/login/page.tsx` (delete bespoke `Logo`, import shared)
- Modify: `app/(auth)/signup/page.tsx` (delete bespoke `Logo`, import shared)
- Modify: `app/(auth)/forgot-password/page.tsx` (delete bespoke `Logo`, import shared)
- Modify: `app/(auth)/reset-password/page.tsx` (delete bespoke `Logo`, import shared)

- [ ] **Step 1: Create `components/Logo.tsx`**

Write the file:

```tsx
// components/Logo.tsx
//
// Single source of truth for the ReplyFi logo. Two variants:
//   <Logo />       — wordmark + glyph (use in headers, auth pages)
//   <LogoMark />   — glyph only (use in nav, favicon-style spots)
//
// The two-bubble glyph represents customer review (back) + business reply (front).

interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 28, className = '' }: LogoMarkProps) {
  return (
    <div
      className={`rounded-[8px] bg-accent flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        style={{ width: size * 0.62, height: size * 0.62 }}
        aria-hidden="true"
      >
        {/* Back bubble — customer review */}
        <path
          d="M2 1.5h9A1.5 1.5 0 0112.5 3v5A1.5 1.5 0 0111 9.5H7l-2 2v-2H2A1.5 1.5 0 01.5 8V3A1.5 1.5 0 012 1.5z"
          fill="white"
          fillOpacity="0.5"
        />
        {/* Front bubble — restaurant reply */}
        <path
          d="M8 8h9.5A1.5 1.5 0 0119 9.5v5A1.5 1.5 0 0117.5 16H16v2.5l-3-2.5H8A1.5 1.5 0 016.5 14.5v-5A1.5 1.5 0 018 8z"
          fill="white"
        />
      </svg>
    </div>
  )
}

interface LogoProps {
  size?: number
  className?: string
}

export default function Logo({ size = 30, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="text-[16px] font-bold text-text-1 tracking-tight">ReplyFi</span>
    </div>
  )
}
```

- [ ] **Step 2: Re-export from Nav.tsx for backward compat**

In `components/Nav.tsx`, replace the existing `LogoMark` definition (lines 11-37) with a re-export so existing imports keep working:

```tsx
// Re-export from shared module for backward compatibility.
export { LogoMark } from '@/components/Logo'
```

- [ ] **Step 3: Delete bespoke Logos in auth pages and import the shared one**

In each of `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`, `app/(auth)/forgot-password/page.tsx`, `app/(auth)/reset-password/page.tsx`:

1. Delete the local `function Logo() { ... }` block.
2. Add `import Logo from '@/components/Logo'` at the top with the other imports.
3. The `<Logo />` JSX call sites stay the same (component name is identical).

- [ ] **Step 4: Verify shadow-modal is applied on every auth card**

Open each of the four auth files above and confirm the card div has `shadow-modal` in its className. The login and signup files already have it (`bg-white rounded-2xl border border-[#E4DED8] shadow-modal p-6 sm:p-8`). For `forgot-password/page.tsx` and `reset-password/page.tsx`, if `shadow-modal` is missing, add it. Also swap the hard-coded `border-[#E4DED8]` for `border-border` while you're in there.

- [ ] **Step 5: Verify the build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean. If you see `Module not found: Can't resolve '@/components/Logo'`, the file path is wrong — check `tsconfig.json` for the `@/*` alias mapping.

- [ ] **Step 6: Smoke test**

`npm run dev`, then load `/login`, `/signup`, `/forgot-password`, `/reset-password`. Expected: every page shows the same two-bubble glyph (no more single-stroke bespoke icon on auth) and the card has a clear modal-strength shadow.

- [ ] **Step 7: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add components/Logo.tsx components/Nav.tsx \
  app/\(auth\)/login/page.tsx app/\(auth\)/signup/page.tsx \
  app/\(auth\)/forgot-password/page.tsx app/\(auth\)/reset-password/page.tsx
git commit -m "refactor(brand): single Logo component for nav + auth

The bespoke Logo on each auth page used a different SVG glyph
than the rest of the app. Promote Nav.tsx::LogoMark into a
shared components/Logo.tsx and use it everywhere. Re-export
from Nav for backward compat."
```

---

## Task 5: Harden `next.config.js`

**Files:**
- Modify: `next.config.js`

- [ ] **Step 1: Replace the file body**

`next.config.js` is currently almost empty. Replace its body with:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Google avatar (used in OAuth profile pics)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Supabase storage (review photos, profile pics)
      { protocol: 'https', hostname: '*.supabase.co' },
      // Unsplash (landing-page imagery)
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
}

module.exports = nextConfig
```

- [ ] **Step 2: Verify the build still passes with strict mode on**

```bash
cd "/Users/joshleon/Table Reply" && npm run build
```

Expected: `Compiled successfully`. React Strict Mode runs effects twice in dev only — it does NOT change build output. If the build now fails with a TypeScript error in a route that wasn't previously checked, treat that as a real bug surfaced by the upgrade and fix it inline (or note it and move on if it's clearly out of scope; the build only fails for true type errors, not strict-mode runtime warnings).

- [ ] **Step 3: Verify dev server starts**

```bash
cd "/Users/joshleon/Table Reply" && npm run dev
```

Expected: server listens on `http://localhost:3000`. Load `/` and confirm it renders. Stop the server.

- [ ] **Step 4: Commit**

```bash
cd "/Users/joshleon/Table Reply"
git add next.config.js
git commit -m "chore(next): enable strict mode, compression, image patterns

- reactStrictMode catches double-effect bugs early
- compress: true serves gzipped responses
- poweredByHeader: false drops the X-Powered-By: Next.js header
- images.remotePatterns whitelists Google avatar, Supabase
  storage, and Unsplash so next/image stops blocking them
- optimizePackageImports for lucide-react, recharts, date-fns
  trims dead code from named-import barrels"
```

---

## Task 6: Phase 1 verification gate

- [ ] **Step 1: Final type-check + build**

```bash
cd "/Users/joshleon/Table Reply" && npx tsc --noEmit && npm run build
```

Expected: clean.

- [ ] **Step 2: Manual smoke pass on the routes Phase 1 touched**

Run `npm run dev` and visually check:

| Route | Expect |
| --- | --- |
| `/` | Loads, accent buttons orange, no console errors |
| `/login` | Shared Logo glyph, shadow-modal on card, focus ring on email tab does not zoom on iPhone |
| `/signup` | Same as login |
| `/forgot-password` | Same as login |
| `/reset-password` | Same as login |
| `/dashboard` (after login) | Loads, nav still styled correctly with `LogoMark` |

- [ ] **Step 3: No additional commit — Phase 1 is complete**

The phase is delivered as the four feature commits from Tasks 1–5. Phase 2 starts in a separate plan.

---

## Self-review notes for this plan

- **Token consistency:** every reference to `text-text-1`, `bg-surface`, `border-border`, etc. is defined in Task 1, Step 3.
- **Backward compat:** the `LogoMark` re-export in Task 4 Step 2 ensures any existing `import { LogoMark } from '@/components/Nav'` keeps working.
- **iOS zoom fix:** applied at the primitive level (Task 3), so every page that uses `<Input>` / `<Select>` / `<Textarea>` inherits the fix automatically — no per-page sweep needed.
- **No placeholders:** every code change includes the concrete code; no "TBD" or "add appropriate handling".
- **Verification:** because the project has no test runner, `tsc --noEmit` + `next build` + manual route check is the gate. This is documented in the header so the engineer doesn't go looking for a `npm test` script.
