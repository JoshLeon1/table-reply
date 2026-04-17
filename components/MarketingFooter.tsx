import Link from 'next/link'

/**
 * Footer shared by the marketing pages (landing, contact, privacy, terms).
 * One source of truth for footer links, brand line, and copyright year.
 *
 * Design note: keep the footer quiet — no bold colors, no CTA. The heavy
 * lifting is done by the page content. Muted text-3, hairline top border.
 */
export default function MarketingFooter() {
  return (
    <footer className="border-t border-[#E4DED8] bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#A8A29E]">
        <p className="text-[#C4BEB8]">© {new Date().getFullYear()} ReplyFi. All rights reserved.</p>
        <nav className="flex items-center gap-5">
          <Link href="/privacy" className="hover:text-[#111] transition-colors">Privacy</Link>
          <span className="text-[#E4DED8]" aria-hidden="true">·</span>
          <Link href="/terms" className="hover:text-[#111] transition-colors">Terms</Link>
          <span className="text-[#E4DED8]" aria-hidden="true">·</span>
          <Link href="/contact" className="hover:text-[#111] transition-colors">Contact</Link>
        </nav>
      </div>
    </footer>
  )
}
