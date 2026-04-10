export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    reviewText?: string
    reviewerName?: string
    starRating?: number
    restaurantName?: string
    style?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { reviewText, reviewerName, starRating, restaurantName, style } = body

  if (!reviewText || !reviewerName || !starRating || !restaurantName || !style) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Truncate review to fit nicely in the graphic
  const shortReview = reviewText.length > 140 ? reviewText.slice(0, 137) + '…' : reviewText
  const stars = '★'.repeat(starRating)

  const themes: Record<string, { bg: string; text: string; accent: string; sub: string }> = {
    'Dark & moody':    { bg: '#0F0D0B',  text: '#F5E6C8', accent: '#D4A847', sub: '#7A6A52' },
    'Warm & bright':   { bg: '#FDF4E7',  text: '#2C1810', accent: '#C8632A', sub: '#A0845A' },
    'Clean & minimal': { bg: '#FFFFFF',  text: '#111111', accent: '#1A1A1A', sub: '#888888' },
    'Bold & colorful': { bg: '#1A0533',  text: '#FFFFFF', accent: '#FF6B6B', sub: '#9B7FCC' },
  }

  const t = themes[style] ?? themes['Dark & moody']

  // Build the graphic directly — no AI hallucination risk
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Inter:wght@400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 400px; height: 400px; overflow: hidden; }
  body {
    background: ${t.bg};
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 36px 32px;
    position: relative;
  }
  .ornament {
    position: absolute;
    top: 22px;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0.18;
  }
  .stars {
    font-size: 18px;
    color: ${t.accent};
    letter-spacing: 3px;
    margin-bottom: 18px;
  }
  .quote-mark {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 72px;
    line-height: 0.5;
    color: ${t.accent};
    opacity: 0.35;
    display: block;
    margin-bottom: 8px;
  }
  .review {
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic;
    font-size: ${shortReview.length > 80 ? '16px' : '18px'};
    color: ${t.text};
    line-height: 1.55;
    text-align: center;
    max-width: 320px;
  }
  .divider {
    width: 40px;
    height: 1.5px;
    background: ${t.accent};
    opacity: 0.5;
    margin: 20px auto;
  }
  .footer {
    text-align: center;
  }
  .restaurant-name {
    font-family: 'Playfair Display', Georgia, serif;
    font-weight: 700;
    font-size: 15px;
    color: ${t.accent};
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .reviewer {
    font-size: 11px;
    color: ${t.sub};
    margin-top: 4px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .corner-tl, .corner-tr, .corner-bl, .corner-br {
    position: absolute;
    width: 18px;
    height: 18px;
    opacity: 0.2;
  }
  .corner-tl { top: 14px; left: 14px; border-top: 1.5px solid ${t.accent}; border-left: 1.5px solid ${t.accent}; }
  .corner-tr { top: 14px; right: 14px; border-top: 1.5px solid ${t.accent}; border-right: 1.5px solid ${t.accent}; }
  .corner-bl { bottom: 14px; left: 14px; border-bottom: 1.5px solid ${t.accent}; border-left: 1.5px solid ${t.accent}; }
  .corner-br { bottom: 14px; right: 14px; border-bottom: 1.5px solid ${t.accent}; border-right: 1.5px solid ${t.accent}; }
</style>
</head>
<body>
  <div class="corner-tl"></div>
  <div class="corner-tr"></div>
  <div class="corner-bl"></div>
  <div class="corner-br"></div>

  <svg class="ornament" width="60" height="12" viewBox="0 0 60 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="6" r="3" fill="${t.accent}"/>
    <line x1="0" y1="6" x2="24" y2="6" stroke="${t.accent}" stroke-width="1"/>
    <line x1="36" y1="6" x2="60" y2="6" stroke="${t.accent}" stroke-width="1"/>
  </svg>

  <div class="stars">${stars}</div>
  <span class="quote-mark">"</span>
  <p class="review">${shortReview}</p>
  <div class="divider"></div>
  <div class="footer">
    <div class="restaurant-name">${restaurantName}</div>
    <div class="reviewer">— ${reviewerName}</div>
  </div>
</body>
</html>`

  return NextResponse.json({ html })
}
