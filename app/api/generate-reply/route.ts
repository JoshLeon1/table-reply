export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateReviewReply } from '@/lib/anthropic'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { reviewText, starRating, platform, tone } = body

  if (!reviewText || !starRating || !platform) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: restaurantProfile } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!restaurantProfile) {
    return NextResponse.json({ error: 'Business profile not found' }, { status: 400 })
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    console.error('[generate-reply] ANTHROPIC_API_KEY is not set')
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
  }

  try {
    const reply = await generateReviewReply({
      businessName: restaurantProfile.business_name ?? '',
      businessType: restaurantProfile.business_type ?? '',
      vibe: restaurantProfile.vibe ?? '',
      voiceStyle: restaurantProfile.voice_style ?? restaurantProfile.reply_tone ?? '',
      description: restaurantProfile.description ?? '',
      ownerName: restaurantProfile.owner_name ?? '',
      reviewText,
      platform,
      starRating,
      tone: tone ?? undefined,
      replyPreferences: restaurantProfile.reply_preferences ?? undefined,
    })

    // Best-effort save to replies log — don't fail the request if this errors
    void supabase.from('replies').insert({
      user_id: user.id,
      review_text: reviewText,
      platform,
      star_rating: starRating,
      generated_reply: reply,
    })

    return NextResponse.json({ reply })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[generate-reply] Error:', msg)
    return NextResponse.json({ error: `Failed to generate reply: ${msg}` }, { status: 500 })
  }
}
