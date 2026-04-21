'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import BusinessProfileForm from '@/components/BusinessProfileForm'
import GoogleConnectSection from '@/components/GoogleConnectSection'
import YelpConnectSection from '@/components/YelpConnectSection'
import KeywordAlertsManager from '@/components/KeywordAlertsManager'
import ManageBillingButton from './ManageBillingButton'
import BillingButtons from './BillingButtons'
import Toggle from '@/components/ui/Toggle'
import { Card } from '@/components/ui/Card'
import type { BusinessProfile, KeywordAlert, AutopilotRules } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReplyPreferences {
  endWithOwnerName: boolean
  includeBusinessName: boolean
  inviteBack: boolean
}

interface EmailNotifications {
  weeklyDigest: boolean
}

const DEFAULT_AUTOPILOT: AutopilotRules = {
  enabled: false,
  mode: 'draft',
  minStarRating: 4,
  keywordBlocklist: [],
  skipNoText: true,
  dailyDigest: true,
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
  autopilotRules?: AutopilotRules | null
  gbpConnected?: boolean
  gbpLocationName?: string | null
  allLocations: Array<{
    id: string
    business_name: string
    location_label: string | null
    is_primary: boolean | null
    last_scraped_at: string | null
    google_maps_url: string | null
    yelp_url: string | null
  }>
  activeLocationId: string
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
    id: 'autopilot',
    label: 'Autopilot',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
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
  {
    id: 'locations',
    label: 'Locations',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
  autopilotRules: initialAutopilotRules,
  gbpConnected = false,
  gbpLocationName = null,
  allLocations,
  activeLocationId,
}: Props) {
  // If arriving from the trial banner / paywall "Upgrade now" link, open Account tab directly
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam === 'account' ? 'account' : tabParam === 'autopilot' ? 'autopilot' : tabParam === 'replies' ? 'replies' : tabParam === 'integrations' ? 'integrations' : tabParam === 'locations' ? 'locations' : 'profile'
  )

  // Reply prefs state
  const [replyPrefs, setReplyPrefs] = useState<ReplyPreferences>(initialReplyPrefs)
  const [emailNotifs, setEmailNotifs] = useState<EmailNotifications>(initialEmailNotifs)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [prefsToast, setPrefsToast] = useState<'saved' | 'error' | null>(null)
  const [emailToast, setEmailToast] = useState<'saved' | 'error' | null>(null)

  // Autopilot state
  const [autopilot, setAutopilot] = useState<AutopilotRules>(initialAutopilotRules ?? DEFAULT_AUTOPILOT)
  const [savingAutopilot, setSavingAutopilot] = useState(false)
  const [autopilotToast, setAutopilotToast] = useState<'saved' | 'error' | null>(null)
  // Keyword blocklist as raw textarea string
  const [keywordInput, setKeywordInput] = useState<string>(
    (initialAutopilotRules?.keywordBlocklist ?? []).join(', ')
  )

  // GBP connection state
  const [gbpIsConnected, setGbpIsConnected] = useState(gbpConnected)
  const [gbpLocation, setGbpLocation] = useState(gbpLocationName)
  const [gbpDisconnecting, setGbpDisconnecting] = useState(false)
  const [gbpToast, setGbpToast] = useState<'disconnected' | 'error' | null>(null)

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

  async function saveAutopilotRules(rules: AutopilotRules) {
    setSavingAutopilot(true); setAutopilotToast(null)
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyPreferences: { ...replyPrefs, autopilot: rules } }),
      })
      if (!res.ok) throw new Error()
      setAutopilotToast('saved')
    } catch {
      setAutopilotToast('error')
    } finally {
      setSavingAutopilot(false)
      setTimeout(() => setAutopilotToast(null), 2500)
    }
  }

  function handleAutopilotChange<K extends keyof AutopilotRules>(key: K, value: AutopilotRules[K]) {
    const updated = { ...autopilot, [key]: value }
    setAutopilot(updated)
    saveAutopilotRules(updated)
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

      {/* Google Business Profile direct reply posting */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-[#EDE9E4] flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E]">Google Business Profile</h2>
            <p className="text-[12px] text-[#57534E] mt-0.5">Post replies directly to Google when you approve them.</p>
          </div>
          {gbpToast && (
            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 animate-scale-in ${
              gbpToast === 'disconnected' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-500 border border-red-200'
            }`}>
              {gbpToast === 'disconnected' ? '✓ Disconnected' : 'Error disconnecting'}
            </span>
          )}
        </div>
        <div className="px-5 sm:px-6 py-4 sm:py-5">
          {gbpIsConnected ? (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-[#111]">Connected</p>
                  {gbpLocation && (
                    <p className="text-[12px] text-[#78716C] mt-0.5 font-mono">{gbpLocation}</p>
                  )}
                </div>
              </div>
              <button
                disabled={gbpDisconnecting}
                onClick={async () => {
                  setGbpDisconnecting(true)
                  try {
                    const res = await fetch('/api/auth/google-business/disconnect', { method: 'POST' })
                    if (res.ok) {
                      setGbpIsConnected(false)
                      setGbpLocation(null)
                      setGbpToast('disconnected')
                    } else {
                      setGbpToast('error')
                    }
                  } catch {
                    setGbpToast('error')
                  } finally {
                    setGbpDisconnecting(false)
                    setTimeout(() => setGbpToast(null), 2500)
                  }
                }}
                className="text-[13px] text-[#78716C] hover:text-red-500 transition-colors disabled:opacity-50"
              >
                {gbpDisconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[13px] text-[#57534E]">Connect your Google Business Profile to post replies automatically.</p>
                <p className="text-[12px] text-[#A8A29E] mt-1">Requires a Google account with access to your business listing.</p>
              </div>
              <a
                href="/api/auth/google-business"
                className="flex-shrink-0 inline-flex items-center gap-2 bg-[#111] text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-[#222] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Connect Google
              </a>
            </div>
          )}
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

  const renderAutopilot = () => (
    <Card padding="none" className="overflow-hidden">
      {/* Header with toggle */}
      <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-[#EDE9E4] flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E]">Autopilot</h2>
          <p className="text-[12px] text-[#57534E] mt-0.5">Auto-generate (and optionally approve) replies overnight.</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {autopilotToast && (
            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full animate-scale-in ${
              autopilotToast === 'saved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-500 border border-red-200'
            }`}>
              {autopilotToast === 'saved' ? '✓ Saved' : 'Error saving'}
            </span>
          )}
          <Toggle
            checked={autopilot.enabled}
            onChange={(v) => handleAutopilotChange('enabled', v)}
            disabled={savingAutopilot}
            ariaLabel="Enable Autopilot"
          />
        </div>
      </div>

      {/* Explainer banner */}
      <div className="px-5 sm:px-6 py-3 bg-[#F3EEE4] border-b border-[#EDE9E4]">
        <p className="text-[12px] text-[#57534E] leading-relaxed">
          Autopilot runs nightly at 8am. High-risk reviews (low stars, blocked keywords) are always escalated to you.
        </p>
      </div>

      {/* Controls — only shown when enabled */}
      {autopilot.enabled && (
        <div className="divide-y divide-[#EDE9E4]">

          {/* Minimum star rating */}
          <div className="px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-[#111111]">Minimum star rating</p>
              <p className="text-[12px] text-[#A8A29E] mt-0.5 leading-snug">Only auto-handle reviews at or above this rating</p>
            </div>
            <select
              value={autopilot.minStarRating}
              onChange={(e) => handleAutopilotChange('minStarRating', Number(e.target.value))}
              disabled={savingAutopilot}
              className="flex-shrink-0 px-3 py-2 rounded-xl border border-[#EDE6DC] bg-white text-[13px] font-medium text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] transition-all disabled:opacity-50 min-h-[44px]"
            >
              <option value={3}>3 stars and above</option>
              <option value={4}>4 stars and above</option>
              <option value={5}>5 stars only</option>
            </select>
          </div>

          {/* Reply mode */}
          <div className="px-5 sm:px-6 py-4">
            <p className="text-[13px] font-medium text-[#111111] mb-2.5">After generating a reply</p>
            <div className="space-y-2.5">
              {([
                { value: 'draft', label: 'Draft for my approval', desc: 'Reply stays pending — you review and approve manually' },
                { value: 'auto_approve', label: 'Auto-approve for one-click post', desc: 'Reply moves straight to the Autopilot Queue, ready to copy and post' },
              ] as const).map(({ value, label, desc }) => (
                <label key={value} className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  autopilot.mode === value
                    ? 'border-[#E05A28] bg-[#FEF0E8]/40'
                    : 'border-[#EDE6DC] hover:border-[#D0C9C1]'
                }`}>
                  <input
                    type="radio"
                    name="autopilot-mode"
                    value={value}
                    checked={autopilot.mode === value}
                    onChange={() => handleAutopilotChange('mode', value)}
                    disabled={savingAutopilot}
                    className="mt-0.5 accent-[#E05A28] flex-shrink-0"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-[#111111]">{label}</p>
                    <p className="text-[12px] text-[#A8A29E] mt-0.5 leading-snug">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Keyword blocklist */}
          <div className="px-5 sm:px-6 py-4">
            <div className="mb-2.5">
              <p className="text-[13px] font-medium text-[#111111]">Keyword blocklist</p>
              <p className="text-[12px] text-[#A8A29E] mt-0.5 leading-snug">If a review contains any of these words, it gets escalated to you (comma-separated)</p>
            </div>
            <textarea
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onBlur={() => {
                const list = keywordInput
                  .split(',')
                  .map((k) => k.trim())
                  .filter(Boolean)
                handleAutopilotChange('keywordBlocklist', list)
              }}
              rows={2}
              placeholder="refund, rude, disgusting, health code…"
              disabled={savingAutopilot}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE6DC] bg-white text-[13px] text-[#111111] placeholder:text-[#C4BEB8] focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] transition-all resize-none disabled:opacity-50 min-h-[44px]"
            />
          </div>

          {/* Skip no-text + daily digest checkboxes */}
          <div className="divide-y divide-[#EDE9E4]">
            {([
              { key: 'skipNoText' as const, label: 'Skip reviews without text', desc: 'Rating-only reviews won\'t be processed by Autopilot' },
              { key: 'dailyDigest' as const, label: 'Daily digest email', desc: 'Receive a morning email summarising what Autopilot processed overnight' },
            ]).map(({ key, label, desc }) => (
              <div key={key} className="px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[#111111]">{label}</p>
                  <p className="text-[12px] text-[#A8A29E] mt-0.5 leading-snug">{desc}</p>
                </div>
                <Toggle
                  checked={autopilot[key]}
                  onChange={(v) => handleAutopilotChange(key, v)}
                  disabled={savingAutopilot}
                  ariaLabel={label}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disabled state hint */}
      {!autopilot.enabled && (
        <div className="px-5 sm:px-6 py-4">
          <p className="text-[12px] text-[#A8A29E]">Toggle on to configure your Autopilot rules.</p>
        </div>
      )}
    </Card>
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
              <span className="text-[11px] font-medium text-[#57534E] tnum">{daysRemaining}d remaining</span>
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
    autopilot: renderAutopilot(),
    account: renderAccount(),
    locations: (
      <LocationsTab
        locations={allLocations}
        activeLocationId={activeLocationId}
        userId={userId}
      />
    ),
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold text-[#111]">Settings</h1>
        <p className="text-[13px] text-[#57534E] mt-1">Manage your profile, integrations, and account.</p>
      </div>

      {/* Tab bar — wraps on mobile so all tabs (including Account / delete) stay
          visible without horizontal scrolling. 5 tabs × ~100px didn't fit on
          <400px screens and the Account tab was effectively hidden. */}
      <div className="flex flex-wrap items-center gap-1 bg-[#F3F0EC] rounded-2xl p-1 border border-[#E4DED8]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all ${
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

// ─── Locations tab ────────────────────────────────────────────────────────────

function LocationsTab({
  locations,
  activeLocationId,
  userId,
}: {
  locations: Array<{
    id: string
    business_name: string
    location_label: string | null
    is_primary: boolean | null
    last_scraped_at: string | null
    google_maps_url: string | null
    yelp_url: string | null
  }>
  activeLocationId: string
  userId: string
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newGoogleUrl, setNewGoogleUrl] = useState('')
  const [newYelpUrl, setNewYelpUrl] = useState('')
  const [addError, setAddError] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  // userId is reserved for future per-location GBP connect flow
  void userId

  const handleAdd = async () => {
    setAddError('')
    if (!newLabel.trim()) { setAddError('Location name is required.'); return }
    setAdding(true)
    try {
      const res = await fetch('/api/locations/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationLabel: newLabel.trim(),
          googleMapsUrl: newGoogleUrl.trim() || null,
          yelpUrl: newYelpUrl.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to add location')
      setShowAddForm(false)
      setNewLabel(''); setNewGoogleUrl(''); setNewYelpUrl('')
      router.refresh()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally { setAdding(false) }
  }

  const handleRemove = async (locationId: string) => {
    if (!confirm('Remove this location? All reviews for it will be permanently deleted.')) return
    setRemovingId(locationId)
    try {
      const res = await fetch(`/api/locations/${locationId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to remove location')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong.')
    } finally { setRemovingId(null) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#111]">Locations</h2>
          <p className="text-[13px] text-[#57534E] mt-0.5">Each location has its own review feed and sync.</p>
        </div>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] text-white text-[12px] font-medium transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add location
        </button>
      </div>

      {showAddForm && (
        <div className="bg-[#FEFCF8] border border-[#EDE6DC] rounded-xl p-4 space-y-3">
          <h3 className="text-[13px] font-semibold text-[#111]">New location</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Location name (e.g. Downtown)"
              className="w-full h-10 px-3.5 rounded-xl bg-[#F8F6F3] border border-[#EDE6DC] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:border-[#E05A28]/50 focus:ring-2 focus:ring-[#E05A28]/10"
            />
            <input
              type="url"
              value={newGoogleUrl}
              onChange={e => setNewGoogleUrl(e.target.value)}
              placeholder="Google Maps URL (optional)"
              className="w-full h-10 px-3.5 rounded-xl bg-[#F8F6F3] border border-[#EDE6DC] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:border-[#E05A28]/50 focus:ring-2 focus:ring-[#E05A28]/10"
            />
            <input
              type="url"
              value={newYelpUrl}
              onChange={e => setNewYelpUrl(e.target.value)}
              placeholder="Yelp URL (optional)"
              className="w-full h-10 px-3.5 rounded-xl bg-[#F8F6F3] border border-[#EDE6DC] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:border-[#E05A28]/50 focus:ring-2 focus:ring-[#E05A28]/10"
            />
          </div>
          {addError && <p className="text-[12px] text-[#B84A1A]">{addError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="px-4 py-2 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] text-white text-[12px] font-medium disabled:opacity-50 transition-colors"
            >
              {adding ? 'Adding…' : 'Add location'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-[#F3F0EC] text-[#57534E] text-[12px] font-medium hover:bg-[#EDE9E4] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {locations.map(loc => (
          <div key={loc.id} className="flex items-center gap-3 bg-[#FEFCF8] border border-[#EDE6DC] rounded-xl px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-medium text-[#111] truncate">
                  {loc.location_label ?? loc.business_name}
                </span>
                {loc.is_primary && (
                  <span className="text-[10px] font-medium text-[#57534E] bg-[#F3F0EC] border border-[#EDE6DC] rounded-full px-2 py-0.5">Primary</span>
                )}
                {loc.id === activeLocationId && (
                  <span className="text-[10px] font-medium text-[#E05A28] bg-[#FEF6EF] border border-[#F4DCC4] rounded-full px-2 py-0.5">Active</span>
                )}
              </div>
              <p className="text-[11px] text-[#A8A29E] mt-0.5">
                {loc.google_maps_url ? 'Google' : ''}
                {loc.google_maps_url && loc.yelp_url ? ' · ' : ''}
                {loc.yelp_url ? 'Yelp' : ''}
                {!loc.google_maps_url && !loc.yelp_url ? 'No platforms connected' : ''}
              </p>
            </div>
            {!loc.is_primary && (
              <button
                onClick={() => handleRemove(loc.id)}
                disabled={removingId === loc.id}
                className="text-[12px] text-[#A8A29E] hover:text-[#B84A1A] transition-colors disabled:opacity-40 flex-shrink-0"
              >
                {removingId === loc.id ? 'Removing…' : 'Remove'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
