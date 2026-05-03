-- ============================================================
-- Migration: trainer_testimonials table
-- Date: 2026-05-03
-- Author: Liat (CMO+CCO loop iteration 71c — public storefront social proof)
-- Purpose: trainer-authored client testimonials displayed on the public
--   storefront. Trainer manages own (auth.uid() = user_id); anon reads
--   only published rows.
-- ============================================================

create table if not exists public.trainer_testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  client_dog_name text,
  body text not null,
  rating smallint check (rating between 1 and 5),
  is_published boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists trainer_testimonials_user_id_idx
  on public.trainer_testimonials (user_id);
create index if not exists trainer_testimonials_user_published_idx
  on public.trainer_testimonials (user_id, is_published, display_order)
  where is_published = true;

alter table public.trainer_testimonials enable row level security;

drop policy if exists "Trainers manage own testimonials" on public.trainer_testimonials;
create policy "Trainers manage own testimonials"
  on public.trainer_testimonials
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Public reads published testimonials" on public.trainer_testimonials;
create policy "Public reads published testimonials"
  on public.trainer_testimonials
  for select
  to anon
  using (is_published = true);

comment on table public.trainer_testimonials is
  'Trainer-authored client testimonials displayed on the public storefront. Trainer manages own (auth.uid() = user_id); anon reads only published rows.';
