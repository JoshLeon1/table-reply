'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import Link from 'next/link'

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useFadeIn(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setVisible(true); obs.disconnect() }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function useCountUp(target: number, active: boolean, duration = 1600) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [active, target, duration])
  return val
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [annual, setAnnual] = useState(false)
  const [notifDismissed, setNotifDismissed] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    const fn = () => {
      const y = window.scrollY
      setScrollY(y)
      setScrolled(y > 72)
    }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Banner fades out over the first 60px of scroll
  const bannerOpacity = notifDismissed ? 0 : Math.max(0, 1 - scrollY / 60)
  const bannerVisible = !notifDismissed && bannerOpacity > 0
  // Nav slides down to top-0 as banner fades (40px banner height)
  const navTop = notifDismissed ? 0 : Math.max(0, 40 - scrollY)

  // Fade-in refs for section headings
  const problemFade   = useFadeIn()
  const statsFade     = useFadeIn()
  const howFade       = useFadeIn()
  const analyticsFade = useFadeIn()
  const demoFade      = useFadeIn()
  const quoteFade     = useFadeIn()
  const pricingFade   = useFadeIn()

  // Count-up numbers — trigger when stats container enters view
  const c63 = useCountUp(63, statsFade.visible, 1600)
  const c45 = useCountUp(45, statsFade.visible, 2000)
  const c97 = useCountUp(97, statsFade.visible, 2300)

  const restaurantNames = [
    "Rosario's Trattoria",
    'The Perch Kitchen',
    'Lucky Dragon',
    'South Congress Café',
    'Colina Verde',
  ]

  return (
    <div className="text-[#1C1917]">

      {/* ── NOTIFICATION BAR ────────────────────────────────────────────── */}
      {bannerVisible && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-3 px-10 py-2.5 bg-amber-400 text-[#111]"
          style={{ opacity: bannerOpacity, pointerEvents: bannerOpacity < 0.1 ? 'none' : 'auto' }}
        >
          <span className="text-[13px] font-medium">
            🍴 First week free — no credit card required.{' '}
            <Link href="/signup" className="font-bold underline underline-offset-2 hover:text-amber-900 transition-colors">
              Start today →
            </Link>
          </span>
          <button
            onClick={() => setNotifDismissed(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#111]/40 hover:text-[#111] transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav
        className={`fixed left-0 right-0 z-50 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-stone-100'
            : 'bg-transparent'
        }`}
        style={{ top: `${navTop}px`, transition: 'background-color 0.3s, border-color 0.3s' }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <svg
              className={`w-5 h-5 flex-shrink-0 transition-colors ${scrolled ? 'text-amber-600' : 'text-amber-400'}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
            </svg>
            <span
              className={`font-display font-bold text-xl tracking-tight transition-colors ${
                scrolled ? 'text-stone-900' : 'text-white'
              }`}
            >
              TableReply
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className={`text-sm font-medium transition-colors hidden sm:block ${
                scrolled ? 'text-stone-500 hover:text-stone-900' : 'text-white/70 hover:text-white'
              }`}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-full transition-all duration-150 hover:scale-[1.02]"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#111111] relative overflow-hidden min-h-screen flex flex-col justify-center px-6 pt-36 pb-0">

        {/* Grain texture overlay */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            opacity: 0.045,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Ambient warm glow — off-center, intentionally asymmetric */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: '20%',
            left: '5%',
            width: '520px',
            height: '420px',
            background: 'radial-gradient(ellipse at center, rgba(217,119,6,0.11) 0%, transparent 68%)',
          }}
        />

        {/* LEFT-ALIGNED content — asymmetric, lots of empty right space */}
        <div className="relative z-10 max-w-6xl mx-auto w-full">
          <div className="max-w-[600px]">

            {/* Section label — thin serif italic, not uppercase caps */}
            <p
              className="font-display text-amber-500/75 text-sm mb-10"
              style={{ fontWeight: 400, fontStyle: 'italic' }}
            >
              Built for restaurants
            </p>

            {/* Headline — dramatic weight contrast within same line */}
            <h1
              className="text-white font-display mb-8"
              style={{ fontSize: 'clamp(44px, 7vw, 80px)', lineHeight: 1.06 }}
            >
              <span style={{ fontWeight: 300 }}>Every review</span>
              <br />
              <span style={{ fontWeight: 300 }}>deserves </span>
              <span style={{ fontWeight: 900 }}>a reply.</span>
              <br />
              {/* Amber line with wavy SVG underline */}
              <span className="relative inline-block">
                <span className="text-amber-500" style={{ fontWeight: 700 }}>
                  Now they all get one.
                </span>
                <svg
                  aria-hidden
                  viewBox="0 0 420 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute -bottom-2 left-0 w-full"
                  style={{ height: '11px' }}
                  preserveAspectRatio="none"
                >
                  <path
                    d="M1,6 C18,2 35,10 52,6 C69,2 86,10 103,6 C120,2 137,10 154,6 C171,2 188,10 205,6 C222,2 239,10 256,6 C273,2 290,10 307,6 C324,2 341,10 358,6 C375,2 392,9 419,5"
                    stroke="#D97706"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p
              className="text-[#78716C] leading-[1.75] mb-10 max-w-[420px]"
              style={{ fontSize: '18px' }}
            >
              TableReply writes personalized, on-brand responses to your Google
              and Yelp reviews — in seconds. Unlimited replies, $29/mo.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Primary CTA with pulse ring */}
              <div className="relative inline-block self-start">
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full animate-pulse-ring bg-amber-500/20 pointer-events-none"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full animate-pulse-ring bg-amber-400/10 pointer-events-none"
                  style={{ animationDelay: '1.0s' }}
                />
                <Link
                  href="/signup"
                  className="relative inline-block px-7 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-full transition-all duration-150 hover:scale-[1.02] hover:shadow-lg hover:-translate-y-0.5 text-sm z-10"
                >
                  Start free — first week on us
                </Link>
              </div>

              <a
                href="#how-it-works"
                className="inline-block px-7 py-3.5 border border-white/20 hover:border-white/40 text-white font-semibold rounded-full transition-all duration-150 hover:scale-[1.02] text-sm self-start"
              >
                See how it works
              </a>
            </div>

            <p className="text-stone-600 text-xs">
              No credit card required · Cancel anytime · Works with Google, Yelp &amp; TripAdvisor
            </p>

            <p className="text-white/30 text-[13px] mt-5 flex items-center gap-2">
              <span className="flex -space-x-1.5">
                {['#D97706','#92400E','#B45309'].map((c, i) => (
                  <span key={i} className="w-6 h-6 rounded-full border-2 border-[#111] flex-shrink-0" style={{ background: c }} />
                ))}
              </span>
              Join <span className="text-white/60 font-semibold">200+</span> restaurant owners already using TableReply
            </p>
          </div>
        </div>

        {/* Browser mockup — floats at section bottom */}
        <div className="relative z-10 max-w-3xl mx-auto w-full mt-20">
          <div
            className="rounded-t-2xl overflow-hidden relative"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
              boxShadow: '0 -24px 80px rgba(217,119,6,0.07)',
            }}
          >
            {/* Shine line at very top edge */}
            <div
              aria-hidden
              className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
              style={{
                height: '1px',
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 25%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.18) 75%, transparent 100%)',
              }}
            />

            {/* Chrome title bar */}
            <div className="bg-[#242424] px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
              </div>
              <div className="flex-1 bg-[#1A1A1A] rounded-md px-3 py-1.5 flex items-center gap-2">
                <svg className="w-2.5 h-2.5 text-stone-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-stone-500 text-xs">app.tablereply.com/dashboard</span>
              </div>
            </div>

            {/* Two-panel content */}
            <div className="bg-[#161616] grid grid-cols-1 sm:grid-cols-2">
              {/* Left — review */}
              <div className="p-6 sm:border-r border-b sm:border-b-0 border-white/[0.05]">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">
                    Incoming · Google
                  </span>
                  <div className="flex gap-0.5">
                    {[...Array(4)].map((_, i) => (
                      <svg key={i} className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <svg className="w-3 h-3 text-stone-700" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                <p className="text-stone-300 text-sm leading-[1.75]">
                  "omg the pasta!! 😭 came in on a saturday night with my bf and the
                  cacio e pepe was genuinely the best ive had — like better than some
                  places in italy ngl. service was a lil slow but our server was so sweet
                  we didnt even mind. will def be back"
                </p>
                <p className="text-stone-600 text-xs mt-3">— Sarah M. · 2 days ago</p>
              </div>

              {/* Right — reply */}
              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">
                    Generated reply
                  </span>
                  <span className="flex items-center gap-1.5 text-green-500 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Ready
                  </span>
                </div>
                <p className="text-stone-300 text-sm leading-[1.75]">
                  Sarah, your cacio e pepe comment genuinely made our chef&apos;s week
                  — he&apos;s been perfecting that recipe for years and hearing it lands
                  means everything.
                  <br />
                  <br />
                  You&apos;re right that Saturday nights stretch us, and we&apos;re
                  working on it. Hope to see you and your bf back soon.
                  <br />
                  <br />
                  — Marco
                  <span
                    aria-hidden
                    className="inline-block w-[2px] h-[13px] bg-stone-400 ml-0.5 align-middle animate-blink"
                  />
                </p>
                <button className="mt-4 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md transition-all duration-150 hover:scale-[1.02] flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy reply
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGO BAR ────────────────────────────────────────────────────── */}
      <section className="bg-white py-9 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-stone-400 text-xs uppercase tracking-widest font-medium mb-5">
            Trusted by independent restaurants across the US
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {restaurantNames.flatMap((name, i) => [
              ...(i > 0
                ? [
                    <span
                      key={`sep-${i}`}
                      className="text-amber-500/50 text-xs inline-block animate-slow-spin"
                      style={{ animationDuration: `${9 + i * 1.5}s` }}
                    >
                      ✦
                    </span>,
                  ]
                : []),
              <span
                key={name}
                className="font-display text-stone-400 text-sm tracking-wide"
                style={{ fontWeight: 400 }}
              >
                {name}
              </span>,
            ])}
          </div>
        </div>
      </section>

      {/* ── PROBLEM ──────────────────────────────────────────────────────── */}
      <section
        className="py-32 px-6"
        style={{ background: 'linear-gradient(180deg, #FAFAF8 0%, #F4EFE8 100%)' }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28 items-start">

          {/* Left — headline */}
          <div
            ref={problemFade.ref}
            className={`transition-all duration-700 ${
              problemFade.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <p
              className="font-display text-amber-600/70 text-sm mb-6"
              style={{ fontWeight: 400, fontStyle: 'italic' }}
            >
              The problem
            </p>
            <h2
              className="font-display text-[#1C1917]"
              style={{ fontSize: 'clamp(34px, 4.5vw, 54px)', lineHeight: 1.15, fontWeight: 700 }}
            >
              You know you should
              <br />
              reply to reviews.
              <br />
              <span className="text-amber-600">You never have time.</span>
            </h2>
            <p className="text-[#78716C] mt-7 leading-[1.8] text-base max-w-sm">
              Most owners respond to fewer than 10% of their reviews — not because they
              don&apos;t care, but because crafting a genuine reply takes time they simply
              don&apos;t have at the end of a long shift.
            </p>
          </div>

          {/* Right — staggered cascading stats */}
          <div ref={statsFade.ref} className="space-y-0 pt-4">
            {[
              { count: c63, label: 'of restaurant reviews go unanswered', indent: 0 },
              { count: c45, label: 'more reviews when owners respond consistently', indent: 32 },
              { count: c97, label: "of diners read the owner's reply before visiting", indent: 64 },
            ].map(({ count, label, indent }, i) => (
              <div key={label}>
                {i > 0 && <div className="h-px bg-stone-200/70 my-8" />}
                <div
                  className={`transition-all duration-700 ${
                    statsFade.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{
                    marginLeft: `${indent}px`,
                    transitionDelay: `${i * 120}ms`,
                  }}
                >
                  <div
                    className="font-display text-[#1C1917] leading-none"
                    style={{ fontSize: 'clamp(52px, 7vw, 76px)', fontWeight: 700 }}
                  >
                    {count}%
                  </div>
                  <p className="text-[#78716C] mt-2 text-sm leading-snug max-w-[200px]">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-28 px-6"
        style={{ background: 'linear-gradient(180deg, #FAFAF8 0%, #F2ECE4 100%)' }}
      >
        <div className="max-w-5xl mx-auto">
          <div
            ref={howFade.ref}
            className={`transition-all duration-700 ${
              howFade.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <p
              className="font-display text-amber-600/70 text-sm mb-4"
              style={{ fontWeight: 400, fontStyle: 'italic' }}
            >
              How it works
            </p>
            <h2
              className="font-display text-[#1C1917] mb-20"
              style={{ fontSize: 'clamp(28px, 3.5vw, 46px)', lineHeight: 1.15, fontWeight: 700 }}
            >
              From review to reply in 10 seconds
            </h2>
          </div>

          {/* Unequal 3-column grid — intentionally asymmetric */}
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8"
            style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}
          >
            <div
              className="hidden md:grid gap-8"
              style={{ gridColumn: '1 / -1', gridTemplateColumns: '1.25fr 1fr 0.75fr' }}
            >
              {[
                {
                  num: '01',
                  title: 'Set up your voice',
                  desc: 'Tell us your restaurant name, cuisine, vibe, and how you like to sound. Two minutes, once.',
                },
                {
                  num: '02',
                  title: 'Paste any review',
                  desc: "Copy a review from Google, Yelp, or TripAdvisor. Select the star rating. That's it.",
                },
                {
                  num: '03',
                  title: 'Copy and post',
                  desc: 'Get a personalized, on-brand reply in seconds. Paste it directly on the platform.',
                },
              ].map(({ num, title, desc }) => (
                <div key={num} className="relative pt-16 overflow-visible">
                  {/* Enormous watermark number bleeding behind content */}
                  <div
                    aria-hidden
                    className="absolute font-display select-none pointer-events-none"
                    style={{
                      top: '-8px',
                      left: '-12px',
                      fontSize: '160px',
                      fontWeight: 200,
                      lineHeight: 1,
                      color: 'rgba(217, 119, 6, 0.07)',
                    }}
                  >
                    {num}
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-semibold text-[#1C1917] text-lg mb-2.5">{title}</h3>
                    <p className="text-[#78716C] text-sm leading-[1.75]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile stacked version */}
            {[
              {
                num: '01',
                title: 'Set up your voice',
                desc: 'Tell us your restaurant name, cuisine, vibe, and how you like to sound. Two minutes, once.',
              },
              {
                num: '02',
                title: 'Paste any review',
                desc: "Copy a review from Google, Yelp, or TripAdvisor. Select the star rating. That's it.",
              },
              {
                num: '03',
                title: 'Copy and post',
                desc: 'Get a personalized, on-brand reply in seconds. Paste it directly on the platform.',
              },
            ].map(({ num, title, desc }) => (
              <div key={`m-${num}`} className="md:hidden relative pt-16 overflow-visible">
                <div
                  aria-hidden
                  className="absolute font-display select-none pointer-events-none"
                  style={{
                    top: '-8px',
                    left: '-8px',
                    fontSize: '120px',
                    fontWeight: 200,
                    lineHeight: 1,
                    color: 'rgba(217, 119, 6, 0.07)',
                  }}
                >
                  {num}
                </div>
                <div className="relative z-10">
                  <h3 className="font-semibold text-[#1C1917] text-lg mb-2.5">{title}</h3>
                  <p className="text-[#78716C] text-sm leading-[1.75]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANALYTICS SECTION ────────────────────────────────────────────── */}
      <section className="bg-[#F7F5F0] py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div
            ref={analyticsFade.ref}
            className={`transition-all duration-700 ${analyticsFade.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            {/* Label */}
            <p className="font-display text-amber-600/80 text-sm mb-4" style={{ fontWeight: 400, fontStyle: 'italic' }}>
              Built-in intelligence
            </p>

            {/* Headline */}
            <h2
              className="font-display text-[#111] mb-5"
              style={{ fontSize: 'clamp(28px, 3.5vw, 46px)', lineHeight: 1.12, fontWeight: 700 }}
            >
              Know your restaurant<br />inside out
            </h2>

            {/* Subtext */}
            <p className="text-[#78716C] text-base leading-relaxed max-w-xl mb-14">
              TableReply doesn't just reply to reviews — it analyses them. See what customers love, what they complain about, and exactly what to fix to earn more 5-star reviews.
            </p>

            {/* 3 feature columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
                    </svg>
                  ),
                  title: 'Rating trends',
                  desc: 'See how your average rating changes month over month. Spot dips before they become problems.',
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                    </svg>
                  ),
                  title: 'Sentiment analysis',
                  desc: 'Discover what customers consistently praise and complain about — powered by AI that reads every review.',
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  ),
                  title: 'Improvement opportunities',
                  desc: 'Get specific, actionable suggestions to turn 3-star visits into 5-star ones. Not vague advice — real fixes.',
                },
              ].map(({ icon, title, desc }) => (
                <div key={title}>
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                    {icon}
                  </div>
                  <h3 className="font-semibold text-[#1C1917] text-base mb-2">{title}</h3>
                  <p className="text-[#78716C] text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Analytics mockup */}
            <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden shadow-sm max-w-2xl">
              {/* Mockup header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F0EDE8]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[12px] font-semibold text-[#111]">Rating trend · last 6 months</span>
                </div>
                <span className="text-[11px] text-[#AAA]">Rosario's Trattoria</span>
              </div>

              {/* Fake sparkline */}
              <div className="px-5 pt-4 pb-2">
                <svg viewBox="0 0 440 80" className="w-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.15"/>
                      <stop offset="100%" stopColor="#FBBF24" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Area fill */}
                  <path
                    d="M0,55 C40,60 80,50 130,40 C180,30 210,35 260,25 C310,15 360,18 440,10 L440,80 L0,80 Z"
                    fill="url(#lineGrad)"
                  />
                  {/* Line */}
                  <path
                    d="M0,55 C40,60 80,50 130,40 C180,30 210,35 260,25 C310,15 360,18 440,10"
                    fill="none"
                    stroke="#FBBF24"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Dots */}
                  {[[0,55],[130,40],[260,25],[440,10]].map(([x,y], i) => (
                    <circle key={i} cx={x} cy={y} r="4" fill="#FBBF24" />
                  ))}
                </svg>
                {/* Month labels */}
                <div className="flex justify-between mt-1 mb-3">
                  {['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'].map((m) => (
                    <span key={m} className="text-[10px] text-[#CCC]">{m}</span>
                  ))}
                </div>
              </div>

              {/* Theme pills */}
              <div className="flex flex-wrap gap-2 px-5 pb-5">
                {[
                  { text: 'pasta ★★★★★', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { text: 'Friday wait times ⚠️', color: 'bg-red-50 text-red-600 border-red-200' },
                  { text: 'host warmth ★★★★★', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { text: 'noise level ⚠️', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                  { text: 'tiramisu ★★★★★', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                ].map(({ text, color }) => (
                  <span key={text} className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${color}`}>
                    {text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEMO ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#111111] py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div
            ref={demoFade.ref}
            className={`transition-all duration-700 ${
              demoFade.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <p
              className="font-display text-amber-500/70 text-sm mb-4"
              style={{ fontWeight: 400, fontStyle: 'italic' }}
            >
              See it in action
            </p>
            <h2
              className="font-display text-white mb-16"
              style={{ fontSize: 'clamp(28px, 3.5vw, 46px)', lineHeight: 1.15, fontWeight: 700 }}
            >
              10 seconds. Every time.
            </h2>
          </div>

          <div
            className="border border-white/[0.07] rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.04)' }}
          >
            {/* App header */}
            <div className="bg-[#1C1C1C] px-6 py-4 flex items-center justify-between border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold font-display">TR</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium leading-tight">Rosario&apos;s Trattoria</p>
                  <p className="text-stone-600 text-xs">Generate Reply</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-stone-800" />
                <div className="w-2 h-2 rounded-full bg-stone-800" />
                <div className="w-2 h-2 rounded-full bg-stone-800" />
              </div>
            </div>

            <div className="bg-[#161616] grid grid-cols-1 md:grid-cols-2">
              {/* Left — review */}
              <div className="p-8 border-b md:border-b-0 md:border-r border-white/[0.05]">
                <p className="text-stone-500 text-xs uppercase tracking-wider mb-5 font-medium">
                  Paste your review
                </p>
                <div className="bg-[#1E1E1E] rounded-xl p-5 border border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-0.5">
                      {[...Array(4)].map((_, i) => (
                        <svg key={i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <svg className="w-3.5 h-3.5 text-stone-700" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <span className="text-stone-500 text-xs">Sarah M. · Google</span>
                  </div>
                  <p className="text-stone-300 text-sm leading-[1.75]">
                    "omg the pasta!! 😭 cacio e pepe was genuinely the best ive had —
                    like better than some places in italy ngl. service was a lil slow
                    but our server was so sweet we didnt even mind. will def be back for
                    date night"
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-2.5">
                  <select className="bg-[#1E1E1E] border border-white/10 text-stone-400 text-xs rounded-lg px-3 py-2 focus:outline-none">
                    <option>Google</option>
                    <option>Yelp</option>
                    <option>TripAdvisor</option>
                  </select>
                  <button className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-all duration-150 hover:scale-[1.02]">
                    Generate reply →
                  </button>
                </div>
              </div>

              {/* Right — reply */}
              <div className="p-8">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-stone-500 text-xs uppercase tracking-wider font-medium">
                    Your reply — ready to copy
                  </p>
                  <span className="flex items-center gap-1.5 text-green-500 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Generated
                  </span>
                </div>
                <div className="bg-[#1E1E1E] rounded-xl p-5 border border-white/[0.04]">
                  <p className="text-stone-300 text-sm leading-[1.75]">
                    Sarah, your cacio e pepe comment genuinely made our chef&apos;s
                    week — he&apos;s been perfecting that recipe for years and it means
                    everything to hear it lands.
                    <br />
                    <br />
                    You&apos;re right that Saturdays stretch us, and we&apos;re
                    actively working on that. Hope to see you and your bf back for
                    date night soon.
                    <br />
                    <br />
                    — Marco
                    <span
                      aria-hidden
                      className="inline-block w-[2px] h-[13px] bg-stone-400 ml-0.5 align-middle animate-blink"
                    />
                  </p>
                </div>
                <button className="mt-4 w-full py-2.5 border border-white/10 hover:border-white/20 text-stone-400 hover:text-stone-300 text-xs font-medium rounded-lg transition-all duration-150 flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy to clipboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section
        className="py-28 px-6"
        style={{ background: 'linear-gradient(180deg, #FAFAF8 0%, #F3ECE3 100%)' }}
      >
        <div className="max-w-5xl mx-auto">

          {/* Thin amber line — 40% wide, left-aligned, signals craft */}
          <div
            className="bg-amber-600 mb-16"
            style={{ width: '40%', height: '1px' }}
          />

          <div
            ref={quoteFade.ref}
            className={`transition-all duration-700 ${
              quoteFade.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <p
              className="font-display text-amber-600/70 text-sm mb-4"
              style={{ fontWeight: 400, fontStyle: 'italic' }}
            >
              What owners say
            </p>
            <h2
              className="font-display text-[#1C1917] mb-20"
              style={{ fontSize: 'clamp(28px, 3.5vw, 46px)', lineHeight: 1.15, fontWeight: 700 }}
            >
              Restaurant owners love it
            </h2>
          </div>

          {/* Testimonials — NOT uniform, intentionally different sizes */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200">
            {[
              {
                quote: 'I used to dread opening Yelp on Monday mornings. Now I actually look forward to it.',
                author: 'Marco R.',
                restaurant: "Rosario's Trattoria, Austin TX",
                size: 'text-xl',          // deliberately larger
                weight: 600,
              },
              {
                quote: "The 1-star reply templates alone are worth it. I used to write something defensive and regret it every single time.",
                author: 'Jen K.',
                restaurant: 'The Perch Kitchen, Denver CO',
                size: 'text-base',        // deliberately smaller
                weight: 400,
              },
              {
                quote: 'We went from responding to 10% of our reviews to 100%. Our rating went from 4.1 to 4.6 in 3 months.',
                author: 'David L.',
                restaurant: 'Lucky Dragon, Portland OR',
                size: 'text-lg',          // medium
                weight: 500,
              },
            ].map(({ quote, author, restaurant, size, weight }, i) => (
              <div
                key={author}
                className={`py-8 md:py-0 ${
                  i === 0 ? 'md:pr-10' : i === 1 ? 'md:px-10' : 'md:pl-10'
                }`}
              >
                <div
                  className="font-display text-amber-500 mb-4 select-none"
                  style={{ fontSize: '52px', fontWeight: 700, lineHeight: 0.8 }}
                >
                  &ldquo;
                </div>
                <p
                  className={`font-display text-[#1C1917] leading-relaxed mb-7 ${size}`}
                  style={{ fontStyle: 'italic', fontWeight: weight }}
                >
                  {quote}
                </p>
                <div>
                  <p className="font-semibold text-[#1C1917] text-sm">{author}</p>
                  <p className="text-[#78716C] text-xs mt-0.5">{restaurant}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section
        className="py-28 px-6"
        style={{ background: 'linear-gradient(180deg, #FAFAF8 0%, #F0E9DF 100%)' }}
      >
        <div className="max-w-xl mx-auto">
          <div
            ref={pricingFade.ref}
            className={`transition-all duration-700 ${
              pricingFade.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <p
              className="font-display text-amber-600/70 text-sm mb-4"
              style={{ fontWeight: 400, fontStyle: 'italic' }}
            >
              Pricing
            </p>
            <h2
              className="font-display text-[#1C1917] mb-2"
              style={{ fontSize: 'clamp(28px, 3.5vw, 46px)', lineHeight: 1.15, fontWeight: 700 }}
            >
              One plan. Unlimited replies.
            </h2>
            <p className="text-[#78716C] mb-14">No caps. No contracts. No surprises.</p>
          </div>

          {/* Monthly / Annual toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#EAE6DE] mb-10">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                !annual ? 'bg-white text-[#1C1917] shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                annual ? 'bg-white text-[#1C1917] shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              Annual
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wide leading-none">
                Best value
              </span>
            </button>
          </div>

          {/* Giant price */}
          {annual ? (
            <div className="mb-2">
              <div
                className="font-display text-[#1C1917] leading-none"
                style={{ fontSize: 'clamp(88px, 14vw, 120px)', fontWeight: 700 }}
              >
                $19
                <span
                  className="font-display font-normal text-[#78716C]"
                  style={{ fontSize: 'clamp(22px, 3vw, 28px)' }}
                >
                  .92<span className="ml-1">/mo</span>
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[#78716C] text-sm line-through">$29/mo</span>
                <span className="text-amber-700 text-sm font-semibold">$239/yr — save $109</span>
              </div>
            </div>
          ) : (
            <div
              className="font-display text-[#1C1917] leading-none mb-2"
              style={{ fontSize: 'clamp(88px, 14vw, 120px)', fontWeight: 700 }}
            >
              $29
              <span
                className="font-display font-normal text-[#78716C]"
                style={{ fontSize: 'clamp(22px, 3vw, 28px)' }}
              >
                /mo
              </span>
            </div>
          )}
          <p className="text-[#78716C] text-sm mb-14">
            {annual
              ? 'Billed as $239/yr — equivalent to 2 months free. No credit card required for trial.'
              : 'First week completely free — no credit card required'}
          </p>

          {/* Feature list — 2 columns, uneven: 4 left, 2 right */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-3.5 mb-14" style={{ maxWidth: '420px' }}>
            <div className="space-y-3.5">
              {[
                'Unlimited AI replies',
                'Google, Yelp, TripAdvisor, OpenTable',
                'Social post generator',
                'Review request templates',
              ].map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-[#1C1917]">{f}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3.5 self-start">
              {['Restaurant voice setup', 'Cancel anytime'].map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-[#1C1917]">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA with pulse ring */}
          <div className="relative inline-block">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full animate-pulse-ring bg-amber-500/20 pointer-events-none"
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full animate-pulse-ring bg-amber-400/10 pointer-events-none"
              style={{ animationDelay: '1.1s' }}
            />
            <Link
              href={annual ? '/signup?plan=annual' : '/signup'}
              className="relative inline-block px-10 py-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-full transition-all duration-150 hover:scale-[1.02] hover:shadow-lg hover:-translate-y-0.5 text-base z-10"
            >
              Start your free week →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#FAFAF8]">
        <div className="max-w-2xl mx-auto">
          <p className="font-display text-amber-600/70 text-sm mb-4 italic font-normal">Questions</p>
          <h2
            className="font-display text-[#1C1917] mb-12"
            style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', lineHeight: 1.15, fontWeight: 700 }}
          >
            Frequently asked
          </h2>
          <div className="divide-y divide-[#E8E4DC]">
            {([
              {
                q: 'Will my customers know the reply was AI-generated?',
                a: "TableReply generates the reply, but you review and post it. It sounds like you because we build it around your restaurant's voice, cuisine, and personality. 50% of consumers say generic replies hurt a business — ours never are.",
              },
              {
                q: 'Does it work for negative reviews?',
                a: "Especially for those. Negative review replies are the most important — and the hardest to write calmly after a long shift. TableReply writes empathetic, professional responses that turn unhappy customers into loyal ones.",
              },
              {
                q: 'What platforms does it work with?',
                a: 'Google, Yelp, TripAdvisor, and OpenTable. Paste any review and get a reply in seconds.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. No contracts, no cancellation fees. Cancel in one click.',
              },
              {
                q: 'How is this different from ChatGPT?',
                a: 'ChatGPT gives you a generic reply. TableReply knows your restaurant — your cuisine, your vibe, your owner\'s name, your tone. Every reply sounds like it came from you.',
              },
            ] as const).map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-left gap-6 group"
                >
                  <span className="text-[15px] font-semibold text-[#1C1917] group-hover:text-amber-700 transition-colors leading-snug">
                    {item.q}
                  </span>
                  <svg
                    className={`w-5 h-5 text-[#AAA] flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v16m8-8H4"/>
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="flex gap-5 pb-6">
                    <div className="w-0.5 bg-amber-400 rounded-full flex-shrink-0" />
                    <p className="text-[14px] text-[#78716C] leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#111111] relative overflow-hidden py-16 px-6">

        {/* Thin amber top border — 60px, left-aligned */}
        <div
          className="absolute top-0 left-0 bg-amber-600"
          style={{ width: '60px', height: '1px' }}
        />

        {/* Large watermark behind content */}
        <div
          aria-hidden
          className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none"
          style={{ paddingLeft: '5%' }}
        >
          <span
            className="font-display font-bold whitespace-nowrap"
            style={{
              fontSize: 'clamp(80px, 16vw, 210px)',
              color: 'rgba(255,255,255,0.028)',
              lineHeight: 1,
            }}
          >
            TableReply
          </span>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-10 mb-12">
            {/* Left */}
            <div>
              <p className="font-display text-white font-bold text-2xl mb-1.5">TableReply</p>
              <p className="text-stone-500 text-sm">Built for restaurants, by people who love them.</p>
            </div>

            {/* Right — italic handwritten-feel note + links */}
            <div className="text-right">
              <p
                className="font-display text-stone-400 text-sm mb-5 max-w-xs ml-auto leading-relaxed"
                style={{ fontStyle: 'italic', fontWeight: 400 }}
              >
                Made with care for independent
                <br />restaurants everywhere.
              </p>
              <div className="flex gap-6 text-stone-500 text-sm justify-end">
                <a href="#" className="hover:text-stone-300 transition-colors">Privacy</a>
                <a href="#" className="hover:text-stone-300 transition-colors">Terms</a>
                <a href="#" className="hover:text-stone-300 transition-colors">Contact</a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-8">
            <p className="text-stone-600 text-xs">© 2026 TableReply · Austin, TX</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
