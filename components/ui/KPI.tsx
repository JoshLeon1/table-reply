import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import Eyebrow from './Eyebrow'

interface KPIProps extends HTMLAttributes<HTMLDivElement> {
  /** Text above the number, e.g. "RATING — LAST 30 DAYS". */
  label: string
  /** The number itself. String lets callers pass "4.7" or formatted currency. */
  value: ReactNode
  /** Smaller text below the number, e.g. "from 182 reviews". */
  sub?: ReactNode
  /** Right-aligned slot next to label, typically a <Delta /> chip. */
  trailing?: ReactNode
  /** Bottom slot, for a sparkline or secondary detail. */
  footer?: ReactNode
  variant?: 'hero' | 'secondary'
}

/**
 * Single KPI block — eyebrow / big tabular number / optional sub / optional sparkline.
 * Two sizes:
 *   - 'hero':      44px / 36px below 640px. One per page.
 *   - 'secondary': 28px / 24px below 640px. Action strip and sub-metrics.
 */
export default function KPI({ label, value, sub, trailing, footer, variant = 'hero', className, ...props }: KPIProps) {
  const sizes = variant === 'hero'
    ? 'text-[40px] sm:text-[52px] leading-[0.95]'
    : 'text-[26px] sm:text-[32px] leading-[1.05]'

  return (
    <div className={cn('flex flex-col gap-2', className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <Eyebrow>{label}</Eyebrow>
        {trailing}
      </div>
      <div className={cn('tracking-[-0.035em] text-[#111111] tnum', sizes)} style={{ fontWeight: 500 }}>
        {value}
      </div>
      {sub && <div className="text-[12px] text-[#57534E] tnum">{sub}</div>}
      {footer && <div className="mt-2">{footer}</div>}
    </div>
  )
}
