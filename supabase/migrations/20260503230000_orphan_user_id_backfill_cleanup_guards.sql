-- iter 135: Orphan-row backfill + cleanup + NOT NULL guards.
--
-- Yakir 2026-05-03 demo audit found:
--   clients              : 11 orphan rows (user_id NULL, Feb 2 seed)
--   programs             : 13 orphan rows
--   sessions             :  8 orphan rows
--   intake_submissions   :  1 orphan row ("QA Test User")
--
-- These are CURRENTLY invisible to fresh users (strict RLS uses
-- auth.uid() = user_id and auth.uid() = NULL is NULL). BUT they're a
-- timebomb if any policy is loosened (which is exactly what happened
-- to services — see iter 135 services policy fix).
--
-- BACKFILL STRATEGY: walk the FK tree bottom-up. A session with
-- user_id ≠ NULL implies its program belongs to that user; its program's
-- client also belongs to that user. Propagate up; then delete what
-- remains orphan (no real-trainer anchor anywhere in the subtree).
--
-- After cleanup we add NOT NULL constraints + DEFAULT auth.uid() so
-- this class of orphan cannot be re-introduced via service-role inserts
-- or future seed-script bugs (same pattern as iter 120 activity_logs).

-- 1. Programs ← sessions: orphan program inherits user_id from any
--    non-orphan session. (One pass enough; no orphan session->program
--    chain in current data, but this is idempotent.)
update public.programs p
set user_id = sub.descendant_user_id
from (
  select distinct on (p2.id) p2.id, s.user_id as descendant_user_id
  from public.programs p2
  join public.sessions s on s.program_id = p2.id
  where p2.user_id is null and s.user_id is not null
  order by p2.id, s.created_at
) sub
where p.id = sub.id;

-- 2. Clients ← programs (post-step-1): orphan client inherits user_id
--    from any non-orphan program (including any newly backfilled).
update public.clients c
set user_id = sub.descendant_user_id
from (
  select distinct on (c2.id) c2.id, p.user_id as descendant_user_id
  from public.clients c2
  join public.programs p on p.client_id = c2.id
  where c2.user_id is null and p.user_id is not null
  order by c2.id, p.created_at
) sub
where c.id = sub.id;

-- 3. Programs ← clients: any orphan program whose client is now
--    non-orphan inherits its client's user_id. (Catches programs that
--    have NO sessions but DO have a non-orphan client.)
update public.programs p
set user_id = c.user_id
from public.clients c
where p.client_id = c.id
  and p.user_id is null
  and c.user_id is not null;

-- 4. Sessions ← programs (post-backfill): orphan session inherits from
--    its now-non-orphan program.
update public.sessions s
set user_id = p.user_id
from public.programs p
where s.program_id = p.id
  and s.user_id is null
  and p.user_id is not null;

-- 5. Delete bottom-up: sessions → programs → clients. By this point
--    everything still NULL has no real-trainer anchor anywhere.
delete from public.sessions where user_id is null;
delete from public.programs where user_id is null;
delete from public.clients where user_id is null;

-- 6. Delete the lone orphan intake_submissions row.
delete from public.intake_submissions where trainer_id is null;

-- 7. Tighten constraints. clients.user_id already DEFAULTs auth.uid()
--    (per iter 122 schema snapshot) but is nullable.
alter table public.clients alter column user_id set not null;

alter table public.programs alter column user_id set default auth.uid();
alter table public.programs alter column user_id set not null;

alter table public.sessions alter column user_id set default auth.uid();
alter table public.sessions alter column user_id set not null;

-- 8. intake_submissions.trainer_id is special — anon submissions have no
--    auth.uid() context, so the process-intake edge function explicitly
--    sets trainer_id from the resolved trainer profile. Just NOT NULL.
alter table public.intake_submissions alter column trainer_id set not null;

comment on column public.clients.user_id is
  'Owning trainer (NOT NULL, default auth.uid()). iter 135: tightened to NOT NULL after orphan cleanup; previous nullable+default-auth.uid() let service-role seeds create unattributable rows that became invisible to fresh tenants but were a Zero-Trust Multi-Tenancy timebomb.';

comment on column public.programs.user_id is
  'Owning trainer (NOT NULL, default auth.uid()). iter 135 hardening — see clients.user_id comment.';

comment on column public.sessions.user_id is
  'Owning trainer (NOT NULL, default auth.uid()). iter 135 hardening — see clients.user_id comment.';

comment on column public.intake_submissions.trainer_id is
  'Trainer who owns this intake submission (NOT NULL). Set by the process-intake edge function from the resolved trainer profile (anon submissions, no auth.uid() context). iter 135: tightened to NOT NULL after one-row orphan cleanup.';
