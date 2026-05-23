-- Migration 032: drop dead scenario_upvotes system
-- Codebase only uses scenario_votes (migration 020) with vote_type up/down.
-- scenario_upvotes (migration 015) is no longer referenced anywhere in src.
-- Drop the table + its triggers + functions so they don't drift.

DROP TRIGGER IF EXISTS on_scenario_upvote ON public.scenario_upvotes;
DROP TRIGGER IF EXISTS on_scenario_downvote ON public.scenario_upvotes;

DROP FUNCTION IF EXISTS public.increment_scenario_upvote() CASCADE;
DROP FUNCTION IF EXISTS public.decrement_scenario_upvote() CASCADE;

DROP TABLE IF EXISTS public.scenario_upvotes;
