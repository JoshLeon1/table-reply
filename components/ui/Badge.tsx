import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error'
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#EDE9E4] text-[#555]',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-[#FEF0E8] text-[#B34419] border border-[#F5C9AD]',
    error:   'bg-red-50 text-red-600 border border-red-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
