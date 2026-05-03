-- ============================================================
-- Migration: email_send_log unique constraint for user-bound emails
-- Date: 2026-05-02
-- Author: Liat (CTO loop iteration 15 — trainer onboarding email sequence)
-- Purpose: extend email_send_log idempotency to user-bound lifecycle
--   emails (welcome / setup_nudge / first_client / tip_trick / check_in).
--   The earlier unique index covered session-bound emails (reminder_24h);
--   this one covers per-trainer lifecycle templates.
-- ============================================================

create unique index if not exists email_send_log_user_template_idx
  on public.email_send_log (user_id, email_template)
  where session_id is null;
