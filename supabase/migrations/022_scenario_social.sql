-- Migration 022: scenario-level comments + comment_count + follower notification trigger

-- scenario_comments: Twitter-style replies on scenarios (not on answers)
CREATE TABLE IF NOT EXISTS scenario_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     text NOT NULL CHECK (length(content) BETWEEN 1 AND 500),
  parent_id   uuid REFERENCES scenario_comments(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  is_hidden   boolean NOT NULL DEFAULT false
);

ALTER TABLE scenario_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible scenario comments" ON scenario_comments
  FOR SELECT USING (is_hidden = false);

CREATE POLICY "Users manage own scenario comments" ON scenario_comments
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scenario_comments_scenario
  ON scenario_comments(scenario_id, created_at DESC);

-- comment_count column on scenarios
ALTER TABLE scenarios
  ADD COLUMN IF NOT EXISTS comment_count integer NOT NULL DEFAULT 0;

-- auto-update comment_count
CREATE OR REPLACE FUNCTION update_scenario_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE scenarios SET comment_count = comment_count + 1 WHERE id = NEW.scenario_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE scenarios SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.scenario_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_scenario_comment_count ON scenario_comments;
CREATE TRIGGER trg_scenario_comment_count
  AFTER INSERT OR DELETE ON scenario_comments
  FOR EACH ROW EXECUTE FUNCTION update_scenario_comment_count();

-- Notify followers when a user-created scenario is approved (or inserted as approved)
CREATE OR REPLACE FUNCTION notify_scenario_followers()
RETURNS TRIGGER AS $$
DECLARE
  author_name text;
BEGIN
  IF NOT (NEW.is_user_created AND NEW.is_approved) THEN
    RETURN NEW;
  END IF;
  IF OLD IS NOT NULL AND OLD.is_approved THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, username) INTO author_name
  FROM profiles WHERE id = NEW.user_id;

  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT
    f.follower_id,
    'new_scenario',
    'Yeni Senaryo',
    author_name || ' yeni bir senaryo paylaştı',
    jsonb_build_object('scenario_id', NEW.id, 'author_id', NEW.user_id)
  FROM followers f
  WHERE f.following_id = NEW.user_id
    AND f.follower_id != NEW.user_id
  LIMIT 500;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_scenario_followers ON scenarios;
CREATE TRIGGER trg_notify_scenario_followers
  AFTER INSERT OR UPDATE OF is_approved ON scenarios
  FOR EACH ROW EXECUTE FUNCTION notify_scenario_followers();
