-- blocks: user-to-user blocking
create table if not exists blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references profiles(id) on delete cascade,
  blocked_id  uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(blocker_id, blocked_id)
);

-- Index for quick lookups
create index if not exists blocks_blocker_idx on blocks(blocker_id);
create index if not exists blocks_blocked_idx on blocks(blocked_id);

-- RLS
alter table blocks enable row level security;

-- Users can manage their own blocks
create policy "blocks: own insert" on blocks
  for insert with check (auth.uid() = blocker_id);

create policy "blocks: own delete" on blocks
  for delete using (auth.uid() = blocker_id);

create policy "blocks: own select" on blocks
  for select using (auth.uid() = blocker_id);
