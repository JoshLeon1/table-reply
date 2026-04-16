'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SampleReview } from '@/lib/demo/industry-samples'

interface DemoClientProps {
  samples: SampleReview[]
  businessName: string
  userId: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DemoClient({ samples, businessName, userId }: DemoClientProps) {
  const router = useRouter()
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading')
  const [reply, setReply] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [copied, setCopied] = useState(false)

  // Showcase the glowing sample for the AI-reply demo; fall back to the
  // first item or a generic positive if the list is unexpectedly empty.
  const demo: SampleReview =
    samples.find((s) => s.scenario === 'glowing') ??
    samples[0] ?? {
      rating: 5,
      author: 'Alex P.',
      text: 'Fantastic experience start to finish. Will absolutely be back.',
      scenario: 'glowing',
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(reply)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const markSeenAndGo = async () => {
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ has_seen_demo: true } as never)
      .eq('id', userId)
    router.push('/dashboard')
  }

  const handleSkip = async () => {
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ has_seen_demo: true } as never)
      .eq('id', userId)
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl relative">

        {/* Skip link — never trap the user */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-[13px] text-text-2 hover:text-text-1 transition-colors px-3 py-2"
        >
          Skip demo →
        </button>

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
            We generated a reply for {businessName} using a sample review.
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
            <span className="text-[13px] font-semibold text-[#111]">{demo.author}</span>
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
          <button
            onClick={markSeenAndGo}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#111] hover:bg-[#2a2a2a] text-white text-[14px] font-semibold transition-all text-center"
          >
            Try it with a real review →
          </button>
        </div>

      </div>
    </div>
  )
}
