-- ── 015: Platform expansion ──────────────────────────────────────────────

-- Anonymous answers
ALTER TABLE answers ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;

-- Scenario difficulty
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium';

-- Versus scenario type
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS scenario_type text CHECK (scenario_type IN ('open', 'versus')) DEFAULT 'open';
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS option_a text;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS option_b text;

-- Community upvotes for user-submitted scenarios
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS upvote_count integer NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS scenario_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, scenario_id)
);

-- User titles / unvan system
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_title text;
CREATE TABLE IF NOT EXISTS user_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, title)
);

-- Referral system
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE DEFAULT substring(md5(gen_random_uuid()::text), 1, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_count integer NOT NULL DEFAULT 0;

-- Streak freeze
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_freeze_count integer NOT NULL DEFAULT 0;

-- Onboarding flag
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Versus answers: which option user picked (a/b)
ALTER TABLE answers ADD COLUMN IF NOT EXISTS chosen_option text CHECK (chosen_option IN ('a', 'b'));

-- Trigger: increment scenario upvote_count
CREATE OR REPLACE FUNCTION increment_scenario_upvote()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE scenarios SET upvote_count = upvote_count + 1 WHERE id = NEW.scenario_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_scenario_upvote
  AFTER INSERT ON scenario_upvotes
  FOR EACH ROW EXECUTE FUNCTION increment_scenario_upvote();

CREATE OR REPLACE FUNCTION decrement_scenario_upvote()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE scenarios SET upvote_count = GREATEST(0, upvote_count - 1) WHERE id = OLD.scenario_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_scenario_downvote
  AFTER DELETE ON scenario_upvotes
  FOR EACH ROW EXECUTE FUNCTION decrement_scenario_upvote();

-- RLS
ALTER TABLE scenario_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scenario_upvotes_select" ON scenario_upvotes FOR SELECT USING (true);
CREATE POLICY "scenario_upvotes_insert" ON scenario_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "scenario_upvotes_delete" ON scenario_upvotes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_titles_select" ON user_titles FOR SELECT USING (true);
CREATE POLICY "user_titles_insert" ON user_titles FOR INSERT WITH CHECK (auth.uid() = user_id);
