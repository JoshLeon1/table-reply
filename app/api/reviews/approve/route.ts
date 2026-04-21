export const dynamic = 'force-dynamic'

// Approves a review reply and, if the review has a matched GBP resource name
// and the user has a connected GBP token, posts the reply directly to Google.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { postGbpReply } from '@/lib/gbp/post-reply'
import { getGbpToken } from '@/lib/gbp/client'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { reviewId, replyText } = await request.json().catch(() => ({}))
  if (!reviewId) {
    return NextResponse.json({ error: 'reviewId is required' }, { status: 400 })
  }

  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Fetch the review to get google_review_name and generated_reply
  const { data: review, error: fetchErr } = await supabaseAdmin
    .from('scraped_reviews')
    .select('id, user_id, business_profile_id, google_review_name, generated_reply, source')
    .eq('id', reviewId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchErr || !review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  const reply = replyText ?? review.generated_reply
  if (!reply) {
    return NextResponse.json({ error: 'No reply text available' }, { status: 400 })
  }

  // Mark as approved
  const { error: updateErr } = await supabaseAdmin
    .from('scraped_reviews')
    .update({ reply_status: 'approved' })
    .eq('id', reviewId)
    .eq('user_id', user.id)

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to approve review' }, { status: 500 })
  }

  // Attempt GBP posting if the review is from Google and has a resource name
  let gbpPosted = false
  let gbpError: string | undefined

  if (review.source === 'google' && review.google_review_name && review.business_profile_id) {
    const token = await getGbpToken(user.id, review.business_profile_id)
    if (token) {
      const result = await postGbpReply(user.id, review.business_profile_id, review.google_review_name, reply)
      if (result.ok) {
        gbpPosted = true
        await supabaseAdmin
          .from('scraped_reviews')
          .update({ gbp_posted_at: new Date().toISOString() })
          .eq('id', reviewId)
      } else {
        gbpError = result.error
        console.warn('[reviews/approve] GBP post failed (non-fatal):', result.error)
      }
    }
  }

  return NextResponse.json({ approved: true, gbpPosted, gbpError })
}
