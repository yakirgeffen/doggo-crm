-- ============================================================
-- Migration: Magic Notebook Architecture
-- Extends services (catalog), clients (tags), user_settings (profile)
-- Links programs to services catalog
-- ============================================================

-- 1. Extend services table to act as a catalog
alter table public.services
  add column if not exists type text default 'fixed' check (type in ('fixed', 'open')),
  add column if not exists sessions_included integer default null;

-- 2. Extend clients table with behavioral tags + lead tracking
alter table public.clients
  add column if not exists behavioral_tags text[] default '{}',
  add column if not exists lead_source text default null;

-- 3. Link programs to the services catalog
alter table public.programs
  add column if not exists service_id uuid references public.services(id) default null;

-- 4. Extend user_settings for public storefront profile
alter table public.user_settings
  add column if not exists trainer_handle text unique default null,
  add column if not exists bio text default null,
  add column if not exists avatar_url text default null,
  add column if not exists specialties text[] default '{}';

-- 5. Add constraint to prevent reserved handles
-- (enforced at app level too, but good to have DB-side)
alter table public.user_settings
  add constraint handle_not_reserved
  check (trainer_handle not in ('login', 'welcome', 'privacy', 'terms', 'clients', 'settings', 'calendar', 'programs', 'storefront', 'seed', 'api'));

-- 6. Extend intake_submissions with richer fields
alter table public.intake_submissions
  add column if not exists trainer_id uuid references auth.users default null,
  add column if not exists dog_breed text default null,
  add column if not exists dog_age text default null,
  add column if not exists behavioral_tags text[] default '{}',
  add column if not exists lead_source text default null,
  add column if not exists selected_service_id uuid references public.services(id) default null;

-- 7. Pre-populate behavioral_tags for existing clients (prevent undefined errors)
update public.clients
  set behavioral_tags = '{}'
  where behavioral_tags is null;

-- 8. Public read-only policy for services (storefront needs to show them)
create policy "Public can view active services for storefront"
  on public.services for select
  using (is_active = true);

-- 9. Public read-only policy for user_settings (storefront needs trainer profile)
create policy "Public can view trainer profiles"
  on public.user_settings for select
  using (trainer_handle is not null);
