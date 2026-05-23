-- Migration 027: duel_participants — multi-person invite duels (max 4)
--
-- Allows up to 4 people (creator + 3 others) to participate in one
-- invite duel. The creator is inserted as participant 1 when the
-- invite link is generated.

CREATE TABLE IF NOT EXISTS duel_participants (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id    uuid        NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
  user_id    uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  answer_id  uuid        REFERENCES answers(id)  ON DELETE SET NULL,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(duel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dp_duel_id ON duel_participants(duel_id, joined_at);

ALTER TABLE duel_participants ENABLE ROW LEVEL SECURITY;

-- Anyone can read participants (to show the grid)
CREATE POLICY "dp_select" ON duel_participants
  FOR SELECT USING (true);

-- Authenticated users can add themselves
CREATE POLICY "dp_insert" ON duel_participants
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL)
  );

-- Only the participant themselves can remove their entry
CREATE POLICY "dp_delete" ON duel_participants
  FOR DELETE USING (auth.uid() = user_id);
