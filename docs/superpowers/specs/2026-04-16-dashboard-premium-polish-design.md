# Dashboard Premium Polish — Design Spec

> Owner: Josh Leon · Date: 2026-04-16 · Scope: logged-in dashboard

## 1. Goal

Make the logged-in app look and feel like a premium custom-built product
for service-business owners (salons, dentists, restaurants, auto shops,
real-estate, etc.) — not a generic SaaS template.

The decision: **the dashboard should feel like a well-designed private
dashboard a serious business owner opens with their morning coffee** —
closer in spirit to Mercury, Ramp, Copilot Money, or Things 3 than to
Linear or a hospitality/editorial layout.

Calm. Confident. Trustworthy. Information-dense but never cluttered. The
brand whispers; the data speaks.

---

## 2. Design Principles (in priority order)

1. **Mobile-first, iOS-Safari-first.** A large share of owners will
   open this on an iPhone between customers. Every layout decision is
   verified first at 375×812 (iPhone SE/Mini/12/13 mini baseline) and
   390×844 (iPhone 14/15), then scaled up. Safe-area insets, 44×44pt
   minimum touch targets, 100dvh (not 100vh) for full-height layouts,
   `-webkit-tap-highlight-color: transparent` on interactive
   elements, momentum scrolling preserved (no nested overflow traps).
2. **Data is the hero.** Numbers get the strongest typography on any
   given screen. Cards, chrome, and decoration serve the numbers.
3. **Restraint over decoration.** Orange is a signal, not a flourish.
   Shadows, gradients, and emoji are used sparingly and deliberately.
4. **Hierarchy through weight, not chrome.** One hero element per page.
   Two or three secondary. Tertiary gets quiet treatment. Today, every
   card shouts equally loud.
5. **Vertical-agnostic.** Nothing visual should code as "restaurant"
   (menu-card styling, serif display faces, plating imagery) or as any
   other single industry. A dentist and a wine bar should both open
   the dashboard and feel it was built for them.
6. **Trust first, delight second.** Animations and micro-interactions
   happen on explicit user action, not on page load. No auto-playing
   float/pulse/shimmer once the initial paint is done.
   **Exception:** The landing-page hero generation animation stays
   as-is. It's a conversion-critical moment that demonstrates the
   product. It is out of scope for this pass.

---

## 3. What We're Changing — and What We're Not

### Changing

- Typography system (Inter-only, tabular numerals, eyebrow labels)
- Card hierarchy (hero / standard / inset variants)
- Use of accent orange (rarer, more intentional)
- Shadow system (retire the ambient baseline shadow)
- Icon weight/consistency
- Page-level composition (one hero metric per page)
- Global nav active-state treatment
- Section divider treatment

### Not changing

- Brand palette (cream `#F8F6F3`, orange `#E05A28`, stone grays) — these
  are strong and ownable; keep
- Routes, data model, business logic — zero changes
- Landing/marketing pages — out of scope for this pass
- Dark mode — not in scope (doesn't exist today)

---

## 3.5 Mobile iOS — binding rules

The following are not suggestions. Every component and every page
composition in this spec has to satisfy them:

### 3.5.1 Touch targets

- **Minimum 44×44pt** for any tappable element per Apple HIG. Buttons,
  nav tabs, segmented controls, checkboxes, close buttons — all.
- Where visual size is smaller than 44pt (e.g. an ✕ icon at 16px), the
  **hit area** expands via padding or `::after` pseudo-element to
  44×44pt. The `Stars` filter segmented control is the most likely
  failure point; each star is a 44×44 tap target even though the icon
  renders at 20px.

### 3.5.2 Viewport & safe areas

- Root layout uses `min-h-dvh`, not `min-h-screen` / `100vh`. Already
  in place; keep.
- Fixed nav bar already accounts for `env(safe-area-inset-top)`. Keep.
- Bottom of the page (pagination, "Load more", floating buttons) must
  respect `env(safe-area-inset-bottom)` on iPhones with home indicators.
- **Horizontal scroll is forbidden on every page at 375px width.**
  Verification during implementation: at 375×812, no horizontal
  scrollbar appears on any page.

### 3.5.3 iOS Safari quirks we must survive

- **16px minimum font-size on all `<input>` / `<textarea>` / `<select>`**
  to prevent iOS zoom-on-focus. Body copy stays at 14px, but form
  inputs specifically are 16px. Already partially handled; audit
  during implementation.
- **`overflow-x: clip` on html/body**, not `hidden`. Already in place
  from a prior fix (`overflow-x: hidden` breaks iOS momentum scrolling
  and `position: sticky`). Keep.
- **`overflow-anchor: none` on html/body.** Already in place to prevent
  iOS scroll-anchoring from shifting position when counting-up
  animations change number widths. Keep.
- **Sticky elements**: test every `position: sticky` on iOS Safari;
  use `position: -webkit-sticky` fallback where needed. Nav is
  `position: fixed`, so sticky concerns are limited to the Reviews
  tab bar and Competitors first column.
- **`-webkit-tap-highlight-color: transparent`** on `<button>`,
  `<a>`, and anything with `role="button"`. Add as a global rule.

### 3.5.4 Responsive composition

- **Hero row** (see §9.1) stacks vertically below 768px — hero metric
  on top full-width, secondary metric below full-width.
- **Action strip** (§9.1) horizontally scrolls below 640px using
  snap-points (`scroll-snap-type: x mandatory`). Each action card
  becomes a snap item.
- **Tables** (Reviews, Recent reviews list) collapse to stacked rows
  below 640px — stars + avatar on line 1, quote + meta on line 2,
  right-aligned status badge moves to inline with avatar line.
- **Analytics charts** stay full-width at all breakpoints. X-axis
  labels thin out below 640px (every 2nd or 3rd label shown).
- **KPI strip** in Analytics (§9.3) becomes a 2×2 grid below 640px,
  not a 4-across horizontal strip.

### 3.5.5 Typography on mobile

- **Hero metric** scales down from 44px → 36px below 640px
- **Page title (H1)** scales down from 26px → 22px below 640px
- **Body / table data** stays at 14px / 13px — do not scale down on
  mobile (legibility > density on touch)
- **Eyebrow labels** stay at 11px — intentionally small, they work
  fine on mobile

### 3.5.6 Nav on mobile

- Top bar stays fixed at `env(safe-area-inset-top) + 64px` tall
- Horizontal tab row in the top bar becomes a drawer toggle on mobile
  (existing behavior; keep). Drawer opens from top with slide-down
  animation. Already implemented.
- Active-state treatment in mobile drawer: **2px orange left rail**
  on the active row, not a background fill (see §8.2)
- Drawer items are 48px tall (above 44pt minimum)

---

## 4. Typography System

### 4.1 Fonts

- **Inter** — everything. Weights 400 / 500 / 600. That's it. Retire the
  scattered 700 / 800 usage; 600 is maximum weight for UI.
- **Playfair Display** — remove from the dashboard entirely. If the font
  is still loaded for the landing page, the dashboard simply doesn't
  reference `font-display` / `font-serif`.
- **JetBrains Mono** — add. Used only for review IDs / timestamps /
  copy-paste values in settings. Never for body copy.

### 4.2 Type scale

All sizes in pixels. Line-heights tuned for dashboard density.

| Role | Size / Leading / Weight | Tracking | Example |
|------|-------------------------|----------|---------|
| Hero metric (KPI) | 44 / 48 / 600 | -0.02em | `4.7` |
| Page title (H1) | 26 / 32 / 600 | -0.01em | `Dashboard` |
| Section title (H2) | 17 / 24 / 600 | 0 | `Recent reviews` |
| Card title | 15 / 20 / 600 | 0 | `Rating breakdown` |
| Body | 14 / 20 / 400 | 0 | review text, descriptions |
| Body emphasis | 14 / 20 / 500 | 0 | inline highlights |
| Eyebrow label | 11 / 16 / 600 | 0.09em (uppercase) | `THIS WEEK` |
| Meta / caption | 12 / 16 / 400 | 0 | `2 days ago · Google` |
| Data in tables | 13 / 20 / 400 tnum | 0 | numbers in rows |

### 4.3 Tabular numerals

**Every cell that displays a number uses `font-variant-numeric:
tabular-nums`.** Today, the dashboard uses proportional digits
everywhere, which means `1.1` and `4.4` are different widths and columns
don't line up. Tabular numerals fix this silently and are the single
strongest "this feels premium" win in the whole pass.

Add `.tnum { font-variant-numeric: tabular-nums; }` as a global utility
and apply it to:
- All KPI numbers
- All table cells containing numbers
- Star ratings displayed as numbers (e.g. `4.6`)
- Chart axis labels
- Timestamps rendered as `3d ago` / `4h ago`
- Currency values (pricing, billing)

### 4.4 Eyebrow labels

Replace unstyled section labels with a consistent **eyebrow** treatment:

- 11px / 600 weight / uppercase / 0.09em letter-spacing
- Color: `--text-3` (#A8A29E)
- Used for: card headers, page section dividers, KPI labels

Example:

```
THIS WEEK
───────────
  4.7  ▲ 0.2
```

This is the single visual pattern most responsible for the
"private-dashboard / private-banking" feel.

---

## 5. Color Usage

### 5.1 Keep the palette, change the usage rules

Today, accent orange is used decoratively in ~40 places: tab pills,
trend arrows, icon tints, gradient text, active states, link underlines.

**New rule: orange is a signal for user intent or a single emphasized
datum.** Concretely:

| Allowed uses of accent orange | Disallowed |
|-------------------------------|------------|
| Primary call-to-action buttons | Decorative tints on icons |
| Active nav item (left-rail, see §8) | Gradient text |
| One KPI per page, when highlighted | Tab pill backgrounds |
| Active link underlines | Card borders (except paywall) |
| Trial banner background | Trend arrows (green/red instead) |
| Paywall modal focal point | Button hover states that aren't CTAs |

### 5.2 Adds to the token system

Append to `:root` in `app/globals.css`:

```css
/* Neutral grays — refined scale for new uses */
--slate-50:  #FAF8F5;  /* slightly cooler than bg, for inset panels */
--slate-100: #F0EDE8;  /* row hover backgrounds */
--slate-200: #E4DED8;  /* already exists as --border, keep */
--slate-300: #CEC8C1;  /* dividers on cards */
--slate-900: #0A0A0A;  /* already exists as --dark, keep */

/* Status (for trend indicators — data, not brand) */
--positive: #0B8A5B;  /* green, darker than default for WCAG */
--negative: #B8281E;  /* red, darker than default for WCAG */
--neutral:  #6B6862;  /* flat / no change */

/* New shadow: hover-only, no ambient baseline */
--shadow-hover: 0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);
```

### 5.3 Retire

- `.text-gradient-orange` — delete the utility, remove usages
- `.shadow-accent-lg` — retire; we no longer want glowing orange buttons
- All `bg-gradient-to-*` with orange stops in the dashboard — replace
  with flat colors

---

## 6. Card System

### 6.1 Today's problem

`components/ui/Card.tsx` is a single variant: white / 16px radius /
1px border / ambient shadow. It's applied everywhere. Every region on a
page looks equally important, which is the root "template feel."

### 6.2 New variants

Extend `Card` with a `variant` prop:

```tsx
type CardVariant = 'hero' | 'standard' | 'flat' | 'inset'
```

| Variant  | Background | Border            | Shadow              | Radius | Purpose |
|----------|------------|-------------------|---------------------|--------|---------|
| `hero`   | `#FFFFFF`  | none              | `--shadow-hover`    | 20px   | The single most important card on a page — the hero KPI block. |
| `standard` | `#FFFFFF` | 1px `--border`   | none (hover only)   | 16px   | Default — most cards on the page. |
| `flat`   | transparent | 1px `--border`   | none                | 12px   | Dense info sections that shouldn't compete. Blends into bg. |
| `inset`  | `--slate-50` | none            | none                | 12px   | Callouts inside other cards (e.g. a quote in a review card). |

### 6.3 Hover treatment

- `standard` gets a hover shadow (from `--shadow-hover`) **only if
  interactive** (i.e. wrapped in `<Link>` or has `onClick`). Static
  cards never show hover.
- `hero` does not change on hover.
- `flat` / `inset` never change on hover.

### 6.4 Retire

- `.card-hover` utility from `globals.css` — replaced by the hover logic
  above
- `shadow-card` as a default Tailwind shadow — keep the variable but
  stop applying it to every card

---

## 7. Icons

### 7.1 Today's problem

Heroicons outline @ stroke 1.75 are scattered across the dashboard.
They're fine individually but the cumulative effect is generic — every
AI-generated dashboard in 2024-2026 uses them.

### 7.2 New system

Adopt **Lucide icons** at stroke **1.5**, with a **curated set**:

```
Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Calendar,
Check, ChevronDown, ChevronRight, Copy, Download, ExternalLink, Eye,
Filter, HelpCircle, LayoutDashboard, LineChart, Link2, LogOut, Mail,
MessageSquare, MoreHorizontal, Pencil, Plus, RefreshCw, Search,
Settings, Share2, Sparkles, Star, Trash2, TrendingUp, Users, X
```

Size defaults: **16px** for inline icons, **20px** for card headers,
**24px** for empty-state illustrations.

### 7.3 Rules

- Icons never appear without text or aria-label
- Icons inherit `currentColor` from parent text — no per-icon fills in
  UI chrome (only in brand logos like the Google/Yelp marks, which
  stay as-is)
- Keep the existing hand-drawn GoogleLogo/YelpLogo/TripAdvisorLogo
  components — brand marks must stay on-brand

### 7.4 Star rating icon

Standardize to one component, `components/ui/Stars.tsx` (create from
scratch; today every page inlines its own SVG). Variants:

```
<Stars rating={4.6} size="sm" />   // 12px — table cells
<Stars rating={4.6} size="md" />   // 16px — review cards
<Stars rating={4.6} size="lg" />   // 20px — hero metric
```

Filled color stays amber `#F59E0B`; empty stays `--border`.

---

## 8. Global Nav

### 8.1 Today

Top bar with horizontal tabs (desktop) / hamburger drawer (mobile).
Active tab = orange pill background.

### 8.2 New treatment

**Desktop (≥768px):**
- Default tab: `--text-2` / 500 / no chrome
- Hover: `--text-1` / 500 / subtle `--slate-100` bg
- **Active: `--text-1` / 600 / 2px orange underline beneath the tab,
  no background fill**

This is the single change that reads most "bank/finance" vs. "SaaS."
The pill is the most-template-y piece of UI in the app.

**Mobile drawer (<768px):**
- Drawer slide-down from top (existing animation, keep)
- Each drawer row is 48px tall (above 44pt minimum touch target)
- Default row: `--text-1` / 500 / no chrome
- Active row: `--text-1` / 600 / **2px orange left rail** (vertical
  orientation equivalent of the underline) + subtle `--slate-50` bg
- Row hover/press: `--slate-100` bg
- Rows have `-webkit-tap-highlight-color: transparent`
- Drawer close button (✕) is top-right, 44×44pt tap area

---

## 9. Page-Level Composition

### 9.1 Dashboard home (`/dashboard`)

Today: several equal-weight cards and panels. No focal point.

New composition, top to bottom:

1. **Hero row** — two-column, left-heavy on desktop (≥768px)
   - Left (2/3): big `hero` card with the single hero metric — most
     recent average rating, last-30-days. Number in 44px tnum (36px on
     mobile). Eyebrow above ("RATING — LAST 30 DAYS"). Delta chip to
     the right ("▲ 0.2 from previous 30d"). Below: a tiny 30-day
     sparkline.
   - Right (1/3): `standard` card — "Review volume" with count + 
     sparkline. Secondary metric.
   - **Mobile (<768px):** stacks vertically, hero on top, secondary
     below. Both full-width. Sparklines redraw to fit new width.
2. **Action strip** — single horizontal bar, `flat` variant with inset
   padding. Three small cards side-by-side: Unreplied count, Pending
   AI-drafted replies, Next sync time. Each is clickable to the
   relevant page.
   - **Mobile (<640px):** becomes a horizontal scroller with
     `scroll-snap-type: x mandatory`. Each action card is a snap item,
     80% of viewport wide. Scroll indicator dots (3 dots) below the
     strip. No horizontal page overflow.
3. **Recent reviews** — table-style list, not card-in-card. Five rows
   max.
   - **Desktop:** each row is a horizontal strip — avatar / name /
     stars / one-line quote / platform badge / date, single line.
   - **Mobile (<640px):** two-line row — avatar + name + stars + status
     on line 1, quote + platform + date on line 2. Tap row to expand
     to full review + reply inline.
4. **Setup panel** (only if incomplete) — keeps today's logic but
   becomes a single `hero` card when shown, not a floating CTA stack.
   Full-width on mobile, centered with max-width on desktop.

### 9.2 Reviews (`/dashboard/reviews`)

Today: cards for each review, verbose.

New:
- **Keep** the pending/approved/dismissed tab structure.
- **Denser row treatment** — each review is a row in a bordered list,
  not an individual card with padding + shadow. Rows separated by
  `--divider`, not gaps.
- **One review card expands on click** — inline, not a modal. Full
  review + reply editor below the row.
- **Status badge** at the right — small uppercase eyebrow chip. `PENDING`
  / `APPROVED` / `DISMISSED`. No emoji status indicators.
- **Star filter** becomes a `Stars`-based segmented control: ☆1 ☆2 ☆3 ☆4 ☆5.
  Each star is a 44×44pt tap target on mobile.
- **Search bar** gets `⌘K` keyboard shortcut on desktop. On mobile, a
  search icon in the top of the tab bar toggles a full-width search
  input below the tabs.

**Mobile (<640px) specifics:**
- Tab bar (pending/approved/dismissed) is horizontally scrollable with
  snap-points if it overflows. Keeps tab labels legible at small sizes.
- Row layout collapses to two lines: avatar + name + stars on line 1;
  one-line quote + platform + date on line 2. Status badge moves to
  line 1 right-aligned.
- Tapping a row expands it full-width inline. Reply editor uses a
  16px input font-size to prevent iOS zoom-on-focus.
- "Approve" / "Dismiss" / "Copy reply" actions in the expanded view
  are horizontal and each is at least 44pt tall.

### 9.3 Analytics (`/dashboard/analytics`)

Today: Recharts with colorful styling + gradient text headers.

New:
- **Charts go monochromatic with a single orange accent line** — the
  primary series is `--text-1`, the comparison series is `--slate-300`.
  The one highlighted datum (e.g. "today") gets `--accent`.
- **Remove the gradient-text H1** — plain `Analytics` in H1 style.
- **Tabular numerals on all axis labels and tooltips.**
- **Tooltips** get a redesigned shell: white card / 1px border /
  `--shadow-hover` / 12px radius / 12px padding. Contents: eyebrow
  label + number in tnum + tiny comparison below.
- **KPI strip at the top** — 4 small cards, same style as Dashboard's
  action strip, showing: avg rating, total reviews, reply rate, 
  response time (if tracked).
- **PDF export button** — keep, but move to a `secondary` button in the
  top-right instead of the bespoke orange CTA it is today.

**Mobile (<640px) specifics:**
- KPI strip becomes a 2×2 grid, not a 4-across horizontal strip.
- Charts stay full-width — explicitly set `ResponsiveContainer`
  `width="100%"` and ensure parent card has no horizontal padding
  eating into chart width.
- X-axis labels thin out on narrow widths: Recharts `interval`
  prop set to `preserveStartEnd` on <640px, `0` (show all) ≥640px.
  Smaller `fontSize={10}` on mobile, `12` on desktop.
- Touch hover on charts: Recharts mobile touch is flaky on iOS
  Safari — use `<Tooltip trigger="click">` pattern where available
  or ensure tap outside chart dismisses the tooltip.
- PDF export button stays visible but full-width at the bottom of
  the chart stack, not top-right (top-right collides with page title
  on narrow viewports).

### 9.4 Global Nav / Mobile drawer

See §8. The nav is shared across pages, so shipping it in Phase 1
upgrades every page at once.

---

## 10. Component Changes (summary)

### New components

- `components/ui/Eyebrow.tsx` — the small-caps label (§4.4)
- `components/ui/KPI.tsx` — big tnum number + eyebrow + optional delta
  chip. Variants: `hero` (44px) and `secondary` (28px).
- `components/ui/Stars.tsx` — unified star rating (§7.4)
- `components/ui/Delta.tsx` — `▲ 0.2` / `▼ 0.1` / `—` chip with color
  per direction
- `components/ui/SectionDivider.tsx` — hairline rule with an optional
  centered eyebrow label

### Modified components

- `components/ui/Card.tsx` — add `variant` prop (§6.2)
- `components/ui/Button.tsx` — tighten type scale (§4.2), remove `shadow-accent-lg`
- `components/Nav.tsx` — new active-state treatment (§8.2)

### Modified globals

- `tailwind.config.ts` — add tabular-num utility mapping, new slate scale
- `app/globals.css` — add `.tnum`, new shadow var, retire gradient text
  and `shadow-accent-lg` utilities

---

## 11. Scope — Two Phases

### Phase 1 (this spec's implementation plan)

- Type system + eyebrow + tnum utility
- Card variants + shadow rework
- Lucide icon migration (curated set only)
- `Stars` / `KPI` / `Delta` / `Eyebrow` / `SectionDivider` primitives
- Global Nav rework
- Page reworks: **Dashboard home, Reviews, Analytics**

This is the 80% of dashboard time-on-site.

### Phase 2 (separate plan, not yet written)

- Grow (3 sub-tabs)
- Competitors
- Settings (4 sub-tabs)
- Paywall modal restyle
- Trial banner restyle
- Onboarding flow (if time)

---

## 12. Out of Scope

- **Landing page / marketing surface — no changes.** This includes the
  hero generation animation (the typing → generating → revealing
  review cycle). It's a conversion-critical moment that demonstrates
  the product in motion; it stays exactly as it is today.
- **Mobile iOS/Android native apps** — don't exist. Mobile web on iOS
  Safari is in scope (see §3.5); native apps are not.
- Dark mode — not building
- Illustrated empty states — we commit to type-driven empty states
  (single sentence + single action) and skip illustration work
- New feature work — zero; pure surface redesign
- Accessibility regressions — we keep every existing `aria-*` / focus
  behavior; the design changes are visual, not structural

---

## 13. Self-Review Checklist

- [x] Every section has concrete visual decisions, no "TBD"
- [x] Type scale is exhaustive (no unspecified sizes)
- [x] Color tokens have hex values
- [x] Shadow values have actual CSS
- [x] Page compositions are specified as ordered sections
- [x] Retired items are listed explicitly
- [x] Scope fence between Phase 1 and Phase 2 is clear
- [x] No restaurant-specific design language
- [x] No illustration / image assets required that don't already exist

---

## 14. Open Questions (for Josh)

None required to proceed. If any of these land differently than you
expect when you review, flag and we'll adjust:

1. Accent-orange restraint is aggressive — if it feels "too gray" in
   practice we can re-introduce orange on KPI hero numbers
2. Retiring all ambient shadows in favor of hover-only is a strong
   stance; some users read shadows as "this is clickable." We'll watch
   for that in the hero pass.
3. The `tnum` change is silent but material — you'll feel it more than
   see it consciously.
