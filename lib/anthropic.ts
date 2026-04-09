import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface ReplyPreferences {
  endWithOwnerName?: boolean
  includeRestaurantName?: boolean
  inviteBack?: boolean
}

interface GenerateReviewReplyParams {
  restaurantName: string
  cuisineType: string
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
    restaurantName,
    cuisineType,
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
    includeRestaurantName: true,
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
    prefs.includeRestaurantName
      ? `Naturally mention the restaurant name (${restaurantName}) once in the reply.`
      : 'Do NOT mention the restaurant name in the reply.',
    prefs.inviteBack
      ? 'For 4-5 star reviews, invite the customer to come back soon.'
      : 'Do NOT invite the customer to return.',
  ].join(' ')

  const systemPrompt = `You are a reply assistant for ${restaurantName}, a ${vibe} ${cuisineType} restaurant. The owner's name is ${ownerName}. Write this review response in this voice: ${voiceStyle}.${toneInstruction} About the restaurant: ${description}. Rules: (1) NEVER start with "Thank you for your feedback" or "We appreciate your review." (2) Reference specific details from the review. (3) For 4-5 star: warm and specific. (4) For 3 star: acknowledge what went right, address the issue honestly. (5) For 1-2 star: lead with sincere empathy, never argue, offer to make it right, include "please reach out to us directly at [email]." (6) 75-150 words. (7) Sound like a real human owner. (8) Max one exclamation mark. Preferences: ${prefInstructions}`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 400,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Write a response to this ${starRating}-star review from ${platform}:\n\n"${reviewText}"`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Anthropic')
  }

  return content.text
}
