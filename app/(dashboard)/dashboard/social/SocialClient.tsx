'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

type ScrapedReview = {
  id: string
  reviewer_name: string
  star_rating: number
  review_text: string
  review_datetime_utc: string
  source?: string | null
}

type BusinessProfile = {
  business_name: string
  business_type: string
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
  restaurantProfile: BusinessProfile
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <svg key={i} className={`w-3 h-3 ${i <= rating ? 'text-amber-400' : 'text-[#E4DED8]'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
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
  restaurantProfile: BusinessProfile
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
          restaurantName: restaurantProfile.business_name,
          cuisineType: restaurantProfile.business_type,
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
          restaurantName: restaurantProfile.business_name,
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
        link.download = `${restaurantProfile.business_name.replace(/[^a-z0-9]/gi, '-')}-review.png`
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
  }, [graphicHtml, restaurantProfile.business_name])

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
              <span className="text-[12px] font-semibold text-[#111111] truncate">{review.reviewer_name}</span>
              <span className="text-[12px] text-[#57534E] truncate flex-1">
                — {review.review_text.length > 60 ? review.review_text.slice(0, 60) + '…' : review.review_text}
              </span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#A8A29E] hover:text-[#111111] hover:bg-[#F3F0EC] transition-all flex-shrink-0">
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
                  tab === t ? 'bg-white text-[#111111] shadow-sm' : 'text-[#A8A29E] hover:text-[#57534E]'
                }`}
              >
                {t === 'caption' ? 'Caption' : 'Graphic'}
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
                          ? 'bg-[#E05A28]/10 text-[#E05A28] border-[#E05A28]/20'
                          : 'bg-transparent text-[#A8A29E] border-[#E4DED8] hover:border-[#D0C9C1]'
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
                          : 'bg-transparent text-[#A8A29E] border-[#E4DED8] hover:border-[#D0C9C1]'
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
                className="w-full min-h-[52px] rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] active:scale-[0.98] text-white text-[13px] font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_1px_3px_rgba(224,90,40,0.3)]"
              >
                {captionLoading ? (
                  <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Generating…</>
                ) : (
                  <><svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 3l3 6-3 6h14l-3-6 3-6H5zM5 9h14"/></svg>{caption ? 'Regenerate Caption' : 'Generate Caption'}</>
                )}
              </button>

              {captionError && (
                <p className="text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{captionError}</p>
              )}

              {caption && (
                <>
                  {/* Caption text with char count */}
                  <div className="relative">
                    <div className="bg-[#F8F6F3] rounded-xl border border-[#E4DED8] p-4">
                      <p className="text-[14px] text-[#111111] leading-relaxed font-medium">{caption}</p>
                      {hashtags.length > 0 && (
                        <p className="text-[13px] text-[#C94E21] mt-2 leading-relaxed">{hashtags.join(' ')}</p>
                      )}
                    </div>
                    <span className={`absolute bottom-2 right-3 text-[10px] font-medium ${caption.length > 280 ? 'text-red-500' : caption.length > 200 ? 'text-amber-600' : 'text-[#A8A29E]'}`}>
                      {caption.length}/300
                    </span>
                  </div>

                  {/* Copy button */}
                  <button
                    onClick={copyCaption}
                    className={`w-full h-[44px] rounded-xl text-[13px] font-semibold border transition-all flex items-center justify-center gap-2 ${
                      copied
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-[#F3F0EC] text-[#57534E] border-[#E4DED8] hover:border-[#D0C9C1] hover:text-[#111111]'
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
                            ? 'border-[#E05A28] ring-2 ring-[#E05A28]/20 bg-[#E05A28]/10'
                            : 'border-[#E4DED8] bg-[#F8F6F3] hover:border-[#D0C9C1]'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-md flex-shrink-0 border border-black/10"
                          style={{ background: preview[s] }}
                        />
                        <span className="text-[12px] font-semibold text-[#111111]">{s}</span>
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
                className="w-full min-h-[52px] rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] active:scale-[0.98] text-white text-[13px] font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_1px_3px_rgba(224,90,40,0.3)]"
              >
                {graphicLoading ? (
                  <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Building graphic…</>
                ) : (
                  <><svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>{graphicHtml ? 'Regenerate Graphic' : 'Generate Graphic'}</>
                )}
              </button>

              {graphicError && (
                <p className="text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{graphicError}</p>
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

function platformTopBorder(platform: string): string {
  if (platform === 'Instagram') return 'border-t-2 border-t-purple-300'
  if (platform === 'Facebook') return 'border-t-2 border-t-blue-300'
  if (platform === 'Twitter/X') return 'border-t-2 border-t-sky-300'
  return 'border-t-2 border-t-[#E05A28]/50' // Google default
}

function sourceBadge(source?: string | null) {
  if (source === 'yelp') return <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 rounded-md px-1.5 py-0.5 leading-none">YELP</span>
  if (source === 'tripadvisor') return <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5 leading-none">TA</span>
  return <span className="text-[10px] font-bold text-blue-500 bg-blue-50 border border-blue-200 rounded-md px-1.5 py-0.5 leading-none">G</span>
}

function sourceTopBorder(source?: string | null): string {
  if (source === 'yelp') return 'border-t-2 border-t-red-200'
  if (source === 'tripadvisor') return 'border-t-2 border-t-emerald-200'
  return 'border-t-2 border-t-blue-200'
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SocialClient({ reviews, restaurantProfile }: Props) {
  const [activeReview, setActiveReview] = useState<ScrapedReview | null>(null)

  const goodReviews = reviews.filter((r) => r.star_rating >= 4 && r.review_text?.trim())

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-[#111111] tracking-tight">Social Posts</h1>
        <p className="text-[13px] text-[#57534E] mt-0.5">
          Turn your best reviews into captions and shareable graphics.
        </p>
      </div>

      {goodReviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4DED8] px-6 py-12 sm:p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FEF0E8] border border-[#F5C9AD] flex items-center justify-center mx-auto mb-4 shadow-sm animate-float">
            <svg className="w-7 h-7 text-[#E05A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-[#111111] mb-1">Create your first social post</p>
          <p className="text-[13px] text-[#57534E] mt-1 max-w-[260px] mx-auto leading-relaxed">Turn your best reviews into ready-to-post captions and shareable graphics.</p>
          <p className="text-[12px] text-[#A8A29E] mt-3">Sync some reviews first to unlock social post creation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {goodReviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-2xl border border-[#E4DED8] ${sourceTopBorder(review.source)} p-4 sm:p-5 flex flex-col gap-3 hover:border-[#D0C9C1] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-150`}
            >
              {/* Header row: platform badge + timestamp */}
              <div className="flex items-center justify-between gap-2">
                {sourceBadge(review.source)}
                <span className="text-[11px] text-[#A8A29E]">
                  {review.review_datetime_utc
                    ? new Date(review.review_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : ''}
                </span>
              </div>

              {/* Reviewer: avatar + name + stars */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E05A28]/15 to-[#E05A28]/08 border border-[#E05A28]/20 flex items-center justify-center text-[11px] font-bold text-[#C94E21] flex-shrink-0">
                  {review.reviewer_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#111111] text-[13px] truncate leading-tight">{review.reviewer_name}</p>
                  <div className="mt-0.5">
                    <Stars rating={review.star_rating} />
                  </div>
                </div>
              </div>

              {/* Review text */}
              <p className="text-[14px] text-[#57534E] leading-relaxed flex-1">
                &ldquo;{review.review_text.length > 110
                  ? review.review_text.slice(0, 110) + '…'
                  : review.review_text}&rdquo;
              </p>

              {/* CTA */}
              <button
                onClick={() => setActiveReview(review)}
                className="mt-auto w-full h-[44px] rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white text-[13px] font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-[0.97] shadow-[0_1px_3px_rgba(224,90,40,0.25)]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
