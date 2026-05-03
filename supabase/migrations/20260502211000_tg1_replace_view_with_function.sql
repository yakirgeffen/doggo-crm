-- ============================================================
-- Migration: TG-1 refinement — replace security-definer view
--   with a security-definer FUNCTION (RPC). Same access-control
--   intent; passes the Supabase advisor lint (security_definer_view
--   is flagged ERROR; security_definer functions with hardened
--   search_path are the supported pattern).
--
-- Date: 2026-05-02
-- Author: Liat (CSO-via-N7)
-- ============================================================

drop view if exists public.public_trainer_profiles;

create or replace function public.get_trainer_profile_by_handle(handle text)
  returns table (
    user_id uuid,
    trainer_handle text,
    bio text,
    avatar_url text,
    specialties text[],
    business_name text
  )
  language sql
  security definer
  set search_path = public, pg_temp
  stable
as $$
  select
    s.user_id,
    s.trainer_handle,
    s.bio,
    s.avatar_url,
    s.specialties,
    s.business_name
  from public.user_settings s
  where s.trainer_handle = handle
    and s.trainer_handle is not null
  limit 1;
$$;

grant execute on function public.get_trainer_profile_by_handle(text) to anon, authenticated;

comment on function public.get_trainer_profile_by_handle(text) is
  'Public read path for storefront/intake — returns only the 6 storefront-safe columns of user_settings for the given trainer_handle. Replaces the dropped "Public can view trainer profiles" row policy on user_settings (TG-1 cross-tenant column leak closure 2026-05-02). Security-definer with hardened search_path; trainer-own access to user_settings is preserved via per-user row policies.';
