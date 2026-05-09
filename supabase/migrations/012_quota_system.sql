-- ══════════════════════════════════════════════════════════════
-- Migration 012: Quota tracking columns
-- ══════════════════════════════════════════════════════════════

-- Track lifetime personality analyses per user (for quota enforcement)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS personality_analysis_count integer NOT NULL DEFAULT 0;

-- Back-fill: users who already have a personality_type get 1 counted
UPDATE profiles
SET personality_analysis_count = 1
WHERE personality_type IS NOT NULL AND personality_analysis_count = 0;
