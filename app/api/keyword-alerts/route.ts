import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('keyword_alerts')
    .select('id, keyword, alert_type')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const keyword = typeof body?.keyword === 'string' ? body.keyword.trim() : ''

  if (!keyword) {
    return NextResponse.json({ error: 'Keyword is required.' }, { status: 400 })
  }

  if (keyword.length > 50) {
    return NextResponse.json({ error: 'Keyword must be 50 characters or fewer.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('keyword_alerts')
    .insert({ user_id: user.id, keyword, alert_type: 'email' })
    .select('id, keyword, alert_type')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
