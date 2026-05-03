-- ============================================================
-- Migration: client-attachments Storage bucket + policies
-- Date: 2026-05-03
-- Author: CTO loop iteration 71b — file attachments on client records
-- Purpose: Private Storage bucket for files attached to client cards.
--   Folder layout: <user_id>/<client_id>/<uuid>-<original-filename>
--   The first path segment is the trainer's auth.uid() — RLS uses
--   storage.foldername(name)[1] to enforce per-trainer isolation.
--
-- Bucket-level limits (enforced by Supabase Storage):
--   - file_size_limit: 50 MiB per object
--   - allowed_mime_types: common image/video/PDF formats
--
-- The application also surfaces a 50 MB hint client-side so the
-- trainer sees a graceful error before upload starts; the bucket
-- limit is the authoritative cap.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'client-attachments',
    'client-attachments',
    false,
    52428800, -- 50 MiB
    array[
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/heic',
        'image/heif',
        'application/pdf',
        'video/mp4',
        'video/quicktime',
        'video/x-m4v',
        'video/webm'
    ]
)
on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies on storage.objects, scoped to this bucket only.
-- The first folder segment must equal the calling trainer's auth.uid().
-- This guarantees per-trainer isolation at the Storage layer, mirroring
-- the RLS we already enforce on public.client_attachments.

drop policy if exists "client-attachments insert own folder" on storage.objects;
create policy "client-attachments insert own folder"
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'client-attachments'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

drop policy if exists "client-attachments select own folder" on storage.objects;
create policy "client-attachments select own folder"
    on storage.objects
    for select
    to authenticated
    using (
        bucket_id = 'client-attachments'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

drop policy if exists "client-attachments delete own folder" on storage.objects;
create policy "client-attachments delete own folder"
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'client-attachments'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

-- Intentionally NO UPDATE policy — Storage objects in this bucket
-- are immutable. To "replace" a file the client deletes + re-uploads.
