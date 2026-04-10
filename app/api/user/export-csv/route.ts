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

  const headers = [
    'Date',
    'Reviewer',
    'Rating',
    'Review Text',
    'Language',
    'Reply Status',
    'Generated Reply',
    'Staff Mentions',
    'Alert Triggered',
  ]

  const escape = (val: unknown): string => {
    if (val == null) return ''
    const str = String(val).replace(/\r?\n/g, ' ').replace(/"/g, '""')
    return str.includes(',') || str.includes('"') ? `"${str}"` : str
  }

  const rows = reviews.map((r) => [
    r.review_datetime_utc ? new Date(r.review_datetime_utc).toLocaleDateString('en-US') : '',
    r.reviewer_name ?? '',
    r.star_rating ?? '',
    r.review_text ?? '',
    r.language ?? '',
    r.reply_status ?? '',
    r.generated_reply ?? '',
    Array.isArray(r.staff_mentions) ? r.staff_mentions.join('; ') : '',
    r.alert_triggered ? 'Yes' : '',
  ].map(escape).join(','))

  const csv = [headers.join(','), ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="tablereply-reviews-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
