-- ============================================================
-- Migration: intake_submissions outgoing-webhook trigger
-- Date: 2026-05-02
-- Author: Liat (CTO loop iteration 27 — G4 webhook surface phase 1)
-- Purpose: G4 outgoing webhook on intake_submissions INSERT.
--   Reads the trainer's user_settings.webhook_url; if set, POSTs
--   the lead payload to that URL via pg_net. Best-effort fire-and-
--   forget — failures are swallowed by the EXCEPTION handler so
--   the lead row always lands in the DB.
--
-- Prereq: pg_net extension installed (see migration
--   20260502225000_enable_pg_cron_pg_net).
-- ============================================================

create or replace function public.notify_intake_webhook()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, extensions, net, pg_temp
as $$
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
$$;

drop trigger if exists on_intake_submission_webhook on public.intake_submissions;
create trigger on_intake_submission_webhook
  after insert on public.intake_submissions
  for each row execute function public.notify_intake_webhook();

comment on function public.notify_intake_webhook() is
  'G4 outgoing-webhook dispatcher. After intake_submissions INSERT, POSTs lead payload to the trainer''s configured webhook_url (user_settings.webhook_url). Fire-and-forget; failures swallowed.';
