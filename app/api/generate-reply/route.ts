export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { generateReviewReply } from '@/lib/anthropic'
import { hasActiveAccess } from '@/lib/subscription'
import { resolveActiveOrPrimaryLocationId } from '@/lib/locations/active'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const allowed = await hasActiveAccess(supabaseAdmin, user.id)
  if (!allowed) {
    return NextResponse.json({ error: 'Subscription required' }, { status: 402 })
  }

  // Rate limit: max 20 AI generations per 60 seconds per user
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
  const { count: recentCount } = await supabaseAdmin
    .from('replies')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneMinuteAgo)

  if ((recentCount ?? 0) >= 20) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before generating more replies.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  const body = await request.json().catch(() => ({}))
  const { reviewText, starRating, platform, tone } = body

  if (!reviewText || !starRating || !platform) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!reviewText || typeof reviewText !== 'string' || reviewText.length > 5000) {
    return NextResponse.json({ error: 'Invalid review text' }, { status: 400 })
  }
  if (typeof starRating !== 'number' || starRating < 1 || starRating > 5) {
    return NextResponse.json({ error: 'Invalid star rating' }, { status: 400 })
  }
  const VALID_PLATFORMS = ['google', 'yelp']
  if (platform && !VALID_PLATFORMS.includes(platform.toLowerCase())) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  // Use the currently-viewed location so voice/tone/owner_name match the
  // review the user is replying to. Falls back to primary if no active
  // cookie is set.
  const activeId = await resolveActiveOrPrimaryLocationId(supabaseAdmin, user.id)
  const { data: restaurantProfile } = activeId
    ? await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', activeId)
        .maybeSingle()
    : { data: null }

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
