-- ============================================================
-- Migration: email_send_log table (G6 reminders pipeline)
-- Date: 2026-05-02
-- Author: Liat (CTO loop iteration 14 — G6 reminders cron pipeline)
-- Purpose: idempotency log for trainer-client emails sent via Resend.
--   The scheduled-reminders edge function inserts a (session_id,
--   email_template='reminder_24h') row each time it fires a reminder;
--   the unique index ensures each session gets at most one reminder
--   regardless of cron retry / external trigger.
-- ============================================================

create table if not exists public.email_send_log (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade,
  user_id uuid references auth.users(id),
  client_email text,
  email_template text not null check (email_template in ('reminder_24h','welcome','setup_nudge','first_client','tip_trick','check_in')),
  sent_at timestamptz default now()
);

create unique index if not exists email_send_log_session_template_idx
  on public.email_send_log (session_id, email_template)
  where session_id is not null;

create index if not exists email_send_log_user_idx
  on public.email_send_log (user_id);

alter table public.email_send_log enable row level security;

create policy "Users can view their own send log"
  on public.email_send_log for select
  using (auth.uid() = user_id);

comment on table public.email_send_log is
  'Idempotency log for trainer-client emails sent via Resend (G6 reminders + future onboarding lifecycle). One row per (session_id, email_template) for session-bound emails.';
