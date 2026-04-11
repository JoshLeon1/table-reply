export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get the restaurant profile
  const { data: profile } = await supabase
    .from('restaurant_profiles')
    .select('restaurant_name, cuisine_type, google_maps_url')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ results: [] })

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) return NextResponse.json({ results: [], apiError: 'Google Maps API not configured' })

  const cuisine = profile.cuisine_type ?? 'restaurant'
  const name = profile.restaurant_name ?? ''

  // Build a search query: e.g. "Italian restaurants near Rosario's Trattoria"
  const query = `${cuisine} restaurants near ${name}`

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount',
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 6 }),
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

    // Filter out the restaurant itself by name match
    const results = places
      .filter(p => {
        const n = p.displayName?.text ?? ''
        return n.toLowerCase() !== name.toLowerCase()
      })
      .slice(0, 3)
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
