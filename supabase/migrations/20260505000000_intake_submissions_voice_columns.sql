-- ============================================================
-- Migration: intake_submissions.intake_source + voice_intake_trainers
-- Step 1 of trainer-voice-intake build per:
-- geffen-studio:projects/doggo-crm/trainer-voice-intake-work-order-v1.md
-- ============================================================
-- 1. ALTER intake_submissions: add intake_source TEXT NOT NULL DEFAULT 'form'
--    with CHECK constraint ('form' | 'voice'). Default = 'form' makes existing
--    rows + the existing process-intake flow backward-compatible without code
--    changes.
--
-- 2. CREATE TABLE voice_intake_trainers: maps a trainer's WhatsApp phone
--    number (E.164 format, unique) to their auth.users id. The bot service
--    looks up the sender phone here on every incoming PTT to validate the
--    sender is a registered trainer; the voice-intake edge function does the
--    same on submission to enforce identity at the function boundary.
--
--    Option (b) per work-order — separate table rather than columns on
--    user_settings. Reasoning: cleaner bot lookup surface, doesn't bloat
--    user_settings, supports v2 multi-number registration, doesn't require
--    coordination with the existing useSettings hook.
--
-- 3. RLS on voice_intake_trainers: trainer can read/write their own rows.
--    Service-role bypasses RLS for the bot's lookup query.
--
-- After this migration applies: regenerate scripts/schema-snapshot.json and
-- verify `npm run check:schema` is green.
-- ============================================================

-- 1) intake_source column on intake_submissions
ALTER TABLE public.intake_submissions
ADD COLUMN intake_source TEXT NOT NULL DEFAULT 'form'
  CHECK (intake_source IN ('form', 'voice'));

COMMENT ON COLUMN public.intake_submissions.intake_source IS
  'Origin of the submission. ''form'' = public web intake form (process-intake edge function); ''voice'' = WhatsApp PTT via voice-intake edge function. Added 2026-05-05 per trainer-voice-intake work-order v1.';

-- 2) voice_intake_trainers table
CREATE TABLE public.voice_intake_trainers (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id      UUID         NOT NULL DEFAULT auth.uid()
                                 REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_e164      TEXT         NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT phone_e164_format CHECK (phone_e164 ~ '^\+[1-9][0-9]{6,14}$')
);

COMMENT ON TABLE  public.voice_intake_trainers IS
  'Phone-number → trainer mapping for the WhatsApp voice-intake bot. The bot validates incoming PTT senders against this table; the voice-intake edge function validates submissions against it as well. Added 2026-05-05 per trainer-voice-intake work-order v1.';
COMMENT ON COLUMN public.voice_intake_trainers.phone_e164 IS
  'E.164-formatted phone number, e.g. +972501234567. UNIQUE — each phone maps to one trainer at a time.';

CREATE INDEX voice_intake_trainers_trainer_idx
  ON public.voice_intake_trainers(trainer_id);

-- updated_at trigger (matches existing pattern on user_settings/etc.)
CREATE OR REPLACE FUNCTION public.set_voice_intake_trainers_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER voice_intake_trainers_set_updated_at
BEFORE UPDATE ON public.voice_intake_trainers
FOR EACH ROW
EXECUTE FUNCTION public.set_voice_intake_trainers_updated_at();

-- 3) RLS — trainer-isolated read/write; service-role bypasses for bot lookup
ALTER TABLE public.voice_intake_trainers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can view their own voice-intake registration"
ON public.voice_intake_trainers
FOR SELECT
TO authenticated
USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert their own voice-intake registration"
ON public.voice_intake_trainers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update their own voice-intake registration"
ON public.voice_intake_trainers
FOR UPDATE
TO authenticated
USING (auth.uid() = trainer_id)
WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete their own voice-intake registration"
ON public.voice_intake_trainers
FOR DELETE
TO authenticated
USING (auth.uid() = trainer_id);
