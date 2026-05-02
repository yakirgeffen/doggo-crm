-- ============================================================
-- Migration: enable pg_cron + pg_net extensions
-- Date: 2026-05-02
-- Author: Liat (CTO loop iteration 14 — G6 reminders cron pipeline)
-- Purpose: prereq for the doggo-crm-reminders-daily cron job
--   scheduled in 20260502240000_schedule_reminders_cron.sql.
-- ============================================================

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
