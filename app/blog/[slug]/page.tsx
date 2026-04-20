import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BlogLayout from '@/components/blog/BlogLayout'
import { getPost, getAllPosts } from '@/content/blog/posts'

export const dynamicParams = false // 404 for unknown slugs

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug)
  if (!post) return { title: 'Not Found' }

  const url = `https://replyfi.app/blog/${post.slug}`
  return {
    title: `${post.title} — ReplyFi`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: 'article',
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified ?? post.datePublished,
      siteName: 'ReplyFi',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug)
  if (!post) notFound()

  const { Content } = post
  const url = `https://replyfi.app/blog/${post.slug}`

  // JSON-LD Article schema for rich Google results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.datePublished,
    dateModified: post.dateModified ?? post.datePublished,
    author: { '@type': 'Organization', name: 'ReplyFi', url: 'https://replyfi.app' },
    publisher: {
      '@type': 'Organization',
      name: 'ReplyFi',
      logo: { '@type': 'ImageObject', url: 'https://replyfi.app/favicon.svg' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    keywords: post.keywords.join(', '),
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogLayout meta={post}>
        <Content />
      </BlogLayout>
    </>
  )
}
