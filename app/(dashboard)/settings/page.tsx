export const dynamic = 'force-dynamic'
export const metadata = { title: 'Settings — Replyfi' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BusinessProfileForm from '@/components/BusinessProfileForm'
import ManageBillingButton from './ManageBillingButton'
import BillingButtons from './BillingButtons'
import SettingsClient from './SettingsClient'
import KeywordAlertsManager from '@/components/KeywordAlertsManager'
import GoogleConnectSection from '@/components/GoogleConnectSection'
import YelpConnectSection from '@/components/YelpConnectSection'
import TripAdvisorConnectSection from '@/components/TripAdvisorConnectSection'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: restaurantProfile }, { data: keywordAlerts }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('business_profiles').select('*').eq('user_id', user.id).single(),
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
    includeBusinessName: true,
    inviteBack: true,
  }

  const defaultEmailNotifs = {
    weeklyDigest: true,
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
    <div className="space-y-6 sm:space-y-8 max-w-2xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold text-[#111]">Settings</h1>
        <p className="text-[13px] text-[#57534E] mt-1">Manage your business profile and subscription.</p>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-2xl border border-[#E4DED8] overflow-hidden shadow-card">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#EDE9E4]">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-semibold text-[#A8A29E] uppercase tracking-[0.12em]">Subscription</h2>
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
          {!isPaid && daysRemaining > 0 && (
            <div className="w-full h-1 bg-[#EDE9E4] rounded-full mt-3">
              <div
                className="h-full bg-[#E05A28] rounded-full transition-all duration-500"
                style={{ width: `${Math.round(((7 - daysRemaining) / 7) * 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#57534E]">Account</span>
            <span className="text-[13px] font-medium text-[#111] truncate max-w-[55%] text-right">{user.email}</span>
          </div>
          {isPaid && (
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#57534E]">Plan</span>
              <span className="text-[13px] font-medium text-[#111]">
                {profile?.stripe_plan === 'annual'
                  ? 'Replyfi Pro — $239/yr'
                  : 'Replyfi Pro — $29/mo'}
              </span>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-[#F3F0EC] border-t border-[#EDE9E4]">
          {isPaid ? (
            <ManageBillingButton />
          ) : (
            <BillingButtons />
          )}
        </div>
      </div>

      {/* Business profile */}
      <div className="bg-white rounded-2xl border border-[#E4DED8] overflow-hidden shadow-card">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#EDE9E4]">
          <h2 className="text-[11px] font-semibold text-[#A8A29E] uppercase tracking-[0.12em]">Business Profile</h2>
          <p className="text-[12px] text-[#57534E] mt-0.5">Used to personalize every generated reply.</p>
        </div>
        <div className="px-4 sm:px-6 py-5 sm:py-6">
          <BusinessProfileForm
            userId={user.id}
            existingProfile={restaurantProfile}
            redirectTo="/settings"
          />
        </div>
      </div>

      {/* Google Maps Auto-Sync */}
      <div className="bg-white rounded-2xl border border-[#E4DED8] overflow-hidden shadow-card">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#EDE9E4]">
          <h2 className="text-[11px] font-semibold text-[#A8A29E] uppercase tracking-[0.12em]">Google Maps Auto-Sync</h2>
          <p className="text-[12px] text-[#57534E] mt-0.5">Connect Google Maps to sync reviews automatically every day.</p>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <GoogleConnectSection
            userId={user.id}
            restaurantProfileId={restaurantProfile.id}
            currentGoogleUrl={restaurantProfile.google_maps_url ?? null}
            googleLastScrapedAt={restaurantProfile.last_scraped_at ?? null}
          />
        </div>
      </div>

      {/* Yelp Auto-Sync */}
      <div className="bg-white rounded-2xl border border-[#E4DED8] overflow-hidden shadow-card">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#EDE9E4]">
          <h2 className="text-[11px] font-semibold text-[#A8A29E] uppercase tracking-[0.12em]">Yelp Auto-Sync</h2>
          <p className="text-[12px] text-[#57534E] mt-0.5">Connect Yelp to sync reviews automatically every day.</p>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <YelpConnectSection
            userId={user.id}
            restaurantProfileId={restaurantProfile.id}
            currentYelpUrl={restaurantProfile.yelp_url ?? null}
            yelpLastScrapedAt={restaurantProfile.yelp_last_scraped_at ?? null}
          />
        </div>
      </div>

      {/* TripAdvisor Auto-Sync */}
      <div className="bg-white rounded-2xl border border-[#E4DED8] overflow-hidden shadow-card">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#EDE9E4]">
          <h2 className="text-[11px] font-semibold text-[#A8A29E] uppercase tracking-[0.12em]">TripAdvisor Auto-Sync</h2>
          <p className="text-[12px] text-[#57534E] mt-0.5">Connect TripAdvisor to sync reviews automatically every day.</p>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <TripAdvisorConnectSection
            userId={user.id}
            restaurantProfileId={restaurantProfile.id}
            currentTripAdvisorUrl={restaurantProfile.tripadvisor_url ?? null}
            tripAdvisorLastScrapedAt={restaurantProfile.tripadvisor_last_scraped_at ?? null}
          />
        </div>
      </div>

      {/* Keyword Alerts */}
      <div className="bg-white rounded-2xl border border-[#E4DED8] overflow-hidden shadow-card">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#EDE9E4]">
          <h2 className="text-[11px] font-semibold text-[#A8A29E] uppercase tracking-[0.12em]">Keyword Alerts</h2>
          <p className="text-[12px] text-[#57534E] mt-0.5">Get an instant email when a review contains these words.</p>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <KeywordAlertsManager initialAlerts={keywordAlerts ?? []} />
        </div>
      </div>

      {/* Reply preferences, email notifications, danger zone */}
      <SettingsClient
        userId={user.id}
        userEmail={user.email ?? ''}
        replyPreferences={replyPreferences}
        emailNotifications={emailNotifications}
        businessName={restaurantProfile?.business_name ?? undefined}
        isPaid={isPaid ?? false}
      />
    </div>
  )
}
