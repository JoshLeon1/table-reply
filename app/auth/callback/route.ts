export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/welcome'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') // e.g. /reset-password

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // If a specific next page was requested (e.g. password reset), go there.
      // Only allow same-origin paths (must start with "/" but not "//") to
      // prevent open-redirect phishing via crafted magic-link URLs.
      if (next && /^\/(?!\/)/.test(next)) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Fire-and-forget welcome email (idempotent via welcome_email_sent_at).
      // Never block login on failure.
      try {
        const supabaseAdmin = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )
        const { data: p } = await supabaseAdmin
          .from('profiles')
          .select('welcome_email_sent_at, full_name')
          .eq('id', data.user.id)
          .maybeSingle()

        if (p && !p.welcome_email_sent_at && data.user.email) {
          const metaName =
            (data.user.user_metadata as { full_name?: string } | null)?.full_name ?? null
          const result = await sendWelcomeEmail({
            toEmail: data.user.email,
            firstName: p.full_name ?? metaName,
          })
          if (!('error' in result && result.error)) {
            await supabaseAdmin
              .from('profiles')
              .update({ welcome_email_sent_at: new Date().toISOString() })
              .eq('id', data.user.id)
          }
        }
      } catch (err) {
        console.error('[auth/callback] Welcome email hook failed:', err)
      }

      // Otherwise route by onboarding status
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', data.user.id)
        .eq('is_primary', true)
        .maybeSingle()

      if (!profile) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    if (error) {
      console.error('[ReplyFi] Auth callback error:', error.message)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
