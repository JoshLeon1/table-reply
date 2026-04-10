'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [annual, setAnnual] = useState(false)
  const [notifDismissed, setNotifDismissed] = useState(false)

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Banner fades out over the first 60px of scroll
  const bannerOpacity = notifDismissed ? 0 : Math.max(0, 1 - scrollY / 60)
  const bannerVisible = !notifDismissed && bannerOpacity > 0
  // Nav slides down to top-0 as banner fades (40px banner height)
  const navTop = notifDismissed ? 0 : Math.max(0, 40 - scrollY)

  const restaurantNames = [
    "Rosario's Trattoria",
    'The Perch Kitchen',
    'Lucky Dragon',
    'South Congress Café',
    'Colina Verde',
    'Harbor Plate',
  ]

  const features = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: 'Auto-sync reviews',
      desc: 'New reviews from Google and Yelp appear in your dashboard automatically — no manual checking.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI-generated replies',
      desc: "Every reply is tailored to your restaurant voice, the reviewer's tone, and the star rating.",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      title: 'Keyword alerts',
      desc: 'Get notified when reviewers mention specific words — food safety, staff names, wait times.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Staff mention tracking',
      desc: 'Surface every review that praises or criticizes a team member — so you can act on it.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      ),
      title: 'Multi-language replies',
      desc: 'Replies are written in the same language as the review — no configuration needed.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Analytics & insights',
      desc: 'Track your reply rate, average rating trends, and which review topics come up most.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      ),
      title: 'Social post generator',
      desc: 'Turn 5-star reviews into ready-to-post Instagram and Facebook content with one click.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      title: 'Competitor tracking',
      desc: "Monitor your competitors' ratings and review trends — see how you stack up in your market.",
    },
  ]

  const steps = [
    {
      num: '1',
      title: 'Set up your voice once',
      desc: 'Tell us your restaurant name, cuisine, vibe, and tone. Takes 2 minutes. TableReply learns how you speak.',
    },
    {
      num: '2',
      title: 'Paste any review',
      desc: 'Copy a review from Google, Yelp, or anywhere else and paste it in. Or let TableReply auto-sync your Google reviews daily.',
    },
    {
      num: '3',
      title: 'Copy your reply in seconds',
      desc: 'Get a personalized, on-brand reply instantly. Copy it and paste it back into Google or Yelp. Done.',
    },
  ]

  const testimonials = [
    {
      initials: 'MR',
      name: 'Marco R.',
      role: 'Owner',
      restaurant: "Rosario's Trattoria, Austin TX",
      quote: 'I used to dread opening Yelp on Monday mornings. Now I actually look forward to it. We went from responding to maybe 10% of reviews to every single one.',
    },
    {
      initials: 'JK',
      name: 'Jen K.',
      role: 'Owner & Chef',
      restaurant: 'The Perch Kitchen, Denver CO',
      quote: 'The 1-star reply drafts alone are worth the subscription. I used to write something defensive and regret it every time. TableReply keeps it professional.',
    },
    {
      initials: 'DL',
      name: 'David L.',
      role: 'General Manager',
      restaurant: 'Lucky Dragon, Portland OR',
      quote: 'Our rating went from 4.1 to 4.6 in three months. We attribute most of that to actually responding to every review now — guests notice.',
    },
  ]

  const starterFeatures = [
    '7-day free trial',
    'Up to 20 AI replies',
    'Google and Yelp',
    'Basic voice setup',
  ]

  const proFeatures = [
    'Unlimited AI replies',
    'Google, Yelp, TripAdvisor, OpenTable',
    'Keyword alerts',
    'Staff mention tracking',
    'Multi-language replies',
    'Social post generator',
    'Restaurant voice setup',
    'Cancel anytime',
  ]

  return (
    <div className="text-[#111111]" style={{ fontFamily: 'Inter, sans-serif', background: '#fafaf8' }}>

      {/* ── NOTIFICATION BANNER ─────────────────────────────────────────── */}
      {bannerVisible && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-3 px-10 bg-[#E05A28] text-[#111]"
          style={{ opacity: bannerOpacity, pointerEvents: bannerOpacity < 0.1 ? 'none' : 'auto', height: '40px' }}
        >
          <span className="text-[13px] font-medium">
            First week free — no credit card required.{' '}
            <Link href="/signup" className="font-bold underline underline-offset-2 hover:text-white transition-colors duration-200">
              Start today
            </Link>
          </span>
          <button
            onClick={() => setNotifDismissed(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#111]/40 hover:text-[#111] transition-colors duration-200"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav
        className="fixed left-0 right-0 z-50 bg-white border-b border-[#e5e5e0]"
        style={{ top: `${navTop}px` }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <svg
              className="w-5 h-5 flex-shrink-0 text-[#E05A28]"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
            </svg>
            <span className="font-bold text-xl tracking-tight text-[#111111]" style={{ letterSpacing: '-0.02em' }}>
              TableReply
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-[#6b6b6b] hover:text-[#111111] transition-colors duration-200 hidden sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-[#E05A28] hover:bg-[#B34419] text-white text-sm font-semibold rounded-lg transition-colors duration-200"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#111111] pt-36 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-[580px]">
            <p className="text-[#E05A28] text-sm font-medium mb-6">
              Built for independent restaurants
            </p>

            <h1
              className="text-white font-bold mb-6"
              style={{ fontSize: 'clamp(36px, 5vw, 48px)', lineHeight: 1.12, letterSpacing: '-0.02em' }}
            >
              Every review deserves a reply. Now they all get one.
            </h1>

            <p className="text-[#9a9a9a] mb-10 max-w-[440px]" style={{ fontSize: '16px', lineHeight: '1.6' }}>
              TableReply writes personalized, on-brand responses to your Google and Yelp reviews in seconds. Unlimited replies, $29/mo.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#E05A28] hover:bg-[#B34419] text-white text-sm font-semibold rounded-lg transition-colors duration-200"
              >
                Start free
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center px-6 py-3 bg-transparent border border-[#333] hover:border-[#555] text-white text-sm font-semibold rounded-lg transition-colors duration-200"
              >
                See how it works
              </a>
            </div>

            <p className="text-[#555] text-xs mt-6">
              No credit card required · Cancel anytime · Works with Google, Yelp &amp; TripAdvisor
            </p>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e5e5e0] py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-[#6b6b6b] text-sm mb-4">Trusted by restaurants across the US</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {restaurantNames.map((name, i) => (
              <span key={name} className="flex items-center gap-3">
                <span style={{ color: '#78716C', fontSize: '14px', fontWeight: 500 }}>{name}</span>
                <span className="text-[#E05A28] text-[9px]">◆</span>
              </span>
            ))}
            <Link href="/signup" className="text-[#E05A28] hover:text-[#C94E21] text-sm font-medium transition-colors duration-200">
              Join them →
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROBLEM / SOLUTION ───────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#fafaf8]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_110px_1fr] items-start">

          {/* Left — The problem */}
          <div className="lg:pr-10">
            <p className="text-[#E05A28] text-xs font-semibold uppercase tracking-wider mb-4">
              The problem
            </p>
            <h2
              className="font-bold text-[#111111] mb-5 text-4xl"
              style={{ lineHeight: 1.15, letterSpacing: '-0.02em' }}
            >
              You know you should reply to reviews. You never have time.
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#555' }}>
              Most restaurant owners respond to fewer than 10% of their reviews — not because they don't care, but because crafting a genuine reply takes time they simply don't have at the end of a long shift.
            </p>
            <p className="mt-4" style={{ fontSize: '15px', lineHeight: '1.6', color: '#555' }}>
              Meanwhile, 63% of reviews go unanswered. Potential guests read that silence as indifference.
            </p>
          </div>

          {/* Center — Stats divider */}
          <div className="hidden lg:flex flex-col items-center self-stretch py-2">
            <div className="flex-1 w-px bg-[#e5e5e0]" />
            {[
              { stat: '63%', label: 'reviews unanswered' },
              { stat: '45%', label: 'guests read replies' },
              { stat: '97%', label: 'time saved' },
            ].map(({ stat, label }, i) => (
              <div key={stat} className="flex flex-col items-center">
                {i > 0 && <div className="w-px h-5 bg-[#e5e5e0]" />}
                <div className="flex flex-col items-center py-4 px-1">
                  <p className="font-bold text-[#E05A28] text-xl leading-none" style={{ letterSpacing: '-0.03em' }}>{stat}</p>
                  <p className="text-[#aaa] text-[10px] text-center mt-1 leading-tight" style={{ maxWidth: '65px' }}>{label}</p>
                </div>
              </div>
            ))}
            <div className="flex-1 w-px bg-[#e5e5e0]" />
          </div>

          {/* Right — The solution */}
          <div className="lg:pl-10 mt-12 lg:mt-0">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#16a34a' }}>
              The solution
            </p>
            <h2
              className="font-bold text-[#111111] mb-5 text-4xl"
              style={{ lineHeight: 1.15, letterSpacing: '-0.02em' }}
            >
              Thoughtful replies, in seconds, without lifting a finger.
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#555' }}>
              TableReply drafts personalized responses that sound exactly like you — matched to your tone, your cuisine, and the reviewer's sentiment.
            </p>
            <p className="mt-4" style={{ fontSize: '15px', lineHeight: '1.6', color: '#555' }}>
              Restaurants that respond to every review consistently earn more reviews, higher ratings, and more repeat visits.
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left — headline */}
          <div className="lg:sticky lg:top-32">
            <p className="text-[#E05A28] text-xs font-semibold uppercase tracking-wider mb-4">Features</p>
            <h2
              className="font-bold text-[#111111]"
              style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: 'clamp(32px, 4vw, 48px)',
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
              }}
            >
              Everything you need to manage your reputation
            </h2>
          </div>

          {/* Right — feature rows */}
          <div style={{ borderLeft: '2px solid rgba(224,90,40,0.25)', paddingLeft: '2rem' }}>
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4 mb-8 last:mb-0">
                <div className="text-[#E05A28] mt-0.5 flex-shrink-0">{icon}</div>
                <div>
                  <p className="font-semibold text-[#111111] text-sm mb-1" style={{ letterSpacing: '-0.01em' }}>{title}</p>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#6b6b6b' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6 bg-[#fafaf8] border-t border-[#e5e5e0]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-[#E05A28] text-xs font-semibold uppercase tracking-wider mb-3">
              How it works
            </p>
            <h2
              className="font-bold text-[#111111]"
              style={{ fontSize: 'clamp(28px, 3.5vw, 36px)', lineHeight: 1.2, letterSpacing: '-0.02em' }}
            >
              From review to reply in 10 seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="flex gap-5">
                <div
                  className="w-9 h-9 rounded-lg bg-[#111111] text-white flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {num}
                </div>
                <div>
                  <h3 className="font-semibold text-[#111111] text-sm mb-2" style={{ letterSpacing: '-0.01em' }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#6b6b6b' }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#111111' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 text-center">
            <p className="text-[#E05A28] text-xs font-semibold uppercase tracking-wider mb-3">What owners say</p>
            <h2
              className="font-bold text-white"
              style={{ fontSize: 'clamp(28px, 3.5vw, 36px)', lineHeight: 1.2, letterSpacing: '-0.02em' }}
            >
              Restaurant owners love it
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3">
            {testimonials.map(({ name, role, restaurant, quote }, i) => (
              <div
                key={name}
                className="px-8 py-6"
                style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
              >
                <p
                  className="text-[#E05A28] leading-none mb-3 select-none"
                  style={{ fontSize: '72px', lineHeight: 1, opacity: 0.25, fontFamily: 'Georgia, serif' }}
                >
                  &ldquo;
                </p>
                <p
                  className="text-white mb-6"
                  style={{
                    fontFamily: 'var(--font-playfair), Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: '16px',
                    lineHeight: '1.7',
                  }}
                >
                  {quote}
                </p>
                <p className="font-semibold text-[#9a9a9a] text-sm">{name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#555' }}>{role} · {restaurant}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#fafaf8] border-t border-[#e5e5e0]">
        <div className="max-w-6xl mx-auto flex flex-col items-center">

          {/* Header */}
          <h2
            className="font-bold text-[#111111] mb-3 text-center"
            style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', lineHeight: 1.15, letterSpacing: '-0.02em' }}
          >
            One plan. Everything included.
          </h2>
          <p className="text-center mb-10" style={{ fontSize: '16px', color: '#6b6b6b' }}>
            No caps. No tiers. No surprises.
          </p>

          {/* Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-[#e8e8e3] mb-10">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
                !annual ? 'bg-white text-[#111111] shadow-sm' : 'text-[#6b6b6b] hover:text-[#111111]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
                annual ? 'bg-white text-[#111111] shadow-sm' : 'text-[#6b6b6b] hover:text-[#111111]'
              }`}
            >
              Annual
              <span className="px-1.5 py-0.5 rounded-full bg-[#E05A28] text-white text-[10px] font-bold leading-none tracking-wide">
                SAVE 33%
              </span>
            </button>
          </div>

          {/* Single card */}
          <div
            className="w-full rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              maxWidth: '480px',
              background: '#111111',
              border: '1px solid rgba(224,90,40,0.35)',
              boxShadow: '0 0 0 0 rgba(224,90,40,0)',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 40px rgba(224,90,40,0.15)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 0 0 rgba(224,90,40,0)')}
          >
            {/* Badge */}
            <div className="flex justify-center pt-7 pb-0">
              <span className="px-3 py-1 rounded-full bg-[#E05A28]/20 text-[#E05A28] text-[10px] font-bold uppercase tracking-[0.12em]">
                First week free
              </span>
            </div>

            <div className="px-8 pt-5 pb-8">
              {/* Plan name */}
              <p className="text-center text-white font-bold text-lg mb-5 tracking-tight">
                TableReply Pro
              </p>

              {/* Price */}
              <div className="flex items-end justify-center gap-1 mb-2">
                <span
                  className="font-bold text-white leading-none transition-all duration-300"
                  style={{ fontSize: '80px', letterSpacing: '-0.04em' }}
                >
                  ${annual ? '19' : '29'}
                </span>
                <div className="pb-3 flex flex-col">
                  <span className="text-[#9a9a9a] text-lg">/mo</span>
                </div>
              </div>

              {annual ? (
                <p className="text-center text-[#E05A28] text-[13px] mb-4">Billed $228/yr — save $120</p>
              ) : (
                <p className="text-center text-[#9a9a9a] text-[13px] mb-4">Start free — first 7 days on us. No credit card required.</p>
              )}

              {/* Divider */}
              <div className="h-px bg-[#E05A28]/25 mb-6" />

              {/* Features */}
              <ul className="space-y-3.5 mb-8">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-[#E05A28] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span style={{ fontSize: '14px', color: '#d4d4d4' }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={annual ? '/signup?plan=annual' : '/signup'}
                className="block w-full text-center font-semibold text-white bg-[#E05A28] hover:bg-[#C94E21] rounded-full transition-colors duration-200"
                style={{ fontSize: '15px', height: '56px', lineHeight: '56px' }}
              >
                Start your free week →
              </Link>
              <p className="text-center mt-3 text-[#6b6b6b] text-[12px]">
                Then ${annual ? '19' : '29'}/mo. Cancel anytime. No contracts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#111111]">
        <div className="max-w-6xl mx-auto text-center">
          <h2
            className="font-bold text-white mb-4"
            style={{ fontSize: 'clamp(28px, 3.5vw, 36px)', lineHeight: 1.2, letterSpacing: '-0.02em' }}
          >
            Start replying to every review today
          </h2>
          <p className="text-[#9a9a9a] mb-8 max-w-md mx-auto" style={{ fontSize: '15px', lineHeight: '1.6' }}>
            Join 200+ restaurant owners who never let a review go unanswered.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-3 bg-[#E05A28] hover:bg-[#B34419] text-white text-sm font-semibold rounded-lg transition-colors duration-200"
          >
            See pricing
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#111111] border-t border-[#222] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-4 h-4 text-[#E05A28] flex-shrink-0"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
                  <path d="M7 2v20" />
                  <path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
                </svg>
                <span className="font-bold text-white text-sm" style={{ letterSpacing: '-0.01em' }}>TableReply</span>
              </div>
              <p style={{ fontSize: '13px', color: '#6b6b6b', lineHeight: '1.6' }}>
                AI-powered review replies for independent restaurants. Built to save you time and protect your reputation.
              </p>
            </div>

            {/* Product links */}
            <div>
              <p className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Product</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'Features', href: '#' },
                  { label: 'Pricing', href: '#' },
                  { label: 'Sign in', href: '/login' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} style={{ fontSize: '14px', color: '#6b6b6b' }} className="hover:text-white transition-colors duration-200">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <p className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Legal</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'Privacy Policy', href: '#' },
                  { label: 'Terms of Service', href: '#' },
                  { label: 'Contact us', href: 'mailto:hello@tablereply.com' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} style={{ fontSize: '14px', color: '#6b6b6b' }} className="hover:text-white transition-colors duration-200">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-[#222] pt-8">
            <p style={{ fontSize: '13px', color: '#555' }}>
              &copy; 2026 TableReply · Austin, TX · Made with care for independent restaurants everywhere.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
