export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { hasActiveAccess } from '@/lib/subscription'
import { resolveActiveOrPrimaryLocationId } from '@/lib/locations/active'

// Map business_type → natural search term for nearby search
function businessTypeToSearchTerm(type: string): string {
  const map: Record<string, string> = {
    'Restaurant':       'restaurants',
    'Dental Practice':  'dental practices',
    'Hair Salon':       'hair salons',
    'Med Spa':          'med spas',
    'Auto Repair':      'auto repair shops',
    'Law Firm':         'law firms',
    'Home Services':    'home services',
    'Retail':           'retail stores',
  }
  return map[type] ?? `${type.toLowerCase()} businesses`
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const allowed = await hasActiveAccess(supabaseAdmin, user.id)
  if (!allowed) return NextResponse.json({ error: 'Subscription required' }, { status: 402 })

  // Get the currently-viewed business profile — competitors must be nearby
  // the location the user is actually looking at, not always the primary.
  const activeId = await resolveActiveOrPrimaryLocationId(supabaseAdmin, user.id)
  const { data: profile } = activeId
    ? await supabase
        .from('business_profiles')
        .select('id, business_name, business_type, google_place_id, latitude, longitude, google_maps_url')
        .eq('user_id', user.id)
        .eq('id', activeId)
        .maybeSingle()
    : { data: null }

  if (!profile) return NextResponse.json({ results: [] })

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) return NextResponse.json({ results: [], apiError: 'Google Maps API not configured' })

  const businessName = profile.business_name ?? ''
  const searchTerm = businessTypeToSearchTerm(profile.business_type ?? '')

  // ── Step 1: resolve coordinates if not stored ──────────────────────────────
  let lat = profile.latitude as number | null
  let lng = profile.longitude as number | null
  let ownPlaceId = (profile.google_place_id as string | null) ?? null

  // If we don't have coordinates, look up the business by name via Places API
  // so we can anchor the nearby search properly
  if (lat == null || lng == null) {
    try {
      const lookupRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.location',
        },
        body: JSON.stringify({ textQuery: businessName, maxResultCount: 1 }),
      })
      if (lookupRes.ok) {
        const lookupData = await lookupRes.json()
        const first = lookupData.places?.[0]
        if (first?.location) {
          lat = first.location.latitude
          lng = first.location.longitude
          ownPlaceId = ownPlaceId ?? first.id

          // Persist for next time so we don't have to look up again
          await supabaseAdmin
            .from('business_profiles')
            .update({
              latitude: lat,
              longitude: lng,
              ...(ownPlaceId ? { google_place_id: ownPlaceId } : {}),
            })
            .eq('id', profile.id)
        }
      }
    } catch {
      // Fallback: continue without coordinates
    }
  }

  // ── Step 2: search for same-type businesses nearby ─────────────────────────
  try {
    const searchBody: Record<string, unknown> = {
      textQuery: searchTerm,
      maxResultCount: 20, // fetch more so we can filter and sort
    }

    // Use locationRestriction (hard boundary at 5 km) when we have coordinates,
    // otherwise fall back to a bias so we still get results without location
    if (lat != null && lng != null) {
      searchBody.locationRestriction = {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 5000, // 5 km
        },
      }
    }

    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount',
      },
      body: JSON.stringify(searchBody),
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ results: [], apiError: data?.error?.message ?? 'Places API error' })
    }

    const places = (data.places ?? []) as {
      id: string
      displayName?: { text: string }
      formattedAddress?: string
      rating?: number
      userRatingCount?: number
    }[]

    const results = places
      .filter(p => {
        // Exclude the business itself — by place_id first, then by exact name match
        if (ownPlaceId && p.id === ownPlaceId) return false
        const n = p.displayName?.text ?? ''
        if (n.toLowerCase() === businessName.toLowerCase()) return false
        // Only include businesses that have at least a few reviews (legitimate competitors)
        if ((p.userRatingCount ?? 0) < 3) return false
        return true
      })
      // Sort by review count descending — most-reviewed = most established competitors
      .sort((a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0))
      .slice(0, 5)
      .map(p => ({
        placeId: p.id,
        name: p.displayName?.text ?? '',
        address: p.formattedAddress ?? '',
        rating: p.rating,
        reviewCount: p.userRatingCount,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((p.displayName?.text ?? '') + ' ' + (p.formattedAddress ?? ''))}&query_place_id=${p.id}`,
      }))
      .filter(p => p.name)

    return NextResponse.json({ results })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ results: [], apiError: msg })
  }
}
