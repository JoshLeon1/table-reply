-- supabase/migrations/20260421000000_multi_location.sql

-- 1. Add location columns to business_profiles
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS location_label text,
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT true;

-- 2. Mark all existing rows as primary (they were the only location)
UPDATE business_profiles SET is_primary = true WHERE is_primary IS NULL OR is_primary = false;

-- 3. Add business_profile_id to google_business_tokens
ALTER TABLE google_business_tokens
  ADD COLUMN IF NOT EXISTS business_profile_id uuid
    REFERENCES business_profiles(id) ON DELETE CASCADE;

-- 4. Backfill: link each existing token to its user's primary business profile
UPDATE google_business_tokens gbt
SET business_profile_id = (
  SELECT id FROM business_profiles
  WHERE user_id = gbt.user_id
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE business_profile_id IS NULL;

-- 5. Drop old unique constraint on user_id alone, add compound unique
ALTER TABLE google_business_tokens
  DROP CONSTRAINT IF EXISTS google_business_tokens_user_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'google_business_tokens_user_location_key'
  ) THEN
    ALTER TABLE google_business_tokens
      ADD CONSTRAINT google_business_tokens_user_location_key
      UNIQUE (user_id, business_profile_id);
  END IF;
END $$;

-- 6. Ensure scraped_reviews cascades when a business_profile is deleted
ALTER TABLE scraped_reviews
  DROP CONSTRAINT IF EXISTS scraped_reviews_business_profile_id_fkey;

ALTER TABLE scraped_reviews
  ADD CONSTRAINT scraped_reviews_business_profile_id_fkey
    FOREIGN KEY (business_profile_id) REFERENCES business_profiles(id) ON DELETE CASCADE;
