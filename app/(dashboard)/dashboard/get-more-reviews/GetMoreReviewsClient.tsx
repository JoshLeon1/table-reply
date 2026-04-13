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

function ChannelIcon({ channel, className = 'w-4 h-4' }: { channel: string; className?: string }) {
  if (channel === 'sms') return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z"/>
    </svg>
  )
  if (channel === 'email') return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
  )
  if (channel === 'receipt') return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
    </svg>
  )
  // tablecard
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M3 14h18M7 6h.01M7 18h.01M17 6h.01M17 18h.01M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>
    </svg>
  )
}

const CHANNELS = [
  { key: 'sms' as const, label: 'SMS', desc: 'Text message', rows: 3 },
  { key: 'email' as const, label: 'Email', desc: 'Email body', rows: 5 },
  { key: 'receipt' as const, label: 'Receipt', desc: 'Printed note', rows: 3 },
  { key: 'tablecard' as const, label: 'Table Card', desc: 'Card insert', rows: 3 },
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
      const data = await res.json()
      if (!res.ok) {
        console.error('generate-review-requests error:', data)
        throw new Error(data?.error ?? 'Failed to generate messages')
      }
      // Validate all 4 keys are present and non-empty strings
      const result: ReviewMessages = {
        sms: typeof data.sms === 'string' && data.sms ? data.sms : '',
        email: typeof data.email === 'string' && data.email ? data.email : '',
        receipt: typeof data.receipt === 'string' && data.receipt ? data.receipt : '',
        tablecard: typeof data.tablecard === 'string' && data.tablecard ? data.tablecard : '',
      }
      setMessages(result)
      setEditedMessages(result)
    } catch (err) {
      console.error('handleGenerateMessages error:', err)
      setGenerateError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
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
          <h1 className="text-[22px] font-semibold text-white tracking-tight">Get More Reviews</h1>
          <p className="text-[13px] text-white/55 mt-1">Generate personalized messages and tools to earn more 5-star reviews.</p>
        </div>

        {/* Section 1: Review Request Messages */}
        <div className="bg-[#111111] rounded-2xl border border-white/[0.07] p-4 sm:p-6 space-y-5">
          <div>
            <h2 className="text-[14px] font-semibold text-white">Review Request Messages</h2>
            <p className="text-[12px] text-white/35 mt-0.5">
              Personalized messages to send via SMS, email, receipt, or table card
            </p>
          </div>
          <button
            onClick={handleGenerateMessages}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2.5 bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] active:scale-[0.98] disabled:opacity-60 text-white font-semibold text-[14px] px-4 rounded-xl transition-all min-h-[52px] shadow-[0_2px_12px_rgba(224,90,40,0.25)]"
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
              <>
                <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                Generate Messages
              </>
            )}
          </button>

          {generateError && (
            <p className="text-red-400 text-sm">{generateError}</p>
          )}

          {/* Skeleton placeholders */}
          {showSkeletons && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CHANNELS.map((ch) => (
                <div key={ch.key} className="rounded-xl border border-white/[0.07] p-4 space-y-3 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white/[0.10] rounded-md" />
                    <div className="w-20 h-4 bg-white/[0.10] rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-3 bg-white/[0.10] rounded" />
                    <div className="w-4/5 h-3 bg-white/[0.10] rounded" />
                    <div className="w-3/5 h-3 bg-white/[0.10] rounded" />
                  </div>
                  <div className="w-20 h-8 bg-white/[0.10] rounded-lg ml-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Message cards */}
          {showCards && messages && editedMessages && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {CHANNELS.map((ch) => {
                const isSms = ch.key === 'sms'
                const isEmail = ch.key === 'email'
                const isReceipt = ch.key === 'receipt'
                const isCard = ch.key === 'tablecard'
                return (
                  <div key={ch.key} className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-4 space-y-3 hover:border-white/[0.12] transition-colors">
                    {/* Channel header */}
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSms ? 'bg-blue-50 border border-blue-100 text-blue-500'
                        : isEmail ? 'bg-violet-50 border border-violet-100 text-violet-500'
                        : 'bg-white/[0.08] border border-white/[0.10] text-white/55'
                      }`}>
                        <ChannelIcon channel={ch.key} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[13px] font-semibold text-white">{ch.label}</span>
                      <span className="text-[11px] text-white/35 ml-auto">{ch.desc}</span>
                    </div>

                    {/* SMS speech bubble preview */}
                    {isSms && (
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/[0.10] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-white/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                          </svg>
                        </div>
                        <div className="bg-[#E9EFFD] rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
                          <p className="text-[12px] text-[#1A1A2E] leading-relaxed whitespace-pre-wrap">{editedMessages[ch.key]}</p>
                        </div>
                      </div>
                    )}

                    {/* Email mini preview */}
                    {isEmail && (
                      <div className="rounded-xl border border-white/[0.07] overflow-hidden">
                        <div className="bg-white/[0.06] border-b border-white/[0.07] px-3 py-2 space-y-0.5">
                          <p className="text-[11px] text-white/35"><span className="font-medium text-white/55">From:</span> {restaurantProfile?.restaurant_name ?? 'Your restaurant'}</p>
                          <p className="text-[11px] text-white/35"><span className="font-medium text-white/55">Subject:</span> We&apos;d love your feedback!</p>
                        </div>
                        <div className="px-3 py-2.5">
                          <p className="text-[12px] text-white/55 leading-relaxed whitespace-pre-wrap">{editedMessages[ch.key]}</p>
                        </div>
                      </div>
                    )}

                    {/* Receipt / Table card dashed paper preview */}
                    {(isReceipt || isCard) && (
                      <div className="rounded-xl border-2 border-dashed border-white/[0.12] bg-white/[0.03] px-4 py-3">
                        <p className="text-[12px] text-white/55 leading-relaxed whitespace-pre-wrap font-mono">{editedMessages[ch.key]}</p>
                      </div>
                    )}

                    {/* Edit textarea */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.10em] text-white/35 mb-1.5">Edit message</p>
                      <textarea
                        className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.10] bg-[#1A1A1A] text-[13px] text-white placeholder:text-white/25 focus:bg-[#1E1E1E] focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] focus:outline-none resize-none transition-all"
                        rows={ch.key === 'email' ? 5 : 3}
                        value={editedMessages[ch.key]}
                        onChange={(e) =>
                          setEditedMessages((prev) =>
                            prev ? { ...prev, [ch.key]: e.target.value } : prev
                          )
                        }
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleCopy(ch.key)}
                        className={`text-[12px] font-semibold px-3.5 min-h-[36px] rounded-xl border transition-all flex items-center gap-1.5 ${
                          copiedChannel === ch.key
                            ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400'
                            : 'border-white/[0.10] hover:border-white/[0.20] bg-white/[0.06] text-white/55 hover:text-white'
                        }`}
                      >
                        {copiedChannel === ch.key ? (
                          <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Copied!</>
                        ) : (
                          <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>Copy</>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty state before generating */}
          {!showSkeletons && !showCards && (
            <div className="text-center py-10">
              <div className="w-10 h-10 rounded-2xl bg-[#FEF0E8] border border-[#F5C9AD] flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-[#E05A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z"/>
                </svg>
              </div>
              <p className="text-[14px] font-medium text-white">Generate your message templates</p>
              <p className="text-[13px] text-white/35 mt-1 max-w-[280px] mx-auto leading-relaxed">
                AI-crafted messages for <span className="text-white font-medium">{restaurantProfile.restaurant_name}</span> — ready to copy and send.
              </p>
            </div>
          )}
        </div>

        {/* Section 2: QR Code Generator */}
        <div className="bg-[#111111] rounded-2xl border border-white/[0.07] p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-white">QR Code for your Google review page</h2>
            <p className="text-[12px] text-white/35 mt-0.5">Add this to your menu, receipt, or table card</p>
          </div>

          {restaurantProfile.google_maps_url ? (
            <div className="space-y-4">
              {!qrDataUrl && (
                <button
                  onClick={handleGenerateQr}
                  disabled={generatingQr}
                  className="flex items-center gap-2 bg-[#E05A28] hover:bg-[#C94E21] disabled:opacity-60 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors min-h-[44px]"
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
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <div className="p-4 bg-white rounded-2xl flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl}
                      alt="Google Review QR Code"
                      width={180}
                      height={180}
                      className="block w-40 h-40 sm:w-[180px] sm:h-[180px]"
                    />
                  </div>
                  <div className="flex flex-col items-center sm:items-start gap-3 text-center sm:text-left">
                    <p className="text-[13px] text-white/55 leading-relaxed max-w-[280px]">
                      Print this QR code and add it to your menu, receipt, or table tent card to collect more reviews.
                    </p>
                    <button
                      onClick={handleDownloadQr}
                      className="flex items-center gap-2 bg-[#111] hover:bg-[#222] text-white font-semibold text-[13px] px-4 py-2.5 rounded-xl transition-colors min-h-[44px]"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download QR Code
                    </button>
                    <button
                      onClick={() => setQrDataUrl(null)}
                      className="text-[12px] text-white/35 hover:text-white/55 transition-colors"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.06] px-4 py-5 text-sm text-white/55">
              Connect your Google Maps listing in{' '}
              <span className="text-white font-medium">Auto Reviews</span> to generate a QR code.
            </div>
          )}
        </div>

        {/* Section 3: Tips */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">Tips for getting more reviews</p>
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
                className="bg-[#111111] rounded-2xl border border-white/[0.07] p-4 sm:p-5"
              >
                <h3 className="text-[13px] font-semibold text-white mb-1.5">{tip.title}</h3>
                <p className="text-[12px] text-white/55 leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>

    </div>
  )
}
