import { cn } from '@/lib/utils'

interface StarsProps {
  /** 0 to 5, supports decimals (rounded to nearest int for fill). */
  rating: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'w-3 h-3',        // 12px — table cells
  md: 'w-4 h-4',        // 16px — review cards
  lg: 'w-5 h-5',        // 20px — hero metric
}

/**
 * Canonical star rating display. Amber filled, border-color empty.
 * Used everywhere a rating is shown in the UI. Rounds input to nearest
 * whole star for fill state.
 */
export default function Stars({ rating, size = 'md', className }: StarsProps) {
  const filled = Math.round(Math.max(0, Math.min(5, rating)))
  return (
    <div className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={cn(SIZES[size], i <= filled ? 'text-amber-400' : 'text-[#E4DED8]')}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}
