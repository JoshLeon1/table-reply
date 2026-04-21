import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: reviews } = await supabase
    .from('scraped_reviews')
    .select('*')
    .eq('user_id', user.id)
    .order('review_datetime_utc', { ascending: false })

  if (!reviews || reviews.length === 0) {
    return NextResponse.json({ error: 'No reviews found' }, { status: 404 })
  }

  // Always wrap every field in double-quotes, escaping any internal quotes.
  const q = (val: unknown): string => {
    if (val == null) return '""'
    const str = String(val)
      .replace(/\r?\n/g, ' ')   // collapse newlines to a space
      .replace(/"/g, '""')       // escape internal quotes
    return `"${str}"`
  }

  const platformLabel = (source: string | null | undefined): string => {
    if (source === 'yelp') return 'Yelp'
    return 'Google'
  }

  const formatDate = (iso: string | null | undefined): string => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    } catch { return iso }
  }

  const statusLabel = (s: string | null | undefined): string => {
    if (s === 'approved') return 'Approved'
    if (s === 'dismissed') return 'Dismissed'
    if (s === 'skipped') return 'Skipped (no text)'
    return 'Pending'
  }

  const headers = [
    'Date',
    'Reviewer',
    'Stars',
    'Platform',
    'Review Text',
    'Reply Status',
    'Generated Reply',
    'Language',
    'Staff Mentioned',
    'Keyword Alert',
  ]

  const rows = reviews.map((r) => [
    q(formatDate(r.review_datetime_utc)),
    q(r.reviewer_name),
    q(r.star_rating),
    q(platformLabel(r.source)),
    q(r.review_text),
    q(statusLabel(r.reply_status)),
    q(r.generated_reply),
    q(r.language || 'English'),
    q(Array.isArray(r.staff_mentions) && r.staff_mentions.length ? r.staff_mentions.join(', ') : ''),
    q(r.alert_triggered ? 'Yes' : ''),
  ].join(','))

  const csv = [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="replyfi-reviews-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
