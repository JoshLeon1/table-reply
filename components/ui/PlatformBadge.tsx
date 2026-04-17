import { cn } from '@/lib/utils'

interface PlatformBadgeProps {
  /** 'yelp' | 'tripadvisor' | anything else renders as Google. */
  source?: string | null
  className?: string
}

const VARIANTS = {
  yelp:        { label: 'YELP', classes: 'text-red-500 bg-red-50 border-red-200' },
  tripadvisor: { label: 'TA',   classes: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  google:      { label: 'G',    classes: 'text-blue-500 bg-blue-50 border-blue-200' },
} as const

/**
 * Small platform attribution badge shown next to a review's reviewer name.
 * Source is permissive (string | null | undefined) — unknown values fall
 * back to Google branding.
 */
export default function PlatformBadge({ source, className }: PlatformBadgeProps) {
  const variant = source === 'yelp' ? VARIANTS.yelp : source === 'tripadvisor' ? VARIANTS.tripadvisor : VARIANTS.google
  return (
    <span className={cn('inline-flex items-center text-[10px] font-bold rounded-md px-1.5 py-0.5 leading-none border', variant.classes, className)}>
      {variant.label}
    </span>
  )
}
