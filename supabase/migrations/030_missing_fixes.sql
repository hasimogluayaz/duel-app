-- Migration 030: Missing fixes (engagement, seasons, RPCs, achievement types)
-- Run in Supabase SQL Editor

-- ── 1. Engagement: view_count on duels + duel_likes table ─────────────────────
ALTER TABLE public.duels
  ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0 NOT NULL;

CREATE TABLE IF NOT EXISTS public.duel_likes (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  duel_id     uuid        NOT NULL REFERENCES public.duels(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (duel_id, user_id)
);

CREATE INDEX IF NOT EXISTS duel_likes_duel_id_idx ON public.duel_likes (duel_id);
CREATE INDEX IF NOT EXISTS duel_likes_user_id_idx ON public.duel_likes (user_id);

ALTER TABLE public.duel_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "duel_likes_select_all" ON public.duel_likes;
DROP POLICY IF EXISTS "duel_likes_insert_own" ON public.duel_likes;
DROP POLICY IF EXISTS "duel_likes_delete_own" ON public.duel_likes;

CREATE POLICY "duel_likes_select_all"
  ON public.duel_likes FOR SELECT USING (true);

CREATE POLICY "duel_likes_insert_own"
  ON public.duel_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "duel_likes_delete_own"
  ON public.duel_likes FOR DELETE USING (auth.uid() = user_id);

-- RPC: increment view count atomically
CREATE OR REPLACE FUNCTION public.increment_duel_view(p_duel_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.duels SET view_count = view_count + 1 WHERE id = p_duel_id;
$$;

-- ── 2. decrement_answer_count RPC (missing — causes silent count drift) ───────
CREATE OR REPLACE FUNCTION public.decrement_answer_count(p_scenario_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.scenarios
  SET answer_count = GREATEST(0, COALESCE(answer_count, 0) - 1)
  WHERE id = p_scenario_id;
$$;

-- ── 3. seasons table: winner_id + ended_at (season-end cron needs these) ─────
ALTER TABLE public.seasons
  ADD COLUMN IF NOT EXISTS winner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ended_at  timestamptz;

-- ── 4. Achievement CHECK constraint: add season rank types ────────────────────
-- Drop and recreate to include season_birinci / season_ikinci / season_ucuncu
ALTER TABLE public.achievements
  DROP CONSTRAINT IF EXISTS achievements_type_check;

ALTER TABLE public.achievements
  ADD CONSTRAINT achievements_type_check
  CHECK (type IN (
    'first_win', 'streak_7', 'streak_30', 'roast_master', 'popular',
    'season_birinci', 'season_ikinci', 'season_ucuncu'
  ));

-- ── 5. Stories cleanup function (table-safe: only deletes if table exists) ──
-- Uses plpgsql + EXECUTE so the function body isn't validated against the
-- stories table at creation time. Cron can call it harmlessly even if
-- migration 023 (stories) was never run.
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'stories'
  ) THEN
    EXECUTE 'DELETE FROM public.stories WHERE expires_at < now()';
  END IF;
END;
$$;
