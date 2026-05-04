-- ============================================================================
-- ⚠️  STALE — DO NOT TRUST AS SOURCE OF TRUTH
-- ============================================================================
-- This file captures the original founding-phase schema. Subsequent schema
-- changes ship as migrations under `supabase/migrations/` and HAVE NOT been
-- replayed back into this file. The live database has additional columns,
-- tables, indexes, and RLS policies not reflected here.
--
-- Concrete drift examples (caught in iter 114 audit, 2026-05-03):
--   • clients.user_id (default auth.uid()), clients.behavioral_tags,
--     clients.lead_source, clients.primary_dog_breed
--   • programs.user_id, programs.price, programs.currency,
--     programs.payment_link_id, programs.invoice_url, programs.invoice_pdf_url,
--     programs.service_id, programs.sumit_invoice_document_id, …
--   • sessions.user_id (default auth.uid()), sessions.google_calendar_event_id,
--     sessions.price, sessions.currency, sessions.service_id, …
--   • user_settings.wa_template_*, user_settings.intro_pages_seen,
--     user_settings.api_token_hash, user_settings.specialties, …
--   • New tables: services, quotes, intake_submissions, email_templates,
--     activity_logs, email_send_log, webhook_events, newsletter_subscribers,
--     client_attachments, trainer_testimonials, sys_integrations_vault.
--
-- HOW TO GET THE ACTUAL SCHEMA:
--   1. Read the migrations under `supabase/migrations/` in chronological order.
--   2. OR query the live database via Supabase MCP:
--        SELECT column_name, data_type, is_nullable, column_default
--          FROM information_schema.columns
--         WHERE table_schema='public' AND table_name='<table>'
--         ORDER BY ordinal_position;
--      and for RLS:
--        SELECT polname, polcmd,
--               pg_get_expr(polqual, polrelid)      AS using_expr,
--               pg_get_expr(polwithcheck, polrelid) AS check_expr
--          FROM pg_policy
--         WHERE polrelid = 'public.<table>'::regclass;
--
-- If you're about to write a Supabase query and you only checked this file,
-- check the live schema or a recent migration too — iter 114 was a silent
-- production bug because IncomingLeads referenced columns that don't exist
-- on `clients` (`trainer_id`, `primary_dog_breed`-pre-iter-115). Both
-- caught only by the audit pass after the bug had been live.
--
-- Refreshing this file: TODO. The class-of-bug fix is a build-time guard
-- script that compares this file to live state and fails the build on drift
-- (tracked in `studio/memory.md` 2026-05-03 build-time-guards entry as a
-- pattern; not yet applied to schema sync specifically).
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
-- Links to Supabase Auth.users
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  full_name text,
  role text not null check (role in ('trainer', 'assistant')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- CLIENTS
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  email text,
  phone text,
  primary_dog_name text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.clients enable row level security;

-- PROGRAMS
create table public.programs (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) not null,
  program_name text not null,
  program_type text not null check (program_type in ('fixed_sessions', 'open_ended')),
  sessions_included int, -- Nullable for open ended
  sessions_completed int default 0,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  assigned_trainer uuid references public.profiles(id),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid')),
  greeninvoice_invoice_number text,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

alter table public.programs enable row level security;

-- SESSIONS
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  program_id uuid references public.programs(id) not null,
  session_date date not null,
  trainer uuid references public.profiles(id),
  session_notes text,
  homework text,
  next_session_date date,
  created_at timestamptz default now()
);

alter table public.sessions enable row level security;

-- EMAIL TEMPLATES
create table public.email_templates (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  subject text not null,
  body_template text not null, -- Markdown or Text with {{variables}}
  created_at timestamptz default now()
);

alter table public.email_templates enable row level security;

-- ACTIVITY LOGS (Timeline)
create table public.activity_logs (
  id uuid default uuid_generate_v4() primary key,
  entity_type text not null, -- 'client', 'program', 'session', 'email'
  entity_id uuid not null,
  action text not null, -- 'created', 'updated', 'sent'
  description text,
  performed_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.activity_logs enable row level security;

-- RLS POLICIES
-- Simple policy: Trainers see everything, Assistants can see/edit most but not delete.
-- For V1 simplicity: Authenticated users can read everything.
-- Writing logic handled below.

create policy "Enable read access for all authenticated users"
on public.profiles for select using (auth.role() = 'authenticated');

create policy "Enable read access for all authenticated users"
on public.clients for select using (auth.role() = 'authenticated');

create policy "Enable insert/update for all authenticated users"
on public.clients for insert with check (auth.role() = 'authenticated');

create policy "Enable read access for all authenticated users"
on public.programs for select using (auth.role() = 'authenticated');

create policy "Enable insert/update for all authenticated users"
on public.programs for insert with check (auth.role() = 'authenticated');

create policy "Enable read access for all authenticated users"
on public.sessions for select using (auth.role() = 'authenticated');

create policy "Enable insert/update for all authenticated users"
on public.sessions for insert with check (auth.role() = 'authenticated');

-- FUNCTIONS & TRIGGERS

-- Auto-update sessions_completed in programs
create or replace function update_sessions_completed()
returns trigger as $$
begin
  update public.programs
  set sessions_completed = (
    select count(*) from public.sessions where program_id = new.program_id
  )
  where id = new.program_id;
  return new;
end;
$$ language plpgsql;

create trigger on_session_created
after insert on public.sessions
for each row execute procedure update_sessions_completed();

-- Auto-create profile on signup (Optional, depends on auth flow. Usually handled via Supabase triggers on auth.users)
-- Skipping for now, assuming manual invite or manual profile creation.
