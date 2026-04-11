'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

type ScrapedReview = {
  id: string
  reviewer_name: string
  star_rating: number
  review_text: string
  review_datetime_utc: string
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
type Tab = 'caption' | 'graphic'

interface Props {
  reviews: ScrapedReview[]
  restaurantProfile: RestaurantProfile
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-[#E05A28] text-[13px] tracking-tight">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

// ─── Create Post Modal ────────────────────────────────────────────────────────

function CreatePostModal({
  review,
  restaurantProfile,
  onClose,
}: {
  review: ScrapedReview
  restaurantProfile: RestaurantProfile
  onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>('caption')

  // Caption state
  const [platform, setPlatform] = useState<Platform>('Instagram')
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('Grateful & warm')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [captionLoading, setCaptionLoading] = useState(false)
  const [captionError, setCaptionError] = useState('')
  const [copied, setCopied] = useState(false)

  // Graphic state
  const [graphicStyle, setGraphicStyle] = useState<GraphicStyle>('Dark & moody')
  const [graphicHtml, setGraphicHtml] = useState('')
  const [graphicLoading, setGraphicLoading] = useState(false)
  const [graphicError, setGraphicError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const platforms: Platform[] = ['Instagram', 'Facebook', 'Twitter/X', 'TikTok']
  const captionStyles: CaptionStyle[] = ['Grateful & warm', 'Bold & confident', 'Fun & casual']
  const graphicStyles: GraphicStyle[] = ['Dark & moody', 'Warm & bright', 'Clean & minimal', 'Bold & colorful']

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const generateCaption = async () => {
    setCaptionLoading(true)
    setCaptionError('')
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
      setCaptionError('Failed to generate. Please try again.')
    } finally {
      setCaptionLoading(false)
    }
  }

  const generateGraphic = async () => {
    setGraphicLoading(true)
    setGraphicError('')
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
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Generation failed')
      const data = await res.json()
      setGraphicHtml(data.html ?? '')
    } catch (err) {
      setGraphicError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setGraphicLoading(false)
    }
  }

  const copyCaption = async () => {
    const full = hashtags.length > 0 ? `${caption}\n\n${hashtags.join(' ')}` : caption
    await navigator.clipboard.writeText(full).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPng = useCallback(async () => {
    if (!iframeRef.current) return
    setDownloading(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 800
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')

      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width:800px;height:800px;transform:scale(2);transform-origin:0 0">
            ${graphicHtml}
          </div>
        </foreignObject>
      </svg>`

      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        const link = document.createElement('a')
        link.download = `${restaurantProfile.restaurant_name.replace(/[^a-z0-9]/gi, '-')}-review.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
        setDownloading(false)
      }
      img.onerror = () => {
        // Fallback: open in new tab
        const blob = new Blob([graphicHtml], { type: 'text/html' })
        window.open(URL.createObjectURL(blob))
        setDownloading(false)
      }
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData)
    } catch {
      setDownloading(false)
    }
  }, [graphicHtml, restaurantProfile.restaurant_name])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full sm:max-w-[560px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex-shrink-0">
          {/* Review pill */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 bg-[#F3F0EC] rounded-xl border border-[#E4DED8]">
              <Stars rating={review.star_rating} />
              <span className="text-[12px] font-semibold text-[#444] truncate">{review.reviewer_name}</span>
              <span className="text-[12px] text-[#A8A29E] truncate flex-1">
                — {review.review_text.length > 60 ? review.review_text.slice(0, 60) + '…' : review.review_text}
              </span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#A8A29E] hover:text-[#111] hover:bg-[#F3F0EC] transition-all flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-[#F3F0EC] rounded-xl">
            {(['caption', 'graphic'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                  tab === t ? 'bg-white text-[#111] shadow-sm' : 'text-[#6B6B6B] hover:text-[#333]'
                }`}
              >
                {t === 'caption' ? '✦ Caption' : '◈ Graphic'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 pb-5">

          {/* ── Caption tab ─────────────────────────────────────────── */}
          {tab === 'caption' && (
            <div className="space-y-4">
              {/* Platform */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#A8A29E] mb-2">Platform</p>
                <div className="flex flex-wrap gap-1.5">
                  {platforms.map(p => (
                    <button
                      key={p}
                      onClick={() => { setPlatform(p); setCaption(''); setHashtags([]) }}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${
                        platform === p
                          ? 'bg-[#111] text-white border-[#111]'
                          : 'bg-white text-[#666] border-[#E4DED8] hover:border-[#CEC8C1]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#A8A29E] mb-2">Tone</p>
                <div className="flex flex-wrap gap-1.5">
                  {captionStyles.map(s => (
                    <button
                      key={s}
                      onClick={() => { setCaptionStyle(s); setCaption(''); setHashtags([]) }}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${
                        captionStyle === s
                          ? 'bg-[#E05A28] text-white border-[#E05A28]'
                          : 'bg-white text-[#666] border-[#E4DED8] hover:border-[#CEC8C1]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateCaption}
                disabled={captionLoading}
                className="w-full h-[44px] rounded-xl bg-[#111] hover:bg-[#1C1C1C] text-white text-[13px] font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {captionLoading ? (
                  <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Writing…</>
                ) : caption ? 'Regenerate' : 'Generate Caption'}
              </button>

              {captionError && (
                <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{captionError}</p>
              )}

              {caption && (
                <>
                  {/* Caption text */}
                  <div className="bg-[#F3F0EC] rounded-xl border border-[#E4DED8] p-4">
                    <p className="text-[14px] text-[#222] leading-relaxed font-medium">{caption}</p>
                    {hashtags.length > 0 && (
                      <p className="text-[13px] text-[#C94E21] mt-2 leading-relaxed">{hashtags.join(' ')}</p>
                    )}
                  </div>

                  {/* Copy button */}
                  <button
                    onClick={copyCaption}
                    className={`w-full h-[44px] rounded-xl text-[13px] font-semibold border transition-all flex items-center justify-center gap-2 ${
                      copied
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-[#666] border-[#E4DED8] hover:border-[#CEC8C1] hover:text-[#111]'
                    }`}
                  >
                    {copied ? (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Copied!</>
                    ) : (
                      <><svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>Copy caption + hashtags</>
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Graphic tab ─────────────────────────────────────────── */}
          {tab === 'graphic' && (
            <div className="space-y-4">
              {/* Style */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#A8A29E] mb-2">Style</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {graphicStyles.map(s => {
                    const preview: Record<string, string> = {
                      'Dark & moody': '#0F0D0B',
                      'Warm & bright': '#FDF4E7',
                      'Clean & minimal': '#FFFFFF',
                      'Bold & colorful': '#1A0533',
                    }
                    return (
                      <button
                        key={s}
                        onClick={() => { setGraphicStyle(s); setGraphicHtml('') }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          graphicStyle === s
                            ? 'border-[#E05A28] ring-2 ring-[#E05A28]/20 bg-[#FEF0E8]'
                            : 'border-[#E4DED8] bg-white hover:border-[#CEC8C1]'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-md flex-shrink-0 border border-black/10"
                          style={{ background: preview[s] }}
                        />
                        <span className="text-[12px] font-semibold text-[#333]">{s}</span>
                        {graphicStyle === s && (
                          <svg className="w-3.5 h-3.5 text-[#E05A28] ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={generateGraphic}
                disabled={graphicLoading}
                className="w-full h-[44px] rounded-xl bg-[#111] hover:bg-[#1C1C1C] text-white text-[13px] font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {graphicLoading ? (
                  <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Building graphic…</>
                ) : graphicHtml ? 'Regenerate' : 'Generate Graphic'}
              </button>

              {graphicError && (
                <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{graphicError}</p>
              )}

              {graphicHtml && (
                <div className="flex flex-col items-center gap-4">
                  {/* Preview */}
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-[#E4DED8] w-full" style={{ maxWidth: 320, aspectRatio: '1 / 1' }}>
                    <iframe
                      ref={iframeRef}
                      srcDoc={graphicHtml}
                      scrolling="no"
                      title="Graphic preview"
                      style={{ display: 'block', border: 'none', width: 400, height: 400, transform: 'scale(0.8)', transformOrigin: '0 0', pointerEvents: 'none' }}
                    />
                  </div>

                  {/* Download */}
                  <button
                    onClick={downloadPng}
                    disabled={downloading}
                    className="flex items-center gap-2 px-5 h-[44px] rounded-xl bg-[#E05A28] hover:bg-[#C94E21] text-white text-[13px] font-semibold disabled:opacity-50 transition-all"
                  >
                    {downloading ? (
                      <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Downloading…</>
                    ) : (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Download PNG</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SocialClient({ reviews, restaurantProfile }: Props) {
  const [activeReview, setActiveReview] = useState<ScrapedReview | null>(null)

  const goodReviews = reviews.filter((r) => r.star_rating >= 4 && r.review_text?.trim())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#111]">Social Posts</h1>
        <p className="text-[13px] text-[#6B6B6B] mt-0.5">
          Turn your best reviews into captions and shareable graphics.
        </p>
      </div>

      {goodReviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4DED8] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F3F0EC] border border-[#E4DED8] flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-[#A8A29E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-[14px] font-medium text-[#666]">No 4★ or 5★ reviews yet</p>
          <p className="text-[13px] text-[#A8A29E] mt-1">Sync your reviews to unlock social post creation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goodReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-[#E4DED8] p-5 flex flex-col gap-3 hover:border-[#D4CFC6] hover:shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all duration-150"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#111] text-[13px] truncate max-w-[65%]">
                  {review.reviewer_name}
                </span>
                <Stars rating={review.star_rating} />
              </div>

              {/* Review snippet */}
              <p className="text-[13px] text-[#666] leading-relaxed flex-1">
                {review.review_text.length > 110
                  ? review.review_text.slice(0, 110) + '…'
                  : review.review_text}
              </p>

              {/* CTA */}
              <button
                onClick={() => setActiveReview(review)}
                className="mt-auto w-full h-[38px] rounded-xl bg-[#111] hover:bg-[#1C1C1C] text-white text-[12px] font-semibold transition-all duration-150 flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Post
              </button>
            </div>
          ))}
        </div>
      )}

      {activeReview && (
        <CreatePostModal
          review={activeReview}
          restaurantProfile={restaurantProfile}
          onClose={() => setActiveReview(null)}
        />
      )}
    </div>
  )
}
