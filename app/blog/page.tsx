import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingNav from '@/components/MarketingNav'
import MarketingFooter from '@/components/MarketingFooter'
import { getAllPosts } from '@/content/blog/posts'

export const metadata: Metadata = {
  title: 'Blog — ReplyFi',
  description:
    'Practical guides for restaurant owners — how to respond to reviews, get more 5-star ratings, and protect your reputation online.',
  alternates: { canonical: 'https://replyfi.app/blog' },
  openGraph: {
    title: 'ReplyFi Blog — Review Management for Restaurants',
    description:
      'Practical guides for restaurant owners — how to respond to reviews, get more 5-star ratings, and protect your reputation online.',
    url: 'https://replyfi.app/blog',
    type: 'website',
  },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketingNav right="cta" />

      <main id="main" className="flex-1">
        <div className="max-w-[860px] mx-auto px-5 sm:px-6 py-12 sm:py-20">
          <header className="mb-10 sm:mb-14">
            <p className="text-[13px] font-semibold text-[#E05A28] uppercase tracking-[0.1em] mb-3">
              ReplyFi Blog
            </p>
            <h1 className="text-[34px] sm:text-[46px] font-bold tracking-tight leading-[1.1] text-[#111]">
              Run a better restaurant online.
            </h1>
            <p className="mt-4 text-[16px] sm:text-[18px] text-[#57534E] leading-relaxed max-w-[620px]">
              Practical playbooks on review replies, reputation management, and getting more
              5-star ratings — written for restaurant owners, not SEO farms.
            </p>
          </header>

          <ul className="space-y-6">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block rounded-2xl border border-[#E4DED8] hover:border-[#D4CFC6] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-200 p-6 sm:p-7 bg-white"
                >
                  <div className="flex items-center gap-2 text-[12px] text-[#A8A29E] mb-2">
                    <time dateTime={post.datePublished}>
                      {new Date(post.datePublished).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </time>
                    <span aria-hidden="true">·</span>
                    <span>{post.readingMinutes} min read</span>
                  </div>
                  <h2 className="text-[20px] sm:text-[24px] font-bold text-[#111] tracking-tight leading-snug group-hover:text-[#E05A28] transition-colors">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-[14px] sm:text-[15px] text-[#57534E] leading-relaxed">
                    {post.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#E05A28] group-hover:gap-2 transition-all">
                    Read article →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <MarketingFooter />
    </div>
  )
}
