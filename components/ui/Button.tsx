import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed select-none'

    const variants = {
      primary:
        'bg-[#111] hover:bg-[#2A2A2A] active:bg-[#0A0A0A] text-white focus-visible:ring-[#111]',
      accent:
        'bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white focus-visible:ring-[#E05A28] shadow-[0_1px_2px_rgba(224,90,40,0.25)]',
      secondary:
        'bg-white border border-[#E4DED8] hover:border-[#C4BEB8] hover:bg-[#FAF8F5] text-[#111] focus-visible:ring-[#111]',
      ghost:
        'hover:bg-[#EDE9E4] text-[#57534E] hover:text-[#111] focus-visible:ring-[#111]',
      destructive:
        'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white focus-visible:ring-red-500',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-[13px] gap-1.5 h-8',
      md: 'px-4 py-2 text-sm gap-2 h-9',
      lg: 'px-5 py-2.5 text-sm gap-2 h-10',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5 opacity-70 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
