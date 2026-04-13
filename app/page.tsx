'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── Scroll-triggered animation hook ──────────────────────────────────────────
function useInView(threshold = 0.12) {
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCounter(target: number, duration = 1200, active = false) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(eased * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [active, target, duration])
  return val
}

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [annual, setAnnual] = useState(false)
  const [notifDismissed, setNotifDismissed] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Typing animation state for hero mockup
  const [typedReview, setTypedReview] = useState('')
  const [typedReply, setTypedReply] = useState('')
  const [animPhase, setAnimPhase] = useState<'typing' | 'generating' | 'revealing'>('typing')

  useEffect(() => {
    const REVIEW = 'Food was cold and service was slow. Very disappointed.'
    const REPLY   = "We're truly sorry your experience didn't match our standards. We'd love to make this right—please email us directly."
    const WORDS   = REPLY.split(' ')
    let charIdx = 0
    let wordIdx = 0
    let t: ReturnType<typeof setTimeout>

    function typeChar() {
      charIdx++
      setTypedReview(REVIEW.slice(0, charIdx))
      if (charIdx < REVIEW.length) {
        t = setTimeout(typeChar, 44 + Math.random() * 22)
      } else {
        t = setTimeout(() => {
          setAnimPhase('generating')
          t = setTimeout(() => {
            setAnimPhase('revealing')
            revealWord()
          }, 2200)
        }, 350)
      }
    }

    function revealWord() {
      wordIdx++
      setTypedReply(WORDS.slice(0, wordIdx).join(' '))
      if (wordIdx < WORDS.length) {
        t = setTimeout(revealWord, 65 + Math.random() * 30)
      } else {
        t = setTimeout(reset, 3000)
      }
    }

    function reset() {
      charIdx = 0; wordIdx = 0
      setTypedReview(''); setTypedReply('')
      setAnimPhase('typing')
      t = setTimeout(typeChar, 700)
    }

    t = setTimeout(typeChar, 1100)
    return () => clearTimeout(t)
  }, [])

  // Section animation refs
  const trustBarAnim   = useInView(0.2)
  const proofAnim      = useInView(0.1)
  const problemAnim    = useInView(0.1)
  const featuresAnim   = useInView(0.08)
  const howItWorksAnim = useInView(0.1)
  const testimonialsAnim = useInView(0.08)
  const faqAnim        = useInView(0.1)
  const pricingAnim    = useInView(0.15)
  const ctaAnim        = useInView(0.2)

  // Stat counters (fire when problem section is visible)
  const stat1 = useCounter(63, 1000, problemAnim.inView)
  const stat2 = useCounter(45, 1200, problemAnim.inView)
  const stat3 = useCounter(97, 1100, problemAnim.inView)

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
      title: 'Google, Yelp & TripAdvisor Auto-Sync',
      desc: 'Reviews from all three platforms sync to your dashboard automatically every day — no manual checking, no copy-pasting.',
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
      title: 'Reviews come to you',
      desc: 'Google, Yelp, and TripAdvisor reviews appear in your dashboard automatically every day — just connect each platform once in Settings.',
    },
    {
      num: '3',
      title: 'Copy your reply in seconds',
      desc: 'Get a personalized, on-brand reply instantly. Copy it and paste it back into Google, Yelp, or TripAdvisor. Done.',
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
    'Google + Yelp + TripAdvisor auto-sync',
    'Keyword alerts',
    'Staff mention tracking',
    'Multi-language replies',
    'Social post generator',
    'Restaurant voice setup',
    'Cancel anytime',
  ]

  const faqs = [
    {
      q: 'Do I approve replies before they get posted?',
      a: 'Yes, always. TableReply generates a draft — you review it, edit if needed, then copy and paste it into Google or Yelp yourself. Nothing posts automatically.',
    },
    {
      q: 'Does this connect to Google, Yelp, and TripAdvisor automatically?',
      a: "Yes — Google, Yelp, and TripAdvisor all sync automatically every day. Connect each platform once in Settings and reviews will start appearing in your dashboard.",
    },
    {
      q: 'Will replies sound robotic or generic?',
      a: "No. When you set up your profile, you tell TableReply your restaurant's name, cuisine, owner name, and tone. Every reply is written specifically for that review — it won't sound like a template.",
    },
    {
      q: 'How long does setup take?',
      a: "About 2 minutes. Enter your restaurant name, cuisine type, and a few words about your tone. That's it — you can start generating replies immediately.",
    },
    {
      q: 'Can I edit the replies before I use them?',
      a: 'Absolutely. Every reply is just a text draft. Edit it however you like before copying it to your review platform.',
    },
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
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E05A28]/10 border border-[#E05A28]/20 mb-6 sm:mb-7 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#E05A28] animate-pulse" />
                <span className="text-[#E05A28] text-[12px] font-semibold tracking-wide">Built for independent restaurants</span>
              </div>

              <h1
                className="text-white mb-5 sm:mb-6 animate-fade-up"
                style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', animationDelay: '180ms' }}
              >
                Your reviews deserve a reply.{' '}
                <span style={{ color: '#E05A28' }}>Now every single one gets one.</span>
              </h1>

              <p className="text-[#777] mb-8 sm:mb-10 max-w-[440px] animate-fade-up" style={{ fontSize: '15px', lineHeight: '1.7', animationDelay: '280ms' }}>
                Google, Yelp, and TripAdvisor reviews sync automatically every day. Get a thoughtful, on-brand reply in seconds — matched to your voice and their tone.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-7 sm:mb-8 animate-fade-up" style={{ animationDelay: '360ms' }}>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white text-sm font-bold rounded-xl transition-all duration-150 active:scale-[0.98] shadow-[0_4px_20px_rgba(224,90,40,0.35)] hover:shadow-[0_6px_28px_rgba(224,90,40,0.5)] hover:-translate-y-0.5"
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

              <div className="flex flex-wrap items-center gap-4 sm:gap-5 animate-fade-up" style={{ animationDelay: '440ms' }}>
                {['7 days free', 'Cancel anytime', 'Google & Yelp'].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[#E05A28] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                    <span className="text-[#555] text-[12px]">{item}</span>
                  </div>
                ))}
              </div>
              <a href="#example" className="inline-flex items-center gap-1.5 text-[#888] text-[13px] hover:text-[#E05A28] transition-colors duration-200 mt-2 animate-fade-up" style={{ animationDelay: '500ms' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                See a real reply example
              </a>
            </div>

            {/* Right — product mockup */}
            <div className="hidden lg:flex justify-center items-center animate-fade-up" style={{ animationDelay: '300ms' }}>
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

                    {/* Review 2 — live typing animation */}
                    <div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white/40 flex-shrink-0">DK</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white text-[13px] font-semibold">David K.</span>
                            <span className="text-white/25 text-[11px]">just now</span>
                          </div>
                          <div className="mb-2 text-[12px]">
                            <span className="text-amber-400/70">★</span>
                            <span className="text-white/15">★★★★</span>
                          </div>
                          {/* Typing review text */}
                          <p className="text-white/50 text-[12px] leading-relaxed min-h-[34px]">
                            &ldquo;{typedReview}
                            {animPhase === 'typing' && (
                              <span className="inline-block w-[1.5px] h-[0.9em] bg-white/40 ml-px align-text-bottom" style={{ animation: 'blink 0.8s step-end infinite' }} />
                            )}
                            {animPhase !== 'typing' && typedReview && '…"'}
                          </p>
                        </div>
                      </div>

                      {/* Generating dots */}
                      {animPhase === 'generating' && (
                        <div className="mt-3 ml-11 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#E05A28]/10 border border-[#E05A28]/20 w-fit">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-[#E05A28]"
                              style={{ animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                            />
                          ))}
                          <span className="text-[11px] text-[#E05A28]/80 ml-1">Generating reply…</span>
                        </div>
                      )}

                      {/* AI reply reveal */}
                      {animPhase === 'revealing' && (
                        <div className="mt-3 ml-11 bg-[#E05A28]/10 border border-[#E05A28]/20 rounded-xl p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#E05A28] mb-1.5">AI Reply</p>
                          <p className="text-white/70 text-[12px] leading-relaxed min-h-[2.5em]">
                            {typedReply}
                            <span className="inline-block w-[1.5px] h-[0.9em] bg-[#E05A28]/60 ml-px align-text-bottom" style={{ animation: 'blink 0.8s step-end infinite' }} />
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────────────────────── */}
      <div className="bg-[#0D0D0D] border-b border-white/[0.06] py-4 overflow-hidden relative select-none">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #0D0D0D, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #0D0D0D, transparent)' }} />

        <div className="flex" style={{ animation: 'marqueeScroll 28s linear infinite' }}>
          {/* Two copies for seamless loop */}
          {[0, 1].map((set) => (
            <div key={set} className="flex items-center gap-0 flex-shrink-0" aria-hidden={set === 1}>
              {['Italian', 'BBQ & Smokehouse', 'Café', 'Fine Dining', 'Food Truck', 'Bakery', 'Sushi Bar', 'Mexican', 'Farm-to-Table', 'Gastropub', 'Pizza', 'Steakhouse'].map((item) => (
                <span key={item} className="flex items-center gap-5 px-6 text-[12px] font-medium text-white/30 whitespace-nowrap">
                  {item}
                  <span className="w-1 h-1 rounded-full bg-white/15 flex-shrink-0" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── PROOF SECTION ────────────────────────────────────────────────── */}
      <section id="example" className="bg-white py-16 px-5 sm:px-6 border-b border-[#e5e5e0]">
        <div
          ref={proofAnim.ref}
          className={`max-w-4xl mx-auto transition-all duration-700 ${proofAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E05A28] mb-3">Real Example</p>
            <h2 className="font-bold text-[#111111] mb-2" style={{ fontSize: 'clamp(24px, 3vw, 36px)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              See exactly what you&apos;ll get
            </h2>
            <p className="text-[15px] text-[#777] max-w-md mx-auto">A real 1-star review. The reply TableReply drafts in seconds.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* LEFT — The Review */}
            <div className="rounded-2xl border bg-[#FAFAFA] border-[#E4DED8] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888] mb-4 flex items-center gap-2">
                <span className="text-amber-400">★</span><span className="text-[#bbb]">☆☆☆☆</span>
                <span className="ml-1">1-star review on Google</span>
              </p>
              <p className="text-[13px] font-semibold text-[#111] mb-0.5">James T.</p>
              <p className="text-[12px] text-[#aaa] mb-4">3 days ago</p>
              <p className="text-[14px] leading-relaxed text-[#444]">
                &ldquo;Honestly disappointed. Waited 40 minutes for a table with a reservation, then the pasta was lukewarm. Server was apologetic but the manager never came out. Won&apos;t be back.&rdquo;
              </p>
              <div className="mt-5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#ddd] bg-white text-[11px] text-[#555]">
                <span className="w-3 h-3 rounded-full bg-[#4285F4] flex-shrink-0" />
                Google Review
              </div>
            </div>

            {/* RIGHT — TableReply's draft */}
            <div className="rounded-2xl border bg-[#FEF0E8] border-[#F5C9AD] border-l-4 border-l-[#E05A28] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#E05A28] mb-4 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                AI Reply · Generated in 4 seconds
              </p>
              <p className="text-[14px] leading-relaxed text-[#333]">
                &ldquo;Hi James, thank you for sharing this — and I&apos;m genuinely sorry your experience fell short. A 40-minute wait with a reservation and a lukewarm dish is not the standard we hold ourselves to. I&apos;d love the opportunity to make this right. Please reach out to us directly at [email] and I&apos;ll personally make sure your next visit is much better. — [Owner Name], [Restaurant Name]&rdquo;
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['✓ Sounds human', '✓ Takes accountability', '✓ Invites them back'].map((badge) => (
                  <span key={badge} className="px-2.5 py-1 rounded-full bg-[#E05A28]/10 border border-[#E05A28]/20 text-[11px] font-medium text-[#B34419]">
                    {badge}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[12px] text-[#888]">You review before posting. One click to copy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e5e5e0] py-5 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div
            ref={trustBarAnim.ref}
            className={`flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 transition-all duration-700 ${trustBarAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
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
        <div
          ref={problemAnim.ref}
          className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_110px_1fr] items-start gap-10 lg:gap-0"
        >

          {/* Left — The problem */}
          <div className={`lg:pr-10 transition-all duration-700 ${problemAnim.inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
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
              { val: stat1, suffix: '%', label: 'reviews unanswered' },
              { val: stat2, suffix: '%', label: 'guests read replies' },
              { val: stat3, suffix: '%', label: 'time saved' },
            ].map(({ val, suffix, label }, i) => (
              <div key={label} className="flex flex-col items-center">
                {i > 0 && <div className="w-px h-5 bg-[#e5e5e0]" />}
                <div className="flex flex-col items-center py-4 px-1">
                  <p className="font-bold text-[#E05A28] text-[20px] leading-none tabular-nums" style={{ letterSpacing: '-0.03em' }}>{val}{suffix}</p>
                  <p className="text-[#bbb] text-[10px] text-center mt-1 leading-tight" style={{ maxWidth: '65px' }}>{label}</p>
                </div>
              </div>
            ))}
            <div className="flex-1 w-px bg-[#e5e5e0]" />
          </div>

          {/* Right — The solution */}
          <div className={`lg:pl-10 transition-all duration-700 delay-200 ${problemAnim.inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
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
        <div ref={featuresAnim.ref} className="max-w-6xl mx-auto">

          {/* Header */}
          <div className={`text-center mb-12 transition-all duration-700 ${featuresAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E05A28] mb-3">Features</p>
            <h2
              className="font-bold text-[#111111]"
              style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', lineHeight: 1.12, letterSpacing: '-0.02em' }}
            >
              Everything you need to protect and grow your reputation
            </h2>
            <p className="mt-3 text-[15px] text-[#888] max-w-xl mx-auto leading-relaxed">
              One platform. Every tool an independent restaurant needs to stay ahead of reviews.
            </p>
          </div>

          {/* 3-col card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon, title, desc }, i) => (
              <div
                key={title}
                className="group bg-[#fafaf8] hover:bg-white border border-[#E4DED8] hover:border-[#D0C9C1] rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] hover:-translate-y-0.5"
                style={{
                  transitionDelay: featuresAnim.inView ? `${i * 45}ms` : '0ms',
                  opacity: featuresAnim.inView ? 1 : 0,
                  transform: featuresAnim.inView ? 'translateY(0)' : 'translateY(20px)',
                }}
              >
                <div className="w-9 h-9 rounded-xl bg-[#FEF0E8] border border-[#F5C9AD] flex items-center justify-center text-[#E05A28] mb-3 group-hover:scale-110 group-hover:bg-[#FCDCCA] transition-all duration-200">
                  {icon}
                </div>
                <p className="font-semibold text-[#111111] text-[13px] mb-1.5 tracking-tight">{title}</p>
                <p className="text-[13px] leading-relaxed text-[#6b6b6b]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-5 sm:px-6 bg-[#fafaf8] border-t border-[#e5e5e0]">
        <div className="max-w-6xl mx-auto">
          <div
            ref={howItWorksAnim.ref}
            className={`mb-12 text-center transition-all duration-600 ${howItWorksAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
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
            {/* Connector line (desktop only) — animates width */}
            <div
              className="hidden md:block absolute top-5 left-[calc(16.66%+18px)] right-[calc(16.66%+18px)] h-px bg-gradient-to-r from-[#E05A28]/30 via-[#E05A28]/50 to-[#E05A28]/30 origin-left transition-all duration-1000"
              style={{ transform: howItWorksAnim.inView ? 'scaleX(1)' : 'scaleX(0)', transitionDelay: '300ms' }}
            />

            {steps.map(({ num, title, desc }, i) => (
              <div
                key={num}
                className="flex flex-col items-center gap-4 px-6 py-7 sm:py-8 text-center transition-all duration-500"
                style={{
                  transitionDelay: howItWorksAnim.inView ? `${i * 120}ms` : '0ms',
                  opacity: howItWorksAnim.inView ? 1 : 0,
                  transform: howItWorksAnim.inView ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                }}
              >
                <div className="w-8 h-8 rounded-full bg-[#E05A28] text-white flex items-center justify-center flex-shrink-0 font-bold text-[14px] shadow-[0_4px_16px_rgba(224,90,40,0.35)] relative z-10 transition-transform duration-200 hover:scale-110">
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
          <div
            ref={testimonialsAnim.ref}
            className={`mb-14 text-center transition-all duration-700 ${testimonialsAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <p className="text-[#E05A28] text-xs font-semibold uppercase tracking-wider mb-3">What owners say</p>
            <h2
              className="font-bold text-white"
              style={{ fontSize: 'clamp(28px, 3.5vw, 36px)', lineHeight: 1.2, letterSpacing: '-0.02em' }}
            >
              Restaurant owners love it
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
            {testimonials.map(({ initials, name, role, restaurant, quote }, i) => (
              <div
                key={name}
                className="bg-[#111111] px-7 py-8 flex flex-col transition-all duration-600"
                style={{
                  transitionDelay: testimonialsAnim.inView ? `${i * 100}ms` : '0ms',
                  opacity: testimonialsAnim.inView ? 1 : 0,
                  transform: testimonialsAnim.inView ? 'translateY(0)' : 'translateY(24px)',
                }}
              >
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

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-5 sm:px-6 bg-white border-t border-[#e5e5e0]">
        <div
          ref={faqAnim.ref}
          className={`max-w-2xl mx-auto transition-all duration-700 ${faqAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E05A28] mb-3">FAQ</p>
            <h2 className="font-bold text-[#111111]" style={{ fontSize: 'clamp(22px, 3vw, 32px)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              Common questions
            </h2>
          </div>
          <div className="space-y-2">
            {faqs.map(({ q, a }, i) => (
              <div key={i} className="border border-[#E4DED8] rounded-xl overflow-hidden bg-white">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#fafaf8] transition-colors duration-150"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-[14px] font-semibold text-[#111] pr-4">{q}</span>
                  <span className="text-[#E05A28] flex-shrink-0 text-[20px] font-light leading-none w-5 text-center">
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 pt-1 border-t border-[#EDE9E4]">
                    <p className="text-[14px] text-[#555] leading-relaxed">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-[#fafaf8] border-t border-[#e5e5e0]">
        <div
          ref={pricingAnim.ref}
          className="max-w-6xl mx-auto flex flex-col items-center"
        >

          {/* Header */}
          <h2
            className={`font-bold text-[#111111] mb-3 text-center transition-all duration-700 ${pricingAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
            style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', lineHeight: 1.15, letterSpacing: '-0.02em' }}
          >
            One plan. Everything included.
          </h2>
          <p className={`text-center mb-10 transition-all duration-700 delay-100 ${pricingAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ fontSize: '16px', color: '#6b6b6b' }}>
            No caps. No tiers. No surprises.
          </p>

          {/* Toggle */}
          <div className={`flex items-center gap-1 p-1 rounded-full bg-[#e8e8e3] mb-10 transition-all duration-700 delay-150 ${pricingAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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
            className={`w-full rounded-2xl overflow-hidden transition-all duration-500 delay-200`}
            style={{
              maxWidth: '480px',
              background: '#111111',
              border: '1px solid rgba(224,90,40,0.35)',
              boxShadow: pricingAnim.inView ? '0 0 0 0 rgba(224,90,40,0)' : '0 0 0 0 rgba(224,90,40,0)',
              opacity: pricingAnim.inView ? 1 : 0,
              transform: pricingAnim.inView ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
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
                Google + Yelp + TripAdvisor auto-sync daily · cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ──────────────────────────────────────────────────── */}
      <section className="py-16 px-5 sm:px-6 bg-[#111111]">
        <div
          ref={ctaAnim.ref}
          className={`max-w-2xl mx-auto transition-all duration-700 ${ctaAnim.inView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.97]'}`}
        >
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
                No credit card. No setup fee. 7 days free — takes 2 minutes to configure.
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
              <p className="mt-2 text-white/50 text-[12px]">
                Not ready yet?{' '}
                <a href="#example" className="text-white/70 underline underline-offset-2 hover:text-white transition-colors duration-200">
                  See a real example first
                </a>
              </p>
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
              &copy; 2025 TableReply · Austin, TX
            </p>
            <p className="text-[12px] text-[#333]">Made with care for independent restaurants everywhere</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
