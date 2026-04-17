'use client'

import { useState } from 'react'

interface StarRatingProps {
  value: number             // 0-5
  onChange?: (n: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string            // e.g. "Rate this reply"
}

export default function StarRating({ value, onChange, readonly, size = 'md', label = 'Rating' }: StarRatingProps) {
  const [focusIndex, setFocusIndex] = useState(value || 1)
  const px = size === 'sm' ? 16 : size === 'lg' ? 28 : 20
  const isInteractive = !readonly && !!onChange

  const handleKey = (e: React.KeyboardEvent) => {
    if (!isInteractive) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(5, focusIndex + 1)
      setFocusIndex(next)
      onChange!(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.max(1, focusIndex - 1)
      setFocusIndex(next)
      onChange!(next)
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKey}
      className="inline-flex items-center gap-1"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
            tabIndex={value === n || (value === 0 && n === 1) ? 0 : -1}
            disabled={!isInteractive}
            onClick={() => isInteractive && onChange!(n)}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-colors ${isInteractive ? 'hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25' : 'cursor-default'}`}
          >
            <svg width={px} height={px} viewBox="0 0 20 20" fill={filled ? '#E05A28' : 'none'} stroke={filled ? '#E05A28' : '#C4BEB8'} strokeWidth="1.5">
              <polygon points="10,2 12.5,7.5 18.5,8.2 14,12.4 15.2,18 10,15.2 4.8,18 6,12.4 1.5,8.2 7.5,7.5" strokeLinejoin="round"/>
            </svg>
          </button>
        )
      })}
    </div>
  )
}
