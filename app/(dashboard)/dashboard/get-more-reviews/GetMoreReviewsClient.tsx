'use client'

import { useState } from 'react'
import QRCode from 'qrcode'
import type { RestaurantProfile } from '@/types'

interface ReviewMessages {
  sms: string
  email: string
  receipt: string
  tablecard: string
}

const CHANNELS = [
  { key: 'sms' as const, icon: '📱', label: 'SMS' },
  { key: 'email' as const, icon: '📧', label: 'Email' },
  { key: 'receipt' as const, icon: '🧾', label: 'Receipt' },
  { key: 'tablecard' as const, icon: '📋', label: 'Table Card' },
]

interface Props {
  restaurantProfile: RestaurantProfile
}

export default function GetMoreReviewsClient({ restaurantProfile }: Props) {
  const [messages, setMessages] = useState<ReviewMessages | null>(null)
  const [editedMessages, setEditedMessages] = useState<ReviewMessages | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null)

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [generatingQr, setGeneratingQr] = useState(false)

  async function handleGenerateMessages() {
    setGenerating(true)
    setGenerateError(null)
    try {
      const res = await fetch('/api/generate-review-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: restaurantProfile.restaurant_name,
          cuisineType: restaurantProfile.cuisine_type,
          vibe: restaurantProfile.vibe,
          voiceStyle: restaurantProfile.voice_style,
          ownerName: restaurantProfile.owner_name,
        }),
      })
      if (!res.ok) throw new Error('Failed to generate messages')
      const data: ReviewMessages = await res.json()
      setMessages(data)
      setEditedMessages(data)
    } catch (err) {
      setGenerateError('Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy(channel: string) {
    const text = editedMessages?.[channel as keyof ReviewMessages] ?? ''
    await navigator.clipboard.writeText(text)
    setCopiedChannel(channel)
    setTimeout(() => setCopiedChannel(null), 2000)

    // Track click
    try {
      await fetch('/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      })
    } catch {
      // Non-critical, ignore tracking errors
    }
  }

  async function handleGenerateQr() {
    const reviewUrl = restaurantProfile.google_maps_url ?? ''
    if (!reviewUrl) return
    setGeneratingQr(true)
    try {
      const url = reviewUrl.endsWith('/reviews')
        ? reviewUrl
        : `${reviewUrl}/reviews`
      const dataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: { dark: '#111111', light: '#FFFFFF' },
      })
      setQrDataUrl(dataUrl)
    } catch {
      // ignore
    } finally {
      setGeneratingQr(false)
    }
  }

  function handleDownloadQr() {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `${restaurantProfile.restaurant_name.replace(/\s+/g, '-')}-review-qr.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const showSkeletons = generating
  const showCards = !generating && (messages !== null || generateError !== null)

  return (
    <div className="space-y-8 pb-12">

        {/* Page Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#111]">Get More Reviews</h1>
          <p className="text-[13px] text-[#57534E] mt-1">Generate personalized messages and tools to earn more 5-star reviews.</p>
        </div>

        {/* Section 1: Review Request Messages */}
        <div className="bg-white rounded-2xl border border-[#E4DED8] p-4 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold text-[#111]">Review Request Messages</h2>
              <p className="text-[12px] text-[#A8A29E] mt-0.5">
                Personalized messages to send via SMS, email, receipt, or table card
              </p>
            </div>
            <button
              onClick={handleGenerateMessages}
              disabled={generating}
              className="flex items-center justify-center gap-2 bg-[#E05A28] hover:bg-[#C94E21] disabled:opacity-60 text-white font-semibold text-[13px] px-4 py-2.5 rounded-xl transition-colors min-h-[44px] sm:min-h-0 flex-shrink-0"
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                'Generate Messages'
              )}
            </button>
          </div>

          {generateError && (
            <p className="text-red-500 text-sm">{generateError}</p>
          )}

          {/* Skeleton placeholders */}
          {showSkeletons && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CHANNELS.map((ch) => (
                <div key={ch.key} className="rounded-xl border border-[#E4DED8] p-4 space-y-3 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#E4DED8] rounded-md" />
                    <div className="w-20 h-4 bg-[#E4DED8] rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-3 bg-[#E4DED8] rounded" />
                    <div className="w-4/5 h-3 bg-[#E4DED8] rounded" />
                    <div className="w-3/5 h-3 bg-[#E4DED8] rounded" />
                  </div>
                  <div className="w-20 h-8 bg-[#E4DED8] rounded-lg ml-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Message cards */}
          {showCards && messages && editedMessages && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {CHANNELS.map((ch) => (
                <div key={ch.key} className="rounded-xl border border-[#E4DED8] p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{ch.icon}</span>
                    <span className="text-[13px] font-semibold text-[#111]">{ch.label}</span>
                  </div>
                  <textarea
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DED8] text-[13px] text-[#111] focus:ring-2 focus:ring-[#E05A28]/40 focus:outline-none resize-none"
                    rows={ch.key === 'email' ? 5 : 3}
                    value={editedMessages[ch.key]}
                    onChange={(e) =>
                      setEditedMessages((prev) =>
                        prev ? { ...prev, [ch.key]: e.target.value } : prev
                      )
                    }
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleCopy(ch.key)}
                      className="text-[12px] font-semibold px-3.5 py-2 rounded-xl border border-[#E4DED8] hover:bg-[#F3F0EC] hover:border-[#CEC8C1] text-[#57534E] hover:text-[#111] transition-all min-h-[36px]"
                    >
                      {copiedChannel === ch.key ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state before generating */}
          {!showSkeletons && !showCards && (
            <div className="text-center py-10 text-[#888] text-sm">
              Click &ldquo;Generate Messages&rdquo; to create personalized review request messages for{' '}
              <span className="text-[#111] font-medium">{restaurantProfile.restaurant_name}</span>.
            </div>
          )}
        </div>

        {/* Section 2: QR Code Generator */}
        <div className="bg-white rounded-2xl border border-[#E4DED8] p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-[#111]">QR Code for your Google review page</h2>
            <p className="text-[12px] text-[#A8A29E] mt-0.5">Add this to your menu, receipt, or table card</p>
          </div>

          {restaurantProfile.google_maps_url ? (
            <div className="space-y-4">
              {!qrDataUrl && (
                <button
                  onClick={handleGenerateQr}
                  disabled={generatingQr}
                  className="flex items-center gap-2 bg-[#111] hover:bg-[#222] disabled:opacity-60 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-colors"
                >
                  {generatingQr ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Generating…
                    </>
                  ) : (
                    'Generate QR Code'
                  )}
                </button>
              )}

              {qrDataUrl && (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-[#E4DED8] inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl}
                      alt="Google Review QR Code"
                      width={256}
                      height={256}
                      className="block"
                    />
                  </div>
                  <button
                    onClick={handleDownloadQr}
                    className="flex items-center gap-2 bg-[#111] hover:bg-[#222] text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-colors"
                  >
                    Download QR Code
                  </button>
                  <button
                    onClick={() => setQrDataUrl(null)}
                    className="text-xs text-[#888] hover:text-[#111] transition-colors"
                  >
                    Regenerate
                  </button>
                  <p className="text-[#888] text-xs text-center max-w-sm">
                    Print this QR code and add it to your menu, receipt, or table tent card to collect
                    more reviews.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[#E4DED8] bg-[#F3F0EC] px-4 py-5 text-sm text-[#888]">
              Connect your Google Maps listing in{' '}
              <span className="text-[#111] font-medium">Auto Reviews</span> to generate a QR code.
            </div>
          )}
        </div>

        {/* Section 3: Tips */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E]">Tips for getting more reviews</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              {
                title: 'Ask in person',
                body: "The best time to ask is right after a positive experience. A simple 'Would you mind leaving us a review? It really helps.' goes a long way.",
              },
              {
                title: 'Timing matters',
                body: 'Ask within 24 hours while the memory is fresh. Saturday dinner guests who had a great time are your best reviewers.',
              },
              {
                title: 'Make it easy',
                body: 'The fewer steps the better. A QR code on the table or receipt removes all friction.',
              },
            ].map((tip) => (
              <div
                key={tip.title}
                className="bg-white rounded-2xl border border-[#E4DED8] p-4 sm:p-5"
              >
                <h3 className="text-[13px] font-semibold text-[#111] mb-1.5">{tip.title}</h3>
                <p className="text-[12px] text-[#57534E] leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>

    </div>
  )
}
