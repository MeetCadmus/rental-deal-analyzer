-- Cloud sync: one JSON blob per user holding their whole deal library.
-- Apply with `supabase db push` (after linking) or paste into the SQL editor.

create table if not exists public.user_data (
  user_id    uuid primary key references auth.users on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

-- Each signed-in user can only read/write their own row.
drop policy if exists "own row select" on public.user_data;
drop policy if exists "own row upsert" on public.user_data;
drop policy if exists "own row update" on public.user_data;
create policy "own row select" on public.user_data
  for select using (auth.uid() = user_id);
create policy "own row upsert" on public.user_data
  for insert with check (auth.uid() = user_id);
create policy "own row update" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
