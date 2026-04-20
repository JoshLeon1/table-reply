import { MetadataRoute } from 'next'
import { getAllPosts } from '@/content/blog/posts'

const BASE = 'https://replyfi.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const core: MetadataRoute.Sitemap = [
    { url: BASE,               lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/signup`,   lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/login`,    lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/blog`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/contact`,  lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/privacy`,  lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE}/terms`,    lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
  ]

  const posts: MetadataRoute.Sitemap = getAllPosts().map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.dateModified ?? p.datePublished),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...core, ...posts]
}
