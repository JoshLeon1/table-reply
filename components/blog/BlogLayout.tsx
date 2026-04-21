import Link from 'next/link'
import MarketingNav from '@/components/MarketingNav'
import MarketingFooter from '@/components/MarketingFooter'
import type { BlogPostMeta } from '@/content/blog/posts'

interface Props {
  meta: BlogPostMeta
  children: React.ReactNode
}

/**
 * Shared article wrapper for /blog/[slug] pages.
 *
 * - Consistent typography + spacing via .blog-prose (defined in globals.css)
 * - Soft mid-article + end-of-article CTAs to ReplyFi
 * - Same nav/footer as the rest of the marketing site
 */
export default function BlogLayout({ meta, children }: Props) {
  const publishedLabel = new Date(meta.datePublished).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketingNav right="cta" />

      <main id="main" className="flex-1">
        <article className="max-w-[720px] mx-auto px-5 sm:px-6 py-10 sm:py-16">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-[#A8A29E]">
            <Link href="/" className="hover:text-[#111] transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/blog" className="hover:text-[#111] transition-colors">Blog</Link>
          </nav>

          {/* Header */}
          <header className="mb-8 sm:mb-10">
            <h1 className="text-[30px] sm:text-[40px] font-bold tracking-tight leading-[1.15] text-[#111]">
              {meta.title}
            </h1>
            <div className="mt-4 flex items-center gap-3 text-[13px] text-[#7C7672]">
              <time dateTime={meta.datePublished}>{publishedLabel}</time>
              <span aria-hidden="true">·</span>
              <span>{meta.readingMinutes} min read</span>
            </div>
          </header>

          {/* Inline CTA card — appears right at the top above the content */}
          <div className="mb-8 sm:mb-10 rounded-2xl border border-[#F5C9AD] bg-[#FEF0E8] px-5 py-4 flex items-start gap-3">
            <span className="mt-0.5 w-2 h-2 rounded-full bg-[#E05A28] flex-shrink-0" />
            <p className="text-[13px] text-[#7C3010] leading-relaxed">
              <strong>Tired of writing replies yourself?</strong>{' '}
              <Link href="/signup" className="underline font-semibold hover:text-[#C94E21] transition-colors">
                ReplyFi drafts personalized replies in your voice
              </Link>{' '}
              across Google &amp; Yelp. Free 7-day trial, no credit card.
            </p>
          </div>

          {/* Article body */}
          <div className="blog-prose">
            {children}
          </div>

          {/* End-of-article CTA */}
          <aside className="mt-12 sm:mt-16 rounded-2xl border border-[#E4DED8] bg-[#F8F6F3] p-6 sm:p-8">
            <h2 className="text-[20px] sm:text-[22px] font-bold text-[#111] tracking-tight">
              Stop writing replies at 11pm.
            </h2>
            <p className="mt-2 text-[14px] text-[#57534E] leading-relaxed">
              ReplyFi syncs your Google and Yelp reviews and drafts a personalized reply
              for each one — in your business&apos;s voice. You approve and post in one tap.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] text-white text-[14px] font-semibold shadow-[0_2px_12px_rgba(224,90,40,0.3)] transition-colors"
              >
                Start free for 7 days →
              </Link>
              <span className="text-[12px] text-[#A8A29E] sm:ml-1">No credit card required · Cancel anytime</span>
            </div>
          </aside>

          {/* Related posts — simple hand-linked cluster */}
          <section className="mt-12 sm:mt-16 pt-8 border-t border-[#E4DED8]">
            <h3 className="text-[14px] font-semibold text-[#111] uppercase tracking-wider mb-4">Keep reading</h3>
            <Link
              href="/blog"
              className="text-[14px] text-[#E05A28] hover:text-[#C94E21] font-medium transition-colors"
            >
              ← All articles
            </Link>
          </section>
        </article>
      </main>

      <MarketingFooter />
    </div>
  )
}
