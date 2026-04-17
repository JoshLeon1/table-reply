import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  /** Accessible label. Defaults to "Loading…". Pass "" to hide from AT. */
  label?: string
}

const SIZES = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

/**
 * Canonical indeterminate loading spinner. Inherits `currentColor`, so
 * drop it inside a button / text context and it matches the surrounding
 * color automatically.
 *
 * Replaces the hand-rolled SVG that was copy-pasted across login, signup,
 * forgot-password, reset-password, onboarding, contact, etc.
 */
export default function Spinner({ size = 'sm', className, label = 'Loading…' }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin flex-shrink-0', SIZES[size], className)}
      fill="none"
      viewBox="0 0 24 24"
      role={label ? 'status' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
