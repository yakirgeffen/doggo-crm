-- ============================================================
-- Migration: email_templates table + per-trainer RLS
-- Date: 2026-05-02
-- Author: Liat (Geffen Studio)
--
-- Closes B5/TG-4 from work-order: the email_templates table is
-- referenced by source/CLAUDE.md and is a planned P2-1 home for
-- per-trainer email template customization, but does not exist
-- in the live DB. Without this migration, P2-1 (load templates
-- from DB in EmailComposer) cannot land.
--
-- Schema:
--   id           uuid PK
--   user_id      uuid FK to auth.users (per-trainer ownership)
--   name         text — display label in EmailComposer dropdown
--   subject      text — email subject template
--   body         text — email body template (with {client_name},
--                {dog_name}, {trainer_name} placeholders)
--   is_default   boolean — marks a template as the "starter" set
--                that should be visible to all trainers without
--                an explicit row (consumed by EmailComposer fallback)
--   created_at   timestamptz
--   updated_at   timestamptz (auto-updated by handle_updated_at trigger)
--
-- RLS: per-trainer ownership via auth.uid() = user_id, matching
-- the pattern on clients/programs/sessions/services.
--
-- No data seeded by this migration. EmailComposer keeps its
-- hardcoded 3-template fallback when the table returns 0 rows
-- for the current trainer; once a trainer creates their own
-- templates, the fallback is suppressed and only their templates
-- show. This avoids needing an auth-signup trigger to seed
-- defaults per trainer.
-- ============================================================

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subject text not null,
  body text not null,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists email_templates_user_id_idx
  on public.email_templates(user_id);

alter table public.email_templates enable row level security;

create policy "Users can manage their own email templates"
  on public.email_templates
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Reuse the existing handle_updated_at trigger function (search_path
-- already locked down by the function_search_path_hardening migration).
create trigger handle_email_templates_updated_at
  before update on public.email_templates
  for each row
  execute function public.handle_updated_at();
