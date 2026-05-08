-- Add profile_complete flag for OAuth users who need to choose a username
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_complete boolean NOT NULL DEFAULT true;

-- Existing users are already complete
-- New Google OAuth users will be set to false until they visit /auth/tamamla
