'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import MarketingNav from '@/components/MarketingNav'

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

export default function LandingPage() {
  const [annual, setAnnual] = useState(false)

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
  const howItWorksAnim = useInView(0.08)
  const pricingAnim    = useInView(0.1)
  const faqAnim        = useInView(0.08)
  const ctaAnim        = useInView(0.15)

  const faqs = [
    {
      q: 'Will the AI actually sound like me?',
      a: 'Yes. ReplyFi learns your tone from the replies you approve. By week two, most owners say they can\'t tell which replies they wrote and which ones the AI drafted.',
    },
    {
      q: 'How do replies get to Google?',
      a: 'When you approve a reply, ReplyFi copies it to your clipboard and opens your Google reviews page in a new tab — one click to paste and you\'re done. Same flow for Yelp. (Fully automated posting is on the way once Google approves our Business Profile API access.)',
    },
    {
      q: 'Which review platforms are supported?',
      a: 'Google and Yelp today. We pull in new reviews daily and draft replies for all of them in one inbox.',
    },
    {
      q: 'What about bad or unfair reviews?',
      a: 'Low-star and keyword-flagged reviews get highlighted with an alert so you never miss them. The AI drafts a professional, empathetic response — you can edit inline before approving.',
    },
    {
      q: 'How is this different from the reply tool my platform already has?',
      a: 'Google and Yelp give you a blank box. ReplyFi gives you a draft that sounds like you, for every review across every platform, ready the moment you open your laptop.',
    },
    {
      q: 'Do I need a credit card to start?',
      a: 'No. The 7-day free trial is genuinely free — no card on file. If you don\'t love it, walk away and nothing happens.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes. One click in your dashboard. No phone calls, no retention gauntlet.',
    },
  ]

  const steps = [
    { num: '1', title: 'Connect your listings once', desc: 'Add your Google and Yelp pages in under 2 minutes. We take it from there.' },
    { num: '2', title: 'Reviews appear automatically', desc: 'ReplyFi pulls in new reviews every day — no manual work.' },
    { num: '3', title: 'Approve, copy, paste', desc: 'Edit inline if you want, hit approve, and we copy your reply + open Google. One paste and it\'s live.' },
  ]

  const proFeatures = [
    'Unlimited AI replies',
    'Google + Yelp auto-sync',
    'One-click copy + open Google to paste',
    'Inline reply editing before approving',
    'Keyword alerts + staff mention tracking',
    'Autopilot mode for hands-free replies',
    'Cancel anytime',
  ]

  return (
    <div className="text-[#111111]" style={{ fontFamily: 'Inter, sans-serif', background: '#fafaf8' }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <MarketingNav right="cta" />

      <main id="main">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#111111] pt-10 sm:pt-16 lg:pt-24 pb-14 sm:pb-16 lg:pb-20 px-4 sm:px-6 overflow-hidden relative">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 15% 50%, rgba(224,90,40,0.13) 0%, transparent 65%)' }} />

        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">

            {/* Left — text */}
            <div>
              <div className="inline-flex items-center gap-2 mb-7 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <span className="w-1 h-1 rounded-full bg-[#E05A28] flex-shrink-0" />
                <span className="text-white/55 text-[11px] font-medium tracking-[0.08em] uppercase">Built for local businesses</span>
              </div>

              <h1
                className="text-white mb-5 sm:mb-6 animate-fade-up"
                style={{ fontSize: 'clamp(34px, 6.2vw, 72px)', fontWeight: 600, lineHeight: 1.02, letterSpacing: '-0.035em', animationDelay: '160ms' }}
              >
                Reply to every review<br className="hidden sm:block" /> in seconds,{' '}
                <span className="text-white/55">without losing your voice.</span>
              </h1>

              <p className="text-white/55 mb-8 animate-fade-up" style={{ fontSize: 'clamp(15px, 1.6vw, 17px)', lineHeight: '1.55', animationDelay: '260ms', maxWidth: '480px' }}>
                AI drafts a personal reply to every review. Approve, and we copy it + open Google for you — one paste and you&apos;re done.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-2.5 mb-6 animate-fade-up" style={{ animationDelay: '340ms' }}>
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 px-5 h-11 bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white text-[14px] font-semibold rounded-lg transition-colors duration-150 shadow-[0_1px_2px_rgba(224,90,40,0.25),0_8px_24px_rgba(224,90,40,0.20)]"
                >
                  Start 7-day free trial
                  <svg className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-5 h-11 text-white/70 hover:text-white text-[14px] font-medium rounded-lg transition-colors duration-150"
                >
                  See how it works →
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

                <div className="relative bg-[#1A1A1A] rounded-2xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
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
                      <div className="mt-2.5 ml-9 flex gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                          Copied & opened
                        </div>
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
                          <p className="text-white/50 text-[11px] leading-relaxed" style={{ minHeight: '2.25rem' }}>
                            &ldquo;{typedReview}
                            {animPhase === 'typing' && <span className="inline-block w-px h-[0.85em] bg-white/40 ml-px align-text-bottom" style={{ animation: 'blink 0.8s step-end infinite' }} />}
                            {animPhase !== 'typing' && typedReview && '…"'}
                          </p>
                        </div>
                      </div>
                      {/* Fixed-height container so animating content never shifts layout */}
                      <div style={{ minHeight: '96px' }}>
                        {animPhase === 'generating' && (
                          <div className="mt-2.5 ml-9 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#E05A28]/10 border border-[#E05A28]/20 w-fit">
                            {[0,1,2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#E05A28]" style={{ animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                            <span className="text-[10px] text-[#E05A28]/80 ml-1">Generating…</span>
                          </div>
                        )}
                        {animPhase === 'revealing' && (
                          <div className="mt-2.5 ml-9 bg-[#E05A28]/10 border border-[#E05A28]/20 rounded-xl p-2.5">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#E05A28] mb-1">AI Reply</p>
                            <p className="text-white/65 text-[11px] leading-relaxed" style={{ minHeight: '3.5rem' }}>
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
        </div>
      </section>

      {/* ── INDUSTRIES STRIP — infinite marquee ─────────────────────────── */}
      <div className="bg-[#0D0D0D] border-y border-white/[0.06] py-6 sm:py-5 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/35 whitespace-nowrap flex-shrink-0">
            Trusted by local businesses in
          </p>

          {/* Marquee viewport with edge fades */}
          <div
            className="relative flex-1 w-full overflow-hidden"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 48px, #000 calc(100% - 48px), transparent 100%)',
              maskImage:       'linear-gradient(to right, transparent 0, #000 48px, #000 calc(100% - 48px), transparent 100%)',
            }}
          >
            <div className="flex gap-0 animate-industry-scroll whitespace-nowrap will-change-transform">
              {/* Render the list twice for seamless loop */}
              {[0, 1].map((dup) => (
                <div key={dup} className="flex items-center shrink-0" aria-hidden={dup === 1}>
                  {[
                    'Dental', 'Salons', 'HVAC', 'Restaurants', 'Med Spas', 'Law Firms', 'Veterinary',
                    'Auto Repair', 'Chiropractors', 'Cafés', 'Barbershops', 'Plumbing',
                    'Real Estate', 'Fitness Studios', 'Dermatology', 'Pet Grooming',
                    'Landscaping', 'Spas', 'Accounting', 'Orthodontics', 'Roofing',
                    'Dog Training', 'Optometry', 'Tattoo Studios', 'Nail Salons',
                  ].map((label) => (
                    <span key={`${dup}-${label}`} className="flex items-center">
                      <span className="text-[12px] sm:text-[13px] text-white/55 font-medium px-3 sm:px-4">
                        {label}
                      </span>
                      <span className="text-white/20 text-[10px]" aria-hidden="true">·</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-20 px-4 sm:px-6 bg-white border-t border-[#e5e5e0]">
        <div className="max-w-4xl mx-auto">
          <div
            ref={howItWorksAnim.ref}
            className={`mb-10 text-center transition-all duration-600 ${howItWorksAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A8A29E] mb-3">How It Works</p>
            <h2 className="text-[#111111]" style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.025em', fontWeight: 500 }}>
              Set up once. Replies ready every morning.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {steps.map(({ num, title, desc }, i) => (
              <div
                key={num}
                className="relative flex sm:flex-col items-start gap-4 sm:gap-4 p-5 sm:p-6 rounded-2xl bg-white border border-border shadow-card transition-all duration-500 hover:shadow-card-hover hover:-translate-y-0.5"
                style={{
                  transitionDelay: howItWorksAnim.inView ? `${i * 100}ms` : '0ms',
                  opacity: howItWorksAnim.inView ? 1 : 0,
                  transform: howItWorksAnim.inView ? 'translateY(0)' : 'translateY(16px)',
                }}
              >
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

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-20 px-4 sm:px-6 bg-[#fafaf8] border-t border-[#e5e5e0]">
        <div ref={pricingAnim.ref} className="max-w-md mx-auto flex flex-col items-center">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A8A29E] mb-3 transition-all duration-700 ${pricingAnim.inView ? 'opacity-100' : 'opacity-0'}`}>Pricing</p>
          <h2
            className={`text-[#111111] mb-3 text-center transition-all duration-700 ${pricingAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
            style={{ fontSize: 'clamp(28px, 4vw, 46px)', lineHeight: 1.05, letterSpacing: '-0.025em', fontWeight: 500 }}
          >
            Simple pricing. No surprises.
          </h2>

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

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-20 py-16 sm:py-20 px-4 sm:px-6 bg-white border-t border-[#e5e5e0]">
        <div ref={faqAnim.ref} className="max-w-2xl mx-auto">
          <div className={`mb-10 text-center transition-all duration-700 ${faqAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A8A29E] mb-3">FAQ</p>
            <h2 className="text-[#111111]" style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.025em', fontWeight: 500 }}>
              Questions, answered.
            </h2>
          </div>

          <div className="divide-y divide-[#e5e5e0] border-y border-[#e5e5e0]">
            {faqs.map(({ q, a }, i) => (
              <details
                key={q}
                className="group"
                style={{
                  transitionDelay: faqAnim.inView ? `${i * 50}ms` : '0ms',
                  opacity: faqAnim.inView ? 1 : 0,
                  transform: faqAnim.inView ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 500ms ease, transform 500ms ease',
                }}
              >
                <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none select-none">
                  <span className="text-[#111111] text-[15px] sm:text-[16px] font-medium tracking-tight pr-2">{q}</span>
                  <span className="flex-shrink-0 w-7 h-7 rounded-full border border-[#e5e5e0] flex items-center justify-center transition-all duration-200 group-open:bg-[#E05A28] group-open:border-[#E05A28]">
                    <svg className="w-3.5 h-3.5 text-[#666] transition-all duration-200 group-open:rotate-180 group-open:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="pb-5 pr-10 text-[14px] leading-relaxed text-[#555]">{a}</p>
              </details>
            ))}
          </div>

          <p className="text-center text-[13px] text-[#666] mt-8">
            Still have questions?{' '}
            <Link href="/contact" className="text-[#E05A28] font-medium hover:underline">Get in touch</Link>
          </p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#0D0D0D] border-t border-white/[0.06] py-12 sm:py-14 px-4 sm:px-6 relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(224,90,40,0.10) 0%, transparent 70%)' }} />
        <div
          ref={ctaAnim.ref}
          className={`max-w-4xl mx-auto relative transition-all duration-700 ${ctaAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-10">

            {/* Left — text */}
            <div className="text-center sm:text-left">
              <h2 className="text-white mb-2" style={{ fontSize: 'clamp(24px, 3vw, 32px)', lineHeight: 1.12, letterSpacing: '-0.025em', fontWeight: 500 }}>
                Start replying to every review today.
              </h2>
              <p className="text-white/65 text-[13px]">7-day free trial, no card required.</p>
            </div>

            {/* Right — CTA */}
            <div className="flex flex-col items-center sm:items-end gap-3 flex-shrink-0 w-full sm:w-auto">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-6 py-4 sm:py-3.5 rounded-xl font-bold text-[14px] text-white transition-all duration-200 active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg, #E05A28 0%, #C44A1E 100%)', boxShadow: '0 4px 16px rgba(224,90,40,0.35), inset 0 1px 0 rgba(255,255,255,0.12)' }}
              >
                Start Free 7-Day Trial
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>

          </div>
        </div>
      </section>

      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#111111] border-t border-[#1E1E1E] py-7 sm:py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Mobile: brand on top row, Product/Legal side-by-side below. Desktop: 3 equal columns. */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 sm:gap-8 mb-5 sm:mb-6">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-2">
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#444] mb-2">Product</p>
              <ul className="space-y-1.5">
                {[{ label: 'Features', href: '#how-it-works' }, { label: 'Pricing', href: '#pricing' }, { label: 'FAQ', href: '#faq' }, { label: 'Blog', href: '/blog' }, { label: 'Sign In', href: '/login' }, { label: 'Start Free', href: '/signup' }].map(({ label, href }) => (
                  <li key={label}><Link href={href} className="text-[13px] text-[#555] hover:text-white transition-colors duration-200">{label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#444] mb-2">Legal</p>
              <ul className="space-y-1.5">
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
