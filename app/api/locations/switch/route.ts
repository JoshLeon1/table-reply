// app/api/locations/switch/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { locationId } = await request.json().catch(() => ({}))
  if (!locationId) return NextResponse.json({ error: 'locationId required' }, { status: 400 })

  // Verify the location belongs to this user
  const { data: location } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('id', locationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!location) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const response = NextResponse.json({ ok: true })
  response.cookies.set('active_location_id', locationId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: 'lax',
  })
  return response
}
