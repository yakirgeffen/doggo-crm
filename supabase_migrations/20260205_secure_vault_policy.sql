-- Revoke SELECT permission on the secret_access_key column for the authenticated role
-- This prevents the frontend from ever reading the actual secret key, even if it "tries" to.
-- We do this by revoking the TABLE level permission and then granting it back on specific columns only.

-- First, ensure RLS is enabled (it should be, but good practice)
alter table public.sys_integrations_vault enable row level security;

-- 1. Revoke the broad select (if it was granted loosely)
revoke select on public.sys_integrations_vault from authenticated;
revoke select on public.sys_integrations_vault from anon;

-- 2. Grant column-specific select to authenticated users
-- They can see: service_name, access_key_id, is_connected, updated_at
-- They CANNOT see: secret_access_key
grant select (user_id, service_name, access_key_id, is_connected, updated_at) 
on public.sys_integrations_vault 
to authenticated;

-- 3. Allow them to INSERT/UPDATE everything (so they can save keys)
-- Ideally we would use a function to save keys to be even stricter, but for now this blocks the "Read" vector.
grant insert, update, delete on public.sys_integrations_vault to authenticated;

-- 4. Admin (Service Role) keeps full access
grant all on public.sys_integrations_vault to service_role;
