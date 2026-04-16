'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { BusinessProfile } from '@/types'

interface Props {
  restaurantProfile: BusinessProfile
}

// ── Sample reviews by cuisine type ───────────────────────────────────────────

const DEMO_REVIEWS: Record<string, { text: string; rating: number; reviewer: string }> = {
  Italian: {
    rating: 5, reviewer: 'Sarah M.',
    text: 'The tagliatelle was perfectly al dente and the sauce had incredible depth — tasted like it had been simmering for hours. Our server was warm and attentive all evening. Honestly felt like a home kitchen in Italy. We\'ll be back next week.',
  },
  Mexican: {
    rating: 4, reviewer: 'James T.',
    text: 'The carnitas tacos were incredible — that slow-braised pork with the house salsa verde is something else. Margaritas were strong and fresh. Only reason for 4 stars was a short wait for a table on Friday night, but absolutely worth it.',
  },
  American: {
    rating: 5, reviewer: 'Olivia R.',
    text: 'Best smash burger I\'ve had in years — perfectly charred, great American cheese pull, and the brioche bun held up to the end. Fries were crispy and hot. Solid spot for a no-fuss dinner that delivers every time.',
  },
  Japanese: {
    rating: 5, reviewer: 'Kevin L.',
    text: 'The omakase was stunning. Each piece of nigiri was precise and impossibly fresh — the bluefin toro practically melted. The chef took time to explain each course which made it feel personal and memorable. Best meal I\'ve had this year.',
  },
  Chinese: {
    rating: 5, reviewer: 'Michelle W.',
    text: 'The har gow and siu mai were perfect — fresh and delicate with that satisfying snap. Loved the atmosphere on Sunday morning. Best dim sum in the city by a mile. We\'ll be making this our regular weekend tradition.',
  },
  Indian: {
    rating: 5, reviewer: 'Priya S.',
    text: 'The butter chicken had incredible depth of flavor — clearly made from scratch, not from a jar. Garlic naan was perfectly charred with just the right chew. The best Indian we\'ve had in the city. Brought the whole family and everyone was blown away.',
  },
  Mediterranean: {
    rating: 5, reviewer: 'Alex D.',
    text: 'The mezze spread was extraordinary — the hummus was silky and the baba ganoush had beautiful smokiness. Lamb was beautifully seasoned with herbs. Excellent wine list to match. A real gem of a restaurant, we keep coming back.',
  },
  French: {
    rating: 5, reviewer: 'Claire B.',
    text: 'Duck confit was flawlessly executed — paper-crisp skin and fall-off-the-bone meat. Our server\'s wine pairing suggestion was spot on. The crème brûlée had a perfect caramel shell. Très magnifique from start to finish.',
  },
  Thai: {
    rating: 4, reviewer: 'Tom N.',
    text: 'The pad see ew had perfect wok char — not too sweet, beautifully balanced. Green curry had real depth and a lovely slow-building heat. Authentic flavors throughout, feels like Bangkok not a suburban approximation. Will definitely be back.',
  },
  Greek: {
    rating: 5, reviewer: 'Nikolas P.',
    text: 'The lamb souvlaki was beautifully marinated and charred perfectly on the grill. Tzatziki was fresh and generous, not that watery stuff. Felt like we were dining on a Greek island. Incredible value too — we\'ll be bringing everyone we know.',
  },
  BBQ: {
    rating: 5, reviewer: 'Darren F.',
    text: 'The brisket was a masterpiece — 14-hour smoke, beautiful bark, melt-in-your-mouth tender. The house dry rub and that vinegar sauce are a perfect marriage. Best BBQ I\'ve had outside of Texas. The burnt ends should be illegal they\'re so good.',
  },
  Seafood: {
    rating: 5, reviewer: 'Janet C.',
    text: 'The lobster bisque was velvety, rich, and perfectly balanced — the best I\'ve ever had. Grilled halibut was cooked to perfection and the lemon caper butter was outstanding. Ocean-fresh quality throughout. A must for seafood lovers in this city.',
  },
  Steakhouse: {
    rating: 5, reviewer: 'Robert H.',
    text: 'The dry-aged ribeye was cooked exactly to my request — perfect medium-rare with beautiful marbling throughout. The bone marrow appetizer is a must-order. Our server knew the menu cold and the wine list is exceptional. A proper steakhouse experience.',
  },
  Pizza: {
    rating: 5, reviewer: 'Gina M.',
    text: 'Neapolitan crust charred and chewy in all the right ways — clearly coming out of a proper wood-fired oven. The San Marzano tomato sauce was sweet and fresh. That margherita is the best pizza in the city by a clear margin. We order it every week.',
  },
  Burger: {
    rating: 5, reviewer: 'Tyler B.',
    text: 'The smash burger was absolutely perfect — double patty, American cheese, special sauce that has a touch of something I can\'t place but need more of. Simple done absolutely right. The onion rings were incredible too. This is my new regular.',
  },
  'Farm-to-Table': {
    rating: 5, reviewer: 'Naomi K.',
    text: 'Every ingredient tasted like it was picked that morning — the heirloom tomato salad with burrata was a revelation of flavor. The seasonal tasting menu felt like the chef is at the absolute top of their game. This is why farm-to-table exists.',
  },
  Other: {
    rating: 5, reviewer: 'Alex R.',
    text: 'Absolutely outstanding from start to finish. The food was exceptional — clearly made with real care and quality ingredients. Every dish had a distinct identity and the service matched the food perfectly. A standout experience we\'ll be talking about for months.',
  },
}

function getDemo(cuisineType: string) {
  return DEMO_REVIEWS[cuisineType] ?? DEMO_REVIEWS['Other']
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DemoClient({ restaurantProfile }: Props) {
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading')
  const [reply, setReply] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [copied, setCopied] = useState(false)

  const demo = getDemo(restaurantProfile.business_type)

  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => {
      setElapsed(Math.round((Date.now() - start) / 100) / 10)
    }, 100)

    fetch('/api/generate-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewText: demo.text,
        starRating: demo.rating,
        platform: 'Google',
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        clearInterval(timer)
        setElapsed(Math.round((Date.now() - start) / 100) / 10)
        if (data.reply) {
          setReply(data.reply)
          setState('done')
        } else {
          setState('error')
        }
      })
      .catch(() => {
        clearInterval(timer)
        setState('error')
      })

    return () => clearInterval(timer)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(reply)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-[#E05A28] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[#111]" viewBox="0 0 14 14" fill="currentColor">
                <path d="M7 1C3.686 1 1 3.686 1 7s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 2a4 4 0 110 8A4 4 0 017 3z"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#111] tracking-tight">ReplyFi</span>
          </div>
          <h1
            className="text-[clamp(24px,3vw,36px)] text-[#111] leading-tight mb-2"
            style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}
          >
            Your first reply
          </h1>
          <p className="text-[#888] text-[14px]">
            We generated a reply for {restaurantProfile.business_name} using a sample{' '}
            {restaurantProfile.business_type} business review.
          </p>
        </div>

        {/* Sample review */}
        <div className="bg-white rounded-2xl border border-[#E4DED8] p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map((i) => (
                <svg key={i} className={`w-4 h-4 ${i <= demo.rating ? 'text-amber-400' : 'text-[#E4DED8]'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-[13px] font-semibold text-[#111]">{demo.reviewer}</span>
            <span className="text-[11px] text-[#CCC] ml-auto">Google · Sample</span>
          </div>
          <p className="text-[14px] text-[#555] leading-relaxed">{demo.text}</p>
        </div>

        {/* Reply area */}
        <div className="bg-white rounded-2xl border border-[#E4DED8] overflow-hidden mb-4">
          {state === 'loading' && (
            <div className="px-6 py-10 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-3 mb-3">
                <svg className="animate-spin w-5 h-5 text-[#E05A28]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-[14px] font-medium text-[#111]">Crafting your reply…</span>
              </div>
              <p className="text-[12px] text-[#CCC]">{elapsed.toFixed(1)}s</p>
            </div>
          )}

          {state === 'error' && (
            <div className="px-6 py-8 text-center">
              <p className="text-[13px] text-red-500">Couldn't generate the demo — you can try a real review on the dashboard.</p>
            </div>
          )}

          {state === 'done' && (
            <>
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDE9E4]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E05A28]" />
                  <span className="text-[13px] font-semibold text-[#111]">Generated reply</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#666] hover:text-[#111] hover:bg-[#F8F6F3] border border-transparent hover:border-[#E4DED8] transition-all"
                >
                  {copied ? (
                    <><svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> Copied</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg> Copy</>
                  )}
                </button>
              </div>
              <div className="px-6 py-5">
                <p className="text-[14px] text-[#333] leading-relaxed whitespace-pre-wrap">{reply}</p>
              </div>
            </>
          )}
        </div>

        {/* Magic moment callout */}
        {state === 'done' && (
          <div className="rounded-2xl bg-[#111] text-white px-6 py-5 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[14px] font-semibold">
                That took{' '}
                <span className="text-[#E05A28]">{elapsed.toFixed(1)} seconds.</span>
              </p>
              <p className="text-white/50 text-[13px] mt-0.5">You just saved 5 minutes of writing.</p>
            </div>
            <svg className="w-8 h-8 text-[#E05A28]/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#111] hover:bg-[#2a2a2a] text-white text-[14px] font-semibold transition-all text-center"
          >
            Try it with a real review →
          </Link>
          {state === 'loading' && (
            <Link
              href="/dashboard"
              className="flex items-center justify-center px-6 py-3.5 rounded-xl border border-[#E4DED8] text-[#888] hover:text-[#111] text-[13px] font-medium transition-all"
            >
              Skip to dashboard
            </Link>
          )}
        </div>

      </div>
    </div>
  )
}
