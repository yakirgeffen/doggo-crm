-- activity_logs.performed_by — server-side default auth.uid()
--
-- Iter 120 audit (2026-05-03) discovered that every `logActivity()` call
-- since 2026-02-21 has been silently rejected by RLS. The activity_logs
-- table has policy:
--
--    USING       (auth.uid() = performed_by)
--    WITH CHECK  (auth.uid() = performed_by)
--
-- The client-side `logActivity()` helper in `src/lib/supabase.ts` doesn't
-- include `performed_by` in its insert payload, so the column was being
-- defaulted to NULL — and `auth.uid() = NULL` evaluates to NULL, which
-- RLS treats as a check failure. 71 days of audit-log writes lost.
--
-- The 57 pre-2026-02-21 rows are legacy data from before the RLS policy
-- was tightened (when relrowsecurity was either off or had a permissive
-- INSERT policy that has since been replaced). They have NULL
-- performed_by; we leave them as-is — backfilling would require guessing
-- which trainer triggered each row.
--
-- Fix: server-side default. ALTER COLUMN ... SET DEFAULT auth.uid() makes
-- `performed_by` auto-populate from the authenticated session on every
-- insert that omits the field. Zero application-side changes needed —
-- every existing logActivity call starts working immediately on deploy.
--
-- Why not also backfill historic rows: cannot reliably attribute them.
-- They stay as anonymous-historic. Fresh rows from now on will be
-- correctly scoped, and the activity timeline will start working again
-- for current trainers.
--
-- Why not change the RLS policy to allow NULL: that would let any
-- authenticated user create unattributable audit rows in any other
-- trainer's data, defeating the purpose of multi-tenant isolation.
-- The default approach preserves the security model.

alter table public.activity_logs
  alter column performed_by set default auth.uid();

comment on column public.activity_logs.performed_by is
  'Trainer who triggered the audit-log row. Defaults to auth.uid() on insert; RLS scopes reads + writes to (auth.uid() = performed_by). Pre-2026-02-21 rows have NULL performed_by (legacy, before the RLS policy was tightened) and are not visible to current trainers.';
