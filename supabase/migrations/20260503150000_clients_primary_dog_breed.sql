-- Adds `primary_dog_breed` to clients. The intake form already captures
-- `intake_submissions.dog_breed`, but until now the conversion path
-- (IncomingLeads.handleApprove) had nowhere to put it on the client side —
-- iter 114 worked around this by prepending breed to `notes`, but that's a
-- format-string hack that loses queryability. This is the proper fix.
--
-- Nullable since existing clients (created before this migration) won't
-- have breed data. ClientHero displays it conditionally below the dog name
-- when present.
--
-- RLS: existing `auth.uid() = user_id` policy on clients automatically
-- covers this column — no policy changes needed.

alter table public.clients
  add column if not exists primary_dog_breed text;

comment on column public.clients.primary_dog_breed is
  'Dog breed; carried over from intake_submissions.dog_breed when a lead is converted to a client. Free-text Hebrew (e.g., ''לברדור'', ''גולדן רטריבר'').';
