-- Adds `intro_pages_seen text[]` to user_settings to track which page-level
-- intro modals each trainer has dismissed. Per-page persistence — survives
-- device switches (a trainer who dismisses on laptop should not be re-greeted
-- on phone).
--
-- Veteran-row backfill: every existing user_settings row is marked as having
-- seen the v1 intro pages (currently just 'clients') so existing trainers
-- aren't ambushed by an intro modal on a CRM they already know how to use.
-- New signups created after this migration get the default empty array and
-- will see the intro on first visit.
--
-- Future intros (settings, storefront, etc.) ship with their own backfill in
-- the same shape — append the new page id to existing rows so veterans skip
-- it, but new signups see it.
--
-- RLS: existing user_settings policies (auth.uid() = user_id on all CRUD)
-- automatically cover this column — no policy changes needed.

alter table public.user_settings
  add column if not exists intro_pages_seen text[] not null default '{}';

comment on column public.user_settings.intro_pages_seen is
  'Page IDs whose intro modal the trainer has dismissed. Veteran rows backfilled at migration time; new rows default to empty.';

-- Veteran backfill: any row that exists right now is treated as having seen
-- the v1 intro pages. Use array_append rather than overwrite so future
-- backfills can layer cleanly without clobbering pages a user already saw.
update public.user_settings
   set intro_pages_seen = array['clients']
 where not (intro_pages_seen @> array['clients']);
