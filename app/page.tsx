'use client'

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
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Typing animation
  const [typedReview, setTypedReview] = useState('')
  const [typedReply, setTypedReply] = useState('')
  const [animPhase, setAnimPhase] = useState<'typing' | 'generating' | 'revealing'>('typing')

  useEffect(() => {
    const REVIEW = 'Wait time was long and staff seemed disinterested. Very disappointed.'
    const REPLY   = "We're truly sorry your experience didn't match our standards. We'd love to make this right — please reach out to us directly."
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
          t = setTimeout(() => { setAnimPhase('revealing'); revealWord() }, 2200)
        }, 350)
      }
    }
    function revealWord() {
      wordIdx++
      setTypedReply(WORDS.slice(0, wordIdx).join(' '))
      if (wordIdx < WORDS.length) t = setTimeout(revealWord, 65 + Math.random() * 30)
      else t = setTimeout(reset, 3000)
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
  const proofAnim        = useInView(0.08)
  const problemAnim      = useInView(0.08)
  const featuresAnim     = useInView(0.05)
  const howItWorksAnim   = useInView(0.08)
  const testimonialsAnim = useInView(0.05)
  const faqAnim          = useInView(0.08)
  const pricingAnim      = useInView(0.1)
  const ctaAnim          = useInView(0.15)

  // Stat counters
  const stat1 = useCounter(63, 1000, problemAnim.inView)
  const stat2 = useCounter(45, 1200, problemAnim.inView)
  const stat3 = useCounter(80, 1100, problemAnim.inView)

  const features = [
    {
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
      title: 'Google, Yelp & TripAdvisor Auto-Sync',
      desc: 'Reviews from all three sync to your dashboard every day — no manual work.',
    },
    {
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
      title: 'AI-Powered Replies',
      desc: "Crafted to match your business's voice, their tone, and the star rating.",
    },
    {
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      title: 'Deep Analytics',
      desc: 'Track rating trends, response rates, keywords, and monthly volume.',
    },
    {
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
      title: 'Keyword Alerts',
      desc: 'Instant email when a review mentions a specific issue, staff names, or anything you track.',
    },
    {
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      title: 'Staff Mention Tracking',
      desc: 'Surface every review that names a team member — catch praise and problems early.',
    },
    {
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
      title: 'Social Post Generator',
      desc: 'Turn 5-star reviews into polished Instagram, TikTok, and Facebook posts in one click.',
    },
    {
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>,
      title: 'Direct Platform Deep Links',
      desc: "Click 'Respond on Google/Yelp/TripAdvisor' and land directly on that specific review — no hunting through pages to find where to paste.",
    },
    {
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>,
      title: 'Multi-Language Replies',
      desc: 'Replies auto-match the language of the review — no configuration needed.',
    },
  ]

  const steps = [
    { num: '1', title: 'Connect your business', desc: 'Link your Google, Yelp, and TripAdvisor listings once. Takes under 2 minutes.' },
    { num: '2', title: 'Your reviews appear automatically', desc: 'ReplyFi pulls in your latest reviews every day — no manual work, no copy-pasting.' },
    { num: '3', title: 'Approve, Edit, Then Post With One Click', desc: "Review and edit the AI draft inline, then approve it. Tap 'Respond' to open that exact review on Google, Yelp, or TripAdvisor — copy, paste, done." },
  ]

  const testimonials = [
    {
      initials: 'SM', name: 'Dr. Sarah M.', role: 'Owner', business: 'Bright Smile Dental, Austin TX',
      quote: 'I used to dread opening Yelp on Monday mornings. Now I actually look forward to it. We went from responding to maybe 10% of reviews to every single one — patients notice.',
    },
    {
      initials: 'MT', name: 'Marcus T.', role: 'Owner', business: 'Crown & Blade, Denver CO',
      quote: 'The 1-star reply drafts alone are worth the subscription. I used to write something defensive and regret it every time. ReplyFi keeps it professional and my clients keep coming back.',
    },
    {
      initials: 'JR', name: 'Jen R.', role: 'Owner', business: 'Comfort Air Services, Portland OR',
      quote: 'Our rating went from 4.1 to 4.6 in three months. We attribute most of that to actually responding to every review now — customers trust a business that responds.',
    },
  ]

  const proFeatures = [
    'Unlimited AI replies',
    'Google + Yelp + TripAdvisor auto-sync',
    'Direct deep links to review platforms',
    'Inline reply editing before approving',
    'Keyword alerts',
    'Staff mention tracking',
    'Multi-language replies',
    'Social post generator',
    'Cancel anytime',
  ]

  const faqs = [
    { q: 'Do I approve replies before they get posted?', a: 'Yes, always. ReplyFi generates a draft — you review it, edit inline if needed, then approve it. Approved replies go to your Approved tab, where you copy and paste on the platform yourself. Nothing ever posts automatically.' },
    { q: 'Does this connect to Google, Yelp, and TripAdvisor automatically?', a: 'Yes — all three sync every day. Connect each platform once in Settings and reviews start appearing in your dashboard.' },
    { q: 'Will replies sound robotic or generic?', a: "No. You set your business name, owner name, and tone. Every reply is written specifically for that review — it won't sound like a template." },
    { q: 'How long does setup take?', a: "Under 5 minutes. Enter your business name, tone, and connect a platform. You can start generating replies right away." },
    { q: 'Can I edit the replies before I use them?', a: 'Absolutely. Every reply has an inline edit button right in the dashboard — make changes before you approve. Once approved, copy it and respond directly on the platform.' },
  ]

  return (
    <div className="text-[#111111]" style={{ fontFamily: 'Inter, sans-serif', background: '#fafaf8' }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e5e5e0]" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[7px] sm:rounded-[8px] bg-[#E05A28] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true">
                <path d="M2 1.5h9A1.5 1.5 0 0112.5 3v5A1.5 1.5 0 0111 9.5H7l-2 2v-2H2A1.5 1.5 0 01.5 8V3A1.5 1.5 0 012 1.5z" fill="white" fillOpacity="0.5"/>
                <path d="M8 8h9.5A1.5 1.5 0 0119 9.5v5A1.5 1.5 0 0117.5 16H16v2.5l-3-2.5H8A1.5 1.5 0 016.5 14.5v-5A1.5 1.5 0 018 8z" fill="white"/>
              </svg>
            </div>
            <span className="font-bold text-[15px] sm:text-[17px] tracking-[-0.025em] text-[#111111]">ReplyFi</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login" className="text-[13px] sm:text-sm font-medium text-[#6b6b6b] hover:text-[#111] transition-colors duration-200">
              Sign in
            </Link>
            <Link href="/signup" className="px-3.5 sm:px-4 py-2 bg-[#E05A28] hover:bg-[#C94E21] text-white text-[13px] sm:text-sm font-semibold rounded-lg transition-colors duration-200 whitespace-nowrap">
              Try Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#111111] pt-10 sm:pt-16 lg:pt-24 pb-10 sm:pb-16 lg:pb-20 px-4 sm:px-6 overflow-hidden relative">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 15% 50%, rgba(224,90,40,0.13) 0%, transparent 65%)' }} />

        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">

            {/* Left — text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E05A28]/10 border border-[#E05A28]/20 mb-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#E05A28] animate-pulse flex-shrink-0" />
                <span className="text-[#E05A28] text-[11px] sm:text-[12px] font-semibold tracking-wide">Built for local businesses</span>
              </div>

              <h1
                className="text-white mb-4 sm:mb-5 animate-fade-up"
                style={{ fontSize: 'clamp(30px, 6vw, 68px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', animationDelay: '160ms' }}
              >
                Reply to Every Review in Seconds—<span style={{ color: '#E05A28' }}>Without Losing Your Voice</span>.
              </h1>

              <p className="text-[#888] mb-7 animate-fade-up" style={{ fontSize: 'clamp(14px, 2vw, 16px)', lineHeight: '1.65', animationDelay: '260ms', maxWidth: '460px' }}>
                ReplyFi drafts personalized responses for any local business. Approve, copy, and post in under 30 seconds.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-up" style={{ animationDelay: '340ms' }}>
                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white text-[14px] font-bold rounded-xl transition-all duration-150 active:scale-[0.98] shadow-[0_4px_20px_rgba(224,90,40,0.35)]"
                >
                  Start Free 7-Day Trial
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </Link>
                <a
                  href="#how-it-works"
                  className="flex items-center justify-center px-6 py-3.5 border border-white/10 hover:border-white/25 text-white/60 hover:text-white text-[14px] font-medium rounded-xl transition-all duration-200"
                >
                  See How It Works
                </a>
              </div>

              {/* Trust signals */}
              <div className="flex items-center gap-4 sm:gap-5 flex-wrap animate-fade-up" style={{ animationDelay: '420ms' }}>
                {['7-day free trial', 'No credit card required', 'Cancel anytime'].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-[#E05A28] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                    <span className="text-white/60 text-[12px]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — product mockup */}
            <div className="flex justify-center items-center animate-fade-up" style={{ animationDelay: '300ms' }}>
              <div className="relative w-full max-w-[400px] mx-auto lg:mx-0">
                <div aria-hidden="true" className="absolute -inset-6 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(224,90,40,0.15) 0%, transparent 70%)' }} />
                <div className="absolute -bottom-2 left-4 right-4 h-full rounded-2xl bg-white/[0.03] border border-white/[0.05]" />

                <div className="relative bg-[#1A1A1A] rounded-2xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden lg:animate-float">
                  {/* Window chrome */}
                  <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                    <span className="ml-2 text-white/20 text-[11px]">ReplyFi — Pending Reviews</span>
                  </div>

                  <div className="p-4">
                    {/* Review 1 — static */}
                    <div className="mb-4 pb-4 border-b border-white/[0.06]">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#E05A28]/20 flex items-center justify-center text-[10px] font-bold text-[#E05A28] flex-shrink-0">SJ</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white text-[12px] font-semibold">Sarah Johnson</span>
                            <span className="text-white/20 text-[10px]">2h ago</span>
                          </div>
                          <div className="text-amber-400 text-[11px] mb-2">★★★★★</div>
                          <p className="text-white/50 text-[11px] leading-relaxed">"Best experience I've had. The team was so welcoming — truly special."</p>
                        </div>
                      </div>
                      <div className="mt-3 ml-9 bg-[#E05A28]/10 border border-[#E05A28]/20 rounded-xl p-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#E05A28] mb-1">Your reply</p>
                        <p className="text-white/65 text-[11px] leading-relaxed">Thank you so much, Sarah! Our team loves hearing this. We look forward to seeing you again! 🙏</p>
                      </div>
                      <div className="mt-2.5 ml-9 flex gap-1.5">
                        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E05A28] text-white text-[10px] font-semibold">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                          Approve Reply
                        </div>
                        <div className="px-2.5 py-1.5 rounded-lg border border-white/10 text-white/30 text-[10px]">Dismiss</div>
                      </div>
                    </div>

                    {/* Review 2 — animated */}
                    <div>
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/40 flex-shrink-0">DK</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white text-[12px] font-semibold">David K.</span>
                            <span className="text-white/20 text-[10px]">just now</span>
                          </div>
                          <div className="mb-2 text-[11px]">
                            <span className="text-amber-400/70">★</span>
                            <span className="text-white/15">★★★★</span>
                          </div>
                          <p className="text-white/50 text-[11px] leading-relaxed min-h-[28px]">
                            &ldquo;{typedReview}
                            {animPhase === 'typing' && <span className="inline-block w-px h-[0.85em] bg-white/40 ml-px align-text-bottom" style={{ animation: 'blink 0.8s step-end infinite' }} />}
                            {animPhase !== 'typing' && typedReview && '…"'}
                          </p>
                        </div>
                      </div>
                      {animPhase === 'generating' && (
                        <div className="mt-2.5 ml-9 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#E05A28]/10 border border-[#E05A28]/20 w-fit">
                          {[0,1,2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#E05A28]" style={{ animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                          <span className="text-[10px] text-[#E05A28]/80 ml-1">Generating…</span>
                        </div>
                      )}
                      {animPhase === 'revealing' && (
                        <div className="mt-2.5 ml-9 bg-[#E05A28]/10 border border-[#E05A28]/20 rounded-xl p-2.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-[#E05A28] mb-1">AI Reply</p>
                          <p className="text-white/65 text-[11px] leading-relaxed min-h-[2.5em]">
                            {typedReply}
                            <span className="inline-block w-px h-[0.85em] bg-[#E05A28]/60 ml-px align-text-bottom" style={{ animation: 'blink 0.8s step-end infinite' }} />
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
      <div className="bg-[#0D0D0D] border-b border-white/[0.06] py-3 overflow-hidden relative select-none">
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #0D0D0D, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #0D0D0D, transparent)' }} />
        <div className="flex" style={{ animation: 'marqueeScroll 28s linear infinite' }}>
          {[0, 1].map((set) => (
            <div key={set} className="flex items-center flex-shrink-0" aria-hidden={set === 1}>
              {['Dental Practices', 'Hair Salons', 'HVAC Companies', 'Auto Repair', 'Restaurants', 'Med Spas', 'Plumbers', 'Law Firms', 'Gyms & Studios', 'Veterinarians', 'Landscaping', 'Retail Shops'].map((item) => (
                <span key={item} className="flex items-center gap-4 sm:gap-5 px-5 sm:px-6 text-[11px] sm:text-[12px] font-medium text-white/30 whitespace-nowrap">
                  {item}<span className="w-1 h-1 rounded-full bg-white/15 flex-shrink-0" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── PROOF SECTION ────────────────────────────────────────────────── */}
      <section id="example" className="bg-white py-12 sm:py-16 px-4 sm:px-6 border-b border-[#e5e5e0]">
        <div
          ref={proofAnim.ref}
          className={`max-w-4xl mx-auto transition-all duration-700 ${proofAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E05A28] mb-2.5">Real Example</p>
            <h2 className="font-bold text-[#111111]" style={{ fontSize: 'clamp(22px, 3vw, 34px)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              See Exactly What You&apos;ll Get
            </h2>
            <p className="text-[14px] text-[#777] mt-2 max-w-sm mx-auto">A real 1-star review. The reply ReplyFi drafts in seconds.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
            {/* The review */}
            <div className="rounded-2xl border bg-[#FAFAFA] border-[#E4DED8] p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-amber-400 text-[13px]">★</span>
                <span className="text-[#ddd] text-[13px]">★★★★</span>
                <span className="text-[11px] text-[#999] ml-1">1-star · Google</span>
              </div>
              <p className="text-[13px] font-semibold text-[#111] mb-0.5">James T.</p>
              <p className="text-[12px] text-[#aaa] mb-3">3 days ago</p>
              <p className="text-[13px] sm:text-[14px] leading-relaxed text-[#444]">
                &ldquo;Honestly disappointed. Waited 40 minutes past my appointment and the staff barely acknowledged it. Won&apos;t be back.&rdquo;
              </p>
            </div>

            {/* ReplyFi's draft */}
            <div className="rounded-2xl border bg-[#FEF0E8] border-l-4 border-l-[#E05A28] border-[#F5C9AD] p-5 sm:p-6">
              <div className="flex items-center gap-1.5 mb-3">
                <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#E05A28]">AI Reply · 4 seconds</p>
              </div>
              <p className="text-[13px] sm:text-[14px] leading-relaxed text-[#333]">
                &ldquo;Hi James, thank you for sharing this — I&apos;m genuinely sorry your experience fell short. A 40-minute wait past your appointment is not our standard. I&apos;d love to make this right. Please reach out directly and I&apos;ll personally ensure your next visit is much better. — [Owner Name]&rdquo;
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['✓ Sounds human', '✓ Takes accountability', '✓ Invites them back'].map((badge) => (
                  <span key={badge} className="px-2.5 py-1 rounded-full bg-[#E05A28]/10 border border-[#E05A28]/20 text-[11px] font-medium text-[#B34419]">{badge}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section className="bg-[#111] py-8 sm:py-10 px-4 sm:px-6">
        <div ref={problemAnim.ref} className="max-w-3xl mx-auto">
          <div className={`grid grid-cols-3 gap-4 transition-all duration-700 ${problemAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            {[
              { val: stat1, suffix: '%', label: 'of reviews go unanswered' },
              { val: stat2, suffix: '%', label: 'of reviewers read replies' },
              { val: stat3, suffix: '%', label: 'less time per reply' },
            ].map(({ val, suffix, label }, i) => (
              <div key={label} className="flex flex-col items-center text-center" style={{ transitionDelay: `${i * 80}ms` }}>
                <p className="font-bold text-[#E05A28] tabular-nums mb-1" style={{ fontSize: 'clamp(28px, 6vw, 44px)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {val}{suffix}
                </p>
                <p className="text-white/35 text-[10px] sm:text-[11px] leading-snug max-w-[80px]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM / SOLUTION ───────────────────────────────────────────── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 border-t border-[#e5e5e0]" style={{ background: '#0A0A0A' }}>
        <div ref={problemAnim.ref} className="max-w-5xl mx-auto">

          {/* Section label */}
          <div className={`text-center mb-10 transition-all duration-700 ${problemAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35 mb-2">The Reality</p>
            <h2 className="font-bold text-white" style={{ fontSize: 'clamp(22px, 3vw, 32px)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              Most owners want to reply. Few actually do.
            </h2>
          </div>

          {/* Before / After comparison */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-700 ${problemAnim.inView ? 'opacity-100' : 'opacity-0'}`}>

            {/* Before — problem */}
            <div className={`rounded-2xl border border-red-900/30 bg-red-950/20 p-6 transition-all duration-700 ${problemAnim.inView ? 'translate-x-0' : '-translate-x-6'}`}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-6 h-6 rounded-full bg-red-900/50 border border-red-800/40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-red-400">Without ReplyFi</span>
              </div>
              <ul className="space-y-3.5">
                {[
                  'Reviews sit unanswered for weeks',
                  'You log in, stare at the screen, log out',
                  'Negative reviews go ignored — damage compounds',
                  'Copy-paste the same generic reply to everyone',
                  'Competitors who reply get more bookings than you',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-white/50 leading-snug">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 flex-shrink-0 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* After — solution */}
            <div className={`rounded-2xl border border-emerald-900/30 bg-emerald-950/20 p-6 transition-all duration-700 delay-150 ${problemAnim.inView ? 'translate-x-0' : 'translate-x-6'}`}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-6 h-6 rounded-full bg-emerald-900/50 border border-emerald-800/40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-emerald-400">With ReplyFi</span>
              </div>
              <ul className="space-y-3.5">
                {[
                  'Reviews are waiting with AI drafts every morning',
                  'Approve, copy, paste — under 30 seconds per review',
                  'Deep link drops you right on the review to post',
                  'Each reply sounds personal, not templated',
                  'Higher response rate → more trust → more customers',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-white/70 leading-snug">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-20 py-12 sm:py-20 px-4 sm:px-6 bg-white border-t border-[#e5e5e0]">
        <div className="max-w-4xl mx-auto">
          <div
            ref={howItWorksAnim.ref}
            className={`mb-10 text-center transition-all duration-600 ${howItWorksAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E05A28] mb-2.5">How It Works</p>
            <h2 className="font-bold text-[#111111]" style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              Set Up Once. Replies Ready Every Morning.
            </h2>
            <p className="text-[14px] text-[#777] mt-3 max-w-md mx-auto leading-relaxed">
              ReplyFi syncs your reviews automatically — you just approve, edit, and post.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {steps.map(({ num, title, desc }, i) => (
              <div
                key={num}
                className="relative flex sm:flex-col items-start gap-4 sm:gap-4 p-5 sm:p-6 rounded-2xl bg-[#fafaf8] border border-[#E4DED8] transition-all duration-500 hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] hover:-translate-y-0.5"
                style={{
                  transitionDelay: howItWorksAnim.inView ? `${i * 100}ms` : '0ms',
                  opacity: howItWorksAnim.inView ? 1 : 0,
                  transform: howItWorksAnim.inView ? 'translateY(0)' : 'translateY(16px)',
                }}
              >
                {/* Connector line between cards on desktop */}
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-[38px] left-full w-full h-px z-10" style={{ width: 'calc(100% - 100%)' }}>
                  </div>
                )}
                <div className="w-10 h-10 rounded-xl bg-[#E05A28] text-white flex items-center justify-center flex-shrink-0 font-bold text-[15px] shadow-[0_4px_14px_rgba(224,90,40,0.30)]">
                  {num}
                </div>
                <div>
                  <h3 className="font-semibold text-[#111111] text-[14px] sm:text-[15px] mb-1.5 tracking-tight">{title}</h3>
                  <p className="text-[13px] leading-relaxed text-[#666]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE BENEFITS ────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-[#fafaf8] border-t border-[#e5e5e0]">
        <div ref={featuresAnim.ref} className="max-w-5xl mx-auto">
          <div className={`text-center mb-8 sm:mb-12 transition-all duration-700 ${featuresAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E05A28] mb-2.5">Why It Works</p>
            <h2 className="font-bold text-[#111111]" style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', lineHeight: 1.12, letterSpacing: '-0.02em' }}>
              Everything You Need to Handle Reviews—Without the Work
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                num: '01',
                title: 'Replies That Feel Personal—Every Time',
                desc: "Set your tone once. Every reply sounds like it came from you—whether you're warm, professional, or straight to the point. Guests won't know it's AI.",
                tagline: 'Build stronger relationships with every guest',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                ),
                color: '#E05A28',
                bg: '#FEF0E8',
                border: '#F5C9AD',
              },
              {
                num: '02',
                title: 'All Your Reviews. One Place. Zero Effort.',
                desc: 'Google, Yelp, and TripAdvisor reviews show up automatically. No tabs. No logging in. No chasing reviews.',
                tagline: 'Never miss a review again',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                ),
                color: '#0070F3',
                bg: '#EBF4FF',
                border: '#BFDBFE',
              },
              {
                num: '03',
                title: 'Go From Review to Response in Seconds',
                desc: 'Generate, edit, and post instantly. One click and you\'re live on Google, Yelp, or TripAdvisor.',
                tagline: 'Save hours every week',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                ),
                color: '#059669',
                bg: '#ECFDF5',
                border: '#A7F3D0',
              },
            ].map(({ num, title, desc, tagline, icon, color, bg, border }, i) => (
              <div
                key={num}
                className="bg-white border border-[#E4DED8] rounded-2xl p-6 sm:p-7 flex flex-col transition-all duration-500 hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] hover:-translate-y-0.5"
                style={{
                  transitionDelay: featuresAnim.inView ? `${i * 80}ms` : '0ms',
                  opacity: featuresAnim.inView ? 1 : 0,
                  transform: featuresAnim.inView ? 'translateY(0)' : 'translateY(20px)',
                }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg, border: `1px solid ${border}`, color }}>
                    {icon}
                  </div>
                  <span className="font-bold tabular-nums" style={{ fontSize: '13px', color: '#E4DED8', letterSpacing: '-0.02em' }}>{num}</span>
                </div>
                <h3 className="font-bold text-[#111111] text-[16px] sm:text-[17px] mb-2.5 leading-snug tracking-tight">{title}</h3>
                <p className="text-[13px] sm:text-[14px] leading-relaxed text-[#666] flex-1">{desc}</p>
                <p className="mt-4 pt-4 border-t border-[#F0EBE5] text-[12px] font-semibold text-[#111]" style={{ color }}>{tagline}</p>
              </div>
            ))}
          </div>

          {/* Analytics bonus strip */}
          <div className={`mt-8 sm:mt-10 rounded-2xl border border-[#E4DED8] bg-white overflow-hidden transition-all duration-700 delay-300 ${featuresAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-[#EDE9E4]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#A8A29E]">Included in every plan</span>
              </div>
              <h3 className="font-bold text-[#111] text-[16px] sm:text-[18px] tracking-tight">Built-In Insights That Actually Help You Improve</h3>
              <p className="text-[13px] text-[#777] mt-1 leading-relaxed">Track trends in ratings, complaints, and response performance automatically.</p>
            </div>
            <div className="px-5 sm:px-7 py-4 sm:py-5">
              <div className="flex flex-col gap-y-2.5 sm:flex-row sm:flex-wrap sm:gap-x-5">
                {[
                  'Rating trends over time',
                  'Complaint and keyword tracking',
                  'Response performance metrics',
                  'Keyword alerts',
                  'Staff mention tracking',
                  'Multi-language replies',
                  'Social content generator',
                  'Direct platform deep links',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-[#E05A28] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                    <span className="text-[12px] sm:text-[13px] text-[#777]">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Social proof bar */}
          <div className={`mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 px-5 sm:px-7 py-4 rounded-2xl bg-[#F3F0EC] border border-[#E4DED8] transition-all duration-700 delay-400 ${featuresAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-[13px] font-semibold text-[#57534E]">Trusted by 200+ local businesses</p>
            <p className="text-[12px] text-[#78716C] italic text-center sm:text-right">&ldquo;We went from ignoring reviews to replying to every single one.&rdquo; &mdash; Restaurant Owner</p>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-20 overflow-hidden" style={{ background: '#111111' }}>
        <div className="max-w-6xl mx-auto">
          <div
            ref={testimonialsAnim.ref}
            className={`mb-8 sm:mb-12 text-center px-4 sm:px-6 transition-all duration-700 ${testimonialsAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <p className="text-[#E05A28] text-[11px] font-semibold uppercase tracking-wider mb-2.5">What Owners Say</p>
            <h2 className="font-bold text-white" style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              Local Business Owners Love It
            </h2>
          </div>

          {/* Mobile: horizontal snap scroll. Desktop: grid */}
          <div className="flex sm:grid sm:grid-cols-3 overflow-x-auto sm:overflow-visible gap-3 sm:gap-0 px-4 sm:px-6 pb-5 sm:pb-0 snap-x snap-mandatory sm:snap-none sm:rounded-2xl sm:overflow-hidden scroll-smooth"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {testimonials.map(({ initials, name, role, business, quote }, i) => (
              <div
                key={name}
                className="bg-[#161616] sm:bg-[#181818] rounded-2xl sm:rounded-none border border-white/[0.07] sm:border-0 sm:border-r px-5 sm:px-7 py-6 sm:py-8 flex flex-col flex-shrink-0 w-[82vw] sm:w-auto snap-center transition-all duration-600"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  transitionDelay: testimonialsAnim.inView ? `${i * 100}ms` : '0ms',
                  opacity: testimonialsAnim.inView ? 1 : 0,
                  transform: testimonialsAnim.inView ? 'translateY(0)' : 'translateY(20px)',
                }}
              >
                <div className="text-amber-400 text-[12px] mb-4">★★★★★</div>
                <p className="text-white/75 text-[14px] sm:text-[15px] leading-[1.7] flex-1 mb-5">{quote}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/[0.07]">
                  <div className="w-9 h-9 rounded-full bg-[#E05A28]/15 border border-[#E05A28]/20 flex items-center justify-center text-[11px] font-bold text-[#E05A28] flex-shrink-0">{initials}</div>
                  <div>
                    <p className="font-semibold text-white text-[13px]">{name}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{role} · {business}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-white border-t border-[#e5e5e0]">
        <div
          ref={faqAnim.ref}
          className={`max-w-2xl mx-auto transition-all duration-700 ${faqAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <div className="text-center mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E05A28] mb-2.5">FAQ</p>
            <h2 className="font-bold text-[#111111]" style={{ fontSize: 'clamp(20px, 3vw, 30px)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Common Questions</h2>
          </div>
          <div className="space-y-2">
            {faqs.map(({ q, a }, i) => (
              <div key={i} className="border border-[#E4DED8] rounded-xl overflow-hidden bg-white">
                <button
                  className="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left hover:bg-[#fafaf8] transition-colors duration-150 gap-3"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-[13px] sm:text-[14px] font-semibold text-[#111]">{q}</span>
                  <span className={`text-[#E05A28] flex-shrink-0 text-[18px] font-light leading-none w-5 text-center transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-[#EDE9E4]">
                    <p className="text-[13px] sm:text-[14px] text-[#555] leading-relaxed">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-12 sm:py-20 px-4 sm:px-6 bg-[#fafaf8] border-t border-[#e5e5e0]">
        <div ref={pricingAnim.ref} className="max-w-md mx-auto flex flex-col items-center">
          <h2
            className={`font-bold text-[#111111] mb-2 text-center transition-all duration-700 ${pricingAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
            style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', lineHeight: 1.15, letterSpacing: '-0.02em' }}
          >
            One plan. Everything included.
          </h2>
          <p className={`text-center mb-8 text-[15px] text-[#777] transition-all duration-700 delay-75 ${pricingAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            No caps. No tiers. No surprises.
          </p>

          {/* Toggle */}
          <div className={`flex items-center gap-1 p-1 rounded-full bg-[#e8e8e3] mb-8 transition-all duration-700 delay-100 ${pricingAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button onClick={() => setAnnual(false)} className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${!annual ? 'bg-white text-[#111111] shadow-sm' : 'text-[#6b6b6b]'}`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={`flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${annual ? 'bg-white text-[#111111] shadow-sm' : 'text-[#6b6b6b]'}`}>
              Annual
              <span className="px-1.5 py-0.5 rounded-full bg-[#E05A28] text-white text-[10px] font-bold leading-none">SAVE 31%</span>
            </button>
          </div>

          {/* Card */}
          <div
            className={`w-full rounded-2xl overflow-hidden transition-all duration-500 delay-150 ${pricingAnim.inView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-[0.97]'}`}
            style={{ background: '#111111', border: '1px solid rgba(224,90,40,0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
          >
            <div className="flex justify-center pt-6 pb-0">
              <span className="px-3 py-1 rounded-full bg-[#E05A28]/20 text-[#E05A28] text-[10px] font-bold uppercase tracking-[0.12em]">7-day free trial</span>
            </div>
            <div className="px-6 sm:px-8 pt-4 pb-7">
              <p className="text-center text-white font-bold text-[17px] mb-4 tracking-tight">ReplyFi Pro</p>
              <div className="flex items-end justify-center gap-1 mb-1.5">
                <span className="font-bold text-white leading-none transition-all duration-300" style={{ fontSize: 'clamp(56px, 12vw, 76px)', letterSpacing: '-0.04em' }}>
                  ${annual ? '239' : '29'}
                </span>
                <span className="text-[#9a9a9a] text-lg pb-2">{annual ? '/yr' : '/mo'}</span>
              </div>
              {annual
                ? <p className="text-center text-[#E05A28] text-[13px] mb-1">Under $20/mo — save $109 vs monthly</p>
                : null
              }
              <p className="text-center text-white/55 text-[13px] mb-4">7-day free trial — no credit card required.</p>
              <div className="h-px bg-[#E05A28]/20 mb-5" />
              <ul className="space-y-3 mb-7">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-[#E05A28] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="text-[13px] sm:text-[14px] text-[#d4d4d4]">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={annual ? '/signup?plan=annual' : '/signup'}
                className="block w-full text-center font-bold text-white bg-[#E05A28] hover:bg-[#C94E21] rounded-xl transition-colors duration-200 py-3.5 sm:py-4 text-[15px]"
              >
                Start Free 7-Day Trial →
              </Link>
              <p className="text-center mt-3 text-white/50 text-[12px]">7-day free trial · no credit card required · cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#0D0D0D] border-t border-white/[0.06] py-6 sm:py-8 px-4 sm:px-6">
        <div
          ref={ctaAnim.ref}
          className={`max-w-4xl mx-auto transition-all duration-700 ${ctaAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-10">

            {/* Left — text */}
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E05A28] animate-pulse flex-shrink-0" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">500+ local businesses</span>
              </div>
              <h2 className="font-bold text-white mb-1.5" style={{ fontSize: 'clamp(20px, 3vw, 28px)', lineHeight: 1.2, letterSpacing: '-0.025em' }}>
                Start replying to every review today.
              </h2>
              <p className="text-white/65 text-[13px]">7-day free trial — no credit card required</p>
            </div>

            {/* Right — CTA */}
            <div className="flex flex-col items-center sm:items-end gap-3 flex-shrink-0">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-[14px] text-white transition-all duration-200 active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg, #E05A28 0%, #C44A1E 100%)', boxShadow: '0 4px 16px rgba(224,90,40,0.35), inset 0 1px 0 rgba(255,255,255,0.12)' }}
              >
                Start Free 7-Day Trial
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                </svg>
              </Link>
              <div className="flex items-center gap-3">
                {['Google', 'Yelp', 'TripAdvisor'].map((p) => (
                  <span key={p} className="text-[10px] text-white/25 font-medium">{p}</span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#111111] border-t border-[#1E1E1E] py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 sm:gap-8 mb-5 sm:mb-6">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-[7px] bg-[#E05A28] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 20 20" fill="none" className="w-[17px] h-[17px]" aria-hidden="true">
                    <path d="M2 1.5h9A1.5 1.5 0 0112.5 3v5A1.5 1.5 0 0111 9.5H7l-2 2v-2H2A1.5 1.5 0 01.5 8V3A1.5 1.5 0 012 1.5z" fill="white" fillOpacity="0.5"/>
                    <path d="M8 8h9.5A1.5 1.5 0 0119 9.5v5A1.5 1.5 0 0117.5 16H16v2.5l-3-2.5H8A1.5 1.5 0 016.5 14.5v-5A1.5 1.5 0 018 8z" fill="white"/>
                  </svg>
                </div>
                <span className="font-bold text-white text-[15px] tracking-[-0.02em]">ReplyFi</span>
              </div>
              <p className="text-[12px] sm:text-[13px] text-[#555] leading-relaxed">AI-powered review replies for local businesses.</p>
            </div>

            {/* Product */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#444] mb-2.5">Product</p>
              <ul className="space-y-2">
                {[{ label: 'Features', href: '#how-it-works' }, { label: 'Pricing', href: '#pricing' }, { label: 'Sign In', href: '/login' }, { label: 'Start Free', href: '/signup' }].map(({ label, href }) => (
                  <li key={label}><Link href={href} className="text-[13px] text-[#555] hover:text-white transition-colors duration-200">{label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#444] mb-2.5">Legal</p>
              <ul className="space-y-2">
                {[{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Contact', href: '/contact' }].map(({ label, href }) => (
                  <li key={label}><Link href={href} className="text-[13px] text-[#555] hover:text-white transition-colors duration-200">{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-[#1E1E1E] pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <p className="text-[12px] text-[#444]">© 2026 ReplyFi · Austin, TX</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
