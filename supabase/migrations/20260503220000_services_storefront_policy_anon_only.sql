-- iter 135: Tighten services storefront-read RLS policy to anon role only.
--
-- BUG (Yakir 2026-05-03 demo): a fresh trainer (yakirgeffen8@gmail.com)
-- logged in for the first time and saw 7 services from OTHER trainers
-- (e.g. "פגישת ייעוץ" ₪550, "אילוף גורים" ₪50000, "personal training"
-- ₪432789324) on /settings → Services & Pricing. This is a Zero-Trust
-- Multi-Tenancy violation per CLAUDE.md "CRITICAL: Security & Data
-- Isolation".
--
-- ROOT CAUSE: the policy "Public can view active services for storefront"
-- was created with no role restriction (polroles = {0} = PUBLIC), so it
-- granted every role — including `authenticated` — read access to ANY
-- services row where is_active = true. Combined with the second policy
-- "Users can view their own services" (auth.uid() = user_id), the
-- effective union for an authenticated trainer was: their own services
-- OR every other trainer's active services.
--
-- The policy was intended to support the public storefront page
-- (/t/:trainerHandle), which queries services as the anon role with an
-- explicit .eq('user_id', settingsData.user_id) filter. The same filter
-- applies whether the policy targets `anon` or `public` — the storefront
-- continues to work — but tightening to `anon` ensures the cross-tenant
-- bleed cannot happen for authenticated users.
--
-- Compare to trainer_testimonials' "Public reads published testimonials"
-- which is correctly scoped to {anon} — that's the established pattern.
--
-- FIX: drop the permissive policy and recreate it scoped to `anon` only.
-- The storefront page (PublicStorefrontPage.tsx line 84-89) reads as
-- anon and explicitly scopes by user_id, so behaviour is preserved.

drop policy if exists "Public can view active services for storefront" on public.services;

create policy "Anon can view active services for storefront"
  on public.services
  for select
  to anon
  using (is_active = true);

comment on policy "Anon can view active services for storefront" on public.services is
  'Storefront-read policy scoped to anon role only (iter 135 fix). The previous policy "Public can view active services for storefront" was role-unrestricted (polroles={0}=PUBLIC) which let authenticated trainers read every other trainer''s services — a Zero-Trust Multi-Tenancy violation. Authenticated users now read only their own services via the "Users can view their own services" policy.';
