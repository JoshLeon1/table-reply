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
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-[#E4DED8]">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 h-14 sm:h-[60px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <LogoMark size={26} />
          <span className="font-bold text-[15px] sm:text-[16px] tracking-[-0.025em] text-[#111111]">ReplyFi</span>
        </Link>

        {right === 'cta' ? (
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/login"
              className="relative text-[13px] sm:text-[14px] font-medium text-[#57534E] hover:text-[#111] transition-colors duration-200 py-1
                         after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-px after:bg-[#111]
                         after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-left"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-4 h-9 bg-[#111] hover:bg-[#2A2A2A] text-white text-[13px] sm:text-[14px] font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap"
            >
              Try free
            </Link>
          </div>
        ) : (
          <Link href="/" className="text-[13px] text-[#57534E] hover:text-[#111] transition-colors font-medium">← Back</Link>
        )}
      </div>
    </nav>
  )
}
