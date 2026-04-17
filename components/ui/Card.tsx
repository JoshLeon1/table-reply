import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type CardVariant = 'hero' | 'standard' | 'flat' | 'inset'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: CardVariant
  /** When true, applies hover shadow. Use for card-as-link. Default false. */
  interactive?: boolean
}

const PADDINGS: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-5 sm:p-6',
  lg:   'p-6 sm:p-8',
}

const VARIANTS: Record<CardVariant, string> = {
  hero:     'bg-white rounded-[20px] border-0',
  standard: 'bg-white rounded-2xl border border-[#E4DED8]',
  flat:     'bg-transparent rounded-xl border border-[#E4DED8]',
  inset:    'bg-[#FAF8F5] rounded-xl border-0',
}

/**
 * Card variants:
 *   - hero:     The single most important card on a page (no border, 20px radius)
 *   - standard: Default — most cards (white, 16px radius, 1px border)
 *   - flat:     Blends into bg (transparent, 12px radius, 1px border). Dense info.
 *   - inset:    Callouts inside other cards (slate-50, 12px radius, no border)
 *
 * Hero gets a persistent soft shadow. Standard with interactive=true gets a
 * hover shadow. Flat and inset never show shadows.
 */
export function Card({ className, padding = 'md', variant = 'standard', interactive = false, children, ...props }: CardProps) {
  const base =
    variant === 'hero'
      ? 'shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]'
      : variant === 'standard' && interactive
      ? 'transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]'
      : ''

  return (
    <div
      className={cn(VARIANTS[variant], PADDINGS[padding], base, className)}
      {...props}
    >
      {children}
    </div>
  )
}
