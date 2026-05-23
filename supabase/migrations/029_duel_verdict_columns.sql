-- Migration 029: ai_verdict and winner_id columns on duels
-- Required for AI judge mode — missed from migration 028

ALTER TABLE duels
  ADD COLUMN IF NOT EXISTS ai_verdict text;

ALTER TABLE duels
  ADD COLUMN IF NOT EXISTS winner_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
