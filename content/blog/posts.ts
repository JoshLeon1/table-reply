// ─────────────────────────────────────────────────────────────────────────────
// Blog post registry
//
// Each post is a static entry with metadata + lazy-loaded content component.
// Adding a new post = add a TSX file in content/blog/ and register it here.
// ─────────────────────────────────────────────────────────────────────────────

import type { ComponentType } from 'react'

export interface BlogPostMeta {
  slug: string
  title: string
  description: string // ≤155 chars for SEO
  datePublished: string // ISO date
  dateModified?: string
  readingMinutes: number
  ogImage?: string // defaults to site OG image
  keywords: string[] // for meta keywords + internal use
}

export interface BlogPost extends BlogPostMeta {
  Content: ComponentType
}

// Lazy import each post's content component
import HowToRespondBadGoogleReview, {
  meta as HowToRespondBadGoogleReviewMeta,
} from './how-to-respond-to-bad-google-review'

import NegativeReviewResponseExamples, {
  meta as NegativeReviewResponseExamplesMeta,
} from './negative-restaurant-review-response-examples'

import HowToRemoveFakeGoogleReview, {
  meta as HowToRemoveFakeGoogleReviewMeta,
} from './how-to-remove-fake-google-review'

import HowToGetMoreGoogleReviews, {
  meta as HowToGetMoreGoogleReviewsMeta,
} from './how-to-get-more-google-reviews-restaurant'

export const POSTS: BlogPost[] = [
  { ...HowToRespondBadGoogleReviewMeta,    Content: HowToRespondBadGoogleReview },
  { ...NegativeReviewResponseExamplesMeta, Content: NegativeReviewResponseExamples },
  { ...HowToRemoveFakeGoogleReviewMeta,    Content: HowToRemoveFakeGoogleReview },
  { ...HowToGetMoreGoogleReviewsMeta,      Content: HowToGetMoreGoogleReviews },
]

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug)
}

export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.datePublished.localeCompare(a.datePublished))
}
