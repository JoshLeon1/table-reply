import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({ email: '' }))
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 })
  }

  const supabase = createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${req.nextUrl.origin}/auth/callback`,
    },
  })

  if (error) {
    // Stay generic on the error message — leaking "no such user" is an
    // enumeration attack vector.
    return NextResponse.json({ ok: false, error: 'resend_failed' }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
