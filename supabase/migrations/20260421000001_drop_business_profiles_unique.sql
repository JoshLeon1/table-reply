-- Allow multiple business_profiles rows per user (multi-location support)
-- The old 1:1 constraint prevented adding a second location for the same user.
ALTER TABLE business_profiles DROP CONSTRAINT IF EXISTS restaurant_profiles_user_id_key;
