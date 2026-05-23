-- Migration 033: voting_started_at column for community duels
-- Creator decides when voting opens — symmetrical to AI mode's "AI Karar Versin"

ALTER TABLE public.duels
  ADD COLUMN IF NOT EXISTS voting_started_at timestamptz;
