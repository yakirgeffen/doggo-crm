-- ============================================================
-- Migration: G4 webhook phase 2 — session/program events
-- Date: 2026-05-03
-- Author: Liat (CTO loop iteration 29 — G4 webhook phase 2)
-- Purpose: extend the webhook surface beyond intake_submission.created
--   (phase 1) to:
--     - session.created   (sessions INSERT)
--     - session.cancelled (sessions DELETE — EditSessionModal deletes)
--     - program.paid      (programs UPDATE where payment_status -> 'paid')
--   All events fire to the same user_settings.webhook_url with a
--   distinct X-Doggo-Event header. Best-effort fire-and-forget.
-- ============================================================

create or replace function public.notify_webhook_event(
  p_user_id uuid,
  p_event_name text,
  p_payload jsonb
)
  returns void
  language plpgsql
  security definer
  set search_path = public, extensions, net, pg_temp
as $$
declare
  v_webhook_url text;
begin
  if p_user_id is null then
    return;
  end if;

  select s.webhook_url into v_webhook_url
  from public.user_settings s
  where s.user_id = p_user_id;

  if v_webhook_url is null or v_webhook_url = '' then
    return;
  end if;

  perform net.http_post(
    url := v_webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Doggo-Event', p_event_name
    ),
    body := jsonb_build_object('event', p_event_name) || p_payload
  );
exception when others then
  return;
end;
$$;

create or replace function public.notify_session_created_webhook()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_temp
as $$
begin
  perform public.notify_webhook_event(
    new.user_id,
    'session.created',
    jsonb_build_object(
      'session_id', new.id,
      'program_id', new.program_id,
      'session_date', new.session_date,
      'price', new.price,
      'currency', new.currency,
      'created_at', new.created_at
    )
  );
  return new;
end;
$$;

drop trigger if exists on_session_created_webhook on public.sessions;
create trigger on_session_created_webhook
  after insert on public.sessions
  for each row execute function public.notify_session_created_webhook();

create or replace function public.notify_session_cancelled_webhook()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_temp
as $$
begin
  perform public.notify_webhook_event(
    old.user_id,
    'session.cancelled',
    jsonb_build_object(
      'session_id', old.id,
      'program_id', old.program_id,
      'session_date', old.session_date
    )
  );
  return old;
end;
$$;

drop trigger if exists on_session_cancelled_webhook on public.sessions;
create trigger on_session_cancelled_webhook
  after delete on public.sessions
  for each row execute function public.notify_session_cancelled_webhook();

create or replace function public.notify_program_paid_webhook()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_temp
as $$
begin
  if new.payment_status = 'paid' and (old.payment_status is distinct from 'paid') then
    perform public.notify_webhook_event(
      new.user_id,
      'program.paid',
      jsonb_build_object(
        'program_id', new.id,
        'client_id', new.client_id,
        'program_name', new.program_name,
        'price', new.price,
        'currency', new.currency,
        'sumit_invoice_document_id', new.sumit_invoice_document_id
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_program_paid_webhook on public.programs;
create trigger on_program_paid_webhook
  after update on public.programs
  for each row execute function public.notify_program_paid_webhook();
