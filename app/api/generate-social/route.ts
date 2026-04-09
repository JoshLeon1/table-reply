export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    reviewText?: string
    restaurantName?: string
    cuisineType?: string
    vibe?: string
    platform?: string
    style?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { reviewText, restaurantName, cuisineType, vibe, platform, style } = body

  if (!reviewText || !restaurantName || !platform || !style) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: `You are a social media manager for ${restaurantName}, a ${cuisineType ?? 'restaurant'} restaurant with a ${vibe ?? 'welcoming'} vibe. Create a ${platform} caption using this customer review as inspiration. Style: ${style}. Include relevant hashtags. Keep it authentic and on-brand. Never quote the review directly — transform it into a post that celebrates the restaurant. For Twitter/X keep under 280 characters.`,
      messages: [
        {
          role: 'user',
          content: `Review to use as inspiration: ${reviewText}\n\nReturn JSON: { "caption": "...", "hashtags": ["#tag1", "#tag2", ...] }`,
        },
      ],
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
      rawText.match(/(\{[\s\S]*\})/)

    const jsonStr = jsonMatch ? jsonMatch[1] ?? jsonMatch[0] : rawText

    let parsed: { caption: string; hashtags: string[] }
    try {
      parsed = JSON.parse(jsonStr.trim())
    } catch {
      // Fallback: try to parse the whole rawText
      parsed = JSON.parse(rawText.trim())
    }

    if (!parsed.caption || typeof parsed.caption !== 'string') {
      throw new Error('Invalid response shape from Claude')
    }

    return NextResponse.json({
      caption: parsed.caption,
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
    })
  } catch (error) {
    console.error('Error generating social caption:', error)
    return NextResponse.json({ error: 'Failed to generate caption' }, { status: 500 })
  }
}
