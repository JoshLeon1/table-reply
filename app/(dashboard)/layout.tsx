import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import SubscriptionGateWrapper from '@/components/SubscriptionGateWrapper'
import { hasAccess, type AccessProfile, type AccessResult } from '@/lib/subscription/access'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Default: authenticated-paid equivalent so unauthenticated redirect stays
  // the page's job (not the layout's). This matches the previous behavior.
  let access: AccessResult = { ok: true, reason: 'paid', daysRemaining: 0 }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_paid, trial_started_at, subscription_period_end, subscription_canceled_at, subscription_past_due')
      .eq('id', user.id)
      .maybeSingle()

    access = hasAccess(profile as AccessProfile | null)
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ backgroundColor: '#F8F6F3' }}>
      {/* Subtle ambient gradient at top */}
      <div
        className="pointer-events-none fixed top-0 left-0 right-0 h-96 opacity-40"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(224,90,40,0.06), transparent)' }}
      />
      <Nav />
      {/* Spacer so content clears the fixed nav (64px nav + safe-area-inset-top for iOS notch) */}
      <div className="flex-shrink-0" style={{ height: 'calc(64px + env(safe-area-inset-top))' }} />
      <main id="main" className="flex-1 flex flex-col">
        <SubscriptionGateWrapper access={access}>
          {children}
        </SubscriptionGateWrapper>
      </main>
    </div>
  )
}
