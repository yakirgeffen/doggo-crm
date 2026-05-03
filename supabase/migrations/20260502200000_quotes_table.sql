-- ============================================================
-- Migration: quotes table (G8 native quote flow via Sumit)
-- Date: 2026-05-02
-- Purpose: track price quotations sent via Sumit. One row per
--   Sumit PriceQuotation document. Closes Gaya G8 — replaces the
--   speculative quotes-via-email-template (Option A) and quotes-
--   entity-table (Option B) with a Sumit-document-ID-tracked row.
-- ============================================================

create table if not exists public.quotes (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid default auth.uid() references auth.users(id),
  client_id uuid references public.clients(id) on delete set null,
  intake_submission_id uuid references public.intake_submissions(id) on delete set null,
  sumit_document_id bigint,
  sumit_document_number bigint,
  total_amount numeric,
  currency text default 'ILS'::text,
  status text not null default 'sent'::text check (status in ('draft','sent','viewed','accepted','declined','expired')),
  sent_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.quotes enable row level security;

create policy "Users can manage their own quotes"
  on public.quotes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists quotes_client_id_idx on public.quotes using btree (client_id);
create index if not exists quotes_user_id_idx on public.quotes using btree (user_id);

comment on table public.quotes is
  'Tracks price quotations sent via Sumit (G8 native quote flow). One row per Sumit PriceQuotation document. Status lifecycle: draft -> sent -> viewed -> accepted/declined/expired.';
