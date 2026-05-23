-- Migration 036: disable anonymous answers and duel participation
-- All actions (answering, voting, joining duels) now require authentication.

-- ── 1. answers: only authenticated inserts ──────────────────────────────────
-- Migration 031 allowed (user_id IS NULL) for anonymous answers; revoke that.
DROP POLICY IF EXISTS "answers_insert" ON public.answers;

CREATE POLICY "answers_insert"
  ON public.answers FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- ── 2. duel_participants: only authenticated inserts ────────────────────────
-- Migration 034 allowed (user_id IS NULL) for anonymous participants; revoke.
DROP POLICY IF EXISTS "dp_insert" ON public.duel_participants;

CREATE POLICY "dp_insert" ON public.duel_participants
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- ── 3. Optional: ip_address / user_agent columns from migration 035 ─────────
-- Left in place for historical anonymous answers already in the DB. Safe to
-- ignore or drop manually later. Index also retained.
