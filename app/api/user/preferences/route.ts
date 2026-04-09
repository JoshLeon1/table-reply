import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { replyPreferences, emailNotifications } = body

  if (replyPreferences !== undefined) {
    const { error } = await supabase
      .from('restaurant_profiles')
      .update({ reply_preferences: replyPreferences })
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (emailNotifications !== undefined) {
    const { error } = await supabase
      .from('profiles')
      .update({ email_notifications: emailNotifications })
      .eq('id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
