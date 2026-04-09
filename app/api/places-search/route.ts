export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const query = request.nextUrl.searchParams.get('query')?.trim()
  if (!query) return NextResponse.json({ results: [] })

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GOOGLE_MAPS_API_KEY not configured', results: [] },
      { status: 500 }
    )
  }

  try {
    // Uses Places API (New) — https://places.googleapis.com/v1/places:searchText
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating',
      },
      body: JSON.stringify({
        textQuery: query,
        includedType: 'restaurant',
        maxResultCount: 6,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[TableReply] Places API error:', data)
      return NextResponse.json({ results: [], error: data?.error?.message ?? 'Search failed' }, { status: 500 })
    }

    const results = (data.places ?? []).map((p: {
      id: string
      displayName?: { text: string }
      formattedAddress?: string
      rating?: number
    }) => ({
      placeId: p.id,
      name: p.displayName?.text ?? '',
      address: p.formattedAddress ?? '',
      rating: p.rating,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.id}`,
    }))

    return NextResponse.json({ results })
  } catch (err) {
    console.error('[TableReply] Places search error:', err)
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 })
  }
}
