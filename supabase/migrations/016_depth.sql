-- ── 016: Platform depth — activity, bookmarks, comments, checkins, seasons ──

-- Activity feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'duel_won','duel_lost','answer_voted','answer_created','followed','achievement','tier_up','weekly_champion'
  target_id uuid,     -- duel_id, answer_id, user_id etc.
  target_type text,   -- 'duel','answer','profile','achievement'
  meta jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_feed_user_idx ON activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_feed_public_idx ON activity_feed(created_at DESC);

-- Answer bookmarks
CREATE TABLE IF NOT EXISTS answer_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answer_id uuid NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, answer_id)
);

-- Scenario bookmarks
CREATE TABLE IF NOT EXISTS scenario_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, scenario_id)
);

-- Answer comments (not duel comments — standalone answer comments)
CREATE TABLE IF NOT EXISTS answer_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answer_id uuid NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS answer_comments_answer_idx ON answer_comments(answer_id, created_at);

-- Daily check-in rewards
CREATE TABLE IF NOT EXISTS daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  streak_day integer NOT NULL DEFAULT 1,
  points_awarded integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

-- Seasons
CREATE TABLE IF NOT EXISTS seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  starts_at date NOT NULL,
  ends_at date NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  reward_title text,
  reward_points integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Season standings snapshot (end-of-season)
CREATE TABLE IF NOT EXISTS season_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(season_id, user_id)
);

-- Weekly missions (separate from daily)
CREATE TABLE IF NOT EXISTS weekly_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  type text NOT NULL,
  target integer NOT NULL DEFAULT 1,
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  points_reward integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start, type)
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  duel_updates boolean NOT NULL DEFAULT true,
  answer_votes boolean NOT NULL DEFAULT true,
  social boolean NOT NULL DEFAULT true,
  system boolean NOT NULL DEFAULT true,
  weekly_summary boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Rematch requests (on duels table: add rematch_requested_by)
ALTER TABLE duels ADD COLUMN IF NOT EXISTS rematch_requested_by uuid REFERENCES profiles(id);
ALTER TABLE duels ADD COLUMN IF NOT EXISTS parent_duel_id uuid REFERENCES duels(id);

-- Answer edit tracking
ALTER TABLE answers ADD COLUMN IF NOT EXISTS edited_at timestamptz;
ALTER TABLE answers ADD COLUMN IF NOT EXISTS edit_count integer NOT NULL DEFAULT 0;

-- Duel: add category field (for category-based matchmaking)
ALTER TABLE duels ADD COLUMN IF NOT EXISTS category text;

-- Scenario: add editor_pick flag
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS is_editor_pick boolean NOT NULL DEFAULT false;

-- Profile: add theme + bookmark_count
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_theme text DEFAULT 'default';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bookmark_count integer NOT NULL DEFAULT 0;

-- Current season tracking on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS season_points integer NOT NULL DEFAULT 0;

-- RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "activity_public_read" ON activity_feed FOR SELECT USING (true);
CREATE POLICY "activity_own_insert" ON activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_own" ON answer_bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "scenario_bookmarks_own" ON scenario_bookmarks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "comments_public_read" ON answer_comments FOR SELECT USING (true);
CREATE POLICY "comments_own_insert" ON answer_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_own_delete" ON answer_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "checkins_own" ON daily_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "seasons_public_read" ON seasons FOR SELECT USING (true);
CREATE POLICY "standings_public_read" ON season_standings FOR SELECT USING (true);
CREATE POLICY "weekly_missions_own" ON weekly_missions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notif_prefs_own" ON notification_preferences FOR ALL USING (auth.uid() = user_id);

-- Insert current season
INSERT INTO seasons (name, starts_at, ends_at, is_active, reward_title, reward_points)
VALUES ('Sezon 1 — Başlangıç', CURRENT_DATE, CURRENT_DATE + interval '30 days', true, 'ilk_kan', 500)
ON CONFLICT DO NOTHING;
