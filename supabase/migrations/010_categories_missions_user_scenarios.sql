-- Scenarios: category + user-created support
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'genel';
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS is_user_created boolean NOT NULL DEFAULT false;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT true;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS answer_count int NOT NULL DEFAULT 0;

-- Back-fill answer_count from existing data
UPDATE scenarios s
SET answer_count = (SELECT COUNT(*) FROM answers a WHERE a.scenario_id = s.id);

-- Auto-increment answer_count on new answers
CREATE OR REPLACE FUNCTION increment_scenario_answer_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE scenarios SET answer_count = answer_count + 1 WHERE id = NEW.scenario_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_scenario_answer_count ON answers;
CREATE TRIGGER trg_scenario_answer_count
  AFTER INSERT ON answers
  FOR EACH ROW EXECUTE FUNCTION increment_scenario_answer_count();

-- RLS: allow users to see approved scenarios (including user-created)
-- Existing RLS on scenarios should cover this since default is SELECT *

-- Daily missions progress
CREATE TABLE IF NOT EXISTS user_daily_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  mission_type text NOT NULL,
  progress int NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  points_awarded int NOT NULL DEFAULT 0,
  UNIQUE(user_id, date, mission_type)
);

ALTER TABLE user_daily_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own daily missions" ON user_daily_missions;
CREATE POLICY "Users manage own daily missions" ON user_daily_missions
  FOR ALL USING (auth.uid() = user_id);

-- Index for fast daily lookup
CREATE INDEX IF NOT EXISTS idx_user_daily_missions_user_date
  ON user_daily_missions(user_id, date);

-- User scenario rate limiting: max 5 per day
CREATE INDEX IF NOT EXISTS idx_scenarios_user_date
  ON scenarios(user_id, created_at)
  WHERE is_user_created = true;
