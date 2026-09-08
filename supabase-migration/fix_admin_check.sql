-- ============================================================
-- Fix: pålitlig admin-koll via en SECURITY DEFINER-funktion.
-- Den ursprungliga admin_and_ai_log.sql använde en policy som
-- kollade mot sig själv (admin_users mot admin_users), vilket
-- kan strula i vissa fall. Den här filen byter till Supabases
-- rekommenderade, robusta mönster istället. Kör i Supabase SQL
-- Editor — säker att köra även om du redan kört den gamla filen.
-- ============================================================

-- En funktion som kollar admin-status utan att gå via RLS,
-- så den alltid fungerar pålitligt oavsett vem som frågar.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

-- Byt ut den gamla, self-refererande policyn mot funktionen ovan
drop policy if exists "Admins can view the admin list" on admin_users;
create policy "Admins can view the admin list"
  on admin_users for select
  using (is_admin());

-- Samma sak för feedback-tabellens admin-policys
drop policy if exists "Admins can view all feedback" on feedback;
create policy "Admins can view all feedback"
  on feedback for select
  using (is_admin());

drop policy if exists "Admins can update feedback" on feedback;
create policy "Admins can update feedback"
  on feedback for update
  using (is_admin());

drop policy if exists "Admins can delete feedback" on feedback;
create policy "Admins can delete feedback"
  on feedback for delete
  using (is_admin());

-- Och för AI-loggens admin-policy
drop policy if exists "Admins can view the AI call log" on ai_call_log;
create policy "Admins can view the AI call log"
  on ai_call_log for select
  using (is_admin());

-- Snabb koll: kör denna rad separat efteråt (markera bara den
-- och tryck Run) för att se om DU räknas som admin just nu —
-- ska svara "true":
-- select is_admin();
