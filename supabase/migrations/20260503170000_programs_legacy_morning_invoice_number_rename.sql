-- Rename `programs.greeninvoice_invoice_number` to
-- `programs.legacy_morning_invoice_number`. Closes the CLAUDE.md
-- "Known Tech Debt" item that's been waiting since the founding-phase
-- schema was authored under Green Invoice; Sumit is now the primary
-- billing path (per iter 73 + Sumit-pivot session 2026-05-02), so the
-- vendor-specific name no longer maps to the live billing system.
--
-- Column has 0 populated rows at rename time (verified via SELECT
-- count(greeninvoice_invoice_number) → 0 from 18 programs), so this
-- is a pure name change, no data migration concerns.
--
-- Why rename instead of drop: the field stays as a "legacy_*" name to
-- preserve schema lineage if any historical Morning data needs to be
-- back-imported (e.g., a trainer who has Morning invoices from before
-- the Sumit pivot wants those reflected in the system). The replacement
-- vendor's column already exists at `programs.sumit_invoice_document_number`
-- so there is no clash — the rename creates a clear "this came from
-- the deprecated path" marker without losing the data slot.

alter table public.programs
  rename column greeninvoice_invoice_number to legacy_morning_invoice_number;

comment on column public.programs.legacy_morning_invoice_number is
  'Legacy Morning (Green Invoice) document number. Renamed from greeninvoice_invoice_number 2026-05-03 when Sumit became the primary billing path. New invoices populate sumit_invoice_document_number / sumit_invoice_document_id; this column stays for historical Morning data only.';
