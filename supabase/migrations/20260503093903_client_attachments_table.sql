-- ============================================================
-- Migration: client_attachments table
-- Date: 2026-05-03
-- Author: CTO loop iteration 71b — file attachments on client records
-- Purpose: Persist metadata for files (training videos, dog photos,
--   vaccination records, PDFs) attached to a client card. Files
--   themselves live in the `client-attachments` Storage bucket
--   under a path prefixed by the trainer's user_id (see companion
--   migration 20260503093924_client_attachments_storage_bucket).
--
-- RLS: scoped strictly to user_id = auth.uid(). No legacy/orphan
--   read access — feature is brand-new, no rows pre-exist.
--
-- ON DELETE behavior:
--   - client_id cascades from clients(id) — deleting a client wipes
--     attachment metadata (Storage objects must be cleaned up via
--     application code or a future cron job).
--   - user_id cascades from auth.users(id) — deleting the trainer
--     wipes their attachment metadata too.
-- ============================================================

create table if not exists public.client_attachments (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    storage_path text not null,
    display_name text not null,
    mime_type text,
    size_bytes bigint,
    uploaded_at timestamptz not null default now()
);

create index if not exists client_attachments_client_id_idx
    on public.client_attachments (client_id);

create index if not exists client_attachments_user_id_idx
    on public.client_attachments (user_id);

alter table public.client_attachments enable row level security;

drop policy if exists "Users can view their own client attachments" on public.client_attachments;
create policy "Users can view their own client attachments"
    on public.client_attachments
    for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert their own client attachments" on public.client_attachments;
create policy "Users can insert their own client attachments"
    on public.client_attachments
    for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own client attachments" on public.client_attachments;
create policy "Users can delete their own client attachments"
    on public.client_attachments
    for delete
    using (auth.uid() = user_id);

-- Note: no UPDATE policy — attachments are immutable once uploaded.
-- Editing the display_name or replacing a file is achieved via
-- delete + re-upload to keep storage_path in sync with metadata.
