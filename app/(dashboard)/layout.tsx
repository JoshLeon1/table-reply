import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import SubscriptionGateWrapper from '@/components/SubscriptionGateWrapper'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isPaid = true       // default to paid so unauthenticated redirect is handled by page
  let daysRemaining = 7

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_paid, trial_started_at')
      .eq('id', user.id)
      .maybeSingle()

    isPaid = profile?.is_paid ?? false

    if (!isPaid && profile?.trial_started_at) {
      const trialEnd = new Date(profile.trial_started_at).getTime() + 7 * 24 * 60 * 60 * 1000
      daysRemaining = Math.max(0, Math.ceil((trialEnd - Date.now()) / (1000 * 60 * 60 * 24)))
    } else if (!isPaid) {
      daysRemaining = 0
    }
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
      <SubscriptionGateWrapper isPaid={isPaid} daysRemaining={daysRemaining}>
        {children}
      </SubscriptionGateWrapper>
    </div>
  )
}
