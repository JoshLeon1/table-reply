import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface EyebrowProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'default' | 'muted' | 'accent'
}

/**
 * Small-caps section label. 11px / 600 weight / uppercase / 0.09em tracking.
 * Default tone: --text-3 (#A8A29E). Use above KPIs, card titles, and
 * page section dividers to create the "private dashboard" feel.
 */
export default function Eyebrow({ className, tone = 'default', children, ...props }: EyebrowProps) {
  const tones = {
    default: 'text-[#A8A29E]',
    muted:   'text-[#C4BEB8]',
    accent:  'text-[#E05A28]',
  }
  return (
    <span
      className={cn(
        'inline-block text-[11px] font-semibold uppercase tracking-[0.09em] leading-4',
        tones[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
