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

  const userPrompt = `Generate 4 review request messages for ${restaurantName}. Return as JSON with these keys:
- "sms": A short SMS (under 160 chars). Include [REVIEW LINK] as a placeholder. Casual and warm.
- "email": A friendly email (3-4 sentences). Include [REVIEW LINK]. Slightly more personal.
- "receipt": Very short receipt footer (under 80 chars). Just the ask + [REVIEW LINK].
- "tablecard": Short table card text (under 100 chars). Inviting and warm.

JSON only, no explanation.`

  try {
    const rawText = (await callClaude({
      maxTokens: 1200,
      system: systemPrompt,
      userMessage: userPrompt,
    })).trim()

    // Strip markdown code fences if present
    const stripped = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    // Extract the JSON object (handles extra text before/after)
    const jsonMatch = stripped.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON object found in response')
    const parsed = JSON.parse(jsonMatch[0])

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
