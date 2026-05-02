-- ============================================================
-- Migration: schedule the doggo-crm-reminders-daily cron job
-- Date: 2026-05-02
-- Author: Liat (CTO loop iteration 14 — G6 reminders cron pipeline)
-- Purpose: pg_cron daily 05:00 UTC (08:00 Israel time) hits the
--   scheduled-reminders edge function. Function is verify_jwt=false
--   + idempotent via email_send_log unique index, so calling without
--   auth is safe (each reminder fires exactly once per session
--   regardless of trigger frequency).
--
-- Prereq: pg_cron + pg_net extensions installed (see migration
--   20260502225000_enable_pg_cron_pg_net or applied via MCP earlier
--   this session).
-- ============================================================

select cron.schedule(
  'doggo-crm-reminders-daily',
  '0 5 * * *',
  $$
  select net.http_post(
    url := 'https://mmcgbtnjdatxkdzmsmwy.supabase.co/functions/v1/scheduled-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('source', 'pg_cron')
  ) as request_id;
  $$
);
