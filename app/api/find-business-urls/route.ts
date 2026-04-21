export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Extract city/state from a full address like "123 Main St, Austin, TX 78701, USA"
function extractCityState(address: string): string {
  // Try to grab the second and third comma-separated segments (city, state)
  const parts = address.split(',').map((p) => p.trim())
  if (parts.length >= 3) {
    // Drop first part (street) and last part (country), take middle
    const cityStateParts = parts.slice(1, -1)
    return cityStateParts.join(', ')
  }
  // Fallback: return everything after the first comma
  const idx = address.indexOf(',')
  return idx !== -1 ? address.slice(idx + 1).trim() : address
}

// Pull the first URL from an Outscraper google-search-v3 result that matches a domain
function extractMatchingUrl(
  results: Array<{ link?: string; url?: string }>,
  domainSubstring: string
): string | null {
  for (const r of results) {
    const url = r.link ?? r.url ?? ''
    if (url.includes(domainSubstring)) return url
  }
  return null
}

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.OUTSCRAPER_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OUTSCRAPER_API_KEY not configured', yelpUrl: null },
      { status: 200 }
    )
  }

  let businessName: string
  let address: string
  try {
    const body = await request.json()
    businessName = (body.businessName ?? '').trim()
    address = (body.address ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!businessName) {
    return NextResponse.json({ error: 'businessName is required' }, { status: 400 })
  }

  const location = address ? extractCityState(address) : ''
  const locationSuffix = location ? ` "${location}"` : ''

  const yelpQuery = `"${businessName}"${locationSuffix} site:yelp.com/biz`

  async function searchGoogle(query: string): Promise<Array<{ link?: string; url?: string }>> {
    const url = `https://api.app.outscraper.com/google-search-v3?query=${encodeURIComponent(query)}&limit=5`
    const res = await fetch(url, {
      headers: { 'X-API-KEY': apiKey! },
    })
    if (!res.ok) {
      console.error(`[find-business-urls] Outscraper ${res.status} for query: ${query}`)
      return []
    }
    const data = await res.json()
    // Outscraper returns either data[] or results[] depending on endpoint version
    const rows: unknown[] = data?.data ?? data?.results ?? []
    // Each row may be an array of result objects or a flat array
    const flat: Array<{ link?: string; url?: string }> = []
    for (const row of rows) {
      if (Array.isArray(row)) {
        flat.push(...(row as Array<{ link?: string; url?: string }>))
      } else if (row && typeof row === 'object') {
        flat.push(row as { link?: string; url?: string })
      }
    }
    return flat
  }

  try {
    const [yelpResults] = await Promise.allSettled([
      searchGoogle(yelpQuery),
    ])

    const yelpUrl = yelpResults.status === 'fulfilled'
      ? extractMatchingUrl(yelpResults.value, 'yelp.com/biz')
      : null

    return NextResponse.json({ yelpUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[find-business-urls] Error:', msg)
    return NextResponse.json({ error: msg, yelpUrl: null }, { status: 200 })
  }
}
