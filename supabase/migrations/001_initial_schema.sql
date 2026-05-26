-- Profiles (synced from Google Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Finance Variables (customizable money sources)
create table public.finance_variables (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('income_source', 'expense_category', 'investment_account', 'bank_account')),
  sub_fields jsonb not null default '[]',
  sort_order int not null default 0,
  created_at timestamptz default now()
);
alter table public.finance_variables enable row level security;
create policy "Users manage own finance variables" on public.finance_variables for all using (auth.uid() = user_id);

-- Finance Entries (monthly data per variable)
create table public.finance_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  variable_id uuid references public.finance_variables(id) on delete cascade not null,
  year int not null,
  month int not null check (month >= 1 and month <= 12),
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(variable_id, year, month)
);
alter table public.finance_entries enable row level security;
create policy "Users manage own finance entries" on public.finance_entries for all using (auth.uid() = user_id);

-- Finance Summary (derived monthly totals)
create table public.finance_summaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  year int not null,
  month int not null check (month >= 1 and month <= 12),
  net_income numeric,
  total numeric,
  change numeric,
  comments text,
  pure_living_expenses numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, year, month)
);
alter table public.finance_summaries enable row level security;
create policy "Users manage own finance summaries" on public.finance_summaries for all using (auth.uid() = user_id);

-- Networth
create table public.networth_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  year int not null,
  networth numeric not null,
  growth_pct numeric,
  unique(user_id, year)
);
alter table public.networth_entries enable row level security;
create policy "Users manage own networth" on public.networth_entries for all using (auth.uid() = user_id);

-- Goals
create table public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  year int not null,
  category text not null check (category in ('long_range_dream', 'economic', 'things_i_want', 'personal_development')),
  name text not null,
  target_value numeric,
  target_type text check (target_type in ('cumulative', 'end_of_year')),
  tracking_type text not null default 'checkmark' check (tracking_type in ('checkmark', 'ratio', 'counter')),
  monthly_target numeric,
  achieved boolean default false,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
alter table public.goals enable row level security;
create policy "Users manage own goals" on public.goals for all using (auth.uid() = user_id);

-- Goal Entries (monthly values)
create table public.goal_entries (
  id uuid default gen_random_uuid() primary key,
  goal_id uuid references public.goals(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  year int not null,
  month int not null check (month >= 1 and month <= 12),
  value numeric,
  achieved boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(goal_id, year, month)
);
alter table public.goal_entries enable row level security;
create policy "Users manage own goal entries" on public.goal_entries for all using (auth.uid() = user_id);

-- Stock Holdings
create table public.stock_holdings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  ticker text not null,
  quantity numeric not null,
  total_value numeric not null,
  action text,
  created_at timestamptz default now()
);
alter table public.stock_holdings enable row level security;
create policy "Users manage own holdings" on public.stock_holdings for all using (auth.uid() = user_id);

-- Stock Targets
create table public.stock_targets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  ticker text not null,
  quantity numeric not null,
  target_price numeric not null,
  total numeric not null,
  pct_allocated numeric,
  created_at timestamptz default now()
);
alter table public.stock_targets enable row level security;
create policy "Users manage own stock targets" on public.stock_targets for all using (auth.uid() = user_id);

-- Rewards
create table public.rewards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  year int not null,
  month int,
  type text not null check (type in ('monthly', 'yearly')),
  badge_name text not null,
  badge_level text not null,
  earned_at timestamptz default now()
);
alter table public.rewards enable row level security;
create policy "Users manage own rewards" on public.rewards for all using (auth.uid() = user_id);
