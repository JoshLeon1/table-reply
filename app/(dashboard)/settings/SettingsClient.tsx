'use client'

import { useState } from 'react'

interface ReplyPreferences {
  endWithOwnerName: boolean
  includeBusinessName: boolean
  inviteBack: boolean
}

interface EmailNotifications {
  weeklyDigest: boolean
}

interface SettingsClientProps {
  userId: string
  userEmail: string
  replyPreferences: ReplyPreferences
  emailNotifications: EmailNotifications
  businessName?: string
  isPaid?: boolean
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E05A28] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? 'bg-[#E05A28]' : 'bg-[#D0C9C1]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white ring-0 transition duration-200 ${
          checked ? 'translate-x-4 shadow-[0_1px_3px_rgba(0,0,0,0.15)]' : 'translate-x-0 shadow-sm'
        }`}
      />
    </button>
  )
}

export default function SettingsClient({
  userId,
  userEmail,
  replyPreferences: initialReplyPrefs,
  emailNotifications: initialEmailNotifs,
  businessName,
  isPaid,
}: SettingsClientProps) {
  const [replyPrefs, setReplyPrefs] = useState<ReplyPreferences>(initialReplyPrefs)
  const [emailNotifs, setEmailNotifs] = useState<EmailNotifications>(initialEmailNotifs)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [prefsToast, setPrefsToast] = useState<'saved' | 'error' | null>(null)
  const [emailToast, setEmailToast] = useState<'saved' | 'error' | null>(null)

  // Danger zone
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  async function saveReplyPrefs(newPrefs: ReplyPreferences) {
    setSavingPrefs(true)
    setPrefsToast(null)
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyPreferences: newPrefs }),
      })
      if (!res.ok) throw new Error()
      setPrefsToast('saved')
    } catch {
      setPrefsToast('error')
    } finally {
      setSavingPrefs(false)
      setTimeout(() => setPrefsToast(null), 2500)
    }
  }

  async function saveEmailNotifs(newNotifs: EmailNotifications) {
    setSavingEmail(true)
    setEmailToast(null)
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailNotifications: newNotifs }),
      })
      if (!res.ok) throw new Error()
      setEmailToast('saved')
    } catch {
      setEmailToast('error')
    } finally {
      setSavingEmail(false)
      setTimeout(() => setEmailToast(null), 2500)
    }
  }

  function handleReplyPrefChange(key: keyof ReplyPreferences, value: boolean) {
    const updated = { ...replyPrefs, [key]: value }
    setReplyPrefs(updated)
    saveReplyPrefs(updated)
  }

  function handleEmailNotifChange(key: keyof EmailNotifications, value: boolean) {
    const updated = { ...emailNotifs, [key]: value }
    setEmailNotifs(updated)
    saveEmailNotifs(updated)
  }

  async function handleExport() {
    setExportLoading(true)
    try {
      const res = await fetch('/api/user/export-data')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'replyfi-data.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setExportError('Export failed. Please try again.')
      setTimeout(() => setExportError(null), 5000)
    } finally {
      setExportLoading(false)
    }
  }

  async function handleDeleteData() {
    if (deleteInput !== 'DELETE') return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/user/delete-data', { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      // Redirect to login after account deletion
      window.location.href = '/login?deleted=1'
    } catch {
      setDeleteError('Something went wrong. Please try again or contact hello@replyfi.com.')
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Account info */}
      {(businessName || userEmail) && (
        <div className="rounded-2xl border border-[#E4DED8] bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E05A28]/10 border border-[#E05A28]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#E05A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                {businessName && <p className="text-[14px] font-semibold text-[#111111]">{businessName}</p>}
                <p className="text-[12px] text-[#A8A29E]">{userEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:flex-shrink-0">
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                isPaid
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-[#FEF0E8] text-[#B34419] border border-[#F5C9AD]'
              }`}>
                {isPaid ? 'Pro' : 'Free Trial'}
              </span>
              {!isPaid && (
                <a
                  href="/settings#billing"
                  className="text-[12px] font-semibold text-[#E05A28] hover:text-[#C94E21] transition-colors"
                >
                  Upgrade →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reply preferences */}
      <div className="bg-white rounded-2xl border border-[#E4DED8] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#EDE9E4] flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E]">Reply Preferences</h2>
            <p className="text-[12px] text-[#57534E] mt-1">Applied to every generated reply.</p>
          </div>
          {prefsToast && (
            <span
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 animate-scale-in ${
                prefsToast === 'saved'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-red-50 text-red-500 border border-red-200'
              }`}
            >
              {prefsToast === 'saved' ? '✓ Saved' : 'Error saving'}
            </span>
          )}
        </div>

        <div className="divide-y divide-[#EDE9E4]">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-[#111111]">End reply with owner name</p>
              <p className="text-[12px] text-[#A8A29E] mt-0.5 leading-snug">Sign off each reply with your name (e.g. — Maria)</p>
            </div>
            <Toggle
              checked={replyPrefs.endWithOwnerName}
              onChange={(v) => handleReplyPrefChange('endWithOwnerName', v)}
              disabled={savingPrefs}
            />
          </div>

          <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-[#111111]">Include business name in reply</p>
              <p className="text-[12px] text-[#A8A29E] mt-0.5 leading-snug">Mention your business name naturally in the reply</p>
            </div>
            <Toggle
              checked={replyPrefs.includeBusinessName}
              onChange={(v) => handleReplyPrefChange('includeBusinessName', v)}
              disabled={savingPrefs}
            />
          </div>

          <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-[#111111]">Invite customer to return</p>
              <p className="text-[12px] text-[#A8A29E] mt-0.5 leading-snug">End positive replies with an invitation to return</p>
            </div>
            <Toggle
              checked={replyPrefs.inviteBack}
              onChange={(v) => handleReplyPrefChange('inviteBack', v)}
              disabled={savingPrefs}
            />
          </div>
        </div>
      </div>

      {/* Email notifications */}
      <div className="bg-white rounded-2xl border border-[#E4DED8] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#EDE9E4] flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E]">Email Notifications</h2>
            <p className="text-[12px] text-[#57534E] mt-1 truncate max-w-[200px] sm:max-w-none">Sent to {userEmail}</p>
          </div>
          {emailToast && (
            <span
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 animate-scale-in ${
                emailToast === 'saved'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-red-50 text-red-500 border border-red-200'
              }`}
            >
              {emailToast === 'saved' ? '✓ Saved' : 'Error saving'}
            </span>
          )}
        </div>

        <div className="divide-y divide-[#EDE9E4]">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-[#111111]">Weekly digest</p>
              <p className="text-[12px] text-[#A8A29E] mt-0.5 leading-snug">A weekly summary of new reviews, ratings, and approved replies</p>
            </div>
            <Toggle
              checked={emailNotifs.weeklyDigest ?? true}
              onChange={(v) => handleEmailNotifChange('weeklyDigest', v)}
              disabled={savingEmail}
            />
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="rounded-2xl border border-[#E4DED8] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#EDE9E4]">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E]">Data &amp; Privacy</h2>
          <p className="text-[12px] text-[#57534E] mt-1">Download a copy of your data at any time.</p>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-[#111111]">Export my data</p>
              <p className="text-[12px] text-[#A8A29E] mt-0.5 leading-snug">Download all your reviews and replies as a JSON file</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="flex-shrink-0 px-3.5 py-2 rounded-xl border border-[#E4DED8] hover:border-[#D0C9C1] bg-[#F3F0EC] text-[13px] font-medium text-[#57534E] hover:text-[#111111] transition-all duration-150 disabled:opacity-50 min-h-[44px]"
            >
              {exportLoading ? 'Exporting…' : 'Export JSON'}
            </button>
          </div>
          {exportError && (
            <p className="text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{exportError}</p>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-200 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-red-100">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-red-500">Danger Zone</h2>
          <p className="text-[12px] text-[#57534E] mt-1">These actions are permanent and cannot be undone.</p>
        </div>

        <div>
          {/* Delete */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-3">
            <div>
              <p className="text-[13px] font-medium text-[#111111]">Delete All My Data</p>
              <p className="text-[12px] text-[#A8A29E] mt-0.5 leading-snug">
                Permanently deletes your account, business profile, all reviews, and generated replies. Type{' '}
                <code className="font-mono text-red-500 bg-red-50 px-1 rounded">DELETE</code> to confirm.
              </p>
            </div>

            {deleteError && (
              <p className="text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {deleteError}
              </p>
            )}

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
                className="sm:flex-shrink-0 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-200 disabled:cursor-not-allowed text-white text-[13px] font-medium transition-all duration-150 min-h-[44px]"
              >
                {deleteLoading ? 'Deleting…' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
