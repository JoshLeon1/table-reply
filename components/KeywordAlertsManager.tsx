'use client'

import { useState } from 'react'

interface KeywordAlert {
  id: string
  keyword: string
  alert_type: string
}

interface KeywordAlertsManagerProps {
  initialAlerts: KeywordAlert[]
}

export default function KeywordAlertsManager({ initialAlerts }: KeywordAlertsManagerProps) {
  const [alerts, setAlerts] = useState<KeywordAlert[]>(initialAlerts)
  const [newKeyword, setNewKeyword] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    const trimmed = newKeyword.trim()
    if (!trimmed) return

    setAdding(true)
    setError(null)

    try {
      const res = await fetch('/api/keyword-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: trimmed }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to add keyword.')
        return
      }

      const data = await res.json()
      setAlerts((prev) => [...prev, data])
      setNewKeyword('')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    // Optimistic removal so the chip disappears instantly; restore on error
    const previous = alerts
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    setError(null)
    try {
      const res = await fetch(`/api/keyword-alerts/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setAlerts(previous)
        setError(data?.error ?? 'Could not remove keyword. Please try again.')
      }
    } catch {
      setAlerts(previous)
      setError('Network error. Please try again.')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-4">
      {/* Empty state */}
      {alerts.length === 0 && (
        <p className="text-[13px] text-[#A8A29E] italic">No keyword alerts yet — add one below.</p>
      )}

      {/* Existing keyword chips */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((alert) => (
            <span
              key={alert.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FEF0E8] text-[#B34419] text-[12px] font-medium border border-[#F5C9AD]"
            >
              {alert.keyword}
              <button
                onClick={() => handleDelete(alert.id)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-[#E05A28] hover:bg-[#F5C9AD] hover:text-[#B34419] transition-all leading-none flex-shrink-0"
                aria-label={`Remove keyword "${alert.keyword}"`}
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add keyword row */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. hair, cold food, wait time…"
          maxLength={50}
          className="flex-1 h-11 px-3.5 rounded-xl border border-[#E4DED8] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] bg-[#F8F6F3] focus:bg-white transition-all duration-150"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newKeyword.trim()}
          className="h-11 px-4 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap shadow-[0_1px_3px_rgba(224,90,40,0.25)]"
        >
          {adding ? 'Adding…' : '+ Add'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2">
          <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[12px] text-red-600">{error}</p>
        </div>
      )}

      {/* Tips */}
      <div className="bg-[#F3F0EC] rounded-xl border border-[#E4DED8] px-4 py-3 space-y-1.5">
        <p className="text-[12px] text-[#666] leading-relaxed">
          You&apos;ll get an email alert when a synced review contains any of these words.
        </p>
        <p className="text-[12px] text-[#888]">
          Critical terms (food poisoning, roach, health department) are always monitored automatically.
        </p>
      </div>
    </div>
  )
}
