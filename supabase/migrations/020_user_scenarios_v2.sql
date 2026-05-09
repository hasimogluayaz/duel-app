-- Migration 020: user scenario creation v2
-- Adds debate_question, tags, upvotes/downvotes, author_id alias, scenario_votes table

-- Add missing columns to scenarios
ALTER TABLE scenarios
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS upvotes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS downvotes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS debate_question text;

-- author_id mirrors user_id for clarity — keep both in sync via trigger
CREATE OR REPLACE FUNCTION sync_scenario_author()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.author_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.author_id := NEW.user_id;
  END IF;
  IF NEW.user_id IS NULL AND NEW.author_id IS NOT NULL THEN
    NEW.user_id := NEW.author_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_scenario_author ON scenarios;
CREATE TRIGGER trg_sync_scenario_author
  BEFORE INSERT OR UPDATE ON scenarios
  FOR EACH ROW EXECUTE FUNCTION sync_scenario_author();

-- Scenario votes (upvote / downvote community scenarios)
CREATE TABLE IF NOT EXISTS scenario_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  vote_type   text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scenario_id)
);

ALTER TABLE scenario_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scenario votes" ON scenario_votes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read scenario votes" ON scenario_votes
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_scenario_votes_scenario ON scenario_votes(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_votes_user ON scenario_votes(user_id);

-- Auto-increment upvotes/downvotes on scenario_votes insert/delete
CREATE OR REPLACE FUNCTION update_scenario_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE scenarios SET upvotes = upvotes + 1 WHERE id = NEW.scenario_id;
    ELSE
      UPDATE scenarios SET downvotes = downvotes + 1 WHERE id = NEW.scenario_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE scenarios SET upvotes = GREATEST(0, upvotes - 1) WHERE id = OLD.scenario_id;
    ELSE
      UPDATE scenarios SET downvotes = GREATEST(0, downvotes - 1) WHERE id = OLD.scenario_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.vote_type != NEW.vote_type THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE scenarios SET upvotes = upvotes + 1, downvotes = GREATEST(0, downvotes - 1) WHERE id = NEW.scenario_id;
    ELSE
      UPDATE scenarios SET upvotes = GREATEST(0, upvotes - 1), downvotes = downvotes + 1 WHERE id = NEW.scenario_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_scenario_vote_counts ON scenario_votes;
CREATE TRIGGER trg_scenario_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON scenario_votes
  FOR EACH ROW EXECUTE FUNCTION update_scenario_vote_counts();

-- Index for trending: user-created scenarios sorted by net score
CREATE INDEX IF NOT EXISTS idx_scenarios_trending
  ON scenarios(is_user_created, upvotes DESC, generated_at DESC)
  WHERE is_user_created = true AND is_approved = true;
