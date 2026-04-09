'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import html2canvas from 'html2canvas'

type ScrapedReview = {
  id: string
  reviewer_name: string
  star_rating: number
  review_text: string
  review_datetime_utc: string
  generated_reply: string | null
  reply_status: string | null
}

type RestaurantProfile = {
  restaurant_name: string
  cuisine_type: string
  vibe: string
  voice_style: string
  description: string
  owner_name: string
}

type Platform = 'Instagram' | 'Facebook' | 'Twitter/X' | 'TikTok'
type CaptionStyle = 'Grateful & warm' | 'Bold & confident' | 'Fun & casual'
type GraphicStyle = 'Dark & moody' | 'Warm & bright' | 'Clean & minimal' | 'Bold & colorful'

interface Props {
  reviews: ScrapedReview[]
  restaurantProfile: RestaurantProfile
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

// ─── Caption Modal ────────────────────────────────────────────────────────────

function CaptionModal({
  review,
  restaurantProfile,
  onClose,
}: {
  review: ScrapedReview
  restaurantProfile: RestaurantProfile
  onClose: () => void
}) {
  const [platform, setPlatform] = useState<Platform>('Instagram')
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('Grateful & warm')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const platforms: Platform[] = ['Instagram', 'Facebook', 'Twitter/X', 'TikTok']
  const styles: CaptionStyle[] = ['Grateful & warm', 'Bold & confident', 'Fun & casual']

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: review.review_text,
          restaurantName: restaurantProfile.restaurant_name,
          cuisineType: restaurantProfile.cuisine_type,
          vibe: restaurantProfile.vibe,
          platform,
          style: captionStyle,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCaption(data.caption ?? '')
      setHashtags(data.hashtags ?? [])
    } catch {
      setError('Failed to generate. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(caption).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const appendHashtag = (tag: string) => {
    setCaption((prev) => (prev.endsWith(' ') || prev === '' ? prev + tag : prev + ' ' + tag))
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Portal to document.body so CSS transform on <main> doesn't offset fixed positioning
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0EDE8]">
          <h2 className="text-[15px] font-semibold text-[#111]">Create Social Post</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#AAA] hover:text-[#111] hover:bg-[#F5F4F0] transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          {/* Review text */}
          <div className="bg-[#F7F6F3] rounded-xl p-4 border border-[#E8E4DC]">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#AAA] mb-1.5">
              Review by {review.reviewer_name}
            </p>
            <p className="text-[13px] text-[#444] leading-relaxed">{review.review_text}</p>
          </div>

          {/* Platform */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888] mb-2">Platform</p>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`px-3.5 py-1.5 rounded-xl text-[13px] font-medium border transition-all ${
                    platform === p
                      ? 'bg-[#111] text-white border-[#111]'
                      : 'bg-white text-[#555] border-[#E8E4DC] hover:border-[#D4CFC6]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888] mb-2">Style</p>
            <div className="flex flex-wrap gap-2">
              {styles.map((s) => (
                <button
                  key={s}
                  onClick={() => setCaptionStyle(s)}
                  className={`px-3.5 py-1.5 rounded-xl text-[13px] font-medium border transition-all ${
                    captionStyle === s
                      ? 'bg-amber-400 text-[#111] border-amber-400'
                      : 'bg-white text-[#555] border-[#E8E4DC] hover:border-[#D4CFC6]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#111] hover:bg-[#2a2a2a] text-white text-[13px] font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating…
              </>
            ) : caption ? 'Regenerate' : 'Generate Caption'}
          </button>

          {error && <p className="text-[12px] text-red-500">{error}</p>}

          {/* Caption output */}
          {caption && (
            <>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888] block mb-2">
                  Your Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-[#E8E4DC] p-3 text-[13px] text-[#333] resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                />
              </div>

              <button
                onClick={copy}
                className={`w-full py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${
                  copied
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-[#555] border-[#E8E4DC] hover:border-[#D4CFC6] hover:text-[#111]'
                }`}
              >
                {copied ? '✓ Copied!' : 'Copy to Clipboard'}
              </button>

              {hashtags.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888] mb-2">
                    Suggested Hashtags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => appendHashtag(tag)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Graphic Generator Panel ─────────────────────────────────────────────────

function GraphicPanel({
  review,
  restaurantProfile,
}: {
  review: ScrapedReview
  restaurantProfile: RestaurantProfile
}) {
  const [graphicStyle, setGraphicStyle] = useState<GraphicStyle>('Dark & moody')
  const [graphicHtml, setGraphicHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const hiddenRef = useRef<HTMLDivElement>(null)

  const graphicStyles: GraphicStyle[] = ['Dark & moody', 'Warm & bright', 'Clean & minimal', 'Bold & colorful']

  const generate = async () => {
    setLoading(true)
    setError('')
    setGraphicHtml('')
    try {
      const res = await fetch('/api/generate-graphic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: review.review_text,
          reviewerName: review.reviewer_name,
          starRating: review.star_rating,
          restaurantName: restaurantProfile.restaurant_name,
          style: graphicStyle,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Generation failed')
      }
      const data = await res.json()
      setGraphicHtml(data.html ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Download: render HTML in a hidden div and use html2canvas on it
  const downloadPng = useCallback(async () => {
    if (!graphicHtml || !hiddenRef.current) return
    setDownloading(true)
    try {
      // Parse the generated HTML and inject body content + styles into a hidden container
      const parser = new DOMParser()
      const doc = parser.parseFromString(graphicHtml, 'text/html')

      // Inject any <style> tags into the container
      const styles = Array.from(doc.querySelectorAll('style'))
      const styleSheet = styles.map((s) => s.textContent ?? '').join('\n')

      // Set container content to body innerHTML
      const styleEl = document.createElement('style')
      styleEl.textContent = styleSheet
      hiddenRef.current.innerHTML = ''
      hiddenRef.current.appendChild(styleEl)
      hiddenRef.current.insertAdjacentHTML('beforeend', doc.body.innerHTML)

      // Wait a tick for layout
      await new Promise((r) => setTimeout(r, 100))

      const canvas = await html2canvas(hiddenRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: 400,
        height: 400,
        backgroundColor: null,
      })

      const link = document.createElement('a')
      link.download = `${restaurantProfile.restaurant_name.replace(/[^a-z0-9]/gi, '-')}-review-graphic.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Download failed:', err)
      alert('Download failed. Try right-clicking the preview and saving the image instead.')
    } finally {
      setDownloading(false)
    }
  }, [graphicHtml, restaurantProfile.restaurant_name])

  return (
    <div className="mt-5 bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
      <div className="px-6 py-5 border-b border-[#F0EDE8]">
        <p className="text-[13px] font-semibold text-[#111]">{review.reviewer_name} · {'★'.repeat(review.star_rating)}</p>
        <p className="text-[12px] text-[#888] mt-0.5 line-clamp-2">"{review.review_text}"</p>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Style presets */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888] mb-2">Style</p>
          <div className="flex flex-wrap gap-2">
            {graphicStyles.map((s) => (
              <button
                key={s}
                onClick={() => setGraphicStyle(s)}
                className={`px-3.5 py-1.5 rounded-xl text-[13px] font-medium border transition-all ${
                  graphicStyle === s
                    ? 'bg-[#111] text-white border-[#111]'
                    : 'bg-white text-[#555] border-[#E8E4DC] hover:border-[#D4CFC6]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111] hover:bg-[#2a2a2a] text-white text-[13px] font-semibold disabled:opacity-50 transition-all"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating graphic…
            </>
          ) : graphicHtml ? 'Regenerate' : 'Generate Graphic'}
        </button>

        {error && (
          <p className="text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Preview */}
        {graphicHtml && (
          <div className="flex flex-col items-center gap-4">
            {/* Visible iframe preview — no sandbox so fonts/styles render correctly */}
            <div className="rounded-2xl overflow-hidden border border-[#E8E4DC] shadow-md" style={{ width: 400, height: 400 }}>
              <iframe
                ref={iframeRef}
                srcDoc={graphicHtml}
                width={400}
                height={400}
                scrolling="no"
                title="Review Graphic Preview"
                style={{ display: 'block', border: 'none', width: 400, height: 400 }}
              />
            </div>

            {/* Hidden div used by html2canvas for download */}
            <div
              ref={hiddenRef}
              style={{
                position: 'fixed',
                top: '-9999px',
                left: '-9999px',
                width: 400,
                height: 400,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            />

            <button
              onClick={downloadPng}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-[#111] text-[13px] font-semibold disabled:opacity-50 transition-all"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Downloading…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download as PNG
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SocialClient({ reviews, restaurantProfile }: Props) {
  const [modalReview, setModalReview] = useState<ScrapedReview | null>(null)
  const [selectedGraphicReview, setSelectedGraphicReview] = useState<ScrapedReview | null>(null)

  const fiveStarReviews = reviews.filter((r) => r.star_rating === 5 && r.review_text?.trim())

  return (
    <div className="space-y-12">
      {/* ── Section 1: Caption Generator ─────────────────────────────── */}
      <div>
        <h1 className="text-xl font-semibold text-[#111]">Turn reviews into social content</h1>
        <p className="text-[13px] text-[#888] mt-0.5">Transform your best reviews into ready-to-post captions.</p>

        {reviews.length === 0 ? (
          <div className="mt-6 bg-white rounded-2xl border border-[#E8E4DC] p-10 text-center">
            <p className="text-[13px] text-[#888]">No 4★ or 5★ reviews yet — sync your reviews to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-2xl border border-[#E8E4DC] p-5 flex flex-col gap-3 hover:border-[#D4CFC6] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#111] text-[13px] truncate max-w-[65%]">
                    {review.reviewer_name}
                  </span>
                  <StarRating rating={review.star_rating} />
                </div>
                <p className="text-[13px] text-[#555] leading-relaxed flex-1">
                  {review.review_text.length > 120
                    ? review.review_text.slice(0, 120) + '…'
                    : review.review_text}
                </p>
                <button
                  onClick={() => setModalReview(review)}
                  className="mt-1 w-full py-2 rounded-xl text-[13px] font-semibold bg-[#111] hover:bg-[#2a2a2a] text-white transition-all"
                >
                  Create Post
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Divider ───────────────────────────────────────────────────── */}
      <div className="border-t border-[#E8E4DC]" />

      {/* ── Section 2: Graphic Generator ─────────────────────────────── */}
      <div>
        <h2 className="text-xl font-semibold text-[#111]">Create a shareable graphic</h2>
        <p className="text-[13px] text-[#888] mt-0.5">Turn your best review into a stunning social media image.</p>

        {fiveStarReviews.length === 0 ? (
          <div className="mt-6 bg-white rounded-2xl border border-[#E8E4DC] p-10 text-center">
            <p className="text-[13px] text-[#888]">No 5★ reviews yet — sync more reviews to unlock this.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {fiveStarReviews.map((review) => (
                <div
                  key={review.id}
                  className={`bg-white rounded-2xl border p-5 flex flex-col gap-3 cursor-pointer transition-all ${
                    selectedGraphicReview?.id === review.id
                      ? 'border-amber-400 ring-2 ring-amber-400/20'
                      : 'border-[#E8E4DC] hover:border-[#D4CFC6]'
                  }`}
                  onClick={() =>
                    setSelectedGraphicReview((prev) => (prev?.id === review.id ? null : review))
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#111] text-[13px] truncate max-w-[65%]">
                      {review.reviewer_name}
                    </span>
                    <StarRating rating={5} />
                  </div>
                  <p className="text-[13px] text-[#555] leading-relaxed flex-1">
                    {review.review_text.length > 120
                      ? review.review_text.slice(0, 120) + '…'
                      : review.review_text}
                  </p>
                  <div
                    className={`w-full py-2 rounded-xl text-[13px] font-semibold text-center border transition-all ${
                      selectedGraphicReview?.id === review.id
                        ? 'bg-amber-400 text-[#111] border-amber-400'
                        : 'bg-white text-[#555] border-[#E8E4DC]'
                    }`}
                  >
                    {selectedGraphicReview?.id === review.id ? 'Selected ✓' : 'Create Graphic'}
                  </div>
                </div>
              ))}
            </div>

            {selectedGraphicReview && (
              <GraphicPanel
                review={selectedGraphicReview}
                restaurantProfile={restaurantProfile}
              />
            )}
          </>
        )}
      </div>

      {/* ── Caption Modal ─────────────────────────────────────────────── */}
      {modalReview && (
        <CaptionModal
          review={modalReview}
          restaurantProfile={restaurantProfile}
          onClose={() => setModalReview(null)}
        />
      )}
    </div>
  )
}
