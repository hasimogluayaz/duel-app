-- ============================================================
-- DUEL — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        text UNIQUE NOT NULL,
  display_name    text,
  avatar_url      text,
  bio             text,
  total_points    integer NOT NULL DEFAULT 0,
  weekly_points   integer NOT NULL DEFAULT 0,
  streak_count    integer NOT NULL DEFAULT 0,
  last_played_at  timestamptz,
  personality_type         text,
  personality_updated_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- scenarios
CREATE TABLE IF NOT EXISTS public.scenarios (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content      text NOT NULL,
  active_date  date UNIQUE NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- answers
CREATE TABLE IF NOT EXISTS public.answers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, scenario_id)
);

-- duels
CREATE TABLE IF NOT EXISTS public.duels (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id          uuid NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  challenger_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenged_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenger_answer_id uuid REFERENCES public.answers(id) ON DELETE SET NULL,
  challenged_answer_id uuid REFERENCES public.answers(id) ON DELETE SET NULL,
  status               text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'active', 'completed')),
  winner_id            uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ai_verdict           text,
  ai_roast             text,
  vote_deadline        timestamptz,
  share_token          text UNIQUE NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- votes
CREATE TABLE IF NOT EXISTS public.votes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id       uuid NOT NULL REFERENCES public.duels(id) ON DELETE CASCADE,
  voter_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  voted_for_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(duel_id, voter_id)
);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text NOT NULL,
  message    text NOT NULL,
  data       jsonb NOT NULL DEFAULT '{}',
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type      text NOT NULL
              CHECK (type IN ('first_win', 'streak_7', 'streak_30', 'roast_master', 'popular')),
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, type)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_answers_user_scenario ON public.answers(user_id, scenario_id);
CREATE INDEX IF NOT EXISTS idx_answers_scenario ON public.answers(scenario_id);
CREATE INDEX IF NOT EXISTS idx_duels_challenger ON public.duels(challenger_id);
CREATE INDEX IF NOT EXISTS idx_duels_challenged ON public.duels(challenged_id);
CREATE INDEX IF NOT EXISTS idx_duels_share_token ON public.duels(share_token);
CREATE INDEX IF NOT EXISTS idx_duels_status ON public.duels(status);
CREATE INDEX IF NOT EXISTS idx_votes_duel ON public.votes(duel_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON public.votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON public.profiles(total_points DESC, weekly_points DESC);
CREATE INDEX IF NOT EXISTS idx_scenarios_date ON public.scenarios(active_date);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duels         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements  ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "Profiles are publicly viewable"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- scenarios policies
CREATE POLICY "Scenarios are publicly viewable"
  ON public.scenarios FOR SELECT USING (true);

CREATE POLICY "Only service role can insert scenarios"
  ON public.scenarios FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- answers policies
CREATE POLICY "Answers are viewable by everyone"
  ON public.answers FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert their own answers"
  ON public.answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- duels policies
CREATE POLICY "Duels are publicly viewable"
  ON public.duels FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create duels"
  ON public.duels FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Duel participants can update their duel"
  ON public.duels FOR UPDATE
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- votes policies
CREATE POLICY "Votes are publicly viewable"
  ON public.votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id);

-- notifications policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- achievements policies
CREATE POLICY "Achievements are publicly viewable"
  ON public.achievements FOR SELECT USING (true);

CREATE POLICY "Service role can manage achievements"
  ON public.achievements FOR ALL
  WITH CHECK (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      LOWER(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', '_'))
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: create profile on new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Reset weekly points (call via cron every Monday)
CREATE OR REPLACE FUNCTION public.reset_weekly_points()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles SET weekly_points = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- REALTIME
-- ============================================================

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
