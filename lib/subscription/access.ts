// lib/subscription/access.ts
//
// One place that decides whether a user has access. Every paywall
// decision in the app should route through hasAccess() so the rules
// are consistent — paywall modal, gate wrapper, server-side route
// protection, anywhere.

export type AccessReason =
  | 'paid'
  | 'trialing'
  | 'canceled_in_grace'   // canceled but period_end is in the future
  | 'past_due'            // most recent invoice failed but inside grace
  | 'trial_expired'
  | 'never_paid'

export interface AccessProfile {
  is_paid: boolean | null
  trial_started_at: string | null
  subscription_period_end: string | null
  subscription_canceled_at: string | null
  subscription_past_due: boolean | null
}

export const TRIAL_DAYS = 7
export const PAST_DUE_GRACE_DAYS = 3

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
}

export interface AccessResult {
  ok: boolean
  reason: AccessReason
  /** Days remaining of trial OR canceled-but-inside-period grace. Floor of the value. */
  daysRemaining: number
}

export function hasAccess(profile: AccessProfile | null | undefined): AccessResult {
  if (!profile) {
    return { ok: false, reason: 'never_paid', daysRemaining: 0 }
  }

  // 1. Paid — evaluate nuances (past_due, canceled-in-grace).
  if (profile.is_paid) {
    if (profile.subscription_past_due) {
      // We don't have a "past_due_started_at" timestamp; lean on Stripe's
      // own grace handling and just gate to past_due reason. The webhook
      // flips is_paid=false on cancellation, so being here with is_paid=true
      // means we're inside Stripe's smart-retry window.
      return { ok: true, reason: 'past_due', daysRemaining: PAST_DUE_GRACE_DAYS }
    }
    if (profile.subscription_canceled_at && profile.subscription_period_end) {
      const remainingDays = Math.floor(
        (new Date(profile.subscription_period_end).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
      if (remainingDays > 0) {
        return { ok: true, reason: 'canceled_in_grace', daysRemaining: remainingDays }
      }
      return { ok: false, reason: 'never_paid', daysRemaining: 0 }
    }
    return { ok: true, reason: 'paid', daysRemaining: 0 }
  }

  // 2. Not paid — are they on trial?
  if (profile.trial_started_at) {
    const daysIn = daysSince(profile.trial_started_at)
    const remaining = Math.floor(TRIAL_DAYS - daysIn)
    if (remaining > 0) {
      return { ok: true, reason: 'trialing', daysRemaining: remaining }
    }
    return { ok: false, reason: 'trial_expired', daysRemaining: 0 }
  }

  // 3. Never started a trial, never paid
  return { ok: false, reason: 'never_paid', daysRemaining: 0 }
}
