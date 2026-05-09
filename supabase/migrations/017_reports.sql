-- ── 017: Reports table ──

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  target_type text NOT NULL CHECK (target_type IN ('answer', 'duel', 'comment', 'profile')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reporter_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_target_idx ON reports(target_type, target_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_own_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_own_read" ON reports FOR SELECT USING (auth.uid() = reporter_id);
-- Admins read via service role (API bypasses RLS with service key)
