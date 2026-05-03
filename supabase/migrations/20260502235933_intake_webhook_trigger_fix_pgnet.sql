-- ============================================================
-- Migration: intake_webhook_trigger_fix_pgnet
-- Live version: 20260502235933 (applied via Supabase MCP during loop iteration 12)
-- Author: Liat (TG-2 reconcile pass — iteration 58)
-- Purpose: replaces public.notify_intake_webhook() to use the correct
--   pg_net function reference. The original trigger (in
--   20260502271000_intake_webhook_trigger.sql) initially called
--   extensions.http_post(), which is the wrong namespace — pg_net exposes
--   http_post() in the `net` schema. Live was hot-fixed mid-session.
--
-- This migration was originally applied directly to the live DB via
-- mcp__supabase__apply_migration but the corresponding repo file was never
-- created. This file backfills it. CREATE OR REPLACE is idempotent so
-- re-applying it against the already-fixed live DB is a no-op.
--
-- NOTE: The earlier file 20260502271000_intake_webhook_trigger.sql was
-- subsequently updated in-place to embed the same fix — so a fresh
-- `supabase db reset` against the migrations folder produces the correct
-- final state regardless of whether this file or the earlier one runs.
-- This file exists to make the repo migrations table mirror the live
-- migrations table (TG-2's stated goal).
-- ============================================================

create or replace function public.notify_intake_webhook()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'extensions', 'net', 'pg_temp'
as $function$
declare
  v_webhook_url text;
  v_payload jsonb;
begin
  if new.trainer_id is null then
    return new;
  end if;

  select s.webhook_url into v_webhook_url
  from public.user_settings s
  where s.user_id = new.trainer_id;

  if v_webhook_url is null or v_webhook_url = '' then
    return new;
  end if;

  v_payload := jsonb_build_object(
    'event', 'intake_submission.created',
    'submission_id', new.id,
    'trainer_id', new.trainer_id,
    'full_name', new.full_name,
    'phone', new.phone,
    'dog_name', new.dog_name,
    'dog_breed', new.dog_breed,
    'dog_age', new.dog_age,
    'notes', new.notes,
    'lead_source', new.lead_source,
    'selected_service_id', new.selected_service_id,
    'created_at', new.created_at
  );

  perform net.http_post(
    url := v_webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Doggo-Event', 'intake_submission.created'
    ),
    body := v_payload
  );

  return new;
exception when others then
  return new;
end;
$function$;
