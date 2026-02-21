-- ============================================================
-- Migration: Strict Data Isolation (Zero-Trust Multi-Tenancy)
-- Purpose: Remove all open read/write access policies and enforce strict owner-only RLS
-- ============================================================

-- 1. DROP ALL INSECURE PERMISSIVE POLICIES
-- These policies were granting global read/write access to any authenticated user.
drop policy if exists "Enable read access for all authenticated users" on public.profiles;
drop policy if exists "Enable read access for all authenticated users" on public.clients;
drop policy if exists "Enable insert/update for all authenticated users" on public.clients;
drop policy if exists "Enable read access for all authenticated users" on public.programs;
drop policy if exists "Enable insert/update for all authenticated users" on public.programs;
drop policy if exists "Enable read access for all authenticated users" on public.sessions;
drop policy if exists "Enable insert/update for all authenticated users" on public.sessions;

-- 2. ENFORCE STRICT USER OWNERSHIP ON CORE TABLES

-- PROFILES: Users can only see their own profile
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles
  for select
  using ( auth.uid() = id );

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- CLIENTS
-- Note: the previous migration (20260216) created a strict policy, but we want to ensure it completely overrides everything
drop policy if exists "Users can manage their own clients" on public.clients;
create policy "Users can manage their own clients"
  on public.clients
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- PROGRAMS
drop policy if exists "Users can manage their own programs" on public.programs;
create policy "Users can manage their own programs"
  on public.programs
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- SESSIONS
drop policy if exists "Users can manage their own sessions" on public.sessions;
create policy "Users can manage their own sessions"
  on public.sessions
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- 3. ENFORCE STRICT USER OWNERSHIP ON SECONDARY TABLES

-- INTAKE SUBMISSIONS
drop policy if exists "Trainers can manage their own submissions" on public.intake_submissions;
create policy "Trainers can manage their own submissions"
  on public.intake_submissions
  for all
  using ( auth.uid() = trainer_id )
  with check ( auth.uid() = trainer_id );

-- ACTIVITY LOGS
alter table public.activity_logs enable row level security;
drop policy if exists "Users can manage their own logs" on public.activity_logs;
create policy "Users can manage their own logs"
  on public.activity_logs
  for all
  using ( auth.uid() = performed_by )
  with check ( auth.uid() = performed_by );

-- EMAIL TEMPLATES
alter table public.email_templates enable row level security;
-- Add user_id to email_templates to ensure they are isolated per trainer
alter table public.email_templates add column if not exists user_id uuid references auth.users(id) default auth.uid();
-- Update existing templates to be owned by whoever created them, or null out (which hides them)
-- For safety, assign to existing trainers who might need them (can be fixed manually if needed)
drop policy if exists "Users can manage their own email templates" on public.email_templates;
create policy "Users can manage their own email templates"
  on public.email_templates
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- USER SETTINGS
alter table public.user_settings enable row level security;
drop policy if exists "Users can manage their own settings" on public.user_settings;
create policy "Users can manage their own settings"
  on public.user_settings
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- SERVICES
alter table public.services enable row level security;
drop policy if exists "Users can manage their own services" on public.services;
create policy "Users can manage their own services"
  on public.services
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- MAGIC NOTEBOOKS (if they have user_id)
alter table public.magic_notebooks enable row level security;
-- checking if user_id exists first. If so, enforce policy.
do $$ 
begin
  if exists (select 1 from information_schema.columns where table_name='magic_notebooks' and column_name='user_id') then
    drop policy if exists "Users can manage their own magic notebooks" on public.magic_notebooks;
    create policy "Users can manage their own magic notebooks"
      on public.magic_notebooks
      for all
      using ( auth.uid() = user_id )
      with check ( auth.uid() = user_id );
  end if;
end $$;
