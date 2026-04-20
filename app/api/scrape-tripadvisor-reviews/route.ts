export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/anthropic'
import { FROM_ALERTS, REPLY_TO_SUPPORT, buildUnsubscribeHeaders, escapeHtml, getResend, isEmailOptedIn } from '@/lib/email/client'
import { hasActiveAccess } from '@/lib/subscription'

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function matchesKeyword(reviewText: string, keyword: string): boolean {
  const pattern = new RegExp(`\\b${escapeRegExp(keyword.toLowerCase())}\\b`, 'i')
  return pattern.test(reviewText)
}

interface OutscraperTripAdvisorReview {
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
    const resend = getResend()
    const body = await request.json().catch(() => ({}))

    if (!process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

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

      const allowed = await hasActiveAccess(supabaseAdmin, userId)
      if (!allowed) {
        return NextResponse.json({ error: 'Subscription required' }, { status: 402 })
      }

      const { data: rp } = await supabaseAdmin
        .from('business_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!rp) return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
      restaurantProfileId = rp.id
    }

    // ── Fetch business profile ──────────────────────────────────────────
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('id', restaurantProfileId)
      .eq('user_id', userId)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    }

    if (!profile.tripadvisor_url) {
      return NextResponse.json({ error: 'No TripAdvisor URL configured' }, { status: 400 })
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

    // ── Outscraper API key guard ──────────────────────────────────────────
    if (!process.env.OUTSCRAPER_API_KEY) {
      return NextResponse.json({ error: 'OUTSCRAPER_API_KEY is not configured' }, { status: 500 })
    }

    // ── Call Outscraper TripAdvisor reviews endpoint ──────────────────────
    let reviews: OutscraperTripAdvisorReview[] = []
    if (process.env.NODE_ENV === 'development') console.log('[scrape-tripadvisor] Using TripAdvisor URL:', profile.tripadvisor_url)

    try {
      if (process.env.NODE_ENV === 'development') console.log('[scrape-tripadvisor] Submitting Outscraper request…')
      const outscrapeRes = await fetch(
        `https://api.app.outscraper.com/tripadvisor/reviews` +
          `?query=${encodeURIComponent(profile.tripadvisor_url)}` +
          `&reviewsLimit=20` +
          `&sort=newest`,
        {
          headers: {
            'X-API-KEY': process.env.OUTSCRAPER_API_KEY!,
            'Content-Type': 'application/json',
          },
        }
      )

      if (process.env.NODE_ENV === 'development') console.log('[scrape-tripadvisor] HTTP status:', outscrapeRes.status, outscrapeRes.statusText)

      if (!outscrapeRes.ok) {
        const errBody = await outscrapeRes.text().catch(() => '(unreadable)')
        console.error('[scrape-tripadvisor] Error body:', errBody.slice(0, 500))
        const friendlyMsg =
          outscrapeRes.status === 402 ? 'TripAdvisor sync failed — your Outscraper account has an unpaid balance. Please settle it at outscraper.com.' :
          outscrapeRes.status === 401 ? 'TripAdvisor sync failed — invalid Outscraper API credentials.' :
          outscrapeRes.status === 429 ? 'TripAdvisor sync rate-limited by Outscraper. Please try again in a few minutes.' :
          `TripAdvisor sync failed (Outscraper error ${outscrapeRes.status}). Please try again.`
        throw new Error(friendlyMsg)
      }

      let result = await outscrapeRes.json()
      if (process.env.NODE_ENV === 'development') console.log('[scrape-tripadvisor] Initial status:', result.status)

      // ── Poll if async ─────────────────────────────────────────────────
      if (result.status === 'Pending') {
        const requestId = result.results_location?.split('/').pop()
        if (!requestId) throw new Error('Outscraper job missing results_location')
        const pollUrl = `https://api.app.outscraper.com/requests/${requestId}`
        if (process.env.NODE_ENV === 'development') console.log('[scrape-tripadvisor] Async job — polling:', pollUrl)

        let attempts = 0
        while (result.status === 'Pending' && attempts < 20) {
          await new Promise((r) => setTimeout(r, 5000))
          const pollRes = await fetch(pollUrl, {
            headers: { 'X-API-KEY': process.env.OUTSCRAPER_API_KEY! },
          })
          const pollBody = await pollRes.json()
          if (process.env.NODE_ENV === 'development') console.log(`[scrape-tripadvisor] Poll ${attempts + 1} status:`, pollBody.status)
          if (!pollRes.ok) throw new Error(`Poll ${attempts + 1} failed: ${pollRes.status}`)
          result = pollBody
          attempts++
        }

        if (result.status !== 'Success') {
          throw new Error(`TripAdvisor job did not complete — final status: ${result.status}`)
        }
        if (process.env.NODE_ENV === 'development') console.log('[scrape-tripadvisor] Completed after', attempts, 'poll(s)')
      }

      reviews = result?.data?.[0]?.reviews_data ?? result?.[0]?.reviews_data ?? []
      if (!Array.isArray(reviews)) {
        console.warn('[scrape-tripadvisor] reviews_data not an array — defaulting to []')
        reviews = []
      }
      if (process.env.NODE_ENV === 'development') console.log('[scrape-tripadvisor] Reviews returned:', reviews.length)
    } catch (err) {
      console.error('[scrape-tripadvisor] Outscraper error:', err)
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Outscraper TripAdvisor request failed' },
        { status: 500 }
      )
    }

    // ── Process reviews ───────────────────────────────────────────────────
    let newReviewsCount = 0
    let skippedExisting = 0

    const systemPrompt =
      `You are a reply assistant for ${profile.business_name}, ` +
      `a ${profile.vibe} ${profile.business_type} business. ` +
      `Owner: ${profile.owner_name}. ` +
      `Voice: ${profile.voice_style ?? profile.reply_tone ?? 'warm and professional'}. ` +
      `Rules: (1) NEVER start with "Thank you for your feedback" or "We appreciate your review." ` +
      `(2) Sound like a real human owner. ` +
      `(3) For 4-5 stars: warm, genuine, reference something specific they mentioned. ` +
      `(4) For 3 stars: acknowledge what went right, address the concern honestly. ` +
      `(5) For 1-2 stars: sincere empathy first, never defensive, offer to make it right. ` +
      `(6) Max one exclamation mark total. ` +
      `(7) STRICT LENGTH — scale to review length AND star rating. ` +
      `For 4-5 star reviews: mirror review length — ` +
      `1-10 words → 1 sentence max 20 words; ` +
      `11-30 words → 1-2 sentences max 35 words; ` +
      `31-75 words → 2-3 sentences max 55 words; ` +
      `76+ words → 3-4 sentences max 80 words. ` +
      `For 1-3 star reviews: slightly longer to address the complaint — 2-4 sentences max 65 words. ` +
      `Must cover acknowledgment and what you will do about it. Still concise, no rambling. ` +
      `Do NOT exceed these limits. Do NOT pad. ` +
      `Always end with — ${profile.owner_name}`

    for (const review of reviews) {
      const { review_id, author_title, review_rating, review_text, review_datetime_utc } = review

      const taReviewId = `ta-${review_id}`
      if (process.env.NODE_ENV === 'development') console.log(`[scrape-tripadvisor] Processing ${taReviewId} — ${review_rating}★ by ${author_title}`)

      const { data: existing } = await supabaseAdmin
        .from('scraped_reviews')
        .select('id')
        .eq('review_id', taReviewId)
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
        matchedKeyword = allKeywords.find(kw => matchesKeyword(review_text ?? '', kw))
        alertTriggered = !!matchedKeyword

        // Generate reply
        try {
          generatedReply = await callClaude({
            maxTokens: 400,
            system: systemPrompt + languageInstruction,
            userMessage: `Write a response to this ${review_rating}-star TripAdvisor review (${review_text.trim().split(/\s+/).length} words):\n\n"${review_text}"`,
          })
        } catch (err) {
          console.error(`[scrape-tripadvisor] Anthropic error for ${taReviewId}:`, err)
        }

        // Staff mentions
        try {
          const staffRaw = await callClaude({
            maxTokens: 100,
            system: 'You extract names. Return ONLY a JSON array of first names, or [] if none.',
            userMessage: `Extract any staff member first names mentioned in this business review. Example output: ["Karen", "Mike"]\n\nReview: "${review_text.slice(0, 500)}"`,
          })
          const parsed = JSON.parse(staffRaw.trim())
          if (Array.isArray(parsed)) staffMentions = parsed
        } catch { /* silent */ }

        // Keyword alert email (honor keyword-alerts opt-out)
        if (alertTriggered && userEmail && resend && matchedKeyword && await isEmailOptedIn(supabaseAdmin, userId, 'keywordAlerts')) {
          const safeKeyword = escapeHtml(matchedKeyword)
          const safeBusiness = escapeHtml(profile.business_name)
          const safeAuthor = escapeHtml(author_title ?? 'Anonymous')
          const safeText = escapeHtml((review_text ?? '').slice(0, 300))
          const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://replyfi.app').replace(/\/$/, '')
          const { error: alertSendError } = await resend.emails.send({
            from: FROM_ALERTS,
            to: userEmail,
            replyTo: REPLY_TO_SUPPORT,
            subject: `⚠️ Alert: A TripAdvisor review mentioned "${matchedKeyword.replace(/[\r\n]/g, ' ')}"`,
            headers: buildUnsubscribeHeaders(),
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
              <h2 style="color:#111">⚠️ TripAdvisor Keyword Alert for ${safeBusiness}</h2>
              <p>A new TripAdvisor review mentioned <strong>"${safeKeyword}"</strong>.</p>
              <div style="background:#FEF2F2;border-left:4px solid #EF4444;padding:16px;margin:16px 0;border-radius:8px">
                <p style="margin:0;font-weight:600">${safeAuthor} · ${review_rating}★ (TripAdvisor)</p>
                <p style="margin:8px 0 0;color:#555">"${safeText}..."</p>
              </div>
              <a href="${appUrl}/dashboard/reviews" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">View Review →</a>
              <p style="color:#AAA;font-size:12px;margin-top:24px">ReplyFi · Manage alerts in <a href="${appUrl}/settings">Settings</a></p>
            </div>`,
          })
          if (alertSendError) {
            console.error('[scrape-tripadvisor] Alert email error (Resend response):', alertSendError)
          }
        }
      }

      const baseInsert = {
        user_id:               userId,
        business_profile_id: restaurantProfileId,
        review_id:             taReviewId,
        reviewer_name:         author_title ?? 'Anonymous',
        star_rating:           review_rating ?? 0,
        review_text:           review_text ?? '',
        review_datetime_utc:   review_datetime_utc ?? null,
        generated_reply:       generatedReply,
        reply_status:          replyStatus,
        source:                'tripadvisor',
      }

      const { error: fullInsertErr } = await supabaseAdmin.from('scraped_reviews').insert({
        ...baseInsert,
        alert_triggered: alertTriggered,
        staff_mentions:  staffMentions.length > 0 ? staffMentions : null,
        language:        detectedLanguage !== 'English' ? detectedLanguage : null,
      })

      let insertErr = fullInsertErr
      if (fullInsertErr) {
        if (process.env.NODE_ENV === 'development') console.warn(`[scrape-tripadvisor] Full insert failed — trying base insert without new columns`)
        const { error: baseErr } = await supabaseAdmin.from('scraped_reviews').insert(baseInsert)
        insertErr = baseErr
      }

      if (insertErr) {
        console.error(`[scrape-tripadvisor] Insert error for ${taReviewId}:`, insertErr)
      } else {
        newReviewsCount++
      }
    }

    if (process.env.NODE_ENV === 'development') console.log(`[scrape-tripadvisor] Done — total: ${reviews.length}, new: ${newReviewsCount}, skipped: ${skippedExisting}`)

    await supabaseAdmin
      .from('business_profiles')
      .update({ tripadvisor_last_scraped_at: new Date().toISOString() })
      .eq('id', restaurantProfileId)

    if (newReviewsCount > 0) {
      await supabaseAdmin
        .from('business_analytics')
        .update({ reviews_count_at_analysis: -1 })
        .eq('user_id', userId)
    }

    return NextResponse.json({ newReviews: newReviewsCount, totalProcessed: reviews.length })

  } catch (err) {
    console.error('[scrape-tripadvisor] Unhandled error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
