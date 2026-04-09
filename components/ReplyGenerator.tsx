'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import StarRating from './StarRating'
import CopyButton from './CopyButton'

interface ReplyGeneratorProps {
  isPaid: boolean
  onUpgrade: () => void
  initialReview?: string
  initialRating?: number
  /** Passes a trigger function up so parent can fire generate via keyboard shortcut */
  onGenerateTriggerRef?: (fn: () => void) => void
}

const platforms = ['Google', 'Yelp', 'TripAdvisor', 'OpenTable', 'Facebook', 'Other']

type Tone = 'warmer' | 'more-professional' | 'more-concise'

const TONES: { value: Tone; label: string }[] = [
  { value: 'warmer', label: 'Warmer' },
  { value: 'more-professional', label: 'More professional' },
  { value: 'more-concise', label: 'More concise' },
]

const PLATFORM_TIPS: Record<string, string> = {
  Google: 'Google replies appear publicly — keep it professional and inviting.',
  Yelp: 'Yelp replies are highly visible — address specifics and avoid defensiveness.',
}

const EXAMPLES = [
  {
    stars: 5,
    review: 'The pasta was incredible — perfectly al dente, rich sauce. Server was warm and attentive. Best Italian in the city by far.',
    reply: 'Hearing that the pasta hit the mark means everything to us — that sauce has been simmering the same way since day one. We\'ll pass your kind words along to the team, they\'ll be thrilled. Looking forward to welcoming you back soon.\n\n— Marco',
  },
  {
    stars: 3,
    review: 'Food was good but the wait for a table was 40 minutes past our reservation. The steak was worth it but the start was frustrating.',
    reply: 'You\'re absolutely right, and I\'m sorry the wait set the wrong tone for your evening. A reservation is a promise, and we fell short. The good news is that we\'re working on how we manage the floor on busy nights. I\'d love to have you back and start on the right foot this time.\n\n— Marco',
  },
  {
    stars: 1,
    review: 'Terrible service. Waited an hour for cold food. Manager was dismissive when we raised it. Will never return.',
    reply: 'I\'m genuinely sorry for this experience — cold food and a dismissive response is the opposite of what we stand for. This fell short in every way that matters. I\'d really appreciate the chance to hear more directly from you. Please reach out to us at hello@restaurant.com so we can make it right.\n\n— Marco',
  },
]

const STOP_WORDS = new Set([
  'that','this','they','were','with','from','have','been','your','their','what',
  'will','just','very','good','great','really','would','could','should','about',
  'also','when','then','than','some','more','here','there','which','these',
])

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function getPersonalizationScore(review: string, reply: string): 'highly-personalized' | 'personalized' | 'generic' {
  const reviewWords = review.toLowerCase().match(/\b[a-z]{5,}\b/g)?.filter(w => !STOP_WORDS.has(w)) ?? []
  const replyLower = reply.toLowerCase()
  const specificMatches = [...new Set(reviewWords)].filter(w => replyLower.includes(w)).length
  const hasSig = /—\s*\w+/.test(reply) || /-{1,2}\s*\w+\s*$/.test(reply.trim())
  if (specificMatches >= 2 && hasSig) return 'highly-personalized'
  if (specificMatches >= 1 || hasSig) return 'personalized'
  return 'generic'
}

function WordCountBadge({ count }: { count: number }) {
  const ideal = count >= 75 && count <= 150
  const tooShort = count < 75
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
      ideal
        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
        : 'bg-amber-50 text-amber-600 border border-amber-200'
    }`}>
      {count}w · {ideal ? 'Ideal length' : tooShort ? 'Too short' : 'Too long'}
    </span>
  )
}

function PersonalizationBadge({ score }: { score: ReturnType<typeof getPersonalizationScore> }) {
  if (score === 'highly-personalized') {
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Highly personalized
      </span>
    )
  }
  if (score === 'personalized') {
    return <span className="text-[11px] font-medium text-[#888] bg-[#F5F4F0] border border-[#E8E4DC] px-2 py-0.5 rounded-full">Personalized</span>
  }
  return <span className="text-[11px] font-medium text-[#AAA] bg-[#F9F9F9] border border-[#E8E4DC] px-2 py-0.5 rounded-full">Generic</span>
}

export default function ReplyGenerator({ isPaid, onUpgrade, initialReview = '', initialRating = 5, onGenerateTriggerRef }: ReplyGeneratorProps) {
  const [reviewText, setReviewText] = useState(initialReview)
  const [starRating, setStarRating] = useState(initialRating)
  const [platform, setPlatform] = useState('Google')
  const [generatedReply, setGeneratedReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(false)
  const [socialPost, setSocialPost] = useState('')
  const [error, setError] = useState('')
  const [activeTone, setActiveTone] = useState<Tone | null>(null)
  const [showExamples, setShowExamples] = useState(false)
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null)

  const replyWords = useMemo(() => wordCount(generatedReply), [generatedReply])
  const personalization = useMemo(
    () => generatedReply ? getPersonalizationScore(reviewText, generatedReply) : null,
    [reviewText, generatedReply]
  )

  const handleGenerate = async (tone?: Tone | null) => {
    if (!reviewText.trim()) return
    setLoading(true)
    setError('')
    setGeneratedReply('')
    setSocialPost('')
    setFeedback(null)

    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewText, starRating, platform, tone: tone ?? undefined }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate reply')
      }

      const data = await res.json()
      setGeneratedReply(data.reply)
      setActiveTone(tone ?? null)
      // Mark step done in localStorage
      if (typeof window !== 'undefined') localStorage.setItem('tr_step_reply', '1')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong generating your reply. Please try again — if this keeps happening, email us at hello@tablereply.com'
      )
    } finally {
      setLoading(false)
    }
  }

  // Expose trigger to parent for keyboard shortcut
  useEffect(() => {
    onGenerateTriggerRef?.(() => handleGenerate(activeTone))
  }, [reviewText, activeTone])

  const handleFeedback = async (rating: 'good' | 'bad') => {
    setFeedback(rating)
    try {
      await fetch('/api/reply-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedReply, rating }),
      })
    } catch {
      // silent — feedback is best-effort
    }
  }

  const handleGenerateSocial = async () => {
    if (!isPaid) { onUpgrade(); return }
    setSocialLoading(true)
    try {
      const res = await fetch('/api/generate-social-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewText, starRating, platform }),
      })
      const data = await res.json()
      if (res.ok) setSocialPost(data.caption)
    } finally {
      setSocialLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Input card */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-6">
        <div className="space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-[#111] mb-2">Review</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Paste the customer review here…"
              rows={5}
              className="w-full px-3.5 py-3 rounded-xl border border-[#E8E4DC] text-[#111] text-sm placeholder:text-[#C0BDB8] bg-white resize-y focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all duration-150 min-h-[56px]"
            />
          </div>

          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[#111] mb-2">Rating</label>
              <StarRating value={starRating} onChange={setStarRating} />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#111] mb-2">Platform</label>
              <div className="flex gap-1.5 flex-wrap">
                {platforms.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                      platform === p
                        ? 'bg-[#111] text-white'
                        : 'bg-[#F5F4F0] text-[#666] hover:bg-[#ECEAE5] border border-[#E8E4DC]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {PLATFORM_TIPS[platform] && (
                <p className="text-[11px] text-[#AAA] mt-2 flex items-center gap-1.5">
                  <svg className="w-3 h-3 flex-shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  {PLATFORM_TIPS[platform]}
                </p>
              )}
            </div>
          </div>

          {error && (
            <p className="text-[13px] text-red-500 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
              {error}
            </p>
          )}

          <button
            onClick={() => handleGenerate(null)}
            disabled={!reviewText.trim() || loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-[#2a2a2a] text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 min-h-[44px]"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                Generate Reply
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output card */}
      {generatedReply && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EDE8]">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"/>
              <span className="text-[13px] font-semibold text-[#111]">Generated reply</span>
              {personalization && <PersonalizationBadge score={personalization}/>}
              <WordCountBadge count={replyWords}/>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleGenerate(activeTone)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#666] hover:text-[#111] hover:bg-[#F5F4F0] border border-transparent hover:border-[#E8E4DC] disabled:opacity-40 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Regenerate
              </button>
              <CopyButton text={generatedReply}/>
            </div>
          </div>

          <div className="px-6 py-5">
            <p className="text-[#333] text-sm leading-relaxed whitespace-pre-wrap">{generatedReply}</p>
          </div>

          {/* Tone picker */}
          <div className="px-6 py-4 border-t border-[#F0EDE8]">
            <p className="text-[11px] font-semibold text-[#AAA] uppercase tracking-[0.12em] mb-3">
              Regenerate with different tone
            </p>
            <div className="flex gap-2 flex-wrap">
              {TONES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleGenerate(value)}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all disabled:opacity-40 ${
                    activeTone === value ? 'bg-[#111] text-white' : 'bg-[#F5F4F0] text-[#666] hover:bg-[#ECEAE5] border border-[#E8E4DC]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div className="px-6 py-4 border-t border-[#F0EDE8] flex items-center justify-between">
            <span className="text-[12px] text-[#AAA]">Was this reply good?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFeedback('good')}
                className={`p-1.5 rounded-lg transition-all ${feedback === 'good' ? 'bg-emerald-50 text-emerald-600' : 'text-[#CCC] hover:text-emerald-500 hover:bg-emerald-50'}`}
                title="Good reply"
              >
                <svg className="w-4 h-4" fill={feedback === 'good' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                </svg>
              </button>
              <button
                onClick={() => handleFeedback('bad')}
                className={`p-1.5 rounded-lg transition-all ${feedback === 'bad' ? 'bg-red-50 text-red-500' : 'text-[#CCC] hover:text-red-400 hover:bg-red-50'}`}
                title="Bad reply"
              >
                <svg className="w-4 h-4" fill={feedback === 'bad' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"/>
                </svg>
              </button>
              {feedback && (
                <span className="text-[11px] text-[#AAA]">{feedback === 'good' ? 'Thanks!' : 'Got it, we\'ll improve'}</span>
              )}
            </div>
          </div>

          {/* Social post */}
          <div className="px-6 py-4 border-t border-[#F0EDE8]">
            <button
              onClick={handleGenerateSocial}
              disabled={socialLoading}
              className="flex items-center gap-2 text-[13px] font-medium text-[#666] hover:text-[#111] disabled:opacity-40 transition-colors"
            >
              {socialLoading ? (
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.684a3 3 0 10-5.368 2.684 3 3 0 005.368-2.684zm-9.632-7.368a3 3 0 10-5.368-2.684 3 3 0 005.368 2.684z"/>
                </svg>
              )}
              {isPaid ? 'Turn into social post' : 'Turn into social post · Pro'}
              {!isPaid && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-200 uppercase tracking-wide">Pro</span>
              )}
            </button>
            {socialPost && (
              <div className="mt-4 p-4 bg-[#F7F6F3] rounded-xl border border-[#E8E4DC]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] font-semibold text-[#888] uppercase tracking-wide">Instagram / Facebook</span>
                  <CopyButton text={socialPost}/>
                </div>
                <p className="text-sm text-[#333] whitespace-pre-wrap leading-relaxed">{socialPost}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reply examples */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
        <button
          onClick={() => setShowExamples((p) => !p)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#FAFAF8] transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#AAA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span className="text-[13px] font-medium text-[#555]">Reply examples — see what great looks like</span>
          </div>
          <svg
            className={`w-4 h-4 text-[#AAA] transition-transform ${showExamples ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        {showExamples && (
          <div className="border-t border-[#F0EDE8] divide-y divide-[#F0EDE8]">
            {EXAMPLES.map((ex, i) => (
              <div key={i} className="px-6 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <svg key={s} className={`w-3.5 h-3.5 ${s <= ex.stars ? 'text-amber-400' : 'text-[#E8E4DC]'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <span className="text-[11px] text-[#AAA] font-medium uppercase tracking-wide">{ex.stars}-star review</span>
                </div>
                <p className="text-[12px] text-[#888] italic mb-3 leading-relaxed">"{ex.review}"</p>
                <div className="bg-[#F7F6F3] rounded-xl p-3.5 border border-[#E8E4DC]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#AAA]">Example reply</span>
                  </div>
                  <p className="text-[12px] text-[#444] leading-relaxed whitespace-pre-wrap">{ex.reply}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
