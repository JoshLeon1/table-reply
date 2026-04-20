-- Autopilot feature: tracking columns on scraped_reviews

alter table scraped_reviews
  add column if not exists autopilot_handled boolean default false,
  add column if not exists autopilot_action text,
  add column if not exists autopilot_processed_at timestamptz,
  add column if not exists autopilot_posted_at timestamptz;

create index if not exists idx_scraped_reviews_autopilot
  on scraped_reviews (user_id, autopilot_handled);

comment on column scraped_reviews.autopilot_action is
  'auto_approved | escalated_low_rating | escalated_keyword | skipped_no_text | draft_only';

comment on column scraped_reviews.autopilot_posted_at is
  'Timestamp when user clicked "Post to Google" in the Autopilot Queue UI';
