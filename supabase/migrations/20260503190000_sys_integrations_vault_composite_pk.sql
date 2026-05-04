-- Fix `sys_integrations_vault` primary key from (user_id) to (user_id, service_name).
--
-- QA Avner first-session HOLD-FOR-FIX P1 (2026-05-03 session-1 report at
-- `geffen-studio:projects/doggo-crm/qa-reviews/2026-05-03-iters-113-120-debrief.md`):
-- the existing PK on `user_id` ALONE means the second-saved vendor silently
-- overwrites the first. CLAUDE.md + iter 127 documented Sumit + Morning as
-- parallel choices ("trainer picks either, both, or neither"); the schema
-- made "both" structurally impossible. iter 127 corrected the framing; this
-- migration corrects the schema constraint that made the framing un-honorable.
--
-- Verified safe at apply time: 1 row, 1 trainer, 1 service in the live table
-- (no conflicts to resolve before the constraint swap).
--
-- Both `useSumit.saveKeys` and `useIntegrations.saveKeys` already include
-- `service_name` in their upsert payloads + `testConnection` updates filter
-- by both `user_id` AND `service_name`. The PK swap is the only structural
-- change needed; PostgREST's default upsert conflict-target follows the PK,
-- so the upsert calls become non-overwriting automatically.
--
-- RLS unchanged: `auth.uid() = user_id` policy still applies row-by-row.
-- Multiple rows per trainer are permitted (one per vendor); each row
-- independently scoped to that trainer.

alter table public.sys_integrations_vault
  drop constraint sys_integrations_vault_pkey;

alter table public.sys_integrations_vault
  add primary key (user_id, service_name);

comment on constraint sys_integrations_vault_pkey on public.sys_integrations_vault is
  'Composite PK (user_id, service_name) — trainer can have one row per vendor (sumit, morning, …). Single-column user_id PK was the iter-127-framing-vs-iter-130-schema gap surfaced by QA Avner first-session report 2026-05-03.';
