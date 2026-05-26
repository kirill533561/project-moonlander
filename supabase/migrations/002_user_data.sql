-- Simple key-value store per user for syncing app state
create table public.user_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  key text not null,
  value jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(user_id, key)
);

alter table public.user_data enable row level security;

create policy "Users manage own data" on public.user_data
  for all using (auth.uid() = user_id);

create index idx_user_data_lookup on public.user_data(user_id, key);
