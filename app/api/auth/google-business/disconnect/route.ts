export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteGbpToken } from '@/lib/gbp/client'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const rawLocationId: string | undefined = body?.locationId ?? undefined

  // Validate the caller actually owns the location before scoping the
  // delete to it. Without this, a client could pass any business_profiles.id
  // as locationId — the delete would still only match rows where
  // user_id = current user, so the attack surface is narrow, but we want
  // the API to fail loud on bad input rather than silently no-op.
  let locationId: string | undefined
  if (rawLocationId) {
    const { data: owned } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', rawLocationId)
      .maybeSingle()
    if (!owned) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }
    locationId = owned.id
  }

  await deleteGbpToken(user.id, locationId)
  return NextResponse.json({ ok: true })
}
