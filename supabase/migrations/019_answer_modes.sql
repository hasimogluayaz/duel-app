-- Migration 012: answer modes (emoji, character, debate)

ALTER TABLE answers
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'scenario',
  ADD COLUMN IF NOT EXISTS mode_metadata jsonb;

-- index for filtering answers by mode
CREATE INDEX IF NOT EXISTS idx_answers_mode ON answers(mode);
CREATE INDEX IF NOT EXISTS idx_answers_scenario_mode ON answers(scenario_id, mode);
