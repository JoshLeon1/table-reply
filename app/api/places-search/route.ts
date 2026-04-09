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
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    url.searchParams.set('query', query)
    url.searchParams.set('type', 'restaurant|food|bar|cafe')
    url.searchParams.set('key', apiKey)

    const res = await fetch(url.toString())
    const data = await res.json()

    const results = (data.results ?? [])
      .slice(0, 6)
      .map((p: { place_id: string; name: string; formatted_address: string; rating?: number }) => ({
        placeId: p.place_id,
        name: p.name,
        address: p.formatted_address,
        rating: p.rating,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
      }))

    return NextResponse.json({ results })
  } catch (err) {
    console.error('[TableReply] Places search error:', err)
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 })
  }
}
