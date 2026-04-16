export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/anthropic'
import { Resend } from 'resend'
import { hasActiveAccess } from '@/lib/subscription'

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function matchesKeyword(reviewText: string, keyword: string): boolean {
  const pattern = new RegExp(`\\b${escapeRegExp(keyword.toLowerCase())}\\b`, 'i')
  return pattern.test(reviewText)
}

interface OutscraperReview {
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
  // ── Parse body once (readable stream can only be consumed once) ─────────
  const body = await request.json().catch(() => ({}))

  // ── Auth: accept either cron secret OR a valid user session ────────────
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const cronHeader  = request.headers.get('x-cron-secret')
  const authHeader  = request.headers.get('authorization')
  const isCron =
    cronHeader === process.env.CRON_SECRET ||
    authHeader === `Bearer ${process.env.CRON_SECRET}`

  let userId: string
  let restaurantProfileId: string

  if (isCron) {
    // Called by the daily cron — body must supply both IDs
    userId              = body.userId
    restaurantProfileId = body.restaurantProfileId
    if (!userId || !restaurantProfileId) {
      return NextResponse.json(
        { error: 'userId and restaurantProfileId are required for cron requests' },
        { status: 400 }
      )
    }
  } else {
    // Called manually from the dashboard — validate user session
    const userSupabase = createServerClient()
    const {
      data: { user },
    } = await userSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    userId = user.id

    const allowed = await hasActiveAccess(supabaseAdmin, userId)
    if (!allowed) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 402 })
    }

    const { data: rp } = await supabaseAdmin
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!rp) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 400 })
    }

    restaurantProfileId = rp.id
  }

  // ── Fetch business profile ───────────────────────────────────────────
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('business_profiles')
    .select('*')
    .eq('id', restaurantProfileId)
    .eq('user_id', userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
  }

  if (!profile.google_maps_url) {
    return NextResponse.json({ error: 'No Google Maps URL configured' }, { status: 400 })
  }

  // ── Fetch user email once (for keyword alert emails) ──────────────────
  let userEmail: string | null = null
  try {
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId)
    userEmail = authUser?.email ?? null
  } catch { /* silent fail */ }

  // ── Fetch keyword alerts for this user ────────────────────────────────
  const { data: keywordAlerts } = await supabaseAdmin
    .from('keyword_alerts')
    .select('keyword, alert_type')
    .eq('user_id', userId)

  // ── Test mode: skip Outscraper, use fake reviews ─────────────────────
  // Only allow test mode from cron/admin requests — dashboard users cannot
  // trigger this to generate fake reviews or burn AI credits for free.
  const isTestMode = isCron && body.testMode === true

  if (isTestMode) {
    console.log('[scrape-reviews] TEST MODE — using fake reviews, skipping Outscraper')
  }

  // ── Outscraper API key guard ──────────────────────────────────────────
  if (!isTestMode && !process.env.OUTSCRAPER_API_KEY) {
    return NextResponse.json({ error: 'OUTSCRAPER_API_KEY is not configured' }, { status: 500 })
  }

  // ── Call Outscraper (async — poll until Success) ───────────────────────
  let reviews: OutscraperReview[] = []

  if (isTestMode) {
    reviews = [
      {
        review_id: 'test-1',
        author_title: 'Sarah M',
        review_rating: 4,
        review_text: 'The pasta was incredible — best cacio e pepe in Austin. Service a little slow Friday but host was super warm.',
        review_datetime_utc: new Date().toISOString(),
      },
      {
        review_id: 'test-2',
        author_title: 'James T',
        review_rating: 2,
        review_text: 'Waited 45 minutes past our reservation. Food was good once it arrived but the wait was unacceptable for a special occasion.',
        review_datetime_utc: new Date().toISOString(),
      },
      {
        review_id: 'test-3',
        author_title: 'Maria L',
        review_rating: 5,
        review_text: 'Absolutely perfect from start to finish. Tasting menu worth every penny. Will be back for our anniversary.',
        review_datetime_utc: new Date().toISOString(),
      },
    ]
    console.log('[scrape-reviews] Injected', reviews.length, 'fake reviews')
  } else {
  console.log('[scrape-reviews] Using Google Maps URL:', profile.google_maps_url)

  try {
    console.log('[scrape-reviews] Submitting Outscraper request…')
    const outscrapeRes = await fetch(
      `https://api.app.outscraper.com/maps/reviews-v3` +
        `?query=${encodeURIComponent(profile.google_maps_url)}` +
        `&reviewsLimit=20` +
        `&sort=newest`,
      {
        headers: {
          'X-API-KEY': process.env.OUTSCRAPER_API_KEY!,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('[scrape-reviews] Outscraper HTTP status:', outscrapeRes.status, outscrapeRes.statusText)

    if (!outscrapeRes.ok) {
      const errBody = await outscrapeRes.text().catch(() => '(unreadable)')
      console.error('[scrape-reviews] Outscraper error body:', errBody.slice(0, 500))
      const friendlyMsg =
        outscrapeRes.status === 402 ? 'Review sync failed — your Outscraper account has an unpaid balance. Please settle it at outscraper.com.' :
        outscrapeRes.status === 401 ? 'Review sync failed — invalid Outscraper API credentials.' :
        outscrapeRes.status === 429 ? 'Review sync rate-limited by Outscraper. Please try again in a few minutes.' :
        `Review sync failed (Outscraper error ${outscrapeRes.status}). Please try again.`
      throw new Error(friendlyMsg)
    }

    let result = await outscrapeRes.json()

    console.log('[scrape-reviews] Initial response (first 500 chars):', JSON.stringify(result).slice(0, 500))
    console.log('[scrape-reviews] Initial status:', result.status)

    // ── Check for body-level errors (HTTP 200 but error payload) ────────
    if (result.error || result.errorMessage) {
      const errMsg: string = result.error ?? result.errorMessage
      console.error('[scrape-reviews] Outscraper body error:', errMsg)
      throw new Error(`Review sync failed: ${errMsg}`)
    }
    const lowerStatus = (result.status ?? '').toLowerCase()
    if (lowerStatus && lowerStatus !== 'pending' && lowerStatus !== 'success' && lowerStatus !== 'completed') {
      console.error('[scrape-reviews] Outscraper returned unexpected status:', result.status)
      throw new Error(`Review sync failed (status: ${result.status}). Please try again.`)
    }

    // ── Poll if async (202 Pending) ──────────────────────────────────────
    if (result.status === 'Pending') {
      // Extract the request ID and always poll via api.app.outscraper.com —
      // the results_location may point to api.outscraper.cloud which rejects
      // the X-API-KEY header, causing silent auth failures.
      const requestId = result.results_location?.split('/').pop()
      if (!requestId) throw new Error('Outscraper job missing results_location')
      const canonicalPollUrl = `https://api.app.outscraper.com/requests/${requestId}`
      console.log('[scrape-reviews] Job is async — request ID:', requestId)
      console.log('[scrape-reviews] Polling:', canonicalPollUrl)

      let attempts = 0
      while (result.status === 'Pending' && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 5000))

        const pollRes = await fetch(canonicalPollUrl, {
          headers: { 'X-API-KEY': process.env.OUTSCRAPER_API_KEY! },
        })

        const pollBody = await pollRes.json()
        console.log(`[scrape-reviews] Poll ${attempts + 1} status:`, pollBody.status)

        if (!pollRes.ok) {
          console.error(`[scrape-reviews] Poll ${attempts + 1} HTTP error (${pollRes.status}):`, JSON.stringify(pollBody).slice(0, 500))
          throw new Error(`Outscraper poll returned ${pollRes.status}: ${pollRes.statusText}`)
        }

        result = pollBody
        attempts++
      }

      if (result.status !== 'Success') {
        throw new Error(`Outscraper job did not complete after ${attempts} polls — final status: ${result.status}`)
      }

      console.log('[scrape-reviews] Job completed after', attempts, 'poll(s)')
    }

    console.log('[scrape-reviews] Final response (first 500 chars):', JSON.stringify(result).slice(0, 500))

    // Outscraper wraps results: { data: [{ reviews_data: [...] }] }
    reviews = result?.data?.[0]?.reviews_data ?? result?.[0]?.reviews_data ?? []

    if (!Array.isArray(reviews)) {
      console.warn('[scrape-reviews] reviews_data was not an array — got:', typeof reviews, '— defaulting to []')
      reviews = []
    }

    console.log('[scrape-reviews] Reviews returned from Outscraper:', reviews.length)
  } catch (err) {
    console.error('[scrape-reviews] Outscraper error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Outscraper request failed' },
      { status: 500 }
    )
  }
  } // end else (non-test mode)

  // ── Process reviews ────────────────────────────────────────────────────
  let newReviewsCount = 0
  const totalProcessed = reviews.length

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

  let skippedExisting = 0

  for (const review of reviews) {
    const {
      review_id,
      author_title,
      review_rating,
      review_text,
      review_datetime_utc,
    } = review

    console.log(`[scrape-reviews] Processing review ${review_id} — ${review_rating}★ by ${author_title}`)

    // Skip if we've already stored this review
    const { data: existing } = await supabaseAdmin
      .from('scraped_reviews')
      .select('id')
      .eq('review_id', review_id)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      console.log(`[scrape-reviews] ↳ Skipping — already in DB (id: ${existing.id})`)
      skippedExisting++
      continue
    }

    // Skip reply generation if the review has no text
    const hasText = review_text != null && review_text.trim().length > 0

    let generatedReply: string | null = null
    let replyStatus: 'pending' | 'skipped' = 'pending'
    let detectedLanguage = 'English'
    let staffMentions: string[] = []
    let alertTriggered = false
    let matchedKeyword: string | undefined

    if (!hasText) {
      console.log(`[scrape-reviews] ↳ Skipping — no review text`)
      replyStatus = 'skipped'
    } else {
      // ── Feature 9: Detect language ──────────────────────────────────────
      try {
        detectedLanguage = (await callClaude({
          maxTokens: 20,
          system: 'You detect languages. Reply with ONLY the language name in English, nothing else.',
          userMessage: `What language is this text written in?\n\n"${review_text.slice(0, 200)}"`,
        })).trim()
        console.log(`[scrape-reviews] ↳ Detected language: ${detectedLanguage}`)
      } catch { /* silent fail */ }

      // ── Feature 9: Build language instruction for reply ─────────────────
      let languageInstruction = ''
      const replyLang = profile.reply_language ?? 'match'
      if (replyLang === 'match') {
        if (detectedLanguage !== 'English') {
          languageInstruction = ` Write the reply in ${detectedLanguage}.`
        }
      } else if (replyLang === 'spanish') {
        languageInstruction = ' Write the reply in Spanish.'
      } else if (replyLang === 'french') {
        languageInstruction = ' Write the reply in French.'
      }
      // 'english' (or any unrecognised value): no instruction — default to English

      // ── Feature 2: Keyword alert check ──────────────────────────────────
      const allKeywords = [
        ...(keywordAlerts ?? []).map((a: { keyword: string }) => a.keyword.toLowerCase()),
        'food poisoning', 'cockroach', 'roach', 'health department', 'sick'
      ]
      matchedKeyword = allKeywords.find(kw => matchesKeyword(review_text ?? '', kw))
      alertTriggered = !!matchedKeyword

      if (alertTriggered) {
        console.log(`[scrape-reviews] ↳ Alert triggered — keyword: "${matchedKeyword}"`)
      }

      console.log(`[scrape-reviews] ↳ New review — generating reply…`)

      // ── Generate reply via Anthropic ────────────────────────────────────
      try {
        generatedReply = await callClaude({
          maxTokens: 400,
          system: systemPrompt + languageInstruction,
          userMessage: `Write a response to this ${review_rating}-star review (${review_text.trim().split(/\s+/).length} words):\n\n"${review_text}"`,
        })
        console.log(`[scrape-reviews] ↳ Reply generated (${generatedReply.length} chars)`)
      } catch (err) {
        console.error(`[scrape-reviews] Anthropic error for review ${review_id}:`, err)
        // Still insert the review, just with a null reply
      }

      // ── Feature 3: Extract staff mentions ───────────────────────────────
      try {
        const staffRaw = await callClaude({
          maxTokens: 100,
          system: 'You extract names. Return ONLY a JSON array of first names, or [] if none.',
          userMessage: `Extract any staff member first names mentioned in this business review. Example output: ["Karen", "Mike"]\n\nReview: "${review_text.slice(0, 500)}"`,
        })
        const parsed = JSON.parse(staffRaw.trim())
        if (Array.isArray(parsed)) staffMentions = parsed
        if (staffMentions.length > 0) console.log(`[scrape-reviews] ↳ Staff mentions: ${staffMentions.join(', ')}`)
      } catch { /* silent fail */ }

      // ── Feature 2: Send alert email if triggered ─────────────────────────
      if (alertTriggered && userEmail && resend) {
        await resend.emails.send({
          from: 'Replyfi Alerts <alerts@replyfi.com>',
          to: userEmail,
          subject: `⚠️ Alert: A review mentioned "${matchedKeyword}"`,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h2 style="color:#111">⚠️ Keyword Alert for ${profile.business_name}</h2>
            <p>A new review mentioned <strong>"${matchedKeyword}"</strong> — you may want to respond quickly.</p>
            <div style="background:#FEF2F2;border-left:4px solid #EF4444;padding:16px;margin:16px 0;border-radius:8px">
              <p style="margin:0;font-weight:600">${author_title ?? 'Anonymous'} · ${review_rating}★</p>
              <p style="margin:8px 0 0;color:#555">"${review_text.slice(0, 300)}..."</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://replyfi.com'}/dashboard/reviews" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">View Review →</a>
            <p style="color:#AAA;font-size:12px;margin-top:24px">Replyfi · Manage alerts in <a href="https://replyfi.com/settings">Settings</a></p>
          </div>`
        }).catch(err => console.error('[scrape-reviews] Alert email error:', err))
      }
    }

    // Insert the new review
    // Base insert — always safe with existing schema
    const baseInsert = {
      user_id:               userId,
      business_profile_id: restaurantProfileId,
      review_id,
      reviewer_name:         author_title ?? 'Anonymous',
      star_rating:           review_rating ?? 0,
      review_text:           review_text ?? '',
      review_datetime_utc:   review_datetime_utc ?? null, // null is safe; '' breaks timestamptz
      generated_reply:       generatedReply,
      reply_status:          replyStatus,
      source:                'google',
    }

    // Try full insert (includes new columns); fall back to base if columns not yet migrated
    const { error: fullInsertErr } = await supabaseAdmin.from('scraped_reviews').insert({
      ...baseInsert,
      alert_triggered: alertTriggered,
      staff_mentions:  staffMentions.length > 0 ? staffMentions : null,
      language:        detectedLanguage !== 'English' ? detectedLanguage : null,
    })

    let insertErr = fullInsertErr
    if (fullInsertErr) {
      console.warn(`[scrape-reviews] ↳ Full insert failed (${fullInsertErr.message}) — trying base insert without new columns…`)
      const { error: baseInsertErr } = await supabaseAdmin.from('scraped_reviews').insert(baseInsert)
      insertErr = baseInsertErr
    }

    if (insertErr) {
      console.error(`[scrape-reviews] ↳ Insert error for review ${review_id}:`, insertErr)
    } else {
      console.log(`[scrape-reviews] ↳ Inserted successfully`)
      newReviewsCount++
    }
  }

  console.log(
    `[scrape-reviews] Done — total: ${reviews.length}, new: ${newReviewsCount}, skipped (existing): ${skippedExisting}`
  )

  // ── Update last_scraped_at ─────────────────────────────────────────────
  await supabaseAdmin
    .from('business_profiles')
    .update({ last_scraped_at: new Date().toISOString() })
    .eq('id', restaurantProfileId)

  // ── Invalidate analytics cache when new reviews were found ─────────────
  if (newReviewsCount > 0) {
    console.log(`[scrape-reviews] ${newReviewsCount} new reviews — invalidating analytics cache`)
    await supabaseAdmin
      .from('business_analytics')
      .update({ reviews_count_at_analysis: -1 }) // force stale on next analytics load
      .eq('user_id', userId)
  }

  return NextResponse.json({ newReviews: newReviewsCount, totalProcessed })

  } catch (err) {
    console.error('[scrape-reviews] Unhandled error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
