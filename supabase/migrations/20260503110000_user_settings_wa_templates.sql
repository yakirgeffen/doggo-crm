ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS wa_template_greeting text,
  ADD COLUMN IF NOT EXISTS wa_template_booking text,
  ADD COLUMN IF NOT EXISTS wa_template_reminder text;

COMMENT ON COLUMN public.user_settings.wa_template_greeting IS 'WhatsApp greeting template (placeholders: {firstName}, {dogName}). Null means use hardcoded fallback.';
COMMENT ON COLUMN public.user_settings.wa_template_booking IS 'WhatsApp booking-confirmation template (placeholders: {firstName}, {dogName}, {date}, {time}). Null means use hardcoded fallback.';
COMMENT ON COLUMN public.user_settings.wa_template_reminder IS 'WhatsApp session-reminder template (placeholders: {firstName}, {dogName}, {time}). Null means use hardcoded fallback.';
