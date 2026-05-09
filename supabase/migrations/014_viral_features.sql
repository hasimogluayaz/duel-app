-- ══════════════════════════════════════════════════════════════
-- Migration 014: Karar Ver, Arkadaş Challenge, Reactions,
--                Weekly Champion, Profile Vitrin
-- ══════════════════════════════════════════════════════════════

-- ── 1. Karar Ver: swipe verdicts on answer pairs ──────────────
CREATE TABLE IF NOT EXISTS answer_verdicts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scenario_id     uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  winner_id       uuid NOT NULL REFERENCES answers(id)  ON DELETE CASCADE,
  loser_id        uuid NOT NULL REFERENCES answers(id)  ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(voter_id, winner_id, loser_id)
);
ALTER TABLE answer_verdicts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own verdicts" ON answer_verdicts
  FOR ALL USING (auth.uid() = voter_id);
CREATE POLICY "Verdicts readable" ON answer_verdicts
  FOR SELECT USING (true);

-- verdict_count on answers (how many times picked as winner)
ALTER TABLE answers ADD COLUMN IF NOT EXISTS verdict_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_verdict_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE answers SET verdict_count = verdict_count + 1 WHERE id = NEW.winner_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_increment_verdict ON answer_verdicts;
CREATE TRIGGER trg_increment_verdict
  AFTER INSERT ON answer_verdicts
  FOR EACH ROW EXECUTE FUNCTION increment_verdict_count();

-- ── 2. Arkadaş Challenge links ────────────────────────────────
CREATE TABLE IF NOT EXISTS friend_challenges (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token                 text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  challenger_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scenario_id           uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  challenger_answer_id  uuid NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  friend_answer_id      uuid REFERENCES answers(id) ON DELETE SET NULL,
  friend_user_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at            timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at            timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE friend_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read challenge by token" ON friend_challenges
  FOR SELECT USING (true);
CREATE POLICY "Challenger manages own" ON friend_challenges
  FOR ALL USING (auth.uid() = challenger_id);

-- ── 3. Answer Reactions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS answer_reactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answer_id   uuid NOT NULL REFERENCES answers(id)  ON DELETE CASCADE,
  emoji       text NOT NULL CHECK (emoji IN ('🔥', '💯', '😂', '🤔', '😮')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, answer_id, emoji)
);
ALTER TABLE answer_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reactions" ON answer_reactions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Reactions readable" ON answer_reactions
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_answer_reactions_answer ON answer_reactions(answer_id);

-- ── 4. Weekly Champions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_champions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start  date NOT NULL,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answer_id   uuid NOT NULL REFERENCES answers(id)  ON DELETE CASCADE,
  vote_count  int NOT NULL DEFAULT 0,
  scenario_content text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(week_start)
);
ALTER TABLE weekly_champions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Weekly champions readable" ON weekly_champions FOR SELECT USING (true);

-- ── 5. Profile: pinned answers + vitrin ──────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pinned_answer_ids uuid[] DEFAULT '{}';

-- ── 6. Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_verdicts_scenario  ON answer_verdicts(scenario_id);
CREATE INDEX IF NOT EXISTS idx_verdicts_voter     ON answer_verdicts(voter_id);
CREATE INDEX IF NOT EXISTS idx_friend_challenges_token ON friend_challenges(token);
