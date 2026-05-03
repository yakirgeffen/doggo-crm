-- ============================================================
-- Migration: TG-1 closure — public_trainer_profiles view
-- Date: 2026-05-02
-- Author: Liat (CSO-via-N7-absorption — chief-subagent dispatch
--   not yet available in venue)
-- Purpose: close the trainer-#2 gate item TG-1. The "Public can view
--   trainer profiles" row policy on user_settings exposed full row to
--   any authenticated user when trainer_handle is not null — meaning
--   trainer A could read trainer B's schedule (work_days,
--   work_hours_start, work_hours_end) + operational metadata.
--   Acceptable at N=1; not acceptable at N=2.
--
-- Fix shape:
--   1. Create a security-definer view exposing only the 6 storefront-
--      safe columns (user_id, trainer_handle, bio, avatar_url,
--      specialties, business_name).
--   2. Grant SELECT on the view to anon + authenticated.
--   3. Drop the cross-tenant row policy.
--   4. Revoke direct SELECT from anon on user_settings (anon now goes
--      through the view exclusively).
--
-- Trainer-own access to user_settings is preserved via the existing
-- per-user policies ("Users can manage their own settings", "Users can
-- view their own settings", etc.) which gate by auth.uid() = user_id.
--
-- Companion code change (same submodule SHA): PublicStorefrontPage.tsx
-- + PublicIntakePage.tsx switch from from('user_settings') to
-- from('public_trainer_profiles').
-- ============================================================

create or replace view public.public_trainer_profiles
  with (security_invoker = false)
as
  select
    user_id,
    trainer_handle,
    bio,
    avatar_url,
    specialties,
    business_name
  from public.user_settings
  where trainer_handle is not null;

grant select on public.public_trainer_profiles to anon;
grant select on public.public_trainer_profiles to authenticated;

drop policy if exists "Public can view trainer profiles" on public.user_settings;

revoke select on public.user_settings from anon;

comment on view public.public_trainer_profiles is
  'Security-definer view exposing only storefront-safe columns of user_settings to anon + authenticated. Replaces the dropped "Public can view trainer profiles" row policy on user_settings (TG-1 cross-tenant column leak closure 2026-05-02). Trainer-own access to user_settings is preserved via the per-user row policies.';
