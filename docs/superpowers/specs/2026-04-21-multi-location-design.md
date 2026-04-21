# Multi-Location Design Spec
_Date: 2026-04-21_

## Overview

Allow a single business owner to manage reviews and replies across multiple physical locations of the same brand from one ReplyFi account. Billing is per-location; the first location is included in the base plan, each additional location increments the Stripe subscription quantity.

---

## Data Model

### `business_profiles` — two new columns (additive migration)

| Column | Type | Default | Notes |
|---|---|---|---|
| `location_label` | text | null | Human name for display, e.g. "Downtown", "Airport". Null on primary/only location. |
| `is_primary` | boolean | true | Marks the original onboarding location. New locations default to false. |

- Multiple rows per `user_id` are now valid. The code-level 1:1 assumption is removed everywhere.
- Voice style, reply tone, reply language, autopilot config, and review request templates are stored per-row. New locations inherit these values from the primary location at creation time.

### `google_business_tokens` — one new column

| Column | Type | Notes |
|---|---|---|
| `business_profile_id` | uuid (FK → business_profiles) | Scopes the token to a specific location. |

- Unique constraint changes from `(user_id)` to `(user_id, business_profile_id)`.
- The OAuth token (refresh_token, access_token) is the same Google account credential. The `business_profile_id` determines which GBP listing this row posts to.
- GBP reply posting looks up the token by `(user_id, business_profile_id)` instead of just `user_id`.

### `scraped_reviews` — no changes

Already has `business_profile_id`. Reviews are already correctly isolated per location.

### `profiles` / Stripe

- The Stripe subscription gains a quantity representing location count.
- Adding a location → quantity +1 (Stripe prorates the charge).
- Removing a location → quantity -1.
- First location is always included in the base plan unit price. The quantity starts at 1 at signup.

---

## Navigation & Location Switching

### Single-location users
UI is identical to today. No switcher, no extra chrome.

### Multi-location users (2+ locations)

A **location pill** appears in the sidebar nav below the logo. It shows the active location's label and opens a dropdown to switch locations.

Selecting a location sets a **server cookie** (`active_location_id`). All Next.js server components read this cookie to scope their Supabase queries. URLs remain clean — no query params.

### `/dashboard` — Aggregate Overview

Always shows all locations regardless of the active location cookie:
- Combined 30-day rating KPI and review volume KPI at the top.
- A row of **location cards** — each shows: location label, 30-day average rating, pending reply count, last sync time, "Manage →" link.
- An "Add location" button.

Clicking "Manage →" on a location card: sets that location as the active cookie value and navigates to `/dashboard/reviews` for that location.

### All other routes (`/dashboard/reviews`, `/dashboard/analytics`, `/settings`, etc.)
Scope to the active location via the cookie. Default: primary location if cookie is unset.

---

## Adding a Location

Triggered from "Add location" on the aggregate dashboard or the Locations tab in Settings.

### Step 1 — Pricing gate
A modal explains the per-location monthly cost. "Add location — $X/mo" calls `POST /api/locations/add` which:
1. Creates a new `business_profiles` row, copying voice/tone/autopilot settings from the primary.
2. Sets `is_primary = false`.
3. Increments the Stripe subscription quantity by 1 (Stripe prorates immediately).
4. Returns the new `location_id`.

### Step 2 — Setup form
A lightweight form (location label, Google Maps URL, Yelp URL optional). On save, triggers an initial scrape for the new location.

### Step 3 — GBP connection (optional)
After setup, prompts to connect Google Business Profile for this location. Same OAuth flow, but `locationId` is passed in the OAuth `state` param. The callback stores the GBP token scoped to that `business_profile_id`.

---

## Removing a Location

Available in the Locations settings tab.

- Confirmation required before deletion.
- Cannot remove the last remaining location.
- On confirm: deletes the `business_profiles` row (cascades to `scraped_reviews` and `google_business_tokens` for that location), decrements Stripe quantity by 1.

---

## Settings

- Existing settings page scopes to the active location (voice, tone, autopilot, URLs, GBP connection).
- New **Locations tab** lists all locations with: label, status (active/syncing), GBP connection status, "Edit" and "Remove" actions, and "Add location" button.

---

## API / Backend Changes

| Route | Change |
|---|---|
| `GET /dashboard` (server component) | Reads `active_location_id` cookie; aggregate view ignores it |
| `POST /api/locations/add` | New route — creates profile row + Stripe quantity increment |
| `DELETE /api/locations/[id]` | New route — deletes profile row + Stripe quantity decrement |
| `POST /api/scrape-reviews` | Already accepts `restaurantProfileId`; no change needed |
| `POST /api/reviews/approve` | Already uses `business_profile_id` to look up GBP token; needs token lookup updated to `(user_id, business_profile_id)` |
| `GET /api/auth/google-business/callback` | Reads `locationId` from OAuth state param; stores token with `business_profile_id` |
| `lib/gbp/client.ts` — `saveGbpToken` | Accepts `businessProfileId` param; upserts on `(user_id, business_profile_id)` |
| `lib/gbp/post-reply.ts` | Looks up token by `(userId, businessProfileId)` |
| All cron routes | Loop over all `business_profiles` per user instead of single profile fetch |

---

## Out of Scope

- Agency / multi-client management (different owners per location).
- Per-location voice/tone diverging from the brand default (can be added later).
- A combined cross-location reviews feed (can be added later as a filter option in `/dashboard/reviews`).
- Location-level Stripe subscriptions (one subscription per user, quantity-based).
