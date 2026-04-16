-- supabase/migrations/20260416120000_add_has_seen_demo.sql

-- Track whether a user has been through the /onboarding/demo flow.
-- Default false for new users so the dashboard redirect intercepts
-- them on first login. Backfill existing users to true so we don't
-- yank long-time customers into the demo on their next visit.

alter table profiles
  add column if not exists has_seen_demo boolean not null default false;

update profiles
   set has_seen_demo = true
 where created_at < now();

-- Index is unnecessary — this column is only ever queried by
-- primary-key lookup on the user's own row.
