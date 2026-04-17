import Link from 'next/link'
import { LogoMark } from '@/components/Logo'

interface MarketingNavProps {
  /** Which variant of the right-hand CTA pair to render.
   *  - `cta`: "Sign in" link + "Try Free" accent button (landing page default)
   *  - `back`: single "← Back" link (inner pages like contact/privacy/terms)
   */
  right?: 'cta' | 'back'
}

/**
 * Sticky top nav for marketing pages. Brand-left, configurable-right.
 *
 * Design note: the shadow is intentionally almost invisible — a single
 * 1px line, not a drop shadow. Feels premium, not app-like.
 */
export default function MarketingNav({ right = 'cta' }: MarketingNavProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E4DED8]" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.03)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <LogoMark size={28} className="transition-transform duration-200 group-hover:scale-[1.03]" />
          <span className="font-bold text-[15px] sm:text-[17px] tracking-[-0.025em] text-[#111111]">ReplyFi</span>
        </Link>

        {right === 'cta' ? (
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/login"
              className="relative text-[13px] sm:text-sm font-medium text-[#57534E] hover:text-[#111] transition-colors duration-200 py-1
                         after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-px after:bg-[#111]
                         after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-left"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-3.5 sm:px-4 h-9 bg-[#E05A28] hover:bg-[#C94E21] active:bg-[#B34419] text-white text-[13px] sm:text-sm font-semibold rounded-lg transition-all duration-150 whitespace-nowrap shadow-[0_1px_2px_rgba(224,90,40,0.25)] hover:shadow-[0_2px_8px_rgba(224,90,40,0.35)]"
            >
              Try Free
            </Link>
          </div>
        ) : (
          <Link href="/" className="text-[13px] text-[#A8A29E] hover:text-[#111] transition-colors font-medium">← Back</Link>
        )}
      </div>
    </nav>
  )
}
