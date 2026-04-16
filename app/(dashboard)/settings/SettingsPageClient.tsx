'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import BusinessProfileForm from '@/components/BusinessProfileForm'
import GoogleConnectSection from '@/components/GoogleConnectSection'
import YelpConnectSection from '@/components/YelpConnectSection'
import TripAdvisorConnectSection from '@/components/TripAdvisorConnectSection'
import KeywordAlertsManager from '@/components/KeywordAlertsManager'
import ManageBillingButton from './ManageBillingButton'
import BillingButtons from './BillingButtons'
import Toggle from '@/components/ui/Toggle'
import { Card } from '@/components/ui/Card'
import type { BusinessProfile, KeywordAlert } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReplyPreferences {
  endWithOwnerName: boolean
  includeBusinessName: boolean
  inviteBack: boolean
}

interface EmailNotifications {
  weeklyDigest: boolean
}

interface Props {
  userId: string
  userEmail: string
  restaurantProfile: BusinessProfile
  keywordAlerts: KeywordAlert[]
  replyPreferences: ReplyPreferences
  emailNotifications: EmailNotifications
  isPaid: boolean
  daysRemaining: number
  stripePlan?: string | null
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-[#EDE9E4]">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E]">{title}</h2>
      {sub && <p className="text-[12px] text-[#57534E] mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Tabs definition ──────────────────────────────────────────────────────────

const TABS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    id: 'replies',
    label: 'Replies',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z" />
      </svg>
    ),
  },
  {
    id: 'account',
    label: 'Account',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
] as const

type TabId = typeof TABS[number]['id']

// ─── Main component ───────────────────────────────────────────────────────────

export default function SettingsPageClient({
  userId,
  userEmail,
  restaurantProfile,
  keywordAlerts,
  replyPreferences: initialReplyPrefs,
  emailNotifications: initialEmailNotifs,
  isPaid,
  daysRemaining,
  stripePlan,
}: Props) {
  // If arriving from the trial banner / paywall "Upgrade now" link, open Account tab directly
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam === 'account' ? 'account' : 'profile'
  )

  // Reply prefs state
  const [replyPrefs, setReplyPrefs] = useState<ReplyPreferences>(initialReplyPrefs)
  const [emailNotifs, setEmailNotifs] = useState<EmailNotifications>(initialEmailNotifs)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [prefsToast, setPrefsToast] = useState<'saved' | 'error' | null>(null)
  const [emailToast, setEmailToast] = useState<'saved' | 'error' | null>(null)

  // Account / danger zone state
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // ── Save helpers ─────────────────────────────────────────────────────────

  async function saveReplyPrefs(newPrefs: ReplyPreferences, previous: ReplyPreferences) {
    setSavingPrefs(true); setPrefsToast(null)
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyPreferences: newPrefs }),
      })
      if (!res.ok) throw new Error()
      setPrefsToast('saved')
    } catch {
      // Roll back optimistic UI so the toggle reflects the true saved state
      setReplyPrefs(previous)
      setPrefsToast('error')
    }
    finally { setSavingPrefs(false); setTimeout(() => setPrefsToast(null), 2500) }
  }

  async function saveEmailNotifs(newNotifs: EmailNotifications, previous: EmailNotifications) {
    setSavingEmail(true); setEmailToast(null)
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailNotifications: newNotifs }),
      })
      if (!res.ok) throw new Error()
      setEmailToast('saved')
    } catch {
      // Roll back optimistic UI so the toggle reflects the true saved state
      setEmailNotifs(previous)
      setEmailToast('error')
    }
    finally { setSavingEmail(false); setTimeout(() => setEmailToast(null), 2500) }
  }

  function handleReplyPrefChange(key: keyof ReplyPreferences, value: boolean) {
    const previous = replyPrefs
    const updated = { ...replyPrefs, [key]: value }
    setReplyPrefs(updated); saveReplyPrefs(updated, previous)
  }

  function handleEmailNotifChange(key: keyof EmailNotifications, value: boolean) {
    const previous = emailNotifs
    const updated = { ...emailNotifs, [key]: value }
    setEmailNotifs(updated); saveEmailNotifs(updated, previous)
  }

  async function handleExport() {
    setExportLoading(true)
    try {
      const res = await fetch('/api/user/export-data')
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'replyfi-data.json'; a.click()
      URL.revokeObjectURL(url)
    } catch { setExportError('Export failed. Please try again.'); setTimeout(() => setExportError(null), 5000) }
    finally { setExportLoading(false) }
  }

  async function handleDeleteData() {
    if (deleteInput !== 'DELETE') return
    setDeleteLoading(true); setDeleteError(null)
    try {
      const res = await fetch('/api/user/delete-data', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      window.location.href = '/login?deleted=1'
    } catch {
      setDeleteError('Something went wrong. Please try again or contact hello@replyfi.app.')
      setDeleteLoading(false)
    }
  }

  // ── Tab content renderers ────────────────────────────────────────────────

  const renderProfile = () => (
    <Card padding="none" className="overflow-hidden">
      <SectionHead title="Business Profile" sub="Used to personalise every generated reply." />
      <div className="px-5 sm:px-6 py-5 sm:py-6">
        <BusinessProfileForm
          userId={userId}
          existingProfile={restaurantProfile}
          redirectTo="/settings"
        />
      </div>
    </Card>
  )

  const renderIntegrations = () => (
    <div className="space-y-4">
      {/* Google */}
      <Card padding="none" className="overflow-hidden">
        <SectionHead
          title="Google Maps"
          sub="Sync Google reviews automatically every day."
        />
        <div className="px-5 sm:px-6 py-4 sm:py-5">
          <GoogleConnectSection
            userId={userId}
            restaurantProfileId={restaurantProfile.id}
            currentGoogleUrl={restaurantProfile.google_maps_url ?? null}
            googleLastScrapedAt={restaurantProfile.last_scraped_at ?? null}
          />
        </div>
      </Card>

      {/* Yelp */}
      <Card padding="none" className="overflow-hidden">
        <SectionHead
          title="Yelp"
          sub="Sync Yelp reviews automatically every day."
        />
        <div className="px-5 sm:px-6 py-4 sm:py-5">
          <YelpConnectSection
            userId={userId}
            restaurantProfileId={restaurantProfile.id}
            currentYelpUrl={restaurantProfile.yelp_url ?? null}
            yelpLastScrapedAt={restaurantProfile.yelp_last_scraped_at ?? null}
          />
        </div>
      </Card>

      {/* TripAdvisor */}
      <Card padding="none" className="overflow-hidden">
        <SectionHead
          title="TripAdvisor"
          sub="Sync TripAdvisor reviews automatically every day."
        />
        <div className="px-5 sm:px-6 py-4 sm:py-5">
          <TripAdvisorConnectSection
            userId={userId}
            restaurantProfileId={restaurantProfile.id}
            currentTripAdvisorUrl={restaurantProfile.tripadvisor_url ?? null}
            tripAdvisorLastScrapedAt={restaurantProfile.tripadvisor_last_scraped_at ?? null}
          />
        </div>
      </Card>
    </div>
  )

  const renderReplies = () => (
    <div className="space-y-4">
      {/* Reply preferences */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-[#EDE9E4] flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E]">Reply Preferences</h2>
            <p className="text-[12px] text-[#57534E] mt-0.5">Applied to every generated reply.</p>
          </div>
          {prefsToast && (
            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 animate-scale-in ${
              prefsToast === 'saved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-500 border border-red-200'
            }`}>
              {prefsToast === 'saved' ? '✓ Saved' : 'Error saving'}
            </span>
          )}
        </div>
        <div className="divide-y divide-[#EDE9E4]">
          {([
            { key: 'endWithOwnerName', label: 'End reply with owner name', desc: `Sign off each reply with your name (e.g. — ${restaurantProfile.owner_name || 'Maria'})` },
            { key: 'includeBusinessName', label: 'Include business name in reply', desc: 'Mention your business name naturally in the reply' },
            { key: 'inviteBack', label: 'Invite customer to return', desc: 'End positive replies with an invitation to return' },
          ] as const).map(({ key, label, desc }) => (
            <div key={key} className="px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[#111111]">{label}</p>
                <p className="text-[12px] text-[#A8A29E] mt-0.5 leading-snug">{desc}</p>
              </div>
              <Toggle
                checked={replyPrefs[key]}
                onChange={(v) => handleReplyPrefChange(key, v)}
                disabled={savingPrefs}
                ariaLabel={label}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Keyword Alerts */}
      <Card padding="none" className="overflow-hidden">
        <SectionHead title="Keyword Alerts" sub="Get an instant email when a review contains these words." />
        <div className="px-5 sm:px-6 py-4 sm:py-5">
          <KeywordAlertsManager initialAlerts={keywordAlerts} />
        </div>
      </Card>
    </div>
  )

  const renderAccount = () => (
    <div className="space-y-4">
      {/* Subscription */}
      <Card padding="none" className="overflow-hidden">
        {/* Header row */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#EDE9E4] flex items-center justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E]">Subscription</h2>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide flex-shrink-0 ${
            isPaid
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : daysRemaining > 0
              ? 'bg-[#FEF0E8] text-[#B34419] border border-[#F5C9AD]'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {isPaid ? 'Pro' : daysRemaining > 0 ? `Trial · ${daysRemaining}d left` : 'Trial expired'}
          </span>
        </div>

        {/* Trial progress bar */}
        {!isPaid && daysRemaining > 0 && (
          <div className="px-5 sm:px-6 pt-3 pb-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-[#A8A29E]">Trial progress</span>
              <span className="text-[11px] font-medium text-[#57534E]">{daysRemaining}d remaining</span>
            </div>
            <div className="w-full h-1.5 bg-[#EDE9E4] rounded-full">
              <div className="h-full bg-[#E05A28] rounded-full transition-all" style={{ width: `${Math.round(((7 - daysRemaining) / 7) * 100)}%` }} />
            </div>
          </div>
        )}

        {/* Account info row */}
        <div className="px-5 sm:px-6 py-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#57534E]">Account</span>
            <span className="text-[13px] font-medium text-[#111] truncate max-w-[55%] text-right">{userEmail}</span>
          </div>
          {isPaid && (
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#57534E]">Plan</span>
              <span className="text-[13px] font-medium text-[#111]">
                {stripePlan === 'annual' ? 'ReplyFi Pro — $239/yr' : 'ReplyFi Pro — $29/mo'}
              </span>
            </div>
          )}
        </div>

        {/* Billing CTA */}
        <div className="px-5 sm:px-6 py-4 bg-[#F8F6F3] border-t border-[#EDE9E4]">
          {isPaid ? <ManageBillingButton /> : <BillingButtons />}
        </div>
      </Card>

      {/* Email Notifications */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-[#EDE9E4] flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E]">Email Notifications</h2>
            <p className="text-[12px] text-[#57534E] mt-0.5 truncate max-w-[200px] sm:max-w-none">Sent to {userEmail}</p>
          </div>
          {emailToast && (
            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 animate-scale-in ${
              emailToast === 'saved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-500 border border-red-200'
            }`}>
              {emailToast === 'saved' ? '✓ Saved' : 'Error saving'}
            </span>
          )}
        </div>
        <div className="px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-[#111111]">Weekly digest</p>
            <p className="text-[12px] text-[#A8A29E] mt-0.5 leading-snug">A weekly summary of new reviews, ratings, and approved replies</p>
          </div>
          <Toggle
            checked={emailNotifs.weeklyDigest ?? true}
            onChange={(v) => handleEmailNotifChange('weeklyDigest', v)}
            disabled={savingEmail}
            ariaLabel="Weekly digest emails"
          />
        </div>
      </Card>

      {/* Data & Privacy */}
      <Card padding="none" className="overflow-hidden">
        <SectionHead title="Data & Privacy" sub="Download a copy of your data at any time." />
        <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-[#111111]">Export my data</p>
              <p className="text-[12px] text-[#A8A29E] mt-0.5 leading-snug">Download all your reviews and replies as a JSON file</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="flex-shrink-0 px-3.5 py-2 rounded-xl border border-[#E4DED8] hover:border-[#D0C9C1] bg-[#F3F0EC] text-[13px] font-medium text-[#57534E] hover:text-[#111111] transition-all disabled:opacity-50 min-h-[44px]"
            >
              {exportLoading ? 'Exporting…' : 'Export JSON'}
            </button>
          </div>
          {exportError && <p role="alert" className="text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{exportError}</p>}
        </div>
      </Card>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-200 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-red-100">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-red-500">Danger Zone</h2>
          <p className="text-[12px] text-[#57534E] mt-0.5">These actions are permanent and cannot be undone.</p>
        </div>
        <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-3">
          <div>
            <p className="text-[13px] font-medium text-[#111111]">Delete All My Data</p>
            <p className="text-[12px] text-[#A8A29E] mt-0.5 leading-snug">
              Permanently deletes your account, business profile, all reviews, and generated replies. Type{' '}
              <code className="font-mono text-red-500 bg-red-50 px-1 rounded">DELETE</code> to confirm.
            </p>
          </div>
          {deleteError && <p role="alert" className="text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{deleteError}</p>}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 bg-red-50/50 text-[13px] font-mono text-[#111111] placeholder:text-[#C4BEB8] outline-none transition-all min-h-[44px]"
            />
            <button
              onClick={handleDeleteData}
              disabled={deleteInput !== 'DELETE' || deleteLoading}
              className="sm:flex-shrink-0 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-200 disabled:cursor-not-allowed text-white text-[13px] font-medium transition-all min-h-[44px]"
            >
              {deleteLoading ? 'Deleting…' : 'Delete Everything'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const content = {
    profile: renderProfile(),
    integrations: renderIntegrations(),
    replies: renderReplies(),
    account: renderAccount(),
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold text-[#111]">Settings</h1>
        <p className="text-[13px] text-[#57534E] mt-1">Manage your profile, integrations, and account.</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-[#F3F0EC] rounded-2xl p-1 border border-[#E4DED8] overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-white text-[#111111] shadow-sm border border-[#E4DED8]'
                : 'text-[#A8A29E] hover:text-[#57534E]'
            }`}
          >
            <span className={activeTab === tab.id ? 'text-[#E05A28]' : 'text-current'}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>{content[activeTab]}</div>
    </div>
  )
}
