export const dynamic = 'force-dynamic'
export const metadata = { title: 'Settings — ReplyFi' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import SettingsPageClient from './SettingsPageClient'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [{ data: profile }, { data: restaurantProfile }, { data: keywordAlerts }, { data: gbpToken }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('business_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('keyword_alerts').select('id, keyword, alert_type, user_id, created_at').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabaseAdmin.from('google_business_tokens').select('location_name').eq('user_id', user.id).maybeSingle(),
  ])

  if (!restaurantProfile) redirect('/onboarding')

  const trialStartedAt = profile?.trial_started_at ? new Date(profile.trial_started_at) : null
  const trialEndDate = trialStartedAt ? new Date(trialStartedAt.getTime() + 7 * 24 * 60 * 60 * 1000) : null
  const daysRemaining = trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const replyPreferences = {
    endWithOwnerName: true,
    includeBusinessName: true,
    inviteBack: true,
    ...(restaurantProfile?.reply_preferences ?? {}),
  }

  const emailNotifications = {
    weeklyDigest: true,
    ...(profile?.email_notifications ?? {}),
  }

  // Extract autopilot rules from reply_preferences, if present
  const savedAutopilot = (restaurantProfile?.reply_preferences as { autopilot?: unknown } | null)?.autopilot

  return (
    <div className="max-w-2xl">
      <SettingsPageClient
        userId={user.id}
        userEmail={user.email ?? ''}
        restaurantProfile={restaurantProfile}
        keywordAlerts={keywordAlerts ?? []}
        replyPreferences={replyPreferences}
        emailNotifications={emailNotifications}
        isPaid={profile?.is_paid ?? false}
        daysRemaining={daysRemaining}
        stripePlan={profile?.stripe_plan ?? null}
        autopilotRules={savedAutopilot as import('@/types').AutopilotRules | null ?? null}
        gbpConnected={!!gbpToken}
        gbpLocationName={gbpToken?.location_name ?? null}
      />
    </div>
  )
}
