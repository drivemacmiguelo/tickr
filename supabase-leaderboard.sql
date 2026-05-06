-- ============================================================
-- TICKR — Leaderboard & Profiles
-- Ejecuta esto en Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Tabla de leaderboard (actualizada cada 30s por cada jugador)
create table if not exists public.leaderboard (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  username    text not null default 'Jugador',
  avatar      text not null default '😎',
  title       text not null default 'novice',
  wealth      numeric not null default 1000,
  bal         numeric not null default 1000,
  lv          integer not null default 1,
  prestige_lv integer not null default 0,
  trades      integer not null default 0,
  updated_at  timestamptz default now()
);

-- RLS: cualquiera puede leer, solo tú puedes escribir tu fila
alter table public.leaderboard enable row level security;

create policy "Leaderboard readable by all"
  on public.leaderboard for select
  using (true);

create policy "Users can upsert own leaderboard row"
  on public.leaderboard for insert
  with check (auth.uid() = user_id);

create policy "Users can update own leaderboard row"
  on public.leaderboard for update
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_leaderboard_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leaderboard_updated_at
  before update on public.leaderboard
  for each row execute function update_leaderboard_updated_at();

-- View ordenada por riqueza (para la query del juego)
create or replace view public.leaderboard_ranked as
  select
    row_number() over (order by wealth desc) as rank,
    user_id,
    username,
    avatar,
    title,
    wealth,
    bal,
    lv,
    prestige_lv,
    trades,
    updated_at
  from public.leaderboard
  order by wealth desc;

-- RLS en la view
grant select on public.leaderboard_ranked to anon, authenticated;

-- ============================================================
-- Si ya tenías la tabla game_saves del setup inicial, no hace
-- falta tocarla. Si no la tienes, ejecuta también esto:
-- ============================================================

create table if not exists public.game_saves (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  state       jsonb not null default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

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
