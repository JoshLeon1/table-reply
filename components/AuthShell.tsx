import { ReactNode } from 'react'
import Logo from '@/components/Logo'

interface AuthShellProps {
  /** Title shown above the form card, e.g. "Welcome Back" or "Start Free" */
  title: string
  /** Sub-text directly under the title */
  subtitle?: string
  /** Children rendered inside the card */
  children: ReactNode
  /** Slot rendered below the card (e.g. "Don't have an account? Sign up") */
  footer?: ReactNode
  /** Max-width override. Default 400px works for most forms; signup uses 440px. */
  maxWidth?: number
}

/**
 * Shared chrome for the auth pages (login / signup / forgot-password /
 * reset-password). Provides the dotted-paper background, centered logo,
 * elevated card, and optional below-card footer link.
 *
 * Each auth page used to duplicate ~20 lines of this chrome. Centralizing
 * it makes the brand treatment consistent and makes future polish (e.g.
 * changing the card elevation, the background pattern, or the footer
 * link styling) a one-file edit.
 */
export default function AuthShell({ title, subtitle, children, footer, maxWidth = 400 }: AuthShellProps) {
  return (
    <div
      className="min-h-screen bg-[#F8F6F3] flex items-center justify-center px-4 py-10 sm:py-12 relative"
      style={{
        backgroundImage: 'radial-gradient(circle, #E4DED8 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="w-full animate-fade-up" style={{ maxWidth }}>
        {/* Logo */}
        <div className="flex justify-center mb-7 sm:mb-8">
          <Logo />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-border shadow-modal p-6 sm:p-8">
          <h1 className="text-[20px] font-bold text-[#111] tracking-[-0.02em] mb-1">{title}</h1>
          {subtitle && <p className="text-[13px] text-[#A8A29E] mb-6">{subtitle}</p>}
          <div className={subtitle ? '' : 'mt-6'}>{children}</div>
        </div>

        {footer && <div className="mt-6 text-center text-[13px] text-[#A8A29E]">{footer}</div>}
      </div>
    </div>
  )
}
