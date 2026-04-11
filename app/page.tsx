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
      title: 'Auto-Sync Reviews',
      desc: 'New Google reviews sync to your dashboard daily, automatically — no manual checking, no copy-pasting.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI-Powered Replies',
      desc: "Every reply is crafted to match your restaurant's voice, the reviewer's tone, and the star rating — sounds like you wrote it.",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Deep Analytics Dashboard',
      desc: 'Track rating trends, response rates, peak review days, top keywords, language breakdown, and monthly volume — all in one place. Export to PDF or CSV.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      title: 'Keyword Alerts',
      desc: 'Get instant notifications when reviews mention specific words — food safety issues, staff names, wait times, or anything you care about.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Staff Mention Tracking',
      desc: 'Surface every review that names a team member — catch both praise and problems before they become patterns.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      ),
      title: 'Social Post Generator',
      desc: 'Turn your best 5-star reviews into polished Instagram, Facebook, TikTok, and Twitter/X posts — captions and shareable graphics in one click.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      title: 'Review Request Templates',
      desc: 'Ready-to-send SMS, email, and table card messages personalized to your restaurant — to help you earn more 5-star reviews from happy guests.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      title: 'Competitor Tracking',
      desc: "Auto-find and monitor up to 3 nearby competitors' ratings and review counts — see exactly where you stand in your market.",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      ),
      title: 'Multi-Language Replies',
      desc: 'Replies are automatically written in the same language as the review — English, Spanish, French, and more. No configuration needed.',
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
            <div className="w-8 h-8 rounded-[8px] bg-[#E05A28] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" aria-hidden="true">
                <path d="M2 1.5h9A1.5 1.5 0 0112.5 3v5A1.5 1.5 0 0111 9.5H7l-2 2v-2H2A1.5 1.5 0 01.5 8V3A1.5 1.5 0 012 1.5z" fill="white" fillOpacity="0.5"/>
                <path d="M8 8h9.5A1.5 1.5 0 0119 9.5v5A1.5 1.5 0 0117.5 16H16v2.5l-3-2.5H8A1.5 1.5 0 016.5 14.5v-5A1.5 1.5 0 018 8z" fill="white"/>
              </svg>
            </div>
            <span className="font-bold text-[17px] tracking-[-0.025em] text-[#111111]">TableReply</span>
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
      <section className="bg-[#111111] pt-32 sm:pt-36 pb-20 sm:pb-24 px-5 sm:px-6 overflow-hidden relative">
        {/* Radial glow behind text */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(224,90,40,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">

            {/* Left — text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E05A28]/10 border border-[#E05A28]/20 mb-6 sm:mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E05A28]" />
                <span className="text-[#E05A28] text-[12px] font-semibold tracking-wide">Built for independent restaurants</span>
              </div>

              <h1
                className="text-white font-bold mb-5 sm:mb-6"
                style={{ fontSize: 'clamp(30px, 4.5vw, 52px)', lineHeight: 1.12, letterSpacing: '-0.025em' }}
              >
                Your reviews deserve a reply.{' '}
                <span style={{ color: '#E05A28' }}>Now every single one gets one.</span>
              </h1>

              <p className="text-[#777] mb-8 sm:mb-10 max-w-[440px]" style={{ fontSize: '15px', lineHeight: '1.7' }}>
                TableReply generates thoughtful, on-brand responses to your Google and Yelp reviews in seconds — matched to the reviewer's tone, your voice, and the star rating.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-7 sm:mb-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white text-sm font-bold rounded-xl transition-all duration-150 active:scale-[0.98] shadow-[0_4px_20px_rgba(224,90,40,0.35)]"
                >
                  Start free — no card needed
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-6 sm:px-7 py-3.5 bg-transparent border border-white/10 hover:border-white/25 text-white/60 hover:text-white text-sm font-medium rounded-xl transition-all duration-200"
                >
                  See how it works
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                {['7 days free', 'Cancel anytime', 'Google & Yelp'].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[#E05A28] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                    <span className="text-[#555] text-[12px]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — product mockup */}
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative w-full max-w-[420px]">
                {/* Glow behind card */}
                <div
                  aria-hidden="true"
                  className="absolute -inset-8 rounded-3xl pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at center, rgba(224,90,40,0.18) 0%, transparent 70%)' }}
                />

                {/* Background card (depth effect) */}
                <div className="absolute -bottom-3 left-4 right-4 h-full rounded-2xl bg-white/[0.04] border border-white/[0.06]" />

                {/* Main card */}
                <div className="relative bg-[#1C1C1C] rounded-2xl border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.5)] overflow-hidden animate-float">
                  {/* Card header bar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                    <span className="ml-2 text-white/20 text-[11px]">TableReply — Auto Reviews</span>
                  </div>

                  <div className="p-5">
                    {/* Review 1 */}
                    <div className="mb-4 pb-4 border-b border-white/[0.06]">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E05A28]/20 flex items-center justify-center text-[11px] font-bold text-[#E05A28] flex-shrink-0">SJ</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white text-[13px] font-semibold">Sarah Johnson</span>
                            <span className="text-white/25 text-[11px]">2h ago</span>
                          </div>
                          <div className="text-amber-400 text-[12px] mb-2">★★★★★</div>
                          <p className="text-white/50 text-[12px] leading-relaxed">"Best Italian outside of Naples. The chef came out to greet us — truly special experience."</p>
                        </div>
                      </div>
                      {/* Reply block */}
                      <div className="mt-3 ml-11 bg-[#E05A28]/10 border border-[#E05A28]/20 rounded-xl p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#E05A28] mb-1.5">Your reply</p>
                        <p className="text-white/70 text-[12px] leading-relaxed">Thank you so much, Sarah! Chef Marco loves connecting with our guests. We're so glad you felt that warmth — see you again soon! 🙏</p>
                      </div>
                      <div className="mt-3 ml-11 flex gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#111] text-[11px] font-semibold cursor-default">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                          Copy &amp; Approve
                        </div>
                        <div className="px-3 py-1.5 rounded-lg border border-white/10 text-white/30 text-[11px] font-medium cursor-default">Dismiss</div>
                      </div>
                    </div>

                    {/* Review 2 — pending */}
                    <div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white/40 flex-shrink-0">MR</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white text-[13px] font-semibold">Mike R.</span>
                            <span className="text-white/25 text-[11px]">5h ago</span>
                          </div>
                          <div className="text-amber-400/60 text-[12px] mb-2">★★★<span className="text-white/15">★★</span></div>
                          <p className="text-white/50 text-[12px] leading-relaxed">"Good food but the wait was longer than expected on a Tuesday."</p>
                        </div>
                      </div>
                      {/* Generating indicator */}
                      <div className="mt-3 ml-11 flex items-center gap-2 text-[11px] text-white/30">
                        <svg className="animate-spin w-3 h-3 text-[#E05A28]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        Crafting reply…
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e5e5e0] py-5 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-[12px] text-[#A8A29E] whitespace-nowrap font-medium uppercase tracking-[0.08em]">Trusted by restaurants across the US</p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {restaurantNames.map((name) => (
                <div key={name} className="flex items-center gap-1.5">
                  <div className="flex text-amber-400 text-[10px]">{'★'.repeat(5)}</div>
                  <span className="text-[13px] font-medium text-[#666]">{name}</span>
                </div>
              ))}
            </div>
            <Link href="/signup" className="whitespace-nowrap text-[13px] font-semibold text-[#E05A28] hover:text-[#C94E21] transition-colors duration-200 hidden md:block">
              Join them →
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROBLEM / SOLUTION ───────────────────────────────────────────── */}
      <section className="py-20 px-5 sm:px-6 bg-[#fafaf8]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_110px_1fr] items-start gap-10 lg:gap-0">

          {/* Left — The problem */}
          <div className="lg:pr-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E05A28] mb-4">
              The problem
            </p>
            <h2
              className="font-bold text-[#111111] mb-5"
              style={{ fontSize: 'clamp(24px, 3vw, 36px)', lineHeight: 1.15, letterSpacing: '-0.02em' }}
            >
              You know you should reply. You never have time.
            </h2>
            <p className="text-[15px] leading-relaxed text-[#555]">
              Most restaurant owners respond to fewer than 10% of their reviews — not because they don't care, but because crafting a genuine reply takes time they simply don't have after a long shift.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#555]">
              Meanwhile, 63% of reviews go unanswered. Guests read that silence as indifference.
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
                  <p className="font-bold text-[#E05A28] text-[20px] leading-none" style={{ letterSpacing: '-0.03em' }}>{stat}</p>
                  <p className="text-[#bbb] text-[10px] text-center mt-1 leading-tight" style={{ maxWidth: '65px' }}>{label}</p>
                </div>
              </div>
            ))}
            <div className="flex-1 w-px bg-[#e5e5e0]" />
          </div>

          {/* Right — The solution */}
          <div className="lg:pl-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-4 text-emerald-600">
              The solution
            </p>
            <h2
              className="font-bold text-[#111111] mb-5"
              style={{ fontSize: 'clamp(24px, 3vw, 36px)', lineHeight: 1.15, letterSpacing: '-0.02em' }}
            >
              Thoughtful replies, in seconds, hands-free.
            </h2>
            <p className="text-[15px] leading-relaxed text-[#555]">
              TableReply drafts personalized responses that sound exactly like you — matched to your tone, your cuisine, and the reviewer's sentiment.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#555]">
              Restaurants that respond to every review consistently earn more reviews, higher ratings, and more repeat visits.
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-5 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* Left — headline */}
          <div className="lg:sticky lg:top-32">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E05A28] mb-4">Features</p>
            <h2
              className="font-bold text-[#111111]"
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                lineHeight: 1.12,
                letterSpacing: '-0.02em',
              }}
            >
              Everything you need to protect and grow your reputation
            </h2>
            <p className="mt-4 text-[15px] text-[#888] leading-relaxed">
              One platform. Every tool an independent restaurant needs to stay ahead of reviews.
            </p>
          </div>

          {/* Right — feature rows */}
          <div className="border-l-2 border-[#E05A28]/20 pl-7 sm:pl-8">
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4 mb-7 last:mb-0 group">
                <div className="text-[#E05A28] mt-0.5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">{icon}</div>
                <div>
                  <p className="font-semibold text-[#111111] text-[14px] mb-1.5 tracking-tight">{title}</p>
                  <p className="text-[14px] leading-relaxed text-[#6b6b6b]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-5 sm:px-6 bg-[#fafaf8] border-t border-[#e5e5e0]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E05A28] mb-3">
              How it works
            </p>
            <h2
              className="font-bold text-[#111111]"
              style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', lineHeight: 1.2, letterSpacing: '-0.02em' }}
            >
              From review to reply in 10 seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-5 left-[calc(16.66%+18px)] right-[calc(16.66%+18px)] h-px bg-gradient-to-r from-[#E05A28]/30 via-[#E05A28]/50 to-[#E05A28]/30" />

            {steps.map(({ num, title, desc }) => (
              <div key={num} className="flex flex-col items-center gap-4 px-6 py-7 sm:py-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-[#E05A28] text-white flex items-center justify-center flex-shrink-0 font-bold text-[15px] shadow-[0_4px_16px_rgba(224,90,40,0.35)] relative z-10">
                  {num}
                </div>
                <div>
                  <h3 className="font-semibold text-[#111111] text-[15px] mb-2 tracking-tight">
                    {title}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#6b6b6b]">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
            {testimonials.map(({ initials, name, role, restaurant, quote }) => (
              <div key={name} className="bg-[#111111] px-7 py-8 flex flex-col">
                {/* Stars */}
                <div className="text-amber-400 text-[13px] mb-5">★★★★★</div>

                {/* Quote */}
                <p className="text-white/80 text-[15px] leading-[1.7] flex-1 mb-6">
                  {quote}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-5 border-t border-white/[0.07]">
                  <div className="w-9 h-9 rounded-full bg-[#E05A28]/15 border border-[#E05A28]/20 flex items-center justify-center text-[12px] font-bold text-[#E05A28] flex-shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-[13px]">{name}</p>
                    <p className="text-[12px] text-white/35 mt-0.5">{role} · {restaurant}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-[#fafaf8] border-t border-[#e5e5e0]">
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
      <section className="py-16 px-5 sm:px-6 bg-[#111111]">
        <div className="max-w-2xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden px-8 sm:px-12 py-12 sm:py-14 text-center"
            style={{ background: 'linear-gradient(145deg, #E05A28 0%, #B84018 100%)' }}>
            {/* Dot pattern overlay */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            {/* Glow */}
            <div aria-hidden="true" className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)' }} />
            <div className="relative">
              <p className="text-white/60 text-[11px] font-semibold uppercase tracking-[0.14em] mb-3">Join 200+ restaurants</p>
              <h2 className="font-bold text-white mb-3" style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', lineHeight: 1.15, letterSpacing: '-0.025em' }}>
                Reply to every review.<br className="hidden sm:block" /> Build a reputation that brings guests back.
              </h2>
              <p className="text-white/65 mb-8 text-[14px] sm:text-[15px] leading-relaxed max-w-[400px] mx-auto">
                7 days free — no credit card needed. Set up takes 2 minutes.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-[#E05A28] text-[14px] font-bold rounded-xl hover:bg-white/92 active:bg-white/85 transition-all duration-150 active:scale-[0.98] shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
              >
                Start your free week
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                </svg>
              </Link>
              <p className="text-white/40 text-[12px] mt-4">Then $29/mo · cancel anytime · no contracts</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#111111] border-t border-[#1E1E1E] py-14 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">

            {/* Brand */}
            <div className="sm:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-[7px] bg-[#E05A28] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 20 20" fill="none" className="w-[17px] h-[17px]" aria-hidden="true">
                    <path d="M2 1.5h9A1.5 1.5 0 0112.5 3v5A1.5 1.5 0 0111 9.5H7l-2 2v-2H2A1.5 1.5 0 01.5 8V3A1.5 1.5 0 012 1.5z" fill="white" fillOpacity="0.5"/>
                    <path d="M8 8h9.5A1.5 1.5 0 0119 9.5v5A1.5 1.5 0 0117.5 16H16v2.5l-3-2.5H8A1.5 1.5 0 016.5 14.5v-5A1.5 1.5 0 018 8z" fill="white"/>
                  </svg>
                </div>
                <span className="font-bold text-white text-[15px] tracking-[-0.02em]">TableReply</span>
              </div>
              <p className="text-[13px] text-[#555] leading-relaxed">
                AI-powered review replies for independent restaurants. Built to save you time and protect your reputation.
              </p>
            </div>

            {/* Product links */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#444] mb-4">Product</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'Features', href: '#how-it-works' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'Sign in', href: '/login' },
                  { label: 'Start free trial', href: '/signup' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-[14px] text-[#555] hover:text-white transition-colors duration-200">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#444] mb-4">Legal</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Contact Us', href: '/contact' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-[14px] text-[#555] hover:text-white transition-colors duration-200">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-[#1E1E1E] pt-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-[13px] text-[#444]">
              &copy; 2026 TableReply · Austin, TX
            </p>
            <p className="text-[12px] text-[#333]">Made with care for independent restaurants everywhere</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
