-- ============================================================
-- Migration: Security Lockdown & Strict Multi-Tenancy
-- Purpose: Remove all "legacy" access loopholes and enforce strict user isolation.
-- ============================================================

-- 1. Clients Table Lockdown
-- 1a. Delete orphans (ownerless data is a security risk in multi-tenant)
delete from public.clients where user_id is null;

-- 1b. Enforce NOT NULL
alter table public.clients 
  alter column user_id set not null;

-- 1c. Update Policy (Strict Isolation)
drop policy if exists "Users can manage their own clients" on public.clients;

create policy "Users can manage their own clients"
  on public.clients
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );


-- 2. Programs Table Lockdown
delete from public.programs where user_id is null;

alter table public.programs 
  alter column user_id set not null;

drop policy if exists "Users can manage their own programs" on public.programs;

create policy "Users can manage their own programs"
  on public.programs
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );


-- 3. Sessions Table Lockdown
delete from public.sessions where user_id is null;

alter table public.sessions 
  alter column user_id set not null;

drop policy if exists "Users can manage their own sessions" on public.sessions;

create policy "Users can manage their own sessions"
  on public.sessions
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );


-- 4. Intake Submissions Lockdown
-- 4a. Delete orphans (leads with no trainer assigned)
delete from public.intake_submissions where trainer_id is null;

-- 4b. Enforce NOT NULL (optional, but good practice. Edge function bypasses this via RLS bypass anyway, but schema enforcement is good)
-- Note: usage by Service Role ignores RLS but respects constraints.
-- Ensuring valid trainer_id is important.
alter table public.intake_submissions 
  alter column trainer_id set not null;

-- 4c. Update Policy
drop policy if exists "Trainers can manage their own submissions" on public.intake_submissions;

create policy "Trainers can manage their own submissions"
  on public.intake_submissions
  for all
  using ( auth.uid() = trainer_id );
  -- Removed "or trainer_id is null"


-- 5. Final Safety Check
-- Ensure services table enforces strict ownership (it was already strict, but good to verify)
-- (No change needed for services, policy was already strict: using (auth.uid() = user_id))
