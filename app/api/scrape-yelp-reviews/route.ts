export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/anthropic'
import { Resend } from 'resend'

interface OutscraperYelpReview {
  review_id: string
  author_title: string
  review_rating: number
  review_text: string
  review_datetime_utc: string
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
    const body = await request.json().catch(() => ({}))

    // ── Auth: accept cron secret OR valid user session ────────────────────
    const cronHeader = request.headers.get('x-cron-secret')
    const authHeader = request.headers.get('authorization')
    const isCron =
      cronHeader === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`

    let userId: string
    let restaurantProfileId: string

    if (isCron) {
      userId              = body.userId
      restaurantProfileId = body.restaurantProfileId
      if (!userId || !restaurantProfileId) {
        return NextResponse.json(
          { error: 'userId and restaurantProfileId are required for cron requests' },
          { status: 400 }
        )
      }
    } else {
      const userSupabase = createServerClient()
      const { data: { user } } = await userSupabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      userId = user.id
      const { data: rp } = await supabaseAdmin
        .from('restaurant_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!rp) return NextResponse.json({ error: 'Restaurant profile not found' }, { status: 400 })
      restaurantProfileId = rp.id
    }

    // ── Fetch restaurant profile ──────────────────────────────────────────
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('restaurant_profiles')
      .select('*')
      .eq('id', restaurantProfileId)
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Restaurant profile not found' }, { status: 404 })
    }

    if (!profile.yelp_url) {
      return NextResponse.json({ error: 'No Yelp URL configured' }, { status: 400 })
    }

    // ── Fetch user email ──────────────────────────────────────────────────
    let userEmail: string | null = null
    try {
      const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId)
      userEmail = authUser?.email ?? null
    } catch { /* silent */ }

    // ── Fetch keyword alerts ──────────────────────────────────────────────
    const { data: keywordAlerts } = await supabaseAdmin
      .from('keyword_alerts')
      .select('keyword, alert_type')
      .eq('user_id', userId)

    // ── Call Outscraper Yelp reviews endpoint ─────────────────────────────
    let reviews: OutscraperYelpReview[] = []
    console.log('[scrape-yelp] Using Yelp URL:', profile.yelp_url)

    try {
      console.log('[scrape-yelp] Submitting Outscraper request…')
      const outscrapeRes = await fetch(
        `https://api.app.outscraper.com/yelp/reviews` +
          `?query=${encodeURIComponent(profile.yelp_url)}` +
          `&reviewsLimit=20` +
          `&sort=newest`,
        {
          headers: {
            'X-API-KEY': process.env.OUTSCRAPER_API_KEY!,
            'Content-Type': 'application/json',
          },
        }
      )

      console.log('[scrape-yelp] Outscraper HTTP status:', outscrapeRes.status, outscrapeRes.statusText)

      if (!outscrapeRes.ok) {
        const errBody = await outscrapeRes.text().catch(() => '(unreadable)')
        console.error('[scrape-yelp] Outscraper error body:', errBody.slice(0, 500))
        throw new Error(`Outscraper returned ${outscrapeRes.status}: ${outscrapeRes.statusText}`)
      }

      let result = await outscrapeRes.json()
      console.log('[scrape-yelp] Initial status:', result.status)

      // ── Poll if async ─────────────────────────────────────────────────
      if (result.status === 'Pending') {
        const requestId = result.results_location.split('/').pop()
        const pollUrl = `https://api.app.outscraper.com/requests/${requestId}`
        console.log('[scrape-yelp] Async job — polling:', pollUrl)

        let attempts = 0
        while (result.status === 'Pending' && attempts < 20) {
          await new Promise((r) => setTimeout(r, 5000))
          const pollRes = await fetch(pollUrl, {
            headers: { 'X-API-KEY': process.env.OUTSCRAPER_API_KEY! },
          })
          const pollBody = await pollRes.json()
          console.log(`[scrape-yelp] Poll ${attempts + 1} status:`, pollBody.status)
          if (!pollRes.ok) throw new Error(`Poll ${attempts + 1} failed: ${pollRes.status}`)
          result = pollBody
          attempts++
        }

        if (result.status !== 'Success') {
          throw new Error(`Yelp job did not complete — final status: ${result.status}`)
        }
        console.log('[scrape-yelp] Job completed after', attempts, 'poll(s)')
      }

      // Outscraper wraps: { data: [{ reviews_data: [...] }] }
      reviews = result?.data?.[0]?.reviews_data ?? result?.[0]?.reviews_data ?? []
      if (!Array.isArray(reviews)) {
        console.warn('[scrape-yelp] reviews_data not an array — defaulting to []')
        reviews = []
      }
      console.log('[scrape-yelp] Reviews returned:', reviews.length)
    } catch (err) {
      console.error('[scrape-yelp] Outscraper error:', err)
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Outscraper Yelp request failed' },
        { status: 500 }
      )
    }

    // ── Process reviews ───────────────────────────────────────────────────
    let newReviewsCount = 0
    let skippedExisting = 0

    const systemPrompt =
      `You are a reply assistant for ${profile.restaurant_name}, ` +
      `a ${profile.vibe} ${profile.cuisine_type} restaurant. ` +
      `Owner name: ${profile.owner_name}. ` +
      `Voice: ${profile.voice_style ?? profile.reply_tone ?? 'warm and professional'}. ` +
      `Rules: Never start with "Thank you for your feedback". ` +
      `Reference specific details from the review. ` +
      `For 4-5 stars: warm, specific, invite them back. ` +
      `For 1-2 stars: sincere empathy, never defensive, offer to make it right. ` +
      `IMPORTANT — match reply length to review length: ` +
      `short review (1-2 sentences) → reply in 1-2 sentences only; ` +
      `medium review (3-5 sentences) → reply in 2-3 sentences; ` +
      `long review (6+ sentences or 100+ words) → reply in 3-4 sentences max. ` +
      `Never pad with filler. Always end with — ${profile.owner_name}`

    for (const review of reviews) {
      const { review_id, author_title, review_rating, review_text, review_datetime_utc } = review

      // Prefix yelp- to avoid collisions with Google review IDs
      const yelpReviewId = `yelp-${review_id}`
      console.log(`[scrape-yelp] Processing review ${yelpReviewId} — ${review_rating}★ by ${author_title}`)

      const { data: existing } = await supabaseAdmin
        .from('scraped_reviews')
        .select('id')
        .eq('review_id', yelpReviewId)
        .eq('user_id', userId)
        .maybeSingle()

      if (existing) {
        skippedExisting++
        continue
      }

      const hasText = review_text != null && review_text.trim().length > 0
      let generatedReply: string | null = null
      let replyStatus: 'pending' | 'skipped' = 'pending'
      let detectedLanguage = 'English'
      let staffMentions: string[] = []
      let alertTriggered = false
      let matchedKeyword: string | undefined

      if (!hasText) {
        replyStatus = 'skipped'
      } else {
        // Language detection
        try {
          detectedLanguage = (await callClaude({
            maxTokens: 20,
            system: 'You detect languages. Reply with ONLY the language name in English, nothing else.',
            userMessage: `What language is this text written in?\n\n"${review_text.slice(0, 200)}"`,
          })).trim()
        } catch { /* silent */ }

        // Language instruction
        let languageInstruction = ''
        const replyLang = profile.reply_language ?? 'match'
        if (replyLang === 'match' && detectedLanguage !== 'English') {
          languageInstruction = ` Write the reply in ${detectedLanguage}.`
        } else if (replyLang === 'spanish') {
          languageInstruction = ' Write the reply in Spanish.'
        } else if (replyLang === 'french') {
          languageInstruction = ' Write the reply in French.'
        }

        // Keyword alert check
        const allKeywords = [
          ...(keywordAlerts ?? []).map((a: { keyword: string }) => a.keyword.toLowerCase()),
          'food poisoning', 'cockroach', 'roach', 'health department', 'sick',
        ]
        const reviewLower = (review_text ?? '').toLowerCase()
        matchedKeyword = allKeywords.find(kw => reviewLower.includes(kw))
        alertTriggered = !!matchedKeyword

        // Generate reply
        try {
          generatedReply = await callClaude({
            maxTokens: 400,
            system: systemPrompt + languageInstruction,
            userMessage: `Write a response to this ${review_rating}-star Yelp review (${review_text.trim().split(/\s+/).length} words):\n\n"${review_text}"`,
          })
        } catch (err) {
          console.error(`[scrape-yelp] Anthropic error for review ${yelpReviewId}:`, err)
        }

        // Staff mentions
        try {
          const staffRaw = await callClaude({
            maxTokens: 100,
            system: 'You extract names. Return ONLY a JSON array of first names, or [] if none.',
            userMessage: `Extract any staff member first names mentioned in this restaurant review. Example output: ["Karen", "Mike"]\n\nReview: "${review_text.slice(0, 500)}"`,
          })
          const parsed = JSON.parse(staffRaw.trim())
          if (Array.isArray(parsed)) staffMentions = parsed
        } catch { /* silent */ }

        // Send alert email
        if (alertTriggered && userEmail && resend) {
          await resend.emails.send({
            from: 'TableReply Alerts <alerts@tablereply.com>',
            to: userEmail,
            subject: `⚠️ Alert: A Yelp review mentioned "${matchedKeyword}"`,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
              <h2 style="color:#111">⚠️ Yelp Keyword Alert for ${profile.restaurant_name}</h2>
              <p>A new Yelp review mentioned <strong>"${matchedKeyword}"</strong> — you may want to respond quickly.</p>
              <div style="background:#FEF2F2;border-left:4px solid #EF4444;padding:16px;margin:16px 0;border-radius:8px">
                <p style="margin:0;font-weight:600">${author_title ?? 'Anonymous'} · ${review_rating}★ (Yelp)</p>
                <p style="margin:8px 0 0;color:#555">"${review_text.slice(0, 300)}..."</p>
              </div>
              <a href="https://tablereply.com/dashboard/reviews" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">View Review →</a>
              <p style="color:#AAA;font-size:12px;margin-top:24px">TableReply · Manage alerts in <a href="https://tablereply.com/settings">Settings</a></p>
            </div>`,
          }).catch(err => console.error('[scrape-yelp] Alert email error:', err))
        }
      }

      // Insert review — source column marks it as Yelp
      const baseInsert = {
        user_id:               userId,
        restaurant_profile_id: restaurantProfileId,
        review_id:             yelpReviewId,
        reviewer_name:         author_title ?? 'Anonymous',
        star_rating:           review_rating ?? 0,
        review_text:           review_text ?? '',
        review_datetime_utc:   review_datetime_utc ?? null,
        generated_reply:       generatedReply,
        reply_status:          replyStatus,
        source:                'yelp',
      }

      const { error: fullInsertErr } = await supabaseAdmin.from('scraped_reviews').insert({
        ...baseInsert,
        alert_triggered: alertTriggered,
        staff_mentions:  staffMentions.length > 0 ? staffMentions : null,
        language:        detectedLanguage !== 'English' ? detectedLanguage : null,
      })

      let insertErr = fullInsertErr
      if (fullInsertErr) {
        console.warn(`[scrape-yelp] Full insert failed — trying base insert without new columns`)
        const { error: baseErr } = await supabaseAdmin.from('scraped_reviews').insert(baseInsert)
        insertErr = baseErr
      }

      if (insertErr) {
        console.error(`[scrape-yelp] Insert error for ${yelpReviewId}:`, insertErr)
      } else {
        newReviewsCount++
      }
    }

    console.log(`[scrape-yelp] Done — total: ${reviews.length}, new: ${newReviewsCount}, skipped: ${skippedExisting}`)

    // Update yelp_last_scraped_at
    await supabaseAdmin
      .from('restaurant_profiles')
      .update({ yelp_last_scraped_at: new Date().toISOString() })
      .eq('id', restaurantProfileId)

    // Invalidate analytics cache
    if (newReviewsCount > 0) {
      await supabaseAdmin
        .from('restaurant_analytics')
        .update({ reviews_count_at_analysis: -1 })
        .eq('user_id', userId)
    }

    return NextResponse.json({ newReviews: newReviewsCount, totalProcessed: reviews.length })

  } catch (err) {
    console.error('[scrape-yelp] Unhandled error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
