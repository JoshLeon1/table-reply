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
  hero:     'bg-white rounded-2xl border border-[#EDE9E4]',
  standard: 'bg-[#FEFCF8] rounded-xl border border-[#EDE6DC]',
  flat:     'bg-transparent rounded-xl',
  inset:    'bg-[#FAF8F5] rounded-xl border border-[#EDE9E4]',
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
  // Hairline borders do the heavy lifting. Shadows are rare and reserved for
  // interactive hover — modern editorial feel, not 2019 lifted-panel feel.
  const base =
    variant === 'standard' && interactive
      ? 'transition-colors duration-200 hover:border-[#D0C9C1]'
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
