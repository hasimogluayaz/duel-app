-- ══════════════════════════════════════════════════════════════
-- Migration 013: Follower / following counts + mutual follow index
-- ══════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count  integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count integer NOT NULL DEFAULT 0;

-- Back-fill from followers table
UPDATE profiles p SET
  follower_count  = (SELECT COUNT(*) FROM followers f WHERE f.following_id = p.id),
  following_count = (SELECT COUNT(*) FROM followers f WHERE f.follower_id  = p.id);

-- Auto-sync on follow / unfollow
CREATE OR REPLACE FUNCTION sync_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET follower_count  = follower_count  + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET follower_count  = GREATEST(follower_count  - 1, 0) WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_follower_counts ON followers;
CREATE TRIGGER trg_sync_follower_counts
  AFTER INSERT OR DELETE ON followers
  FOR EACH ROW EXECUTE FUNCTION sync_follower_counts();

-- Index for "mutual friends" suggestions
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower  ON followers(follower_id);
