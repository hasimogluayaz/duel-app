-- ─────────────────────────────────────────────────────────────
--  Engagement tables: views + likes
--  Run once in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Add view_count to duels (denormalized, incremented on page open)
ALTER TABLE public.duels
  ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0 NOT NULL;

-- 2. duel_likes — one like per user per duel
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

CREATE POLICY "duel_likes_select_all"
  ON public.duel_likes FOR SELECT USING (true);

CREATE POLICY "duel_likes_insert_own"
  ON public.duel_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "duel_likes_delete_own"
  ON public.duel_likes FOR DELETE USING (auth.uid() = user_id);

-- 3. RPC: atomically increment view_count
CREATE OR REPLACE FUNCTION public.increment_duel_view(p_duel_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.duels
  SET view_count = view_count + 1
  WHERE id = p_duel_id;
$$;
