-- Migration 035: capture IP + User-Agent on anonymous answers
-- Browsers do NOT expose a logged-in Google account without an explicit
-- OAuth flow, so true anonymity is preserved by the platform. The best we
-- can do for admin moderation is record network/device fingerprints.

ALTER TABLE public.answers
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS user_agent text;

-- Helpful index for admin lookups by source IP
CREATE INDEX IF NOT EXISTS idx_answers_anon_ip
  ON public.answers (ip_address)
  WHERE user_id IS NULL;
