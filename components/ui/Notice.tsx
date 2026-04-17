import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface NoticeProps {
  variant?: 'success' | 'error' | 'warning' | 'info'
  children: ReactNode
  className?: string
  /** Optional icon override. If omitted, a sensible default is rendered per variant. */
  icon?: ReactNode
  /** Role hint — "alert" for errors (announced immediately), "status" for success/info. */
  role?: 'alert' | 'status'
}

const VARIANTS = {
  success: {
    surface: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    iconColor: 'text-emerald-600',
  },
  error: {
    surface: 'bg-red-50 border-red-200',
    text: 'text-red-600',
    iconColor: 'text-red-500',
  },
  warning: {
    surface: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    iconColor: 'text-amber-600',
  },
  info: {
    surface: 'bg-[#F3F0EC] border-[#E4DED8]',
    text: 'text-[#57534E]',
    iconColor: 'text-[#57534E]',
  },
} as const

function DefaultIcon({ variant }: { variant: keyof typeof VARIANTS }) {
  const paths: Record<keyof typeof VARIANTS, ReactNode> = {
    success: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
    error:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    warning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.2 16a2 2 0 001.73 3z" />,
    info:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  }
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      {paths[variant]}
    </svg>
  )
}

/**
 * Inline feedback card — success, error, warning, or info.
 *
 * Replaces the hand-rolled `<div className="bg-emerald-50 border …">` pattern
 * duplicated across login, signup, forgot-password, reset-password, contact,
 * and various dashboard pages.
 *
 * - Default role: `alert` for errors (AT announces immediately), `status`
 *   for success/info/warning.
 * - Icon is rendered automatically per variant; override via the `icon` prop.
 */
export default function Notice({ variant = 'info', children, className, icon, role }: NoticeProps) {
  const v = VARIANTS[variant]
  const resolvedRole = role ?? (variant === 'error' ? 'alert' : 'status')
  return (
    <div
      role={resolvedRole}
      className={cn('rounded-xl border px-4 py-3 flex items-start gap-2.5', v.surface, className)}
    >
      <span className={v.iconColor}>
        {icon ?? <DefaultIcon variant={variant} />}
      </span>
      <div className={cn('text-[13px] leading-relaxed flex-1', v.text)}>{children}</div>
    </div>
  )
}
