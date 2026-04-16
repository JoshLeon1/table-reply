-- supabase/migrations/20260416130000_stripe_webhook_events.sql
--
-- Idempotency log for Stripe webhook events. Stripe retries on any
-- non-2xx response, so the webhook handler must be safe to call with
-- the same event id more than once. We record event_id as primary
-- key — duplicate inserts collide and signal "already processed".

create table if not exists stripe_webhook_events (
  event_id     text        primary key,
  event_type   text        not null,
  processed_at timestamptz not null default now(),
  payload      jsonb       not null
);

create index if not exists stripe_webhook_events_processed_at_idx
  on stripe_webhook_events(processed_at desc);

-- Service role only — never expose to authenticated users.
alter table stripe_webhook_events enable row level security;

-- No policies = no row access for any authenticated role; only the
-- service-role key (used by the webhook handler) bypasses RLS.
