export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { hasActiveAccess } from '@/lib/subscription'

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

  // Get the business profile — need location + type to find real nearby competitors
  const { data: profile } = await supabase
    .from('business_profiles')
    .select('business_name, business_type, google_place_id, latitude, longitude, google_maps_url')
    .eq('user_id', user.id)
    .maybeSingle()

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
            .eq('user_id', user.id)
        }
      }
    } catch {
      // Fallback: continue without coordinates
    }
  }

  // ── Step 2: search for same-type businesses nearby ─────────────────────────
  try {
    const body: Record<string, unknown> = {
      textQuery: searchTerm,
      maxResultCount: 10,
    }

    // If we have coordinates, bias results to a 2 km circle around the business
    if (lat != null && lng != null) {
      body.locationBias = {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 2000, // metres
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
      body: JSON.stringify(body),
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
        return true
      })
      .slice(0, 5)
      .map(p => ({
        placeId: p.id,
        name: p.displayName?.text ?? '',
        address: p.formattedAddress ?? '',
        rating: p.rating,
        reviewCount: p.userRatingCount,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.id}`,
      }))
      .filter(p => p.name)

    return NextResponse.json({ results })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ results: [], apiError: msg })
  }
}
