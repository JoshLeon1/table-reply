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

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const platformRules: Record<string, string> = {
    'Instagram': 'Write 2-3 short sentences (max 180 characters total, not counting hashtags). Conversational and punchy. Do NOT include hashtags in the caption text — they go in the hashtags array only.',
    'Facebook': 'Write 2-3 sentences max (max 200 characters). Friendly and direct. No hashtags in caption text.',
    'Twitter/X': 'Write ONE tight sentence under 220 characters total. No hashtags in caption text.',
    'TikTok': 'Write 1-2 casual fun sentences (max 150 characters). High energy. No hashtags in caption text.',
  }

  const rule = platformRules[platform] ?? platformRules['Instagram']

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `You are a social media manager for ${restaurantName}, a ${cuisineType ?? 'restaurant'} with a ${vibe ?? 'welcoming'} vibe. Transform a customer review into a social post caption. Never quote the review verbatim. Celebrate the restaurant authentically. Style: ${style}.`,
      messages: [
        {
          role: 'user',
          content: `Review: "${reviewText}"
Platform: ${platform}
Rule: ${rule}

Return ONLY valid JSON: { "caption": "short caption here", "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"] }
Hashtags: 4-5 relevant tags. No markdown, no explanation — just the JSON object.`,
        },
      ],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : rawText

    let parsed: { caption: string; hashtags: string[] }
    try {
      parsed = JSON.parse(jsonStr.trim())
    } catch {
      parsed = JSON.parse(rawText.trim())
    }

    if (!parsed.caption || typeof parsed.caption !== 'string') {
      throw new Error('Invalid response shape from Claude')
    }

    return NextResponse.json({
      caption: parsed.caption.trim(),
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 5) : [],
    })
  } catch (error) {
    console.error('Error generating social caption:', error)
    return NextResponse.json({ error: 'Failed to generate caption' }, { status: 500 })
  }
}
