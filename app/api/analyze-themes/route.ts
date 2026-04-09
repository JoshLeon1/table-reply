export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'


/** Extract the first complete JSON object from a string, regardless of code fences or surrounding text */
function extractJSON(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('{')) return trimmed

  const fenceStripped = trimmed
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim()
  if (fenceStripped.startsWith('{')) return fenceStripped

  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end > start) return raw.slice(start, end + 1)

  throw new Error('No JSON object found in Claude response')
}

export async function POST(request: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const reviews: string[] = Array.isArray(body.reviews) ? body.reviews : []
  const forceRefresh: boolean = body.forceRefresh === true

  console.log(`[analyze-themes] user=${user.id} reviews=${reviews.length} forceRefresh=${forceRefresh}`)

  // ── Check Supabase cache ──────────────────────────────────────────────────────
  if (!forceRefresh) {
    const { data: cached } = await supabaseAdmin
      .from('restaurant_analytics')
      .select('themes, last_analyzed_at, reviews_count_at_analysis')
      .eq('user_id', user.id)
      .maybeSingle()

    if (cached?.themes && cached.last_analyzed_at) {
      const ageMs = Date.now() - new Date(cached.last_analyzed_at).getTime()
      const fresh = ageMs < 24 * 60 * 60 * 1000
      const sameCount = cached.reviews_count_at_analysis === reviews.length

      if (fresh && sameCount) {
        console.log('[analyze-themes] Returning cached result')
        const t = cached.themes as any
        return NextResponse.json({
          praised:       Array.isArray(t.praised)       ? t.praised       : [],
          complaints:    Array.isArray(t.complaints)    ? t.complaints    : [],
          opportunities: Array.isArray(t.opportunities) ? t.opportunities : [],
          insufficient: false,
          cached: true,
          lastAnalyzedAt: cached.last_analyzed_at,
        })
      }
    }
  }

  // ── Insufficient data ─────────────────────────────────────────────────────────
  if (reviews.length < 3) {
    return NextResponse.json({ praised: [], complaints: [], opportunities: [], insufficient: true })
  }

  // ── Call Claude ───────────────────────────────────────────────────────────────
  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: 'You are a data extraction assistant. You respond ONLY with valid JSON. No markdown, no code fences, no explanation — just the raw JSON object.',
      messages: [
        {
          role: 'user',
          content: `Analyze these ${reviews.length} restaurant reviews. Return a JSON object with exactly this structure:
{"praised":["item1","item2","item3"],"complaints":["item1","item2"],"opportunities":["item1","item2","item3"]}

Rules:
- praised: what customers consistently love (3-5 specific items)
- complaints: what customers consistently dislike (2-5 items, fewer if not many)
- opportunities: specific improvements for more 5-star reviews (3-5 items)
- Be specific: not "good food" but "hand-made tagliatelle" or "45-min wait on weekends"
- Return ONLY the JSON object, nothing else

Reviews:
${reviews.slice(0, 60).join('\n---\n')}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    console.log('[analyze-themes] Raw (first 400):', raw.slice(0, 400))

    const parsed = JSON.parse(extractJSON(raw))

    const result = {
      praised:       Array.isArray(parsed.praised)       ? parsed.praised.filter(Boolean)       : [],
      complaints:    Array.isArray(parsed.complaints)    ? parsed.complaints.filter(Boolean)    : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities.filter(Boolean) : [],
    }

    console.log('[analyze-themes] OK — praised:', result.praised.length, 'complaints:', result.complaints.length, 'opportunities:', result.opportunities.length)

    // ── Save to Supabase ──────────────────────────────────────────────────────
    const now = new Date().toISOString()
    await supabaseAdmin
      .from('restaurant_analytics')
      .upsert({
        user_id: user.id,
        themes: result,
        last_analyzed_at: now,
        reviews_count_at_analysis: reviews.length,
      }, { onConflict: 'user_id' })

    return NextResponse.json({ ...result, insufficient: false, cached: false, lastAnalyzedAt: now })
  } catch (err) {
    console.error('[analyze-themes] Error:', err)
    return NextResponse.json(
      { error: String(err), praised: [], complaints: [], opportunities: [], insufficient: false },
      { status: 500 }
    )
  }
}
