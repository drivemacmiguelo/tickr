-- Run this in your Supabase SQL editor
-- https://supabase.com/dashboard → SQL Editor

-- Game saves table
create table if not exists public.game_saves (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  state       jsonb not null default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Row Level Security: users can only read/write their own save
alter table public.game_saves enable row level security;

create policy "Users can read own save"
  on public.game_saves for select
  using (auth.uid() = user_id);

create policy "Users can insert own save"
  on public.game_saves for insert
  with check (auth.uid() = user_id);

create policy "Users can update own save"
  on public.game_saves for update
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger game_saves_updated_at
  before update on public.game_saves
  for each row execute function update_updated_at();

-- Profiles table (username display)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
