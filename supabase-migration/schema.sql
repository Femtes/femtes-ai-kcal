-- ============================================================
-- Femtes AI kcal — Supabase-schema
-- Kör detta i Supabase SQL Editor när du satt upp ditt projekt.
-- Varje tabell är kopplad till auth.users via user_id, med
-- Row Level Security (RLS) så en användare bara kan se sin egen data.
-- ============================================================

-- 1) Profil & mål (motsvarar portion-profile-v1, portion-water-goal,
--    portion-step-goal, portion-flexible-budget, portion-visual-mode)
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sex text default 'female',
  age int,
  weight_kg numeric,
  height_cm numeric,
  activity text default 'light',
  goal_type text default 'maintain',
  manual_override boolean default false,
  kcal_goal int,
  protein_goal int,
  fat_goal int,
  carbs_goal int,
  fiber_goal int,
  water_goal_ml int default 2000,
  step_goal int default 8000,
  flexible_budget boolean default true,
  visual_mode boolean default false,
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users manage their own profile"
  on profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2) Måltider per dag (motsvarar portion-day:<datum> --> breakfast/lunch/snack/dinner/other)
create table meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  log_date date not null,
  category text not null check (category in ('breakfast','lunch','snack','dinner','other')),
  name text not null,
  kcal numeric not null default 0,
  protein numeric default 0,
  carbs numeric default 0,
  fat numeric default 0,
  fiber numeric default 0,
  co2_kg numeric default 0,
  cost_sek numeric default 0,
  portion_note text,
  image_url text,
  emoji text,
  created_at timestamptz default now()
);

create index meal_entries_user_date_idx on meal_entries(user_id, log_date);
alter table meal_entries enable row level security;
create policy "Users manage their own meals"
  on meal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3) Vatten per dag (motsvarar water-arrayen i portion-day:<datum>)
create table water_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  log_date date not null,
  ml int not null,
  created_at timestamptz default now()
);

create index water_entries_user_date_idx on water_entries(user_id, log_date);
alter table water_entries enable row level security;
create policy "Users manage their own water log"
  on water_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4) Träningspass (motsvarar exercise-arrayen i portion-day:<datum>)
create table exercise_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  log_date date not null,
  type_key text,
  label text,
  icon text,
  minutes numeric,
  km numeric,
  steps int,
  kcal numeric not null default 0,
  created_at timestamptz default now()
);

create index exercise_entries_user_date_idx on exercise_entries(user_id, log_date);
alter table exercise_entries enable row level security;
create policy "Users manage their own exercise log"
  on exercise_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5) Viktlogg (motsvarar portion-weight-log-v1)
create table weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  log_date date not null,
  kg numeric not null,
  created_at timestamptz default now(),
  unique (user_id, log_date)
);

alter table weight_entries enable row level security;
create policy "Users manage their own weight log"
  on weight_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6) Fasteperioder (motsvarar portion-fasting-v1)
create table fasting_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  method text,
  method_key text,
  fast_hours numeric,
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz default now()
);

create index fasting_sessions_user_idx on fasting_sessions(user_id, start_time);
alter table fasting_sessions enable row level security;
create policy "Users manage their own fasting sessions"
  on fasting_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 7) Eget livsmedelsbibliotek (motsvarar portion-food-library-v1)
create table food_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  name_key text generated always as (lower(trim(name))) stored,
  kcal numeric default 0,
  protein numeric default 0,
  carbs numeric default 0,
  fat numeric default 0,
  fiber numeric default 0,
  co2_kg numeric default 0,
  cost_sek numeric default 0,
  emoji text,
  use_count int default 1,
  last_used timestamptz default now(),
  unique (user_id, name_key)
);

create index food_library_user_idx on food_library(user_id, last_used desc);
alter table food_library enable row level security;
create policy "Users manage their own food library"
  on food_library for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 8) Anpassad måltidsfördelning (motsvarar portion-category-split-v1)
create table category_split (
  user_id uuid primary key references auth.users(id) on delete cascade,
  breakfast_fraction numeric,
  lunch_fraction numeric,
  snack_fraction numeric,
  dinner_fraction numeric,
  other_fraction numeric,
  updated_at timestamptz default now()
);

alter table category_split enable row level security;
create policy "Users manage their own category split"
  on category_split for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 9) Delade måltider mellan vänner (motsvarar portion-shared-meal:<kod>)
-- OBS: den här ska INTE ha RLS på user_id, eftersom mottagaren inte är
-- inloggad som avsändaren. Skydda den istället med korta koder + TTL.
create table shared_meals (
  code text primary key,
  created_by uuid references auth.users(id) on delete set null,
  name text not null,
  kcal numeric default 0,
  protein numeric default 0,
  carbs numeric default 0,
  fat numeric default 0,
  fiber numeric default 0,
  co2_kg numeric default 0,
  cost_sek numeric default 0,
  portion_note text,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '48 hours')
);

alter table shared_meals enable row level security;
-- Vem som helst med koden ska kunna läsa (men inte lista alla koder)
create policy "Anyone with the code can read a shared meal"
  on shared_meals for select
  using (true);
create policy "Authenticated users can create shared meals"
  on shared_meals for insert
  with check (auth.uid() is not null);

-- Valfritt: schemalagd funktion/cron för att städa bort utgångna koder
-- (kör t.ex. via pg_cron eller en Supabase Edge Function på schema)
-- delete from shared_meals where expires_at < now();
