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
      { results: [], apiError: 'GOOGLE_MAPS_API_KEY is not set in environment variables.' },
      { status: 200 }
    )
  }

  try {
    // Places API (New) — Text Search
    // NOTE: Do NOT use includedType — it's too restrictive and filters out many restaurants
    // NOTE: API key must NOT have HTTP referrer restrictions (server-side calls have no Referer header)
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.types,places.location',
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 8,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      const msg = data?.error?.message ?? `HTTP ${res.status}`
      console.error('[ReplyFi] Places API error:', msg, JSON.stringify(data).slice(0, 400))
      return NextResponse.json(
        { results: [], apiError: msg },
        { status: 200 } // return 200 so client can display the error message
      )
    }

    const places = (data.places ?? []) as {
      id: string
      displayName?: { text: string }
      formattedAddress?: string
      rating?: number
      types?: string[]
      location?: { latitude: number; longitude: number }
    }[]

    const results = places
      .slice(0, 6)
      .map(p => {
        const name = p.displayName?.text ?? ''
        const address = p.formattedAddress ?? ''
        // Use place_id URL format — Outscraper's reviews API recognises this reliably
        const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${p.id}`
        return {
          placeId: p.id,
          name,
          address,
          rating: p.rating,
          mapsUrl,
          latitude: p.location?.latitude ?? null,
          longitude: p.location?.longitude ?? null,
        }
      })
      .filter(p => p.name) // remove blank names

    return NextResponse.json({ results })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error'
    console.error('[ReplyFi] Places search error:', msg)
    return NextResponse.json({ results: [], apiError: msg }, { status: 200 })
  }
}
