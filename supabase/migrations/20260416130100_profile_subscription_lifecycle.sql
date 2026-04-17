-- supabase/migrations/20260416130100_profile_subscription_lifecycle.sql
--
-- Track the subscription period end and cancel timestamp so we can:
--   1) Keep access alive after a cancellation through current_period_end
--   2) Show "Cancels on Apr 30" in the UI
--   3) Distinguish 'canceled but still has access' from 'never paid'

alter table profiles
  add column if not exists subscription_period_end  timestamptz,
  add column if not exists subscription_canceled_at timestamptz,
  add column if not exists subscription_past_due    boolean not null default false;
