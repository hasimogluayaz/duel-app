-- Standalone answer likes (for scenario archive, outside duel context)
CREATE TABLE IF NOT EXISTS answer_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answer_id  uuid NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, answer_id)
);

ALTER TABLE answer_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own likes" ON answer_likes;
CREATE POLICY "Users manage own likes" ON answer_likes
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read likes" ON answer_likes;
CREATE POLICY "Anyone can read likes" ON answer_likes
  FOR SELECT USING (true);

-- Trigger: increment answer vote_count on new like
CREATE OR REPLACE FUNCTION increment_answer_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE answers SET vote_count = vote_count + 1 WHERE id = NEW.answer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_answer_like_count ON answer_likes;
CREATE TRIGGER trg_answer_like_count
  AFTER INSERT ON answer_likes
  FOR EACH ROW EXECUTE FUNCTION increment_answer_like_count();

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_answer_likes_user ON answer_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_answer_likes_answer ON answer_likes(answer_id);
