export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RestaurantProfileForm from '@/components/RestaurantProfileForm'
import ManageBillingButton from './ManageBillingButton'
import SettingsClient from './SettingsClient'
import KeywordAlertsManager from '@/components/KeywordAlertsManager'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: restaurantProfile }, { data: keywordAlerts }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('restaurant_profiles').select('*').eq('user_id', user.id).single(),
    supabase
      .from('keyword_alerts')
      .select('id, keyword, alert_type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
  ])

  if (!restaurantProfile) redirect('/onboarding')

  const trialStartedAt = profile?.trial_started_at ? new Date(profile.trial_started_at) : null
  const trialEndDate = trialStartedAt
    ? new Date(trialStartedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    : null
  const now = new Date()
  const daysRemaining = trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  const isPaid = profile?.is_paid

  const defaultReplyPrefs = {
    endWithOwnerName: true,
    includeRestaurantName: true,
    inviteBack: true,
  }

  const defaultEmailNotifs = {
    newReviewsScrapped: true,
  }

  const replyPreferences = {
    ...defaultReplyPrefs,
    ...(restaurantProfile?.reply_preferences ?? {}),
  }

  const emailNotifications = {
    ...defaultEmailNotifs,
    ...(profile?.email_notifications ?? {}),
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#111]">Settings</h1>
        <p className="text-[13px] text-[#888] mt-0.5">Manage your restaurant profile and subscription.</p>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-2xl border border-[#E4DED8] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#EDE9E4]">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[#111] uppercase tracking-wide">Subscription</h2>
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                isPaid
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : daysRemaining > 0
                  ? 'bg-[#FEF0E8] text-[#B34419] border border-[#F5C9AD]'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}
            >
              {isPaid ? 'Pro' : daysRemaining > 0 ? `Trial · ${daysRemaining}d left` : 'Trial expired'}
            </span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#888]">Account</span>
            <span className="font-medium text-[#111]">{user.email}</span>
          </div>
          {isPaid && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#888]">Plan</span>
              <span className="font-medium text-[#111]">TableReply Pro — $29/month</span>
            </div>
          )}
        </div>

        <div className="px-6 py-5 bg-[#FAFAF8] border-t border-[#EDE9E4]">
          {isPaid ? (
            <ManageBillingButton />
          ) : (
            <div className="space-y-3">
              {/* Annual — best value */}
              <Link
                href="/api/stripe/create-checkout?plan=annual"
                className="flex items-center justify-between px-5 py-3.5 rounded-xl bg-[#111] hover:bg-[#2a2a2a] text-white transition-all duration-150 group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-semibold">Annual plan</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#E05A28] text-[#111] text-[9px] font-bold uppercase tracking-wide leading-none">
                      Best value
                    </span>
                  </div>
                  <p className="text-white/50 text-[11px]">$239/yr · save $109 · under $20/month</p>
                </div>
                <span className="text-[#E05A28] text-[13px] font-semibold group-hover:text-[#F07040] transition-colors">
                  $239/yr →
                </span>
              </Link>

              {/* Monthly */}
              <Link
                href="/api/stripe/create-checkout"
                className="flex items-center justify-between px-5 py-3 rounded-xl border border-[#E4DED8] hover:border-[#D4CFC6] bg-white text-[#111] text-[13px] transition-all duration-150"
              >
                <span className="font-medium">Monthly plan</span>
                <span className="text-[#888]">$29/mo →</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Restaurant profile */}
      <div className="bg-white rounded-2xl border border-[#E4DED8] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#EDE9E4]">
          <h2 className="text-[13px] font-semibold text-[#111] uppercase tracking-wide">Restaurant Profile</h2>
          <p className="text-[12px] text-[#888] mt-0.5">Used to personalise every generated reply.</p>
        </div>
        <div className="px-6 py-6">
          <RestaurantProfileForm
            userId={user.id}
            existingProfile={restaurantProfile}
            redirectTo="/settings"
          />
        </div>
      </div>

      {/* Keyword Alerts */}
      <div className="bg-white rounded-2xl border border-[#E4DED8] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#EDE9E4]">
          <h2 className="text-[13px] font-semibold text-[#111] uppercase tracking-wide">Keyword Alerts</h2>
          <p className="text-[12px] text-[#888] mt-0.5">Get an instant email when a review contains these words.</p>
        </div>
        <div className="px-6 py-5">
          <KeywordAlertsManager userId={user.id} initialAlerts={keywordAlerts ?? []} />
        </div>
      </div>

      {/* Reply preferences, email notifications, danger zone */}
      <SettingsClient
        userId={user.id}
        userEmail={user.email ?? ''}
        replyPreferences={replyPreferences}
        emailNotifications={emailNotifications}
      />
    </div>
  )
}
