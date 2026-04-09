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
      desc: 'Every reply is tailored to your restaurant voice, the reviewer\'s tone, and the star rating.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'One-click approve',
      desc: 'Review the draft and post it in one click. Edit if you want, or send it straight through.',
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
      title: 'Staff mentions',
      desc: 'Surface every review that praises or criticizes a team member — so you can act on it.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      ),
      title: 'Multi-language',
      desc: 'Replies are written in the same language as the review — no configuration needed.',
    },
  ]

  const steps = [
    {
      num: '1',
      title: 'Connect your accounts',
      desc: 'Link your Google Business Profile and Yelp in under two minutes. TableReply pulls in all your existing reviews.',
    },
    {
      num: '2',
      title: 'Reviews sync automatically',
      desc: 'Every new review appears in your dashboard as it comes in. You\'ll never miss one again.',
    },
    {
      num: '3',
      title: 'Reply sent in seconds',
      desc: 'Approve the AI draft or tweak it. One click posts it directly to the platform.',
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
          className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-3 px-10 bg-amber-400 text-[#111]"
          style={{ opacity: bannerOpacity, pointerEvents: bannerOpacity < 0.1 ? 'none' : 'auto', height: '40px' }}
        >
          <span className="text-[13px] font-medium">
            First week free — no credit card required.{' '}
            <Link href="/signup" className="font-bold underline underline-offset-2 hover:text-amber-900 transition-colors duration-200">
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
              className="w-5 h-5 flex-shrink-0 text-amber-600"
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
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
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
            <p className="text-amber-500 text-sm font-medium mb-6">
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
                className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
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
        <div className="max-w-6xl mx-auto">
          <p className="text-[#6b6b6b] text-sm mb-4">
            Trusted by restaurants across the US
          </p>
          <p className="text-[#9a9a9a] text-sm">
            {restaurantNames.join(' · ')}
          </p>
        </div>
      </section>

      {/* ── PROBLEM / SOLUTION ───────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#fafaf8]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left — The problem */}
          <div>
            <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-4">
              The problem
            </p>
            <h2
              className="font-bold text-[#111111] mb-5"
              style={{ fontSize: 'clamp(24px, 3vw, 32px)', lineHeight: 1.25, letterSpacing: '-0.02em' }}
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

          {/* Right — The solution */}
          <div>
            <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-4">
              The solution
            </p>
            <h2
              className="font-bold text-[#111111] mb-5"
              style={{ fontSize: 'clamp(24px, 3vw, 32px)', lineHeight: 1.25, letterSpacing: '-0.02em' }}
            >
              Thoughtful replies, in seconds, without lifting a finger.
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#555' }}>
              TableReply connects to your review platforms, drafts personalized responses that sound exactly like you, and lets you approve or post them in one click.
            </p>
            <p className="mt-4" style={{ fontSize: '15px', lineHeight: '1.6', color: '#555' }}>
              Restaurants that respond to every review consistently earn more reviews, higher ratings, and more repeat visits.
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white border-t border-[#e5e5e0]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-3">
              Features
            </p>
            <h2
              className="font-bold text-[#111111]"
              style={{ fontSize: 'clamp(28px, 3.5vw, 36px)', lineHeight: 1.2, letterSpacing: '-0.02em' }}
            >
              Everything you need to manage your reputation
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="p-6 bg-white border border-[#e5e5e0] rounded-lg shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  {icon}
                </div>
                <h3 className="font-semibold text-[#111111] text-sm mb-2" style={{ letterSpacing: '-0.01em' }}>
                  {title}
                </h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#6b6b6b' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6 bg-[#fafaf8] border-t border-[#e5e5e0]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-3">
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
      <section className="py-20 px-6 bg-white border-t border-[#e5e5e0]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-3">
              What owners say
            </p>
            <h2
              className="font-bold text-[#111111]"
              style={{ fontSize: 'clamp(28px, 3.5vw, 36px)', lineHeight: 1.2, letterSpacing: '-0.02em' }}
            >
              Restaurant owners love it
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ initials, name, role, restaurant, quote }) => (
              <div key={name} className="p-6 bg-white border border-[#e5e5e0] rounded-lg shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold text-xs flex-shrink-0"
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="font-semibold text-[#111111] text-sm">{name}</p>
                    <p className="text-xs" style={{ color: '#6b6b6b' }}>{role} · {restaurant}</p>
                  </div>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#555' }}>
                  {quote}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#fafaf8] border-t border-[#e5e5e0]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-3">
              Pricing
            </p>
            <h2
              className="font-bold text-[#111111] mb-2"
              style={{ fontSize: 'clamp(28px, 3.5vw, 36px)', lineHeight: 1.2, letterSpacing: '-0.02em' }}
            >
              Simple, transparent pricing
            </h2>
            <p style={{ fontSize: '15px', color: '#6b6b6b' }}>No caps, no contracts, no surprises.</p>
          </div>

          {/* Toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#ebebeb] mb-10">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                !annual ? 'bg-white text-[#111111] shadow-sm' : 'text-[#6b6b6b] hover:text-[#111111]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                annual ? 'bg-white text-[#111111] shadow-sm' : 'text-[#6b6b6b] hover:text-[#111111]'
              }`}
            >
              Annual
              <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white text-[10px] font-semibold leading-none">
                Save 33%
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">

            {/* Starter */}
            <div className="p-6 bg-white border border-[#e5e5e0] rounded-lg shadow-sm">
              <p className="font-semibold text-[#111111] text-sm mb-1">Starter</p>
              <p style={{ fontSize: '13px', color: '#6b6b6b', marginBottom: '20px' }}>Try it free, no card needed</p>
              <div className="mb-6">
                <span className="font-bold text-[#111111]" style={{ fontSize: '36px', letterSpacing: '-0.02em' }}>$0</span>
                <span className="text-[#6b6b6b] text-sm ml-1">/ 7 days</span>
              </div>
              <ul className="space-y-3 mb-6">
                {starterFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span style={{ fontSize: '14px', color: '#555' }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center py-2.5 bg-white border border-[#e5e5e0] hover:border-[#111111] text-[#111111] text-sm font-semibold rounded-lg transition-colors duration-200"
              >
                Start free trial
              </Link>
            </div>

            {/* Pro */}
            <div className="p-6 bg-[#111111] border border-[#111111] rounded-lg shadow-sm">
              <p className="font-semibold text-white text-sm mb-1">Pro</p>
              <p style={{ fontSize: '13px', color: '#9a9a9a', marginBottom: '20px' }}>For restaurants serious about reputation</p>
              <div className="mb-6">
                <span className="font-bold text-white" style={{ fontSize: '36px', letterSpacing: '-0.02em' }}>
                  {annual ? '$19' : '$29'}
                </span>
                <span className="text-[#9a9a9a] text-sm ml-1">/ mo</span>
                {annual && (
                  <span className="ml-2 text-[#9a9a9a] text-xs line-through">$29</span>
                )}
              </div>
              {annual && (
                <p className="text-amber-400 text-xs mb-4 -mt-3">Billed as $228/yr — save $120</p>
              )}
              <ul className="space-y-3 mb-6">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span style={{ fontSize: '14px', color: '#d4d4d4' }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={annual ? '/signup?plan=annual' : '/signup'}
                className="block w-full text-center py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
              >
                Start free trial
              </Link>
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
            className="inline-flex items-center justify-center px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
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
                  className="w-4 h-4 text-amber-600 flex-shrink-0"
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
