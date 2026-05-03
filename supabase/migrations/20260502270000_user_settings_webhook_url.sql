-- ============================================================
-- Migration: user_settings.webhook_url column
-- Date: 2026-05-02
-- Author: Liat (CTO loop iteration 27 — G4 webhook surface phase 1)
-- Purpose: per-trainer outgoing webhook URL. When a new
--   intake_submission is inserted for this trainer, an HTTP POST
--   fires to webhook_url with the lead payload — letting the
--   trainer wire their own automations (Make / Zapier / WhatsApp).
-- ============================================================

alter table public.user_settings
  add column if not exists webhook_url text;

comment on column public.user_settings.webhook_url is
  'Optional outgoing-webhook URL set by the trainer. When a new intake_submission is inserted for this trainer, an HTTP POST fires to this URL with the lead payload (G4 webhook surface).';
