-- Migration 021: auto-hide content with 5+ reports + user violation tracking

-- Add violation count to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS violation_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS temp_banned_until timestamptz;

-- Add auto_hidden flag to reports table (tracks whether this report triggered auto-hide)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'auto_hidden'
  ) THEN
    ALTER TABLE reports ADD COLUMN auto_hidden boolean NOT NULL DEFAULT false;
  END IF;
END$$;

-- Function: when a report is inserted, check if target has 5+ pending reports → auto-hide
CREATE OR REPLACE FUNCTION auto_hide_reported_content()
RETURNS TRIGGER AS $$
DECLARE
  report_count integer;
BEGIN
  SELECT COUNT(*) INTO report_count
  FROM reports
  WHERE target_type = NEW.target_type
    AND target_id = NEW.target_id
    AND status = 'pending';

  IF report_count >= 5 THEN
    -- Hide the content based on type
    IF NEW.target_type = 'answer' THEN
      UPDATE answers SET is_hidden = true WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'comment' THEN
      UPDATE answer_comments SET is_hidden = true WHERE id = NEW.target_id;
    END IF;

    -- Mark newest report as auto_hidden trigger
    UPDATE reports SET auto_hidden = true
    WHERE target_type = NEW.target_type
      AND target_id = NEW.target_id
      AND status = 'pending'
      AND auto_hidden = false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_hide_reports ON reports;
CREATE TRIGGER trg_auto_hide_reports
  AFTER INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION auto_hide_reported_content();

-- Add is_hidden to answers if not exists
ALTER TABLE answers
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- Add is_hidden to answer_comments if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'answer_comments') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'answer_comments' AND column_name = 'is_hidden'
    ) THEN
      ALTER TABLE answer_comments ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;
    END IF;
  END IF;
END$$;

-- RLS: hide is_hidden answers from regular queries
-- Existing policies remain; we add a filter in app-layer queries (is_hidden = false)

-- Function: increment violation_count on profile when a report is resolved (not dismissed)
CREATE OR REPLACE FUNCTION handle_report_resolution()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Only act when status changes to 'resolved'
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status != 'resolved' THEN RETURN NEW; END IF;

  -- Find the user who owns the reported content
  IF NEW.target_type = 'answer' THEN
    SELECT user_id INTO target_user_id FROM answers WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'comment' THEN
    SELECT user_id INTO target_user_id FROM answer_comments WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'profile' THEN
    target_user_id := NEW.target_id::uuid;
  END IF;

  IF target_user_id IS NULL THEN RETURN NEW; END IF;

  -- Increment violation count
  UPDATE profiles
  SET violation_count = violation_count + 1
  WHERE id = target_user_id;

  -- Check thresholds: 3 → temp ban (7 days), 5 → permanent ban
  UPDATE profiles
  SET
    temp_banned_until = CASE
      WHEN violation_count + 1 = 3 THEN now() + interval '7 days'
      ELSE temp_banned_until
    END,
    is_banned = CASE
      WHEN violation_count + 1 >= 5 THEN true
      ELSE is_banned
    END
  WHERE id = target_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_report_resolution ON reports;
CREATE TRIGGER trg_report_resolution
  AFTER UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION handle_report_resolution();

-- Index for counting pending reports per target (used by auto-hide trigger)
CREATE INDEX IF NOT EXISTS idx_reports_target_status
  ON reports(target_type, target_id, status);
