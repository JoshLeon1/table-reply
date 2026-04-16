export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { channel } = body

  if (!channel) {
    return NextResponse.json({ error: 'Missing channel' }, { status: 400 })
  }

  const VALID_CHANNELS = ['sms', 'email', 'receipt', 'tablecard']
  if (!VALID_CHANNELS.includes(channel)) {
    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
  }

  const { error } = await supabase.from('review_request_clicks').insert({
    user_id: user.id,
    channel,
  })

  if (error) {
    console.error('Error tracking click:', error)
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
