-- 023: 24-hour story scenarios
-- Adds is_story flag and expires_at timestamp to scenarios table

alter table scenarios
  add column if not exists is_story boolean default false,
  add column if not exists expires_at timestamptz default null;

-- Index for fast story queries (active stories only)
create index if not exists idx_scenarios_stories
  on scenarios (is_story, expires_at)
  where is_story = true;

-- Auto-cleanup function: mark expired stories as inactive
create or replace function cleanup_expired_stories()
returns void language plpgsql as $$
begin
  update scenarios
  set is_approved = false
  where is_story = true
    and expires_at is not null
    and expires_at < now()
    and is_approved = true;
end;
$$;

-- Comment: run cleanup_expired_stories() periodically via pg_cron or Supabase scheduled functions
