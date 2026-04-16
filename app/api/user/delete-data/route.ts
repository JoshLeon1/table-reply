export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function DELETE() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Use service role to delete auth user (requires admin privileges)
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Delete all user data in dependency order
  // Leaf tables first, then parent tables, then auth user
  await Promise.all([
    serviceClient.from('replies').delete().eq('user_id', user.id),
    serviceClient.from('reply_feedback').delete().eq('user_id', user.id),
    serviceClient.from('scraped_reviews').delete().eq('user_id', user.id),
    serviceClient.from('competitor_profiles').delete().eq('user_id', user.id),
    serviceClient.from('keyword_alerts').delete().eq('user_id', user.id),
  ])

  await Promise.all([
    serviceClient.from('reviews').delete().eq('user_id', user.id),
  ])

  await Promise.all([
    serviceClient.from('business_profiles').delete().eq('user_id', user.id),
    serviceClient.from('profiles').delete().eq('id', user.id),
  ])

  // Delete the auth user
  const { error: authError } = await serviceClient.auth.admin.deleteUser(user.id)
  if (authError) {
    console.error('Failed to delete auth user:', authError)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
