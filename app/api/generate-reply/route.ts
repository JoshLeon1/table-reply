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
    .from('restaurant_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!restaurantProfile) {
    return NextResponse.json({ error: 'Restaurant profile not found' }, { status: 400 })
  }

  try {
    const reply = await generateReviewReply({
      restaurantName: restaurantProfile.restaurant_name ?? '',
      cuisineType: restaurantProfile.cuisine_type ?? '',
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
    console.error('Error generating reply:', error)
    return NextResponse.json({ error: 'Failed to generate reply' }, { status: 500 })
  }
}
