-- Migration 028: judge_mode for invite duels
-- 'community' = topluluk oyu (default)
-- 'ai'        = yapay zeka kararı

ALTER TABLE duels
  ADD COLUMN IF NOT EXISTS judge_mode text NOT NULL DEFAULT 'community'
  CHECK (judge_mode IN ('community', 'ai'));
