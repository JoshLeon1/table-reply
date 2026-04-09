'use client'

import { useState } from 'react'

interface KeywordAlert {
  id: string
  keyword: string
  alert_type: string
}

interface KeywordAlertsManagerProps {
  userId: string
  initialAlerts: KeywordAlert[]
}

export default function KeywordAlertsManager({ userId, initialAlerts }: KeywordAlertsManagerProps) {
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
    try {
      const res = await fetch(`/api/keyword-alerts/${id}`, { method: 'DELETE' })
      if (!res.ok) return
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch {
      // silently ignore
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
      {/* Existing keyword chips */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((alert) => (
            <span
              key={alert.id}
              className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[12px] border border-amber-200 flex items-center gap-1.5"
            >
              {alert.keyword}
              <button
                onClick={() => handleDelete(alert.id)}
                className="text-amber-500 hover:text-amber-800 transition-colors leading-none"
                aria-label={`Remove keyword "${alert.keyword}"`}
              >
                ×
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
          placeholder="e.g. hair, cold food, rude…"
          maxLength={50}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] text-[13px] focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newKeyword.trim()}
          className="px-4 py-2.5 rounded-xl bg-[#111] text-white text-[13px] font-medium hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {adding ? 'Adding…' : 'Add'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-[12px] text-red-600">{error}</p>
      )}

      {/* Tips */}
      <div className="space-y-1">
        <p className="text-[12px] text-[#888]">
          💡 You'll get an immediate email alert when a scraped review contains any of these words.
        </p>
        <p className="text-[12px] text-[#888]">
          Critical keywords (food poisoning, roach, health department, sick) are always monitored.
        </p>
      </div>
    </div>
  )
}
