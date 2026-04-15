interface ReplyPreferences {
  endWithOwnerName?: boolean
  includeBusinessName?: boolean
  inviteBack?: boolean
}

interface GenerateReviewReplyParams {
  businessName: string
  businessType: string
  vibe: string
  voiceStyle: string
  description: string
  ownerName: string
  reviewText: string
  platform: string
  starRating: number
  tone?: 'warmer' | 'more-professional' | 'more-concise'
  replyPreferences?: ReplyPreferences
}

export async function generateReviewReply(params: GenerateReviewReplyParams): Promise<string> {
  const {
    businessName,
    businessType,
    vibe,
    voiceStyle,
    description,
    ownerName,
    reviewText,
    platform,
    starRating,
    tone,
    replyPreferences,
  } = params

  const prefs: ReplyPreferences = {
    endWithOwnerName: true,
    includeBusinessName: true,
    inviteBack: true,
    ...replyPreferences,
  }

  const toneInstruction =
    tone === 'warmer'
      ? ' Extra warm, heartfelt, and personal — make them feel like family.'
      : tone === 'more-professional'
      ? ' More formal and polished — measured, composed, and businesslike.'
      : tone === 'more-concise'
      ? ' Be concise and direct — aim for under 80 words, no fluff.'
      : ''

  const prefInstructions = [
    prefs.endWithOwnerName
      ? `End with — ${ownerName} on its own line.`
      : 'Do NOT sign off with a name at the end.',
    prefs.includeBusinessName
      ? `Naturally mention the business name (${businessName}) once in the reply.`
      : 'Do NOT mention the business name in the reply.',
    prefs.inviteBack
      ? 'For 4-5 star reviews, invite the customer to come back soon.'
      : 'Do NOT invite the customer to return.',
  ].join(' ')

  const platformContext = platform === 'Yelp'
    ? 'This is a Yelp review — Yelp audiences value authenticity and directness.'
    : platform === 'TripAdvisor'
    ? 'This is a TripAdvisor review — TripAdvisor audiences are often travelers, so warmth and a welcoming tone matter.'
    : 'This is a Google Maps review — keep the reply professional and discoverable.'

  const systemPrompt = `You are a reply assistant for ${businessName}, a ${vibe} ${businessType} business. The owner's name is ${ownerName}. Write in this voice: ${voiceStyle}.${toneInstruction} About the business: ${description}. Platform: ${platformContext}

RULES:
(1) NEVER start with "Thank you for your feedback" or "We appreciate your review."
(2) Sound like a real human owner, not a corporate template.
(3) For 4-5 star: warm, genuine, reference something specific they mentioned.
(4) For 3 star: acknowledge what went right, address the concern honestly.
(5) For 1-2 star: sincere empathy first, never defensive, offer to make it right.
(6) Max one exclamation mark total.
(7) STRICT LENGTH — scale to review length AND star rating:
    For 4–5 star reviews: mirror the review length.
      • 1–10 words  → 1 sentence (max 20 words)
      • 11–30 words → 1–2 sentences (max 35 words)
      • 31–75 words → 2–3 sentences (max 55 words)
      • 76+ words   → 3–4 sentences (max 80 words)
    For 1–3 star reviews: slightly longer to address the complaint — 2–4 sentences (max 65 words).
      Must cover: acknowledgment + what you will do about it. Still concise, no rambling.
    Do NOT exceed these limits. Do NOT pad.
(8) Preferences: ${prefInstructions}`

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Write a response to this ${starRating}-star ${platform} review. The review is ${reviewText.trim().split(/\s+/).length} words long — match that length per the rules above.\n\nReview: "${reviewText}"`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Anthropic API error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const content = data.content?.[0]
  if (!content || content.type !== 'text') {
    throw new Error('Unexpected response from Anthropic')
  }

  return content.text
}

// ── Generic helper used by all API routes ─────────────────────────────────────
export async function callClaude({
  model = 'claude-haiku-4-5-20251001',
  system,
  userMessage,
  maxTokens = 400,
}: {
  model?: string
  system: string
  userMessage: string
  maxTokens?: number
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Anthropic API error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const content = data.content?.[0]
  if (!content || content.type !== 'text') throw new Error('Unexpected response from Anthropic')
  return content.text
}
