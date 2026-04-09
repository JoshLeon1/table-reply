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

  const body = await request.json()
  const { restaurantName, cuisineType, vibe, voiceStyle, ownerName } = body

  if (!restaurantName) {
    return NextResponse.json({ error: 'Missing restaurantName' }, { status: 400 })
  }

  const systemPrompt = `You are a marketing copywriter for ${restaurantName}, a ${cuisineType ?? 'restaurant'}${vibe ? ` with a ${vibe} vibe` : ''}. The owner's name is ${ownerName ?? 'the owner'}. Voice: ${voiceStyle ?? 'warm and genuine'}. Write in a warm, genuine tone that matches the restaurant's personality.`

  const userPrompt = `Generate 4 review request messages for ${restaurantName}. Return as JSON with these keys:
- "sms": A short SMS (under 160 chars). Include [REVIEW LINK] as a placeholder. Casual and warm.
- "email": A friendly email (3-4 sentences). Include [REVIEW LINK]. Slightly more personal.
- "receipt": Very short receipt footer (under 80 chars). Just the ask + [REVIEW LINK].
- "tablecard": Short table card text (under 100 chars). Inviting and warm.

JSON only, no explanation.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic')
    }

    // Strip markdown code fences if present
    const raw = content.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')

    const parsed = JSON.parse(raw)

    const result = {
      sms: typeof parsed.sms === 'string' ? parsed.sms : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      receipt: typeof parsed.receipt === 'string' ? parsed.receipt : '',
      tablecard: typeof parsed.tablecard === 'string' ? parsed.tablecard : '',
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating review requests:', error)
    return NextResponse.json({ error: 'Failed to generate review requests' }, { status: 500 })
  }
}
