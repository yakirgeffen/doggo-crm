-- ============================================================
-- Migration: RLS hardening — pre-soft-launch security patch
-- Date: 2026-05-02
-- Author: Liat (Geffen Studio) — applied via Supabase MCP under
--   work-order P1-4. Findings audited via pg_policies live state.
--
-- Closes four cross-tenant exposure vectors found in the live DB:
--   B1: activity_logs.Public Read Activities  — anyone read all logs
--   B2: activity_logs.Public Write Activities — anyone write log forgeries
--   B3: profiles.Public Read                  — anyone read all profiles
--   B4: user_settings cross-tenant column leak — anon reads schedule + meta
--
-- Per-user policies on every affected table remain in place:
--   activity_logs.Users can manage their own logs (auth.uid() = performed_by)
--   profiles.Users can view their own profile    (auth.uid() = id)
--   profiles.Users can update their own profile  (auth.uid() = id)
--   user_settings.Users can manage their own settings (auth.uid() = user_id)
--
-- Storefront public read on user_settings is preserved via the
-- existing "Public can view trainer profiles" policy plus a tightened
-- column-level GRANT to anon limited to storefront-needed fields only.
-- ============================================================

-- ------------------------------------------------------------
-- B1 + B2: activity_logs — drop unrestricted public policies.
-- Per-user policy "Users can manage their own logs" remains and
-- covers both SELECT and INSERT scoped to auth.uid() = performed_by.
-- ------------------------------------------------------------

drop policy if exists "Public Read Activities" on public.activity_logs;
drop policy if exists "Public Write Activities" on public.activity_logs;

-- ------------------------------------------------------------
-- B3: profiles — drop the qual=true public read policy.
-- Per-user policy "Users can view their own profile" remains.
-- ------------------------------------------------------------

drop policy if exists "Public Read" on public.profiles;

-- ------------------------------------------------------------
-- B4: user_settings — column-level grants to anon.
-- The row policy "Public can view trainer profiles" is preserved
-- so the storefront still works. Anon is restricted to the
-- columns the storefront actually needs; schedule + operational
-- metadata are no longer readable without authentication.
--
-- Authenticated users continue to see full rows via the per-user
-- policy. The remaining authenticated-cross-tenant column leak
-- (an authenticated trainer A reading trainer B's schedule via
-- the public-storefront row policy) is documented in the work
-- order as a trainer-#2 gate item, not closed here.
-- ------------------------------------------------------------

-- Anon column grants must include user_id: PublicStorefrontPage selects
-- (user_id, business_name, bio, avatar_url, specialties) and uses user_id
-- to chain a services lookup; PublicIntakePage selects user_id only and
-- uses it as the foreign-key target on intake_submissions.trainer_id.
-- Trainer auth UUID is therefore inherent to the storefront contract;
-- exposing it to anon is acceptable. Schedule columns
-- (work_days, work_hours_start, work_hours_end) and operational
-- metadata (created_at, updated_at) remain hidden from anon.

revoke select on public.user_settings from anon;
grant select (
  user_id,
  trainer_handle,
  bio,
  avatar_url,
  specialties,
  business_name
) on public.user_settings to anon;

-- ------------------------------------------------------------
-- B6: sys_integrations_vault — add explicit WITH CHECK.
-- Behavior is unchanged (Postgres falls back to USING when WITH
-- CHECK is omitted on FOR ALL), but explicit is safer against
-- future policy edits.
-- ------------------------------------------------------------

drop policy if exists "Users can manage their own integration keys" on public.sys_integrations_vault;
create policy "Users can manage their own integration keys"
  on public.sys_integrations_vault
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
