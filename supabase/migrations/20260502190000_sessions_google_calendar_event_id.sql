-- ============================================================
-- Migration: sessions.google_calendar_event_id column
-- Date: 2026-05-02
-- Purpose: G7 one-way write (CRM -> Google Calendar) per
--   projects/doggo-crm/design-partner-feedback.md Option B.
--   When a session is inserted in CRM, the corresponding Google
--   Calendar event ID is captured here so future update/delete
--   flows (when session-edit UI ships) can target the same event.
-- ============================================================

alter table public.sessions
  add column if not exists google_calendar_event_id text;

comment on column public.sessions.google_calendar_event_id is
  'Google Calendar event ID created when session was inserted (G7 one-way write CRM->Calendar). Null when trainer has no Google Calendar scope or event creation failed.';
