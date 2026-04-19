export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/reviews/:id
 *
 * Accepts a JSON body with any subset of patchable fields:
 *   { autopilot_posted_at?: string | null }
 *
 * The update is scoped to the authenticated user's row — no cross-user writes.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  // Build a safe allowlist of patchable fields
  const patch: Record<string, unknown> = {}
  if ('autopilot_posted_at' in body) {
    patch.autopilot_posted_at = body.autopilot_posted_at ?? new Date().toISOString()
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No patchable fields provided' }, { status: 400 })
  }

  const { error } = await supabase
    .from('scraped_reviews')
    .update(patch)
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
