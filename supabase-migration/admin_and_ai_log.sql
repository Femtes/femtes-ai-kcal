-- ============================================================
-- Admin-åtkomst, supportärenden med status, samt loggning av
-- AI-anrop (för att hålla koll på Gemini-kostnaden).
-- ============================================================

-- 1) Vilka konton som är admins
create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz default now()
);

alter table admin_users enable row level security;

create policy "Admins can view the admin list"
  on admin_users for select
  using (auth.uid() in (select user_id from admin_users));

-- LÄGG TILL DIG SJÄLV SOM ADMIN — byt ut e-postadressen nedan
-- mot din egen inloggningsadress innan du kör filen:
insert into admin_users (user_id)
select id from auth.users where email = 'femtes@me.com';

-- 2) Status på supportärenden + admins kan se/uppdatera alla
alter table feedback add column if not exists status text not null default 'new'
  check (status in ('new', 'read', 'resolved'));

create policy "Admins can view all feedback"
  on feedback for select
  using (auth.uid() in (select user_id from admin_users));

create policy "Admins can update feedback"
  on feedback for update
  using (auth.uid() in (select user_id from admin_users));

create policy "Admins can delete feedback"
  on feedback for delete
  using (auth.uid() in (select user_id from admin_users));

-- 3) Logg över AI-anrop, för kostnadsöversikt
create table ai_call_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  feature text,
  created_at timestamptz default now()
);

create index ai_call_log_created_idx on ai_call_log (created_at desc);

alter table ai_call_log enable row level security;

create policy "Admins can view the AI call log"
  on ai_call_log for select
  using (auth.uid() in (select user_id from admin_users));

create policy "Authenticated calls can be logged"
  on ai_call_log for insert
  with check (auth.uid() is not null);
