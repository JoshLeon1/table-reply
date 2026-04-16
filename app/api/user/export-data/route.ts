export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    { data: profile },
    { data: restaurantProfile },
    { data: scrapedReviews },
    { data: replies },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('business_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('scraped_reviews').select('id, reviewer_name, star_rating, review_text, review_datetime_utc, platform, reply_status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('replies').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    account: {
      email: user.email,
      created_at: user.created_at,
      is_paid: profile?.is_paid ?? false,
    },
    business_profile: restaurantProfile
      ? {
          business_name: restaurantProfile.business_name,
          business_type: restaurantProfile.business_type,
          vibe: restaurantProfile.vibe,
          voice_style: restaurantProfile.voice_style,
          description: restaurantProfile.description,
          owner_name: restaurantProfile.owner_name,
          reply_preferences: restaurantProfile.reply_preferences,
        }
      : null,
    reviews: (scrapedReviews ?? []).map((r) => ({
      id: r.id,
      reviewer_name: r.reviewer_name,
      star_rating: r.star_rating,
      review_text: r.review_text,
      review_datetime_utc: r.review_datetime_utc,
      platform: r.platform,
      reply_status: r.reply_status,
      created_at: r.created_at,
    })),
    replies: (replies ?? []).map((r) => ({
      id: r.id,
      review_text: r.review_text,
      platform: r.platform,
      star_rating: r.star_rating,
      generated_reply: r.generated_reply,
      created_at: r.created_at,
    })),
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="replyfi-data.json"',
    },
  })
}
