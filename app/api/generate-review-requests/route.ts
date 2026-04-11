export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/anthropic'

export async function POST(request: NextRequest) {
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

  const userPrompt = `Generate 4 short review request messages for ${restaurantName}.

You MUST respond with ONLY a valid JSON object — no markdown, no explanation, no code fences.

Required format:
{"sms":"...","email":"...","receipt":"...","tablecard":"..."}

Rules:
- sms: under 160 characters, casual and warm, include [REVIEW LINK]
- email: 2-3 sentences, friendly, include [REVIEW LINK]
- receipt: under 80 characters, just the ask + [REVIEW LINK]
- tablecard: under 100 characters, inviting, include [REVIEW LINK]`

  try {
    const rawText = (await callClaude({
      maxTokens: 800,
      system: systemPrompt,
      userMessage: userPrompt,
    })).trim()

    console.log('[generate-review-requests] raw response:', rawText.slice(0, 300))

    // Strip markdown code fences if present
    const stripped = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()

    // Extract the JSON object — handles any extra text before/after
    const jsonMatch = stripped.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[generate-review-requests] no JSON found in:', stripped)
      throw new Error('No JSON found in Claude response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    const result = {
      sms:       typeof parsed.sms === 'string'       ? parsed.sms       : `Loved dining at ${restaurantName}? We'd be so grateful for a quick Google review! [REVIEW LINK]`,
      email:     typeof parsed.email === 'string'     ? parsed.email     : `Thanks for visiting ${restaurantName}! If you enjoyed your experience, a quick Google review would mean the world to us. [REVIEW LINK]`,
      receipt:   typeof parsed.receipt === 'string'   ? parsed.receipt   : `Enjoyed your meal? Leave us a review! [REVIEW LINK]`,
      tablecard: typeof parsed.tablecard === 'string' ? parsed.tablecard : `Love ${restaurantName}? Share your experience! [REVIEW LINK]`,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[generate-review-requests] error:', error)
    return NextResponse.json({ error: String(error instanceof Error ? error.message : error) }, { status: 500 })
  }
}
