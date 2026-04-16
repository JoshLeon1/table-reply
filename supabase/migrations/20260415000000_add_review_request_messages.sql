ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS review_request_messages JSONB DEFAULT NULL;
