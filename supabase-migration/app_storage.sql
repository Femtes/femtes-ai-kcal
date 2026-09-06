-- ============================================================
-- app_storage — generisk nyckel/värde-lagring som ersätter
-- webbläsarens localStorage. All appdata (mål, måltider, vikt,
-- träning, fasta, bibliotek osv.) sparas nu här, kopplat till
-- kontot, så inget försvinner vid en ny driftsättning eller om
-- man byter enhet/webbläsare.
-- ============================================================

create table app_storage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  key text not null,
  value text not null,
  shared boolean not null default false,
  updated_at timestamptz default now()
);

-- En användare kan bara ha EN rad per (egen) nyckel
create unique index app_storage_personal_key_idx
  on app_storage (user_id, key)
  where shared = false;

-- Delade nycklar (t.ex. "kalori-samåkning"-koderna) är unika globalt
create unique index app_storage_shared_key_idx
  on app_storage (key)
  where shared = true;

create index app_storage_prefix_idx on app_storage (user_id, shared, key);

alter table app_storage enable row level security;

-- Personlig data: bara ägaren kan läsa/skriva
create policy "Users manage their own storage"
  on app_storage for all
  using (shared = false and auth.uid() = user_id)
  with check (shared = false and auth.uid() = user_id);

-- Delad data: vem som helst inloggad kan läsa (t.ex. hämta en delad måltid med kod)
create policy "Authenticated users can read shared storage"
  on app_storage for select
  using (shared = true and auth.uid() is not null);

-- Delad data: vem som helst inloggad kan skapa nya delade rader
create policy "Authenticated users can insert shared storage"
  on app_storage for insert
  with check (shared = true and auth.uid() is not null);

-- Delad data: bara skaparen kan uppdatera/ta bort sin egen delade rad
create policy "Creators manage their own shared storage"
  on app_storage for update using (shared = true and auth.uid() = user_id);
create policy "Creators delete their own shared storage"
  on app_storage for delete using (shared = true and auth.uid() = user_id);
