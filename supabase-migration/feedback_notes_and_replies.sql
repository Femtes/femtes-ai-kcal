-- ============================================================
-- Lägger till två fält på feedback-tabellen:
-- - admin_note: intern anteckning, bara synlig för admin
-- - admin_reply: svarstext till den som skickade in ärendet
-- ============================================================

alter table feedback add column if not exists admin_note text;
alter table feedback add column if not exists admin_reply text;
