-- Migration 024: duels table + nullable user_id on answers

-- 1. Make user_id nullable on answers (for anonymous submissions)
alter table answers alter column user_id drop not null;

-- 2. Update RLS on answers
drop policy if exists "answers_insert" on answers;
drop policy if exists "answers_select" on answers;
drop policy if exists "answers_update" on answers;

create policy "answers_insert" on answers
  for insert
  with check (true);

create policy "answers_select" on answers
  for select
  using (true);

create policy "answers_update" on answers
  for update
  using (
    (auth.uid() is not null and user_id = auth.uid())
    or user_id is null
  );

-- 3. Create duels table
create table if not exists duels (
  id          uuid        default gen_random_uuid() primary key,
  code        text        unique not null,
  scenario_id uuid        references scenarios(id) on delete cascade,
  creator_id  uuid        references profiles(id) on delete set null,
  created_at  timestamptz default now()
);

-- RLS on duels
alter table duels enable row level security;

create policy "duels_select" on duels
  for select
  using (true);

create policy "duels_insert" on duels
  for insert
  with check (true);
