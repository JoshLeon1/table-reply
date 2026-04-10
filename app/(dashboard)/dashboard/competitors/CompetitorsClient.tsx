'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import type { RestaurantProfile, CompetitorProfile } from '@/types'

interface Props {
  restaurantProfile: RestaurantProfile
  competitors: CompetitorProfile[]
  userAvgRating: number
}

function formatDate(iso: string | null) {
  if (!iso) return 'Never'
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return 'Never'
  }
}

function formatRating(val: number | null) {
  if (val === null || val === undefined) return '—'
  return val.toFixed(1)
}

// ─── Setup Flow ────────────────────────────────────────────────────────────────

function SetupFlow({ restaurantName }: { restaurantName: string }) {
  const [urls, setUrls] = useState(['', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    const nonEmpty = urls.filter((u) => u.trim())
    if (!nonEmpty.length) {
      setError('Enter at least one Google Maps URL.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/competitors/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: nonEmpty }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to add competitors.')
        return
      }
      window.location.reload()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E4DED8] p-8">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FEF0E8] mb-4">
            <svg className="w-6 h-6 text-[#E05A28]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-[18px] font-semibold text-[#111] mb-1">Track up to 3 competitors</h2>
          <p className="text-[13px] text-[#888]">See how you stack up against nearby restaurants</p>
        </div>

        <div className="space-y-4 mb-6">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <label className="block text-[12px] font-medium text-[#888] mb-1.5">
                Competitor {i + 1}
              </label>
              <input
                type="url"
                value={urls[i]}
                onChange={(e) => {
                  const next = [...urls]
                  next[i] = e.target.value
                  setUrls(next)
                }}
                placeholder="https://google.com/maps/place/competitor..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DED8] text-[13px] text-[#111] placeholder:text-[#CCC] focus:outline-none focus:ring-2 focus:ring-[#E05A28]/40 focus:border-[#E05A28] transition"
              />
            </div>
          ))}
        </div>

        {error && (
          <p className="text-[12px] text-red-500 mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full px-4 py-2.5 rounded-xl bg-[#111] text-white text-[13px] font-medium hover:bg-[#222] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding competitors…' : 'Add Competitors'}
        </button>
      </div>
    </div>
  )
}

// ─── Inline Add More Form ──────────────────────────────────────────────────────

function AddMoreForm({
  existingCount,
  onAdded,
  onCancel,
}: {
  existingCount: number
  onAdded: () => void
  onCancel: () => void
}) {
  const slots = 3 - existingCount
  const [urls, setUrls] = useState(Array(slots).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    const nonEmpty = urls.filter((u) => u.trim())
    if (!nonEmpty.length) {
      setError('Enter at least one URL.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/competitors/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: nonEmpty }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to add competitors.')
        return
      }
      onAdded()
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E4DED8] p-5 mb-6">
      <p className="text-[13px] font-medium text-[#111] mb-4">Add more competitors</p>
      <div className="space-y-3 mb-4">
        {Array.from({ length: slots }).map((_, i) => (
          <div key={i}>
            <label className="block text-[12px] font-medium text-[#888] mb-1.5">
              Competitor {existingCount + i + 1}
            </label>
            <input
              type="url"
              value={urls[i]}
              onChange={(e) => {
                const next = [...urls]
                next[i] = e.target.value
                setUrls(next)
              }}
              placeholder="https://google.com/maps/place/competitor..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DED8] text-[13px] text-[#111] placeholder:text-[#CCC] focus:outline-none focus:ring-2 focus:ring-[#E05A28]/40 focus:border-[#E05A28] transition"
            />
          </div>
        ))}
      </div>
      {error && <p className="text-[12px] text-red-500 mb-3">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-[#111] text-white text-[13px] font-medium hover:bg-[#222] transition disabled:opacity-50"
        >
          {loading ? 'Adding…' : 'Add'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-[#E4DED8] text-[13px] font-medium text-[#888] hover:bg-[#F3F0EC] transition"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Comparison Table ──────────────────────────────────────────────────────────

interface TableRow {
  label: string
  you: string | number | null
  c1: string | number | null
  c2: string | number | null
  c3: string | number | null
  bestIndex: number // 0 = you, 1 = c1, 2 = c2, 3 = c3 — or -1 if no clear best
}

function ComparisonTable({
  restaurantName,
  userAvgRating,
  competitors,
}: {
  restaurantName: string
  userAvgRating: number
  competitors: CompetitorProfile[]
}) {
  const c = (i: number) => competitors[i] ?? null

  function isHighest(vals: (number | null)[], idx: number): boolean {
    const num = vals[idx]
    if (num === null || num === undefined) return false
    return vals.every((v, i) => i === idx || v === null || v <= num)
  }

  const allRatings: (number | null)[] = [
    userAvgRating || null,
    c(0)?.avg_rating ?? null,
    c(1)?.avg_rating ?? null,
    c(2)?.avg_rating ?? null,
  ]

  const allCounts: (number | null)[] = [
    null, // user doesn't have review_count from competitor table
    c(0)?.review_count ?? null,
    c(1)?.review_count ?? null,
    c(2)?.review_count ?? null,
  ]

  const allRates: (number | null)[] = [
    null,
    c(0)?.response_rate ?? null,
    c(1)?.response_rate ?? null,
    c(2)?.response_rate ?? null,
  ]

  const colHeaders = [
    restaurantName,
    c(0)?.name ?? `Competitor 1`,
    c(1)?.name ?? (competitors.length > 1 ? `Competitor 2` : null),
    c(2)?.name ?? (competitors.length > 2 ? `Competitor 3` : null),
  ]

  const activeCount = 1 + competitors.length // you + competitors

  function cell(
    value: string | number | null,
    highlight: boolean,
    isYou: boolean
  ) {
    return (
      <td
        key={String(value)}
        className={`px-4 py-3 text-[13px] text-center ${
          isYou ? 'bg-[#FEF0E8]/60' : ''
        } ${highlight ? 'text-green-600 font-semibold' : 'text-[#111]'}`}
      >
        {value ?? '—'}
      </td>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E4DED8] overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E4DED8]">
              <th className="px-4 py-3 text-left text-[12px] font-medium text-[#888] w-36">Metric</th>
              {colHeaders.slice(0, activeCount).map((name, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-[12px] font-medium text-center ${
                    i === 0 ? 'bg-[#FEF0E8]/60 text-[#111]' : 'text-[#888]'
                  }`}
                >
                  {i === 0 ? (
                    <span className="flex flex-col items-center gap-0.5">
                      <span>{name}</span>
                      <span className="text-[10px] font-normal text-[#E05A28]">You</span>
                    </span>
                  ) : (
                    name
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4DED8]">
            {/* Average Rating */}
            <tr>
              <td className="px-4 py-3 text-[13px] text-[#888]">Avg Rating</td>
              {[
                userAvgRating ? `${userAvgRating.toFixed(1)} ★` : '—',
                c(0) ? (c(0)!.avg_rating !== null ? `${c(0)!.avg_rating!.toFixed(1)} ★` : '—') : null,
                c(1) ? (c(1)!.avg_rating !== null ? `${c(1)!.avg_rating!.toFixed(1)} ★` : '—') : null,
                c(2) ? (c(2)!.avg_rating !== null ? `${c(2)!.avg_rating!.toFixed(1)} ★` : '—') : null,
              ]
                .slice(0, activeCount)
                .map((v, i) =>
                  cell(v, isHighest(allRatings, i), i === 0)
                )}
            </tr>

            {/* Total Reviews */}
            <tr>
              <td className="px-4 py-3 text-[13px] text-[#888]">Total Reviews</td>
              {[
                null,
                c(0)?.review_count ?? null,
                c(1)?.review_count ?? null,
                c(2)?.review_count ?? null,
              ]
                .slice(0, activeCount)
                .map((v, i) =>
                  cell(
                    v !== null ? v.toLocaleString() : i === 0 ? '—' : '—',
                    isHighest(allCounts, i),
                    i === 0
                  )
                )}
            </tr>

            {/* Response Rate */}
            <tr>
              <td className="px-4 py-3 text-[13px] text-[#888]">Response Rate</td>
              {[null, c(0), c(1), c(2)]
                .slice(0, activeCount)
                .map((comp, i) => {
                  const rate = i === 0 ? null : (comp as CompetitorProfile | null)?.response_rate ?? null
                  const display = i === 0 ? '—' : rate !== null ? `${Math.round(rate)}%` : 'N/A'
                  return cell(display, isHighest(allRates, i), i === 0)
                })}
            </tr>

            {/* Last Synced */}
            <tr>
              <td className="px-4 py-3 text-[13px] text-[#888]">Last Synced</td>
              {[null, c(0), c(1), c(2)]
                .slice(0, activeCount)
                .map((comp, i) => {
                  const date = i === 0 ? '—' : formatDate((comp as CompetitorProfile | null)?.last_scraped_at ?? null)
                  return (
                    <td
                      key={i}
                      className={`px-4 py-3 text-[13px] text-center text-[#888] ${i === 0 ? 'bg-[#FEF0E8]/60' : ''}`}
                    >
                      {date}
                    </td>
                  )
                })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Rating Bar Chart ──────────────────────────────────────────────────────────

function RatingChart({
  restaurantName,
  userAvgRating,
  competitors,
}: {
  restaurantName: string
  userAvgRating: number
  competitors: CompetitorProfile[]
}) {
  const data = [
    { name: restaurantName, rating: userAvgRating || 0, isYou: true },
    ...competitors.map((c) => ({
      name: c.name ?? 'Competitor',
      rating: c.avg_rating ?? 0,
      isYou: false,
    })),
  ]

  return (
    <div className="bg-white rounded-2xl border border-[#E4DED8] p-6 mb-6">
      <p className="text-[13px] font-semibold text-[#111] mb-5">Rating comparison</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 20, right: 16, left: -20, bottom: 0 }} barSize={40}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#888' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 11, fill: '#CCC' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #E4DED8',
              borderRadius: 12,
              fontSize: 12,
              color: '#111',
            }}
            cursor={{ fill: '#F3F0EC' }}
            formatter={(value: unknown) => [`${Number(value).toFixed(1)} ★`, 'Rating']}
          />
          <Bar dataKey="rating" radius={[6, 6, 0, 0]}>
            <LabelList
              dataKey="rating"
              position="top"
              formatter={(v: unknown) => (Number(v) > 0 ? Number(v).toFixed(1) : '')}
              style={{ fontSize: 11, fill: '#888' }}
            />
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isYou ? '#E05A28' : '#E4DED8'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Insight Callout ───────────────────────────────────────────────────────────

function InsightCallout({
  restaurantName,
  userAvgRating,
  competitors,
}: {
  restaurantName: string
  userAvgRating: number
  competitors: CompetitorProfile[]
}) {
  const ratedCompetitors = competitors.filter((c) => c.avg_rating !== null)
  if (!ratedCompetitors.length) return null

  const competitorAvg =
    ratedCompetitors.reduce((sum, c) => sum + c.avg_rating!, 0) / ratedCompetitors.length

  const diff = Math.abs(userAvgRating - competitorAvg)
  const diffStr = diff.toFixed(1)

  // Find competitor with notably more reviews than user (rough heuristic)
  const userReviewProxy = competitors[0]?.review_count ?? null
  const bigReviewComp = userReviewProxy
    ? competitors.find((c) => c.review_count !== null && c.review_count > userReviewProxy * 2)
    : null

  const insights: { key: string; text: string }[] = []

  if (userAvgRating > competitorAvg) {
    insights.push({
      key: 'above',
      text: `You're ${diffStr} stars above your competitors' average — great work keeping standards high.`,
    })
  } else if (userAvgRating < competitorAvg) {
    insights.push({
      key: 'below',
      text: `You're ${diffStr} stars below your competitors' average — focus on the improvements in your Analytics tab.`,
    })
  }

  if (bigReviewComp) {
    const multiple = Math.round(bigReviewComp.review_count! / userReviewProxy!)
    insights.push({
      key: 'reviews',
      text: `⚠️ ${bigReviewComp.name ?? 'A competitor'} has ${multiple}x more reviews — consider adding a review request to your receipts.`,
    })
  }

  if (!insights.length) return null

  return (
    <div className="space-y-3 mb-6">
      {insights.map((ins) => (
        <div
          key={ins.key}
          className="bg-white rounded-2xl border border-[#E4DED8] border-l-4 border-l-[#E05A28] px-5 py-4"
        >
          <p className="text-[13px] text-[#111] leading-relaxed">{ins.text}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Competitor Card ───────────────────────────────────────────────────────────

function CompetitorCard({
  competitor,
  onRemove,
}: {
  competitor: CompetitorProfile
  onRemove: (id: string) => void
}) {
  const [removing, setRemoving] = useState(false)

  async function handleRemove() {
    setRemoving(true)
    try {
      await fetch(`/api/competitors/${competitor.id}`, { method: 'DELETE' })
      onRemove(competitor.id)
    } catch {
      setRemoving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E4DED8] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-[#111] truncate">
            {competitor.name ?? 'Unnamed Competitor'}
          </p>
          <a
            href={competitor.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-[#E05A28] hover:text-[#C94E21] transition truncate block mt-0.5"
          >
            View on Google Maps →
          </a>
        </div>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="flex-shrink-0 px-4 py-2 rounded-xl border border-[#E4DED8] text-[13px] font-medium text-[#888] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition disabled:opacity-50"
        >
          {removing ? 'Removing…' : 'Remove'}
        </button>
      </div>

      <div className="flex items-center gap-5 mt-4 pt-4 border-t border-[#E4DED8]">
        <div>
          <p className="text-[11px] text-[#888] mb-0.5">Avg Rating</p>
          <p className="text-[14px] font-semibold text-[#111]">
            {competitor.avg_rating !== null ? `${competitor.avg_rating.toFixed(1)} ★` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[#888] mb-0.5">Reviews</p>
          <p className="text-[14px] font-semibold text-[#111]">
            {competitor.review_count !== null ? competitor.review_count.toLocaleString() : '—'}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[#888] mb-0.5">Last Synced</p>
          <p className="text-[13px] text-[#888]">{formatDate(competitor.last_scraped_at)}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CompetitorsClient({
  restaurantProfile,
  competitors: initialCompetitors,
  userAvgRating,
}: Props) {
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>(initialCompetitors)
  const [showAddMore, setShowAddMore] = useState(false)

  function handleRemove(id: string) {
    setCompetitors((prev) => prev.filter((c) => c.id !== id))
  }

  // Setup flow
  if (competitors.length < 1) {
    return <SetupFlow restaurantName={restaurantProfile.restaurant_name} />
  }

  return (
    <div className="pb-12">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-semibold text-[#111]">Competitor Tracker</h1>
            <p className="text-[13px] text-[#888] mt-0.5">
              See how {restaurantProfile.restaurant_name} stacks up
            </p>
          </div>
          {competitors.length < 3 && !showAddMore && (
            <button
              onClick={() => setShowAddMore(true)}
              className="px-4 py-2 rounded-xl border border-[#E4DED8] bg-white text-[13px] font-medium text-[#111] hover:bg-[#F3F0EC] transition"
            >
              + Add more competitors
            </button>
          )}
        </div>

        {/* Inline add more form */}
        {showAddMore && (
          <AddMoreForm
            existingCount={competitors.length}
            onAdded={() => {
              setShowAddMore(false)
              window.location.reload()
            }}
            onCancel={() => setShowAddMore(false)}
          />
        )}

        {/* Comparison Table */}
        <ComparisonTable
          restaurantName={restaurantProfile.restaurant_name}
          userAvgRating={userAvgRating}
          competitors={competitors}
        />

        {/* Rating Chart */}
        <RatingChart
          restaurantName={restaurantProfile.restaurant_name}
          userAvgRating={userAvgRating}
          competitors={competitors}
        />

        {/* Insights */}
        <InsightCallout
          restaurantName={restaurantProfile.restaurant_name}
          userAvgRating={userAvgRating}
          competitors={competitors}
        />

        {/* Competitor Cards */}
        <div className="space-y-3">
          <p className="text-[12px] font-medium text-[#888] uppercase tracking-wide">Your competitors</p>
          {competitors.map((c) => (
            <CompetitorCard key={c.id} competitor={c} onRemove={handleRemove} />
          ))}
        </div>
      </div>
    </div>
  )
}
