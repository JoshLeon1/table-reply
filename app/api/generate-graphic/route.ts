export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    reviewText?: string
    reviewerName?: string
    starRating?: number
    restaurantName?: string
    style?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { reviewText, reviewerName, starRating, restaurantName, style } = body

  if (!reviewText || !reviewerName || !starRating || !restaurantName || !style) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const stars = '★'.repeat(starRating) + '☆'.repeat(5 - starRating)

  const styleGuide = {
    'Dark & moody':
      'Dark background (#111 or #1a1209), warm amber/gold (#F59E0B) quote text, deep charcoal for secondary text. Dramatic, atmospheric.',
    'Warm & bright':
      'Warm cream background (#FDF6E3 or #FFFBF0), rich amber/brown heading, soft terracotta accents. Inviting and sunny.',
    'Clean & minimal':
      'Pure white background, black heading text, light gray accents. Generous whitespace. Simple sans-serif.',
    'Bold & colorful':
      'Deep gradient background (e.g. indigo to purple, or teal to emerald), white text, bright accent color. Energetic and eye-catching.',
  }[style] ?? style

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 8096,
      system:
        'You are a graphic designer. You output ONLY raw HTML — no explanation, no markdown, no code fences. The very first character of your response must be < and nothing else.',
      messages: [
        {
          role: 'user',
          content: `Create a 400×400px social media graphic as a complete, self-contained HTML document.

Restaurant: ${restaurantName}
Reviewer: ${reviewerName}
Rating: ${stars}
Quote: "${reviewText}"
Style: ${styleGuide}

Rules:
1. Output ONLY the HTML. Start immediately with <!DOCTYPE html> — no preamble.
2. All CSS in a <style> tag in <head>. No external stylesheets.
3. body { margin: 0; width: 400px; height: 400px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
4. Layout: quote text is the hero (large, beautiful), restaurant name and reviewer credit at bottom, stars displayed as ${stars} in gold.
5. Include one simple inline SVG accent (a fork, leaf, or star ornament — keep it small and decorative).
6. Use only web-safe fonts OR embed a Google Font with @import inside the <style> tag.
7. The graphic must look great at 400×400px with no scrollbars.`,
        },
      ],
    })

    let html = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    // Strip any markdown code fences Claude occasionally wraps around output
    const fenceMatch = html.match(/```(?:html)?\s*([\s\S]*?)```/i)
    if (fenceMatch) {
      html = fenceMatch[1].trim()
    }

    // Tolerate any casing of DOCTYPE / html tag
    const lc = html.toLowerCase()
    if (!lc.startsWith('<!doctype') && !lc.startsWith('<html')) {
      console.error('[generate-graphic] Unexpected Claude response start:', html.slice(0, 120))
      return NextResponse.json(
        { error: 'Graphic generation returned unexpected content. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ html })
  } catch (error) {
    console.error('[generate-graphic] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate graphic' },
      { status: 500 }
    )
  }
}
