import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeltaProps {
  /** Percent or absolute number. Positive = up, negative = down, 0 = flat. */
  value: number
  /** Render as "+0.2" / "-0.1" / "0" — the label text. If omitted, formats value with sign. */
  label?: string
  /** Unit suffix (e.g. "%" or "pts"). Default none. */
  unit?: string
  /** When true, up is bad and down is good (use for things like response-time). */
  inverted?: boolean
  className?: string
  size?: 'sm' | 'md'
}

/**
 * Colored delta chip: ▲ +0.2 (green) / ▼ -0.1 (red) / — 0 (gray).
 * Uses lucide ArrowUpRight/ArrowDownRight/Minus, tabular numerals.
 */
export default function Delta({ value, label, unit = '', inverted = false, className, size = 'md' }: DeltaProps) {
  const dir: 'up' | 'down' | 'flat' = value > 0 ? 'up' : value < 0 ? 'down' : 'flat'
  const good = inverted ? dir === 'down' : dir === 'up'
  const bad  = inverted ? dir === 'up' : dir === 'down'

  const color =
    dir === 'flat' ? 'text-[#6B6862]' :
    good           ? 'text-[#0B8A5B]' :
    bad            ? 'text-[#B8281E]' :
                     'text-[#6B6862]'

  const Icon = dir === 'up' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus
  const sizes = {
    sm: { text: 'text-[11px]', icon: 12, gap: 'gap-0.5' },
    md: { text: 'text-[12px]', icon: 14, gap: 'gap-1' },
  }[size]

  const text = label ?? `${value > 0 ? '+' : ''}${value}${unit}`

  return (
    <span className={cn('inline-flex items-center font-medium tnum', sizes.text, sizes.gap, color, className)}>
      <Icon size={sizes.icon} strokeWidth={2} className="flex-shrink-0" />
      {text}
    </span>
  )
}
