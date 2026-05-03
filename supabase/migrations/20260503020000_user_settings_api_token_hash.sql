-- ============================================================
-- Migration: user_settings.api_token_hash column
-- Date: 2026-05-03
-- Author: Liat (CTO loop iteration 55 — G5 bidirectional API phase 1)
-- Purpose: per-trainer API token stored as SHA-256 hash. Plaintext
--   shown once at generation; only hash persisted. Edge function
--   api-v1 looks up the calling trainer by matching this hash.
-- ============================================================

alter table public.user_settings
  add column if not exists api_token_hash text;

comment on column public.user_settings.api_token_hash is
  'SHA-256 hash of the per-trainer API token. The plaintext token is shown to the trainer once at generation time and never stored. Edge function api-v1 looks up the trainer by matching this hash.';

create index if not exists user_settings_api_token_hash_idx
  on public.user_settings (api_token_hash)
  where api_token_hash is not null;
