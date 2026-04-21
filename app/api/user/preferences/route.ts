export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveActiveOrPrimaryLocationId } from '@/lib/locations/active'

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { replyPreferences, emailNotifications } = body

  if (replyPreferences !== undefined) {
    // Save to the currently-viewed location — reply prefs (voice, autopilot,
    // etc.) are per-location. Writing to primary would silently overwrite
    // prefs for the wrong row when a user edits settings from a secondary
    // location.
    const activeId = await resolveActiveOrPrimaryLocationId(supabase, user.id)
    if (!activeId) return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    const { error } = await supabase
      .from('business_profiles')
      .update({ reply_preferences: replyPreferences })
      .eq('user_id', user.id)
      .eq('id', activeId)
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
