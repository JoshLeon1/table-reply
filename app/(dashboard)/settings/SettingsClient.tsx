'use client'

import { useState } from 'react'

interface ReplyPreferences {
  endWithOwnerName: boolean
  includeRestaurantName: boolean
  inviteBack: boolean
}

interface EmailNotifications {
  newReviewsScrapped: boolean
}

interface SettingsClientProps {
  userId: string
  userEmail: string
  replyPreferences: ReplyPreferences
  emailNotifications: EmailNotifications
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
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? 'bg-amber-400' : 'bg-[#E0DDD7]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
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
      a.download = 'tablereply-data.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Export failed. Please try again.')
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
      setDeleteError('Something went wrong. Please try again or contact hello@tablereply.com.')
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Reply preferences */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#F0EDE8] flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-semibold text-[#111] uppercase tracking-wide">Reply Preferences</h2>
            <p className="text-[12px] text-[#888] mt-0.5">Applied to every generated reply.</p>
          </div>
          {prefsToast && (
            <span
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                prefsToast === 'saved'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {prefsToast === 'saved' ? '✓ Saved' : 'Error saving'}
            </span>
          )}
        </div>

        <div className="divide-y divide-[#F0EDE8]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-[#111]">End reply with owner name</p>
              <p className="text-[12px] text-[#999] mt-0.5">Sign off each reply with your name (e.g. — Maria)</p>
            </div>
            <Toggle
              checked={replyPrefs.endWithOwnerName}
              onChange={(v) => handleReplyPrefChange('endWithOwnerName', v)}
              disabled={savingPrefs}
            />
          </div>

          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-[#111]">Include restaurant name</p>
              <p className="text-[12px] text-[#999] mt-0.5">Mention your restaurant name naturally in the reply</p>
            </div>
            <Toggle
              checked={replyPrefs.includeRestaurantName}
              onChange={(v) => handleReplyPrefChange('includeRestaurantName', v)}
              disabled={savingPrefs}
            />
          </div>

          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-[#111]">Invite customer back</p>
              <p className="text-[12px] text-[#999] mt-0.5">End positive replies with an invitation to return</p>
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
      <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#F0EDE8] flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-semibold text-[#111] uppercase tracking-wide">Email Notifications</h2>
            <p className="text-[12px] text-[#888] mt-0.5">Sent to {userEmail}</p>
          </div>
          {emailToast && (
            <span
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                emailToast === 'saved'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {emailToast === 'saved' ? '✓ Saved' : 'Error saving'}
            </span>
          )}
        </div>

        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-[#111]">New reviews scraped</p>
            <p className="text-[12px] text-[#999] mt-0.5">Get notified when your Auto Review sync pulls in new reviews</p>
          </div>
          <Toggle
            checked={emailNotifs.newReviewsScrapped}
            onChange={(v) => handleEmailNotifChange('newReviewsScrapped', v)}
            disabled={savingEmail}
          />
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-red-100">
          <h2 className="text-[13px] font-semibold text-red-600 uppercase tracking-wide">Danger Zone</h2>
          <p className="text-[12px] text-[#888] mt-0.5">These actions are permanent and cannot be undone.</p>
        </div>

        <div className="divide-y divide-[#F0EDE8]">
          {/* Export */}
          <div className="px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-[#111]">Export my data</p>
              <p className="text-[12px] text-[#999] mt-0.5">Download all your reviews and replies as a JSON file</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="flex-shrink-0 px-4 py-2 rounded-xl border border-[#E8E4DC] hover:border-[#D4CFC6] bg-white text-[13px] font-medium text-[#555] hover:text-[#111] transition-all duration-150 disabled:opacity-50"
            >
              {exportLoading ? 'Exporting…' : 'Export JSON'}
            </button>
          </div>

          {/* Delete */}
          <div className="px-6 py-5 space-y-3">
            <div>
              <p className="text-[13px] font-medium text-[#111]">Delete all my data</p>
              <p className="text-[12px] text-[#999] mt-0.5">
                Permanently deletes your account, restaurant profile, all reviews, and generated replies. Type{' '}
                <code className="font-mono text-red-500 bg-red-50 px-1 rounded">DELETE</code> to confirm.
              </p>
            </div>

            {deleteError && (
              <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {deleteError}
              </p>
            )}

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-[#E8E4DC] focus:border-red-300 focus:ring-2 focus:ring-red-100 text-[13px] font-mono text-[#111] placeholder-[#CCC] outline-none transition-all"
              />
              <button
                onClick={handleDeleteData}
                disabled={deleteInput !== 'DELETE' || deleteLoading}
                className="flex-shrink-0 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white text-[13px] font-medium transition-all duration-150"
              >
                {deleteLoading ? 'Deleting…' : 'Delete everything'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
