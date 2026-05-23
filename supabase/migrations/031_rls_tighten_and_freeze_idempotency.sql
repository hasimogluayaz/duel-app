-- Migration 031: RLS tightening + streak freeze idempotency
-- Run in Supabase SQL Editor

-- ── 1. answers INSERT: require authenticated user ────────────────────────────
-- Migration 024 set WITH CHECK (true) which let anyone insert any user_id.
-- Restrict to authenticated users; allow anonymous answers only with NULL user_id.
DROP POLICY IF EXISTS "answers_insert" ON public.answers;

CREATE POLICY "answers_insert"
  ON public.answers FOR INSERT
  WITH CHECK (
    -- Authenticated user inserting their own answer
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- Anonymous answer (must explicitly set user_id to NULL)
    (user_id IS NULL)
  );

-- ── 2. referrals INSERT: only authenticated and only own row ─────────────────
DROP POLICY IF EXISTS "referrals_insert_service" ON public.referrals;
DROP POLICY IF EXISTS "referrals_insert" ON public.referrals;

CREATE POLICY "referrals_insert"
  ON public.referrals FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND referred_user_id = auth.uid()
  );

-- ── 3. Streak freeze idempotency: track last freeze date ─────────────────────
-- Prevents the same freeze from being consumed twice if both answer route and
-- cron fire on the same UTC day.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_freeze_used_at date;

-- ── 4. Atomic freeze consumption helper ──────────────────────────────────────
-- Returns true if a freeze was successfully consumed for this date, false if
-- already consumed today (or no freezes available).
CREATE OR REPLACE FUNCTION public.consume_streak_freeze(p_user_id uuid, p_date date)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_consumed boolean := false;
BEGIN
  UPDATE public.profiles
  SET
    streak_freeze_count = streak_freeze_count - 1,
    last_freeze_used_at = p_date
  WHERE id = p_user_id
    AND COALESCE(streak_freeze_count, 0) > 0
    AND (last_freeze_used_at IS NULL OR last_freeze_used_at < p_date);

  GET DIAGNOSTICS v_consumed = ROW_COUNT;
  RETURN v_consumed;
END;
$$;
