-- Add missing profile fields to user_settings
alter table public.user_settings
add column if not exists trainer_handle text unique,
add column if not exists bio text,
add column if not exists avatar_url text,
add column if not exists specialties text[];

-- Ensure RLS allows updates to these fields
-- (Existing policies should cover this as long as they are "for update" and "using (auth.uid() = user_id)")
