-- ══════════════════════════════════════════════════════════════
-- Migration 005: vote_count + followers + comments + reports +
--                streak_freeze + referral system
-- ══════════════════════════════════════════════════════════════

-- ── 1. vote_count column on answers ──────────────────────────
ALTER TABLE answers ADD COLUMN IF NOT EXISTS vote_count integer NOT NULL DEFAULT 0;

-- Backfill existing vote_counts from duels
-- (votes cast for a person in a duel = oy on their answer)
UPDATE answers a
SET vote_count = (
  SELECT COUNT(*)
  FROM votes v
  JOIN duels d ON v.duel_id = d.id
  WHERE (d.challenger_answer_id = a.id AND v.voted_for_id = d.challenger_id)
     OR (d.challenged_answer_id = a.id AND v.voted_for_id = d.challenged_id)
);

-- Trigger: keep vote_count in sync when a vote is inserted
CREATE OR REPLACE FUNCTION increment_answer_vote_count()
RETURNS TRIGGER AS $$
DECLARE
  v_answer_id uuid;
BEGIN
  -- find the answer_id for this vote
  SELECT
    CASE
      WHEN d.challenger_id = NEW.voted_for_id THEN d.challenger_answer_id
      ELSE d.challenged_answer_id
    END INTO v_answer_id
  FROM duels d
  WHERE d.id = NEW.duel_id;

  IF v_answer_id IS NOT NULL THEN
    UPDATE answers SET vote_count = vote_count + 1 WHERE id = v_answer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_increment_answer_vote_count ON votes;
CREATE TRIGGER trg_increment_answer_vote_count
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION increment_answer_vote_count();

-- ── 2. streak_freeze_count + onboarding_done on profiles ─────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_freeze_count integer NOT NULL DEFAULT 3;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_done boolean NOT NULL DEFAULT false;

-- ── 3. followers table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS followers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT followers_unique UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);

ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followers_select" ON followers FOR SELECT USING (true);
CREATE POLICY "followers_insert" ON followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "followers_delete" ON followers FOR DELETE
  USING (auth.uid() = follower_id);

-- follower / following counts on profiles (denormalized for perf)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count  integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET follower_count  = follower_count  + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE profiles SET follower_count  = GREATEST(follower_count  - 1, 0) WHERE id = OLD.following_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_follower_counts ON followers;
CREATE TRIGGER trg_follower_counts
  AFTER INSERT OR DELETE ON followers
  FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- ── 4. comments table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id  uuid NOT NULL REFERENCES duels(id)    ON DELETE CASCADE,
  user_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content  text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_duel ON comments(duel_id, created_at DESC);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- comment_count on duels
ALTER TABLE duels ADD COLUMN IF NOT EXISTS comment_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION update_duel_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE duels SET comment_count = comment_count + 1 WHERE id = NEW.duel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE duels SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.duel_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_duel_comment_count ON comments;
CREATE TRIGGER trg_duel_comment_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_duel_comment_count();

-- ── 5. reports table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type  text NOT NULL CHECK (target_type IN ('answer','duel','comment','profile')),
  target_id    uuid NOT NULL,
  reason       text NOT NULL CHECK (reason IN (
    'spam','hate_speech','inappropriate','harassment','other'
  )),
  description  text CHECK (char_length(description) <= 500),
  status       text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','reviewed','dismissed')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_unique UNIQUE (reporter_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_insert" ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_select_admin" ON reports FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "reports_update_admin" ON reports FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── 6. referrals table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_given boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referrals_unique UNIQUE (referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select" ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "referrals_insert_service" ON referrals FOR INSERT
  WITH CHECK (true); -- service role handles inserts

-- referral_code on profiles (unique short code for sharing)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- backfill codes for existing profiles
UPDATE profiles
SET referral_code = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE referral_code IS NULL;

-- trigger to assign code on new profile
CREATE OR REPLACE FUNCTION assign_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_referral_code ON profiles;
CREATE TRIGGER trg_assign_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION assign_referral_code();
