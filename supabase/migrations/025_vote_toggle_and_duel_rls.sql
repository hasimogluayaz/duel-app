-- Migration 025: Vote toggle support + duel creator_response_id

-- 1. RPC function to decrement vote count (for vote toggle off)
CREATE OR REPLACE FUNCTION decrement_answer_vote_count(aid uuid)
RETURNS void AS $$
BEGIN
  UPDATE answers SET vote_count = GREATEST(0, vote_count - 1) WHERE id = aid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add creator_response_id to duels (links to creator's answer)
ALTER TABLE duels ADD COLUMN IF NOT EXISTS creator_response_id uuid REFERENCES answers(id) ON DELETE SET NULL;

-- 3. Ensure RLS on duels allows authenticated inserts
DROP POLICY IF EXISTS "duels_insert" ON duels;
CREATE POLICY "duels_insert" ON duels
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND creator_id = auth.uid());

-- 4. Delete policy for answer_likes (needed for toggle)
DROP POLICY IF EXISTS "Users delete own likes" ON answer_likes;
CREATE POLICY "Users delete own likes" ON answer_likes
  FOR DELETE USING (auth.uid() = user_id);
