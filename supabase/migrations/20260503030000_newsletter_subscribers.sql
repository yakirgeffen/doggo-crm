-- ============================================================
-- Migration: newsletter_subscribers table
-- Date: 2026-05-03
-- Author: Liat (CCO loop iteration 59 — organic traffic capture)
-- Purpose: capture trainer emails from public surfaces (landing page,
--   blog posts, future lead magnets) into a single subscriber list.
--   Used downstream for the trainer onboarding email sequence and
--   product update broadcasts.
--
-- Privacy notes:
--   - email is the natural unique key (case-insensitive via lower())
--   - source is a free-text tag describing where the subscription
--     happened ('landing-page', 'blog:post-slug', 'lead-magnet:name')
--   - confirmed_at supports double-opt-in if added later (column nullable
--     for now; first version is single-opt-in for friction reduction)
--   - unsubscribed_at supports honoring opt-out without deleting the row
--     (so we can avoid re-adding bounces / spam complaints)
-- ============================================================

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists newsletter_subscribers_email_lower_idx
  on public.newsletter_subscribers (lower(email));

create index if not exists newsletter_subscribers_source_idx
  on public.newsletter_subscribers (source);

create index if not exists newsletter_subscribers_created_at_idx
  on public.newsletter_subscribers (created_at desc);

alter table public.newsletter_subscribers enable row level security;

-- No anon SELECT (the list is private), no anon INSERT (use the edge function instead).
-- Authenticated trainers do NOT get cross-tenant access to the subscriber list either —
-- this is the studio-owned global list, not a per-trainer list. Future per-trainer
-- subscriber lists would be a separate table with user_id scoping.

comment on table public.newsletter_subscribers is
  'Studio-owned global subscriber list captured from public surfaces (landing, blog, lead magnets). Not exposed via PostgREST. Inserts go through the subscribe-newsletter edge function which dedupes by lower(email).';
