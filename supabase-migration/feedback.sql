-- ============================================================
-- feedback — buggrapporter och förbättringsförslag som
-- användare skickar in via Support-fliken. Du läser dem själv
-- i Supabase (Table Editor -> feedback), det finns ingen
-- inbyggd admin-vy i appen.
-- ============================================================

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  type text not null check (type in ('bug', 'improvement')),
  title text not null,
  description text not null,
  created_at timestamptz default now()
);

create index feedback_created_idx on feedback (created_at desc);

alter table feedback enable row level security;

-- Inloggade användare kan skicka in feedback (bara skapa, inte läsa andras)
create policy "Users can submit feedback"
  on feedback for insert
  with check (auth.uid() = user_id);

-- Användare kan se sina egna tidigare inskickade ärenden
create policy "Users can view their own feedback"
  on feedback for select
  using (auth.uid() = user_id);
