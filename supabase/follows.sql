-- ============================================================
-- Kapisio — Follow System Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.follows (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid       NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS follows_follower_id_idx  ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows (following_id);

-- Row-Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select_all"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "follows_insert_own"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete_own"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================================
-- Optional: add vote_count column to answers if missing
-- (used by the feed for sorting)
-- ============================================================
ALTER TABLE public.answers ADD COLUMN IF NOT EXISTS vote_count integer DEFAULT 0;
