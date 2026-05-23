-- Migration 034: allow anonymous duel_participants inserts
-- Previously dp_insert required auth.uid() IS NOT NULL, so anonymous users
-- could answer the scenario but were silently dropped from the duel and
-- vanished on page refresh. Capacity (4) is enforced by the API; FK on
-- answer_id ensures each row points to a real answer.

DROP POLICY IF EXISTS "dp_insert" ON public.duel_participants;

CREATE POLICY "dp_insert" ON public.duel_participants
  FOR INSERT WITH CHECK (
    -- Authenticated user adding themselves
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- Anonymous participant (user_id MUST be NULL)
    (user_id IS NULL)
  );
