-- ============================================================
-- Migration: schedule the doggo-crm-lifecycle-daily cron job
-- Date: 2026-05-02
-- Author: Liat (CTO loop iteration 15)
-- Purpose: pg_cron daily 05:30 UTC (08:30 Israel time, 30 min after
--   the reminders cron) hits the lifecycle-emails edge function,
--   which iterates auth.users and fires the appropriate trainer
--   lifecycle email per (user_id, template) condition.
-- ============================================================

select cron.schedule(
  'doggo-crm-lifecycle-daily',
  '30 5 * * *',
  $$
  select net.http_post(
    url := 'https://mmcgbtnjdatxkdzmsmwy.supabase.co/functions/v1/lifecycle-emails',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('source', 'pg_cron')
  ) as request_id;
  $$
);
