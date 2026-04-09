import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function extractNameFromUrl(url: string): string | null {
  try {
    const segment = url.split('/place/')[1]?.split('/')[0]
    if (!segment) return null
    return decodeURIComponent(segment.replace(/\+/g, ' '))
  } catch {
    return null
  }
}

function isGoogleMapsUrl(url: string): boolean {
  return url.includes('google.com/maps') || url.includes('maps.google')
}

export async function POST(request: NextRequest) {
  // Auth
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const urls: string[] = Array.isArray(body?.urls) ? body.urls : []

  if (!urls.length) {
    return NextResponse.json({ error: 'No URLs provided.' }, { status: 400 })
  }

  // Validate all URLs
  for (const url of urls) {
    if (!isGoogleMapsUrl(url)) {
      return NextResponse.json(
        { error: `Invalid URL: "${url}". Must be a Google Maps link.` },
        { status: 400 }
      )
    }
  }

  // Check existing competitor count
  const { data: existing, error: countError } = await supabaseAdmin
    .from('competitor_profiles')
    .select('id')
    .eq('user_id', user.id)

  if (countError) {
    return NextResponse.json({ error: 'Database error.' }, { status: 500 })
  }

  const totalAfter = (existing?.length ?? 0) + urls.length
  if (totalAfter > 3) {
    return NextResponse.json(
      { error: `You can track a maximum of 3 competitors. You currently have ${existing?.length ?? 0}.` },
      { status: 400 }
    )
  }

  const outscraperKey = process.env.OUTSCRAPER_API_KEY

  const insertedProfiles = []

  for (const url of urls) {
    const extractedName = extractNameFromUrl(url)

    // Insert with extracted name first
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('competitor_profiles')
      .insert({
        user_id: user.id,
        google_maps_url: url,
        name: extractedName ?? 'Competitor',
      })
      .select()
      .single()

    if (insertError || !inserted) {
      console.error('Insert error:', insertError)
      continue
    }

    let profile = inserted

    // Optionally enrich with Outscraper
    if (outscraperKey) {
      try {
        const query = encodeURIComponent(url)
        const outscraperRes = await fetch(
          `https://api.app.outscraper.com/maps/search-v3?query=${query}&limit=1`,
          {
            headers: {
              'X-API-KEY': outscraperKey,
            },
          }
        )

        if (outscraperRes.ok) {
          const outscraperData = await outscraperRes.json()
          const place = outscraperData?.data?.[0]?.[0]

          if (place) {
            const updates: Record<string, unknown> = {
              last_scraped_at: new Date().toISOString(),
            }

            if (place.name) updates.name = place.name
            if (typeof place.rating === 'number') updates.avg_rating = place.rating
            if (typeof place.reviews === 'number') updates.review_count = place.reviews

            const { data: updated } = await supabaseAdmin
              .from('competitor_profiles')
              .update(updates)
              .eq('id', inserted.id)
              .select()
              .single()

            if (updated) profile = updated
          }
        }
      } catch (err) {
        console.error('Outscraper fetch failed (non-fatal):', err)
      }
    }

    insertedProfiles.push(profile)
  }

  return NextResponse.json({ competitors: insertedProfiles }, { status: 201 })
}
