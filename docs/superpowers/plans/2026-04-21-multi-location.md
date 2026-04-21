# Multi-Location Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a single business owner to manage reviews and replies across multiple physical locations from one ReplyFi account, with per-location billing via Stripe quantity.

**Architecture:** Multiple `business_profiles` rows per user (one per physical location). Active location stored in a browser cookie (`active_location_id`) read by server components. `/dashboard` becomes an aggregate overview when 2+ locations exist; all other routes scope to the active location.

**Tech Stack:** Next.js 14 App Router, Supabase (server + admin clients), Stripe, TypeScript, Tailwind CSS.

---

## File Map

**New files:**
- `supabase/migrations/20260421000000_multi_location.sql`
- `lib/locations/active.ts`
- `app/api/locations/add/route.ts`
- `app/api/locations/[id]/route.ts`
- `app/api/locations/switch/route.ts`
- `components/LocationSwitcher.tsx`
- `app/(dashboard)/dashboard/LocationsOverview.tsx`

**Modified files:**
- `types/index.ts` — add `location_label`, `is_primary` to `BusinessProfile`
- `lib/gbp/client.ts` — all functions accept optional `businessProfileId`
- `lib/gbp/post-reply.ts` — add `businessProfileId` param
- `app/api/auth/google-business/route.ts` — pass `locationId` in OAuth state
- `app/api/auth/google-business/callback/route.ts` — parse `locationId` from state
- `app/api/auth/google-business/disconnect/route.ts` — scope by `locationId`
- `app/api/reviews/approve/route.ts` — pass `businessProfileId` to GBP functions
- `app/api/cron/autopilot/route.ts` — pass `businessProfileId` to GBP functions
- `components/Nav.tsx` — render `<LocationSwitcher />`
- `app/(dashboard)/dashboard/page.tsx` — aggregate vs single location routing
- `app/(dashboard)/dashboard/reviews/page.tsx` — filter by active location
- `app/(dashboard)/dashboard/analytics/page.tsx` — filter by active location
- `app/(dashboard)/settings/page.tsx` — filter by active location
- `app/(dashboard)/settings/SettingsPageClient.tsx` — Locations tab

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/20260421000000_multi_location.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260421000000_multi_location.sql

-- 1. Add location columns to business_profiles
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS location_label text,
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT true;

-- 2. Mark all existing rows as primary (they were the only location)
UPDATE business_profiles SET is_primary = true WHERE is_primary IS NULL OR is_primary = false;

-- 3. Add business_profile_id to google_business_tokens
ALTER TABLE google_business_tokens
  ADD COLUMN IF NOT EXISTS business_profile_id uuid
    REFERENCES business_profiles(id) ON DELETE CASCADE;

-- 4. Backfill: link each existing token to its user's primary business profile
UPDATE google_business_tokens gbt
SET business_profile_id = (
  SELECT id FROM business_profiles
  WHERE user_id = gbt.user_id
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE business_profile_id IS NULL;

-- 5. Drop old unique constraint on user_id alone, add compound unique
ALTER TABLE google_business_tokens
  DROP CONSTRAINT IF EXISTS google_business_tokens_user_id_key;

ALTER TABLE google_business_tokens
  ADD CONSTRAINT IF NOT EXISTS google_business_tokens_user_location_key
  UNIQUE (user_id, business_profile_id);

-- 6. Ensure scraped_reviews cascades when a business_profile is deleted
ALTER TABLE scraped_reviews
  DROP CONSTRAINT IF EXISTS scraped_reviews_business_profile_id_fkey;

ALTER TABLE scraped_reviews
  ADD CONSTRAINT scraped_reviews_business_profile_id_fkey
    FOREIGN KEY (business_profile_id) REFERENCES business_profiles(id) ON DELETE CASCADE;
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use the `mcp__f1a9aa3f-3415-4f4c-974c-64dd380a1cbd__apply_migration` tool with the SQL above against the linked project.

Verify by running:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'business_profiles' AND column_name IN ('location_label','is_primary');

SELECT column_name FROM information_schema.columns
WHERE table_name = 'google_business_tokens' AND column_name = 'business_profile_id';
```
Expected: 3 rows returned.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260421000000_multi_location.sql
git commit -m "feat(db): add location_label, is_primary to business_profiles; scope GBP tokens to location"
```

---

## Task 2: Type Updates

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Add fields to `BusinessProfile` interface**

In `types/index.ts`, update the `BusinessProfile` interface to add after `reply_preferences`:

```typescript
  location_label?: string | null
  is_primary?: boolean | null
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat(types): add location_label, is_primary to BusinessProfile"
```

---

## Task 3: Active Location Cookie Helper + Switch Route

**Files:**
- Create: `lib/locations/active.ts`
- Create: `app/api/locations/switch/route.ts`

- [ ] **Step 1: Create the cookie helper**

```typescript
// lib/locations/active.ts
import { cookies } from 'next/headers'

const COOKIE_NAME = 'active_location_id'

export function getActiveLocationId(): string | undefined {
  return cookies().get(COOKIE_NAME)?.value
}
```

- [ ] **Step 2: Create the switch route**

```typescript
// app/api/locations/switch/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { locationId } = await request.json().catch(() => ({}))
  if (!locationId) return NextResponse.json({ error: 'locationId required' }, { status: 400 })

  // Verify the location belongs to this user
  const { data: location } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('id', locationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!location) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const response = NextResponse.json({ ok: true })
  response.cookies.set('active_location_id', locationId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: 'lax',
  })
  return response
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add lib/locations/active.ts app/api/locations/switch/route.ts
git commit -m "feat(locations): active location cookie helper + switch route"
```

---

## Task 4: GBP Client — businessProfileId Support

**Files:**
- Modify: `lib/gbp/client.ts`
- Modify: `lib/gbp/post-reply.ts`

- [ ] **Step 1: Update `lib/gbp/client.ts`**

Replace the entire file with:

```typescript
// lib/gbp/client.ts
import { createClient } from '@supabase/supabase-js'

const GBP_BASE = 'https://mybusiness.googleapis.com/v4'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

export interface GbpToken {
  user_id: string
  business_profile_id: string | null
  access_token: string
  refresh_token: string
  expires_at: string
  account_name: string | null
  location_name: string | null
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function getGbpToken(userId: string, businessProfileId?: string): Promise<GbpToken | null> {
  const supabase = adminClient()
  let query = supabase
    .from('google_business_tokens')
    .select('*')
    .eq('user_id', userId)

  if (businessProfileId) {
    query = query.eq('business_profile_id', businessProfileId)
  }

  const { data } = await query.maybeSingle()
  return data ?? null
}

async function refreshAccessToken(token: GbpToken): Promise<GbpToken> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token,
      client_id: process.env.GOOGLE_BUSINESS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GBP token refresh failed: ${res.status} ${body.slice(0, 200)}`)
  }

  const json = await res.json()
  const expiresAt = new Date(Date.now() + json.expires_in * 1000).toISOString()

  const supabase = adminClient()
  // Update ALL rows for this user — the credential is shared across locations
  await supabase
    .from('google_business_tokens')
    .update({
      access_token: json.access_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', token.user_id)

  return { ...token, access_token: json.access_token, expires_at: expiresAt }
}

async function getValidToken(userId: string, businessProfileId?: string): Promise<GbpToken> {
  const token = await getGbpToken(userId, businessProfileId)
  if (!token) throw new Error('No GBP token for user')

  const expiresAt = new Date(token.expires_at).getTime()
  if (Date.now() >= expiresAt - 120_000) {
    return refreshAccessToken(token)
  }
  return token
}

export async function gbpFetch(
  userId: string,
  path: string,
  options: RequestInit = {},
  businessProfileId?: string,
): Promise<Response> {
  const token = await getValidToken(userId, businessProfileId)
  return fetch(`${GBP_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
}

export async function saveGbpToken(params: {
  userId: string
  businessProfileId: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  accountName: string | null
  locationName: string | null
}) {
  const supabase = adminClient()
  const expiresAt = new Date(Date.now() + params.expiresIn * 1000).toISOString()
  await supabase.from('google_business_tokens').upsert(
    {
      user_id: params.userId,
      business_profile_id: params.businessProfileId,
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      expires_at: expiresAt,
      account_name: params.accountName,
      location_name: params.locationName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,business_profile_id' },
  )
}

export async function deleteGbpToken(userId: string, businessProfileId?: string) {
  const supabase = adminClient()
  let query = supabase.from('google_business_tokens').delete().eq('user_id', userId)
  if (businessProfileId) {
    query = query.eq('business_profile_id', businessProfileId)
  }
  await query
}

export async function resolveAccountAndLocation(
  userId: string,
  businessProfileId?: string,
): Promise<{ accountName: string; locationName: string } | null> {
  const accRes = await gbpFetch(userId, '/accounts', {}, businessProfileId)
  if (!accRes.ok) {
    console.error('[gbp] Failed to list accounts:', await accRes.text())
    return null
  }
  const accJson = await accRes.json()
  const accounts: Array<{ name: string }> = accJson.accounts ?? []
  if (accounts.length === 0) return null

  const accountName = accounts[0].name
  const locRes = await gbpFetch(userId, `/${accountName}/locations?pageSize=1`, {}, businessProfileId)
  if (!locRes.ok) {
    console.error('[gbp] Failed to list locations:', await locRes.text())
    return null
  }
  const locJson = await locRes.json()
  const locations: Array<{ name: string }> = locJson.locations ?? []
  if (locations.length === 0) return null

  return { accountName, locationName: locations[0].name }
}
```

- [ ] **Step 2: Update `lib/gbp/post-reply.ts`**

Replace the entire file with:

```typescript
// lib/gbp/post-reply.ts
import { gbpFetch, getGbpToken } from './client'

export async function postGbpReply(
  userId: string,
  businessProfileId: string,
  googleReviewName: string,
  replyText: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = await getGbpToken(userId, businessProfileId)
  if (!token) {
    return { ok: false, error: 'No GBP token — user has not connected Google Business Profile for this location' }
  }

  try {
    const res = await gbpFetch(userId, `/${googleReviewName}/reply`, {
      method: 'PUT',
      body: JSON.stringify({ comment: replyText }),
    }, businessProfileId)

    if (res.ok) return { ok: true }

    const body = await res.json().catch(() => ({}))
    const msg = body?.error?.message ?? `HTTP ${res.status}`
    console.error('[gbp-post-reply] Failed:', res.status, msg)
    return { ok: false, error: msg }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[gbp-post-reply] Error:', msg)
    return { ok: false, error: msg }
  }
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 4: Update `lib/gbp/match-reviews.ts`**

Replace the function signature and token/fetch calls:

```typescript
// lib/gbp/match-reviews.ts
import { SupabaseClient } from '@supabase/supabase-js'
import { gbpFetch, getGbpToken } from './client'

interface GbpReview {
  name: string
  reviewer: { displayName: string }
  createTime: string
}

interface NewReview {
  id: string
  reviewer_name: string
  review_datetime_utc: string | null
}

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

function normalize(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export async function matchAndStoreGbpReviewNames(
  supabase: SupabaseClient,
  userId: string,
  businessProfileId: string,
  newReviewDbIds: string[],
) {
  if (newReviewDbIds.length === 0) return

  const token = await getGbpToken(userId, businessProfileId)
  if (!token?.account_name || !token?.location_name) return

  const locationName = token.location_name

  let gbpReviews: GbpReview[] = []
  try {
    const res = await gbpFetch(userId, `/${locationName}/reviews?pageSize=200`, {}, businessProfileId)
    if (!res.ok) {
      console.error('[gbp-match] Failed to fetch GBP reviews:', res.status, await res.text())
      return
    }
    const json = await res.json()
    gbpReviews = json.reviews ?? []
  } catch (err) {
    console.error('[gbp-match] Error fetching GBP reviews:', err)
    return
  }

  if (gbpReviews.length === 0) return

  const { data: scraped } = await supabase
    .from('scraped_reviews')
    .select('id, reviewer_name, review_datetime_utc')
    .in('id', newReviewDbIds)
    .is('google_review_name', null)

  if (!scraped || scraped.length === 0) return

  const gbpByName = new Map<string, GbpReview[]>()
  for (const r of gbpReviews) {
    const key = normalize(r.reviewer?.displayName ?? '')
    if (!gbpByName.has(key)) gbpByName.set(key, [])
    gbpByName.get(key)!.push(r)
  }

  for (const row of scraped as NewReview[]) {
    const key = normalize(row.reviewer_name ?? '')
    const candidates = gbpByName.get(key) ?? []
    if (candidates.length === 0) continue

    const scrapeTime = row.review_datetime_utc ? new Date(row.review_datetime_utc).getTime() : null

    let matched: GbpReview | null = null
    if (scrapeTime !== null) {
      matched = candidates.find((c) => Math.abs(new Date(c.createTime).getTime() - scrapeTime) <= TWO_DAYS_MS) ?? null
    } else {
      matched = candidates.length === 1 ? candidates[0] : null
    }

    if (!matched) continue

    await supabase
      .from('scraped_reviews')
      .update({ google_review_name: matched.name })
      .eq('id', row.id)
  }
}
```

**Also update the call site in `app/api/scrape-reviews/route.ts`:** find the call to `matchAndStoreGbpReviewNames` and add the `businessProfileId` argument (it is the `restaurantProfileId` already available in scope):

```typescript
await matchAndStoreGbpReviewNames(supabase, userId, restaurantProfileId, insertedIds)
```

- [ ] **Step 5: Commit**

```bash
git add lib/gbp/client.ts lib/gbp/post-reply.ts lib/gbp/match-reviews.ts
git commit -m "feat(gbp): scope token lookup and posting to businessProfileId"
```

---

## Task 5: GBP OAuth Routes + Approve Route

**Files:**
- Modify: `app/api/auth/google-business/route.ts`
- Modify: `app/api/auth/google-business/callback/route.ts`
- Modify: `app/api/auth/google-business/disconnect/route.ts`
- Modify: `app/api/reviews/approve/route.ts`

- [ ] **Step 1: Update OAuth initiation route**

Replace `app/api/auth/google-business/route.ts` with:

```typescript
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SCOPE = 'https://www.googleapis.com/auth/business.manage'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'GOOGLE_BUSINESS_CLIENT_ID not configured' }, { status: 500 })

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  const redirectUri = `${appUrl}/api/auth/google-business/callback`

  // locationId query param lets callers scope the OAuth to a specific location
  const locationId = request.nextUrl.searchParams.get('locationId')
  const state = locationId ? `${user.id}:${locationId}` : user.id

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}
```

- [ ] **Step 2: Update OAuth callback route**

Replace `app/api/auth/google-business/callback/route.ts` with:

```typescript
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { saveGbpToken, resolveAccountAndLocation } from '@/lib/gbp/client'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'

export async function GET(request: NextRequest) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  const { searchParams } = request.nextUrl

  const code = searchParams.get('code')
  const rawState = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    console.error('[gbp-callback] OAuth error:', error)
    return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
  }

  if (!code || !rawState) {
    return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
  }

  // state is either "userId" or "userId:locationId"
  const [userId, locationId] = rawState.split(':')

  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error('[gbp-callback] Missing client credentials')
    return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
  }

  const redirectUri = `${appUrl}/api/auth/google-business/callback`

  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    const body = await tokenRes.text()
    console.error('[gbp-callback] Token exchange failed:', tokenRes.status, body.slice(0, 300))
    return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
  }

  const tokens = await tokenRes.json()

  if (!tokens.refresh_token) {
    console.error('[gbp-callback] No refresh_token in response')
    return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
  }

  // Resolve businessProfileId: use locationId from state, or fall back to user's primary profile
  let businessProfileId = locationId
  if (!businessProfileId) {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: primary } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .maybeSingle()
    businessProfileId = primary?.id
  }

  if (!businessProfileId) {
    console.error('[gbp-callback] Could not resolve businessProfileId')
    return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=error`)
  }

  await saveGbpToken({
    userId,
    businessProfileId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in ?? 3600,
    accountName: null,
    locationName: null,
  })

  const resolved = await resolveAccountAndLocation(userId, businessProfileId)
  if (resolved) {
    await saveGbpToken({
      userId,
      businessProfileId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in ?? 3600,
      accountName: resolved.accountName,
      locationName: resolved.locationName,
    })
  }

  return NextResponse.redirect(`${appUrl}/settings?tab=integrations&gbp=connected`)
}
```

- [ ] **Step 3: Update disconnect route**

Replace `app/api/auth/google-business/disconnect/route.ts` with:

```typescript
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteGbpToken } from '@/lib/gbp/client'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { locationId } = await request.json().catch(() => ({}))
  await deleteGbpToken(user.id, locationId)

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Update approve route**

Replace `app/api/reviews/approve/route.ts` with:

```typescript
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { postGbpReply } from '@/lib/gbp/post-reply'
import { getGbpToken } from '@/lib/gbp/client'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reviewId, replyText } = await request.json().catch(() => ({}))
  if (!reviewId) return NextResponse.json({ error: 'reviewId is required' }, { status: 400 })

  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: review, error: fetchErr } = await supabaseAdmin
    .from('scraped_reviews')
    .select('id, user_id, business_profile_id, google_review_name, generated_reply, source')
    .eq('id', reviewId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchErr || !review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  const reply = replyText ?? review.generated_reply
  if (!reply) return NextResponse.json({ error: 'No reply text available' }, { status: 400 })

  const { error: updateErr } = await supabaseAdmin
    .from('scraped_reviews')
    .update({ reply_status: 'approved' })
    .eq('id', reviewId)
    .eq('user_id', user.id)

  if (updateErr) return NextResponse.json({ error: 'Failed to approve review' }, { status: 500 })

  let gbpPosted = false
  let gbpError: string | undefined

  if (review.source === 'google' && review.google_review_name && review.business_profile_id) {
    const token = await getGbpToken(user.id, review.business_profile_id)
    if (token) {
      const result = await postGbpReply(user.id, review.business_profile_id, review.google_review_name, reply)
      if (result.ok) {
        gbpPosted = true
        await supabaseAdmin
          .from('scraped_reviews')
          .update({ gbp_posted_at: new Date().toISOString() })
          .eq('id', reviewId)
      } else {
        gbpError = result.error
        console.warn('[reviews/approve] GBP post failed (non-fatal):', result.error)
      }
    }
  }

  return NextResponse.json({ approved: true, gbpPosted, gbpError })
}
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add app/api/auth/google-business/route.ts \
        app/api/auth/google-business/callback/route.ts \
        app/api/auth/google-business/disconnect/route.ts \
        app/api/reviews/approve/route.ts
git commit -m "feat(gbp): scope OAuth and reply posting to businessProfileId"
```

---

## Task 6: Cron Autopilot — GBP businessProfileId Fix

**Files:**
- Modify: `app/api/cron/autopilot/route.ts`

The autopilot cron already loops over business profiles. The only change needed is passing `profile.id` as `businessProfileId` to `getGbpToken` and `postGbpReply`.

- [ ] **Step 1: Find the GBP calls in autopilot cron**

```bash
grep -n "getGbpToken\|postGbpReply" "app/api/cron/autopilot/route.ts"
```

- [ ] **Step 2: Update `getGbpToken` call**

Find the line that calls `getGbpToken(profile.user_id)` and change it to:

```typescript
const token = await getGbpToken(profile.user_id, profile.id)
```

- [ ] **Step 3: Update `postGbpReply` call**

Find the line that calls `postGbpReply(profile.user_id, review.google_review_name, ...)` and change it to:

```typescript
const gbpResult = await postGbpReply(profile.user_id, profile.id, review.google_review_name, autoReply)
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add app/api/cron/autopilot/route.ts
git commit -m "fix(cron): pass businessProfileId to GBP token lookup and posting"
```

---

## Task 7: POST /api/locations/add

**Files:**
- Create: `app/api/locations/add/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// app/api/locations/add/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { locationLabel, googleMapsUrl, yelpUrl } = await request.json().catch(() => ({}))

  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Get primary profile to inherit voice/tone settings
  const { data: primary } = await supabaseAdmin
    .from('business_profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .maybeSingle()

  if (!primary) return NextResponse.json({ error: 'No primary location found' }, { status: 400 })

  // Create new location row inheriting brand settings
  const { data: newLocation, error: insertErr } = await supabaseAdmin
    .from('business_profiles')
    .insert({
      user_id: user.id,
      business_name: primary.business_name,
      business_type: primary.business_type,
      vibe: primary.vibe,
      voice_style: primary.voice_style,
      description: primary.description,
      owner_name: primary.owner_name,
      reply_language: primary.reply_language,
      reply_preferences: primary.reply_preferences,
      review_request_messages: primary.review_request_messages,
      location_label: locationLabel ?? null,
      is_primary: false,
      google_maps_url: googleMapsUrl ?? null,
      yelp_url: yelpUrl ?? null,
    })
    .select('id')
    .single()

  if (insertErr || !newLocation) {
    console.error('[locations/add] Insert failed:', insertErr)
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 })
  }

  // Stripe quantity increment (skip if no subscription — e.g. trial users)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      const item = sub.items.data[0]
      if (item) {
        await stripe.subscriptions.update(profile.stripe_subscription_id, {
          items: [{ id: item.id, quantity: (item.quantity ?? 1) + 1 }],
          proration_behavior: 'create_prorations',
        })
      }
    } catch (stripeErr) {
      // Non-fatal: location created, billing update failed — log for ops
      console.error('[locations/add] Stripe update failed:', stripeErr)
    }
  }

  // Kick off initial scrape for the new location
  if (newLocation.id) {
    fetch('/api/scrape-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, restaurantProfileId: newLocation.id }),
    }).catch(() => {})
  }

  return NextResponse.json({ locationId: newLocation.id })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/api/locations/add/route.ts
git commit -m "feat(locations): POST /api/locations/add — create location + Stripe quantity"
```

---

## Task 8: DELETE /api/locations/[id]

**Files:**
- Create: `app/api/locations/[id]/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// app/api/locations/[id]/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Verify ownership and get location info
  const { data: location } = await supabaseAdmin
    .from('business_profiles')
    .select('id, is_primary')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!location) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (location.is_primary) return NextResponse.json({ error: 'Cannot remove the primary location' }, { status: 400 })

  // Ensure this isn't the last location
  const { count } = await supabaseAdmin
    .from('business_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) <= 1) {
    return NextResponse.json({ error: 'Cannot remove the only location' }, { status: 400 })
  }

  // Delete location — cascades to scraped_reviews and google_business_tokens
  const { error: deleteErr } = await supabaseAdmin
    .from('business_profiles')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (deleteErr) {
    console.error('[locations/delete] Delete failed:', deleteErr)
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 })
  }

  // Stripe quantity decrement
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      const item = sub.items.data[0]
      if (item) {
        const newQty = Math.max(1, (item.quantity ?? 1) - 1)
        await stripe.subscriptions.update(profile.stripe_subscription_id, {
          items: [{ id: item.id, quantity: newQty }],
          proration_behavior: 'create_prorations',
        })
      }
    } catch (stripeErr) {
      console.error('[locations/delete] Stripe update failed:', stripeErr)
    }
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "app/api/locations/[id]/route.ts"
git commit -m "feat(locations): DELETE /api/locations/[id] — remove location + Stripe quantity"
```

---

## Task 9: LocationSwitcher Component + Nav Integration

**Files:**
- Create: `components/LocationSwitcher.tsx`
- Modify: `components/Nav.tsx`

- [ ] **Step 1: Create `components/LocationSwitcher.tsx`**

```typescript
// components/LocationSwitcher.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Location {
  id: string
  business_name: string
  location_label: string | null
  is_primary: boolean | null
}

export default function LocationSwitcher() {
  const [locations, setLocations] = useState<Location[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('business_profiles')
        .select('id, business_name, location_label, is_primary')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })

      if (data) setLocations(data)
    }

    // Read current active location from cookie
    const match = document.cookie.match(/(?:^|;\s*)active_location_id=([^;]+)/)
    if (match) setActiveId(match[1])

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Only show when user has 2+ locations
  if (locations.length < 2) return null

  const active = locations.find(l => l.id === activeId) ?? locations[0]
  const displayLabel = active.location_label ?? active.business_name

  const handleSwitch = async (locationId: string) => {
    if (locationId === activeId || switching) return
    setSwitching(true)
    setOpen(false)
    await fetch('/api/locations/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId }),
    })
    setActiveId(locationId)
    setSwitching(false)
    router.refresh()
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={switching}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3F0EC] border border-[#EDE6DC] text-[12px] font-medium text-[#57534E] hover:bg-[#EDE9E4] transition-colors disabled:opacity-60 max-w-[160px]"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#E05A28] flex-shrink-0" />
        <span className="truncate">{displayLabel}</span>
        <svg className={`w-3 h-3 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-[#EDE6DC] rounded-xl shadow-lg py-1.5 min-w-[180px] z-50 animate-fade-up">
          {locations.map(loc => {
            const label = loc.location_label ?? loc.business_name
            const isActive = loc.id === (activeId || locations[0]?.id)
            return (
              <button
                key={loc.id}
                onClick={() => handleSwitch(loc.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-left transition-colors hover:bg-[#F3F0EC] ${
                  isActive ? 'font-medium text-[#111]' : 'text-[#57534E]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-[#E05A28]' : 'bg-[#E4DED8]'}`} />
                <span className="truncate">{label}</span>
                {isActive && (
                  <svg className="w-3 h-3 text-[#E05A28] ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add LocationSwitcher to Nav**

In `components/Nav.tsx`, add the import at the top after existing imports:

```typescript
import LocationSwitcher from '@/components/LocationSwitcher'
```

In the desktop nav section, add `<LocationSwitcher />` after the logo and before the desktop links div. Find this block:

```typescript
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
              <LogoMark size={26} />
              <span className="text-[14px] font-bold text-[#111111] tracking-[-0.025em]">ReplyFi</span>
            </Link>

            {/* Desktop links */}
```

Replace with:

```typescript
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
              <LogoMark size={26} />
              <span className="text-[14px] font-bold text-[#111111] tracking-[-0.025em]">ReplyFi</span>
            </Link>

            {/* Location switcher — only visible when user has 2+ locations */}
            <LocationSwitcher />

            {/* Desktop links */}
```

Also add `<LocationSwitcher />` in the mobile drawer, inside the `<div className="px-3 py-2 space-y-0.5">` block after the `{displayName && ...}` pill:

```typescript
              {displayName && (
                <div className="px-4 pt-2 pb-1">
                  <span className="bg-[#F3F0EC] border border-[#E4DED8] rounded-full px-3 py-1 text-[12px] text-[#57534E] font-medium inline-block max-w-full truncate">
                    {displayName}
                  </span>
                </div>
              )}
              <div className="px-4 pt-1 pb-2">
                <LocationSwitcher />
              </div>
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add components/LocationSwitcher.tsx components/Nav.tsx
git commit -m "feat(nav): location switcher dropdown for multi-location users"
```

---

## Task 10: Aggregate Dashboard

**Files:**
- Create: `app/(dashboard)/dashboard/LocationsOverview.tsx`
- Modify: `app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Create `LocationsOverview.tsx`**

```typescript
// app/(dashboard)/dashboard/LocationsOverview.tsx
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import Stars from '@/components/ui/Stars'
import KPI from '@/components/ui/KPI'
import { Card } from '@/components/ui/Card'
import Delta from '@/components/ui/Delta'

interface Location {
  id: string
  business_name: string
  location_label: string | null
  last_scraped_at: string | null
}

function formatTimeAgo(isoStr: string | null): string {
  if (!isoStr) return 'never'
  try {
    const diff = Date.now() - new Date(isoStr).getTime()
    const hrs = Math.floor(diff / 3600000)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  } catch { return '' }
}

export default async function LocationsOverview({
  locations,
  userId,
  ownerName,
}: {
  locations: Location[]
  userId: string
  ownerName: string
}) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const THIRTY_D = 30 * 24 * 60 * 60 * 1000
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_D).toISOString()
  const sixtyDaysAgo = new Date(Date.now() - 2 * THIRTY_D).toISOString()

  // Fetch per-location stats in parallel
  const locationStats = await Promise.all(
    locations.map(async (loc) => {
      const [{ data: recentReviews }, { data: prevReviews }, { count: pendingCount }] = await Promise.all([
        supabaseAdmin
          .from('scraped_reviews')
          .select('star_rating')
          .eq('business_profile_id', loc.id)
          .gte('review_datetime_utc', thirtyDaysAgo),
        supabaseAdmin
          .from('scraped_reviews')
          .select('star_rating')
          .eq('business_profile_id', loc.id)
          .gte('review_datetime_utc', sixtyDaysAgo)
          .lt('review_datetime_utc', thirtyDaysAgo),
        supabaseAdmin
          .from('scraped_reviews')
          .select('id', { count: 'exact', head: true })
          .eq('business_profile_id', loc.id)
          .eq('reply_status', 'pending'),
      ])

      const recent = (recentReviews ?? []).map(r => r.star_rating).filter(Boolean)
      const prev = (prevReviews ?? []).map(r => r.star_rating).filter(Boolean)
      const avgRating = recent.length > 0 ? recent.reduce((a: number, b: number) => a + b, 0) / recent.length : 0
      const prevAvgRating = prev.length > 0 ? prev.reduce((a: number, b: number) => a + b, 0) / prev.length : 0

      return {
        ...loc,
        reviewCount: recent.length,
        avgRating: Number(avgRating.toFixed(1)),
        ratingDelta: Number((avgRating - prevAvgRating).toFixed(1)),
        pendingCount: pendingCount ?? 0,
      }
    })
  )

  // Combined stats across all locations
  const totalReviews = locationStats.reduce((a, s) => a + s.reviewCount, 0)
  const totalPending = locationStats.reduce((a, s) => a + s.pendingCount, 0)
  const allRatings = locationStats.flatMap(s => Array(s.reviewCount).fill(s.avgRating))
  const combinedAvg = allRatings.length > 0 ? allRatings.reduce((a: number, b: number) => a + b, 0) / allRatings.length : 0

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="pt-6 sm:pt-8">
        <h1 className="text-[22px] sm:text-[26px] text-[#111] leading-[1.15]" style={{ fontWeight: 600, letterSpacing: '-0.022em' }}>
          Welcome back{ownerName ? `, ${ownerName}` : ''}.
        </h1>
        <p className="text-[13px] text-[#57534E] mt-1.5">All locations overview.</p>
      </div>

      {/* Combined KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="hero" padding="lg" className="md:col-span-2">
          <KPI
            variant="hero"
            label="COMBINED RATING — LAST 30 DAYS"
            value={combinedAvg > 0 ? combinedAvg.toFixed(1) : '—'}
            sub={totalReviews > 0 ? `from ${totalReviews} review${totalReviews === 1 ? '' : 's'} across ${locations.length} locations` : 'No reviews in the last 30 days'}
          />
        </Card>
        <Card variant="standard" padding="lg">
          <KPI
            variant="secondary"
            label="PENDING REPLIES"
            value={totalPending}
            sub="across all locations"
          />
        </Card>
      </div>

      {/* Location cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-[#111]" style={{ letterSpacing: '-0.01em' }}>Your locations</h2>
          <Link href="/settings?tab=locations" className="text-[12px] font-medium text-[#57534E] hover:text-[#111] transition-colors">
            Manage locations →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {locationStats.map((loc) => (
            <div key={loc.id} className="bg-[#FEFCF8] border border-[#EDE6DC] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[14px] font-semibold text-[#111]">{loc.location_label ?? loc.business_name}</p>
                  <p className="text-[11px] text-[#A8A29E] mt-0.5">Last sync: {formatTimeAgo(loc.last_scraped_at)}</p>
                </div>
                {loc.pendingCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C47A1A] bg-[#FEF8EE] border border-[#F8E0B0] rounded-full px-2 py-0.5">
                    {loc.pendingCount} pending
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[22px] font-semibold text-[#111] tabular-nums" style={{ letterSpacing: '-0.02em' }}>
                  {loc.avgRating > 0 ? loc.avgRating.toFixed(1) : '—'}
                </div>
                {loc.avgRating > 0 && <Stars rating={loc.avgRating} size="sm" />}
                {loc.ratingDelta !== 0 && <Delta value={loc.ratingDelta} unit="" />}
              </div>
              <Link
                href="/dashboard/reviews"
                onClick={undefined}
                className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F3F0EC] hover:bg-[#EDE9E4] text-[12px] font-medium text-[#57534E] hover:text-[#111] transition-colors"
                data-location-id={loc.id}
              >
                Manage
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

> **Note on "Manage" link:** The `data-location-id` attribute is set for future client-side enhancement. For now, clicking "Manage" goes to `/dashboard/reviews` using whatever the current active location is. To switch and navigate in one click, wrap `LocationsOverview` in a client component or add a `ManageButton` client component that calls `/api/locations/switch` then navigates.

- [ ] **Step 2: Create `ManageLocationButton.tsx` for the Manage action**

```typescript
// app/(dashboard)/dashboard/ManageLocationButton.tsx
'use client'

import { useRouter } from 'next/navigation'

export default function ManageLocationButton({ locationId }: { locationId: string }) {
  const router = useRouter()

  const handleManage = async () => {
    await fetch('/api/locations/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId }),
    })
    router.push('/dashboard/reviews')
    router.refresh()
  }

  return (
    <button
      onClick={handleManage}
      className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F3F0EC] hover:bg-[#EDE9E4] text-[12px] font-medium text-[#57534E] hover:text-[#111] transition-colors"
    >
      Manage
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
    </button>
  )
}
```

Update the Manage button in `LocationsOverview.tsx` to use this component:

```typescript
import ManageLocationButton from './ManageLocationButton'
// ...
// Replace the <Link> Manage button with:
<ManageLocationButton locationId={loc.id} />
```

- [ ] **Step 3: Update `app/(dashboard)/dashboard/page.tsx`**

At the top of the file, add the import:

```typescript
import { getActiveLocationId } from '@/lib/locations/active'
import LocationsOverview from './LocationsOverview'
```

Replace the single-profile fetch:

```typescript
// OLD — fetch one profile
const { data: restaurantProfileCheck } = await supabase
  .from('business_profiles')
  .select('id')
  .eq('user_id', user.id)
  .maybeSingle()

if (!restaurantProfileCheck) redirect('/onboarding')
```

With:

```typescript
// NEW — fetch all profiles for this user
const { data: allLocations } = await supabase
  .from('business_profiles')
  .select('id, business_name, location_label, last_scraped_at, is_primary')
  .eq('user_id', user.id)
  .order('is_primary', { ascending: false })

if (!allLocations || allLocations.length === 0) redirect('/onboarding')

// Multiple locations → aggregate overview
if (allLocations.length > 1) {
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  // Ensure active location cookie is set
  const activeLocationId = getActiveLocationId()
  if (!activeLocationId || !allLocations.find(l => l.id === activeLocationId)) {
    // Default to primary — cookie will be set client-side by LocationSwitcher on first render
  }

  return (
    <LocationsOverview
      locations={allLocations}
      userId={user.id}
      ownerName={ownerProfile?.full_name ?? ''}
    />
  )
}

// Single location — existing flow
const restaurantProfileCheck = allLocations[0]
```

Then update the remaining `business_profiles` fetch to use `restaurantProfileCheck.id`:

Find:
```typescript
supabase.from('business_profiles').select('*').eq('user_id', user.id).maybeSingle(),
```

Replace with:
```typescript
supabase.from('business_profiles').select('*').eq('id', restaurantProfileCheck.id).maybeSingle(),
```

Also update all `scraped_reviews` queries in the file that use `.eq('user_id', user.id)` to also filter `.eq('business_profile_id', restaurantProfileCheck.id)` for accurate per-location stats. For example:

```typescript
// Add .eq('business_profile_id', restaurantProfileCheck.id) to each scraped_reviews query
supabase.from('scraped_reviews').select('star_rating, review_datetime_utc, reply_status')
  .eq('user_id', user.id)
  .eq('business_profile_id', restaurantProfileCheck.id),
```

Apply this `.eq('business_profile_id', restaurantProfileCheck.id)` filter to every `scraped_reviews` query in the file.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/dashboard/LocationsOverview.tsx" \
        "app/(dashboard)/dashboard/ManageLocationButton.tsx" \
        "app/(dashboard)/dashboard/page.tsx"
git commit -m "feat(dashboard): aggregate locations overview for multi-location users"
```

---

## Task 11: Reviews + Analytics — Active Location Scoping

**Files:**
- Modify: `app/(dashboard)/dashboard/reviews/page.tsx`
- Modify: `app/(dashboard)/dashboard/analytics/page.tsx`

- [ ] **Step 1: Update reviews page**

Replace `app/(dashboard)/dashboard/reviews/page.tsx` with:

```typescript
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Reviews — ReplyFi' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getActiveLocationId } from '@/lib/locations/active'
import ReviewsClient from './ReviewsClient'
import type { BusinessProfile, ScrapedReview } from '@/types'

export default async function ReviewsPage() {
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Determine active location
  const activeLocationId = getActiveLocationId()

  let profileQuery = supabaseAdmin
    .from('business_profiles')
    .select('*')
    .eq('user_id', user.id)

  if (activeLocationId) {
    profileQuery = profileQuery.eq('id', activeLocationId)
  } else {
    profileQuery = profileQuery.eq('is_primary', true)
  }

  const { data: profile } = await profileQuery.maybeSingle()
  if (!profile) redirect('/settings')

  const { data: reviews } = await supabaseAdmin
    .from('scraped_reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('business_profile_id', profile.id)
    .in('reply_status', ['pending', 'approved'])
    .order('review_datetime_utc', { ascending: false })
    .limit(50)

  return (
    <ReviewsClient
      profile={profile as BusinessProfile}
      initialReviews={(reviews ?? []) as ScrapedReview[]}
      userId={user.id}
    />
  )
}
```

- [ ] **Step 2: Update analytics page**

Replace `app/(dashboard)/dashboard/analytics/page.tsx` with:

```typescript
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Analytics — ReplyFi' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getActiveLocationId } from '@/lib/locations/active'
import AnalyticsClient from './AnalyticsClient'
import type { ScrapedReview } from '@/types'

export default async function AnalyticsPage() {
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const activeLocationId = getActiveLocationId()

  let profileQuery = supabaseAdmin
    .from('business_profiles')
    .select('*')
    .eq('user_id', user.id)

  if (activeLocationId) {
    profileQuery = profileQuery.eq('id', activeLocationId)
  } else {
    profileQuery = profileQuery.eq('is_primary', true)
  }

  const { data: profile } = await profileQuery.maybeSingle()
  if (!profile) redirect('/settings')

  const { data: reviews } = await supabaseAdmin
    .from('scraped_reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('business_profile_id', profile.id)
    .order('review_datetime_utc', { ascending: false })

  return (
    <AnalyticsClient
      reviews={(reviews ?? []) as ScrapedReview[]}
      restaurantName={profile.business_name}
      userId={user.id}
    />
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/dashboard/reviews/page.tsx" \
        "app/(dashboard)/dashboard/analytics/page.tsx"
git commit -m "feat(reviews, analytics): scope to active location via cookie"
```

---

## Task 12: Settings — Active Location + Locations Tab

**Files:**
- Modify: `app/(dashboard)/settings/page.tsx`
- Modify: `app/(dashboard)/settings/SettingsPageClient.tsx`

- [ ] **Step 1: Update settings page to scope by active location**

In `app/(dashboard)/settings/page.tsx`, add the import at the top:

```typescript
import { getActiveLocationId } from '@/lib/locations/active'
```

Find the `business_profiles` fetch (it currently uses `.maybeSingle()`). Replace it with active-location-aware fetch:

```typescript
const activeLocationId = getActiveLocationId()

let profileQuery = supabase
  .from('business_profiles')
  .select('*')
  .eq('user_id', user.id)

if (activeLocationId) {
  profileQuery = profileQuery.eq('id', activeLocationId)
} else {
  profileQuery = profileQuery.eq('is_primary', true)
}

const { data: restaurantProfile } = await profileQuery.maybeSingle()
```

Also fetch all locations to pass to the Locations tab:

```typescript
const { data: allLocations } = await supabase
  .from('business_profiles')
  .select('id, business_name, location_label, is_primary, last_scraped_at, google_maps_url, yelp_url')
  .eq('user_id', user.id)
  .order('is_primary', { ascending: false })
```

Pass `allLocations` and `activeLocationId` to `SettingsPageClient`:

```typescript
<SettingsPageClient
  // ... existing props ...
  allLocations={allLocations ?? []}
  activeLocationId={activeLocationId ?? restaurantProfile?.id ?? ''}
/>
```

- [ ] **Step 2: Add Locations tab to SettingsPageClient**

In `app/(dashboard)/settings/SettingsPageClient.tsx`:

**a)** Add `allLocations` and `activeLocationId` to the Props interface:

```typescript
  allLocations: Array<{
    id: string
    business_name: string
    location_label: string | null
    is_primary: boolean | null
    last_scraped_at: string | null
    google_maps_url: string | null
    yelp_url: string | null
  }>
  activeLocationId: string
```

**b)** Add `'locations'` to the tabs array (find the existing tabs definition and add it):

```typescript
{ id: 'locations', label: 'Locations' },
```

**c)** Add the Locations tab panel. Inside the tab panels switch/conditional, add a case for `'locations'`:

```typescript
{activeTab === 'locations' && (
  <LocationsTab
    locations={allLocations}
    activeLocationId={activeLocationId}
    userId={userId}
  />
)}
```

**d)** Add the `LocationsTab` component at the bottom of `SettingsPageClient.tsx` (above the default export):

```typescript
function LocationsTab({
  locations,
  activeLocationId,
  userId,
}: {
  locations: Array<{
    id: string
    business_name: string
    location_label: string | null
    is_primary: boolean | null
    last_scraped_at: string | null
    google_maps_url: string | null
    yelp_url: string | null
  }>
  activeLocationId: string
  userId: string
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newGoogleUrl, setNewGoogleUrl] = useState('')
  const [newYelpUrl, setNewYelpUrl] = useState('')
  const [addError, setAddError] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleAdd = async () => {
    setAddError('')
    if (!newLabel.trim()) { setAddError('Location name is required.'); return }
    setAdding(true)
    try {
      const res = await fetch('/api/locations/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationLabel: newLabel.trim(),
          googleMapsUrl: newGoogleUrl.trim() || null,
          yelpUrl: newYelpUrl.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to add location')
      setShowAddForm(false)
      setNewLabel(''); setNewGoogleUrl(''); setNewYelpUrl('')
      router.refresh()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally { setAdding(false) }
  }

  const handleRemove = async (locationId: string) => {
    if (!confirm('Remove this location? All reviews for it will be permanently deleted.')) return
    setRemovingId(locationId)
    try {
      const res = await fetch(`/api/locations/${locationId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to remove location')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong.')
    } finally { setRemovingId(null) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#111]">Locations</h2>
          <p className="text-[13px] text-[#57534E] mt-0.5">Each location has its own review feed and sync.</p>
        </div>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] text-white text-[12px] font-medium transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add location
        </button>
      </div>

      {showAddForm && (
        <div className="bg-[#FEFCF8] border border-[#EDE6DC] rounded-xl p-4 space-y-3 animate-fade-up">
          <h3 className="text-[13px] font-semibold text-[#111]">New location</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Location name (e.g. Downtown)"
              className="w-full h-10 px-3.5 rounded-xl bg-[#F8F6F3] border border-[#EDE6DC] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:border-[#E05A28]/50 focus:ring-2 focus:ring-[#E05A28]/10"
            />
            <input
              type="url"
              value={newGoogleUrl}
              onChange={e => setNewGoogleUrl(e.target.value)}
              placeholder="Google Maps URL (optional)"
              className="w-full h-10 px-3.5 rounded-xl bg-[#F8F6F3] border border-[#EDE6DC] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:border-[#E05A28]/50 focus:ring-2 focus:ring-[#E05A28]/10"
            />
            <input
              type="url"
              value={newYelpUrl}
              onChange={e => setNewYelpUrl(e.target.value)}
              placeholder="Yelp URL (optional)"
              className="w-full h-10 px-3.5 rounded-xl bg-[#F8F6F3] border border-[#EDE6DC] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:border-[#E05A28]/50 focus:ring-2 focus:ring-[#E05A28]/10"
            />
          </div>
          {addError && <p className="text-[12px] text-[#B84A1A]">{addError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="px-4 py-2 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] text-white text-[12px] font-medium disabled:opacity-50 transition-colors"
            >
              {adding ? 'Adding…' : 'Add location'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-[#F3F0EC] text-[#57534E] text-[12px] font-medium hover:bg-[#EDE9E4] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {locations.map(loc => (
          <div key={loc.id} className="flex items-center gap-3 bg-[#FEFCF8] border border-[#EDE6DC] rounded-xl px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-[#111] truncate">
                  {loc.location_label ?? loc.business_name}
                </span>
                {loc.is_primary && (
                  <span className="text-[10px] font-medium text-[#57534E] bg-[#F3F0EC] border border-[#EDE6DC] rounded-full px-2 py-0.5">Primary</span>
                )}
                {loc.id === activeLocationId && (
                  <span className="text-[10px] font-medium text-[#E05A28] bg-[#FEF6EF] border border-[#F4DCC4] rounded-full px-2 py-0.5">Active</span>
                )}
              </div>
              <p className="text-[11px] text-[#A8A29E] mt-0.5">
                {loc.google_maps_url ? 'Google' : ''}
                {loc.google_maps_url && loc.yelp_url ? ' · ' : ''}
                {loc.yelp_url ? 'Yelp' : ''}
                {!loc.google_maps_url && !loc.yelp_url ? 'No platforms connected' : ''}
              </p>
            </div>
            {!loc.is_primary && (
              <button
                onClick={() => handleRemove(loc.id)}
                disabled={removingId === loc.id}
                className="text-[12px] text-[#A8A29E] hover:text-[#B84A1A] transition-colors disabled:opacity-40 flex-shrink-0"
              >
                {removingId === loc.id ? 'Removing…' : 'Remove'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/settings/page.tsx" \
        "app/(dashboard)/settings/SettingsPageClient.tsx"
git commit -m "feat(settings): active location scoping + Locations tab"
```

---

## Task 13: End-to-End Test + Deploy

- [ ] **Step 1: Final TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 2: Test single-location path (existing users)**

1. Log in as an existing user with one location.
2. Confirm `/dashboard` renders the existing HomeClient (no aggregate view, no location switcher in nav).
3. Confirm `/dashboard/reviews` works normally.
4. Confirm Settings shows a "Locations" tab with one primary location and no "Remove" button.

- [ ] **Step 3: Test adding a second location**

1. Go to Settings → Locations tab.
2. Click "Add location", fill in label "Test Location 2", submit.
3. Confirm the new location appears in the list.
4. Refresh — confirm `/dashboard` now shows LocationsOverview with 2 location cards.
5. Confirm the Nav shows the LocationSwitcher pill.

- [ ] **Step 4: Test location switching**

1. Click the LocationSwitcher in the Nav, select "Test Location 2".
2. Navigate to `/dashboard/reviews` — confirm it shows 0 reviews (new empty location).
3. Switch back to the primary location — confirm original reviews reappear.

- [ ] **Step 5: Test removing a location**

1. Settings → Locations → click "Remove" on "Test Location 2".
2. Confirm deletion dialog, confirm.
3. Confirm location is gone from the list.
4. Confirm `/dashboard` returns to the single-location HomeClient view.
5. Confirm the LocationSwitcher is gone from the Nav.

- [ ] **Step 6: Push and deploy**

```bash
git push origin main
```

Monitor Vercel deployment. Once live, verify `/dashboard` on the production URL.
