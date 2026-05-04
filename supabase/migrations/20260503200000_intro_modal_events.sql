-- ============================================================
-- Migration: intro_modal_events table — telemetry for EXP-001
-- Date: 2026-05-03
-- Author: CTO single-deliverable dispatch — EXP-001 pre-verdict
--   blocker (CMO pre-spec, 2026-05-03 onboarding-intro-modal-v1).
-- Purpose: Persist seen / cta_click / dismiss events fired by
--   src/components/IntroModal.tsx so CMO can compute the primary
--   metric (CTA-click rate) at the 2026-05-17 verdict cutoff.
--
-- RLS: trainer_id = auth.uid() for both USING and WITH CHECK so
--   trainers can only insert/read their own events. Default on
--   trainer_id is auth.uid() — per iter 120 lesson, an RLS predicate
--   against a NULL default is a silent-failure class (insert without
--   trainer_id resolves to NULL, fails policy, drops on the floor).
--
-- ON DELETE: trainer_id cascades from auth.users(id) — deleting a
--   trainer wipes their telemetry. Acceptable; the verdict is
--   computed in-window and historical retention is not promised.
-- ============================================================

create table if not exists public.intro_modal_events (
    id uuid primary key default gen_random_uuid(),
    trainer_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    page text not null,
    event text not null check (event in ('seen', 'cta_click', 'dismiss')),
    created_at timestamptz not null default now()
);

create index if not exists intro_modal_events_created_at_idx
    on public.intro_modal_events (created_at desc);

create index if not exists intro_modal_events_page_event_idx
    on public.intro_modal_events (page, event);

alter table public.intro_modal_events enable row level security;

drop policy if exists "Users can view their own intro modal events" on public.intro_modal_events;
create policy "Users can view their own intro modal events"
    on public.intro_modal_events
    for select
    using (auth.uid() = trainer_id);

drop policy if exists "Users can insert their own intro modal events" on public.intro_modal_events;
create policy "Users can insert their own intro modal events"
    on public.intro_modal_events
    for insert
    with check (auth.uid() = trainer_id);

-- Note: no UPDATE/DELETE policies — events are append-only telemetry.
