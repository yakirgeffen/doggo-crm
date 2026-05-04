-- Drop the `legacy_` prefix from `programs.legacy_morning_invoice_number`
-- (just renamed in iter 123 — same session). The previous rename encoded
-- a misframe: Morning was treated as deprecated-replaced-by-Sumit, when
-- in fact the studio is offering trainers a CHOICE — Sumit, Morning, or
-- both, per trainer preference. Yakir surfaced the misframe directly:
-- "does the studio understand that we're giving the trainers a choice
-- in case they want to work with either sumit or green invoice or even
-- both if the trainer wishes so?"
--
-- The IntegrationsSettings UI already supports both — `useIntegrations`
-- handles the Morning vault row, `useSumit` handles the Sumit vault row,
-- and a trainer can connect either, both, or neither. The data model
-- should reflect that parity. `morning_invoice_number` (no qualifier)
-- sits alongside `sumit_invoice_document_number` as equal vendor surfaces.
--
-- Mental-model correction also lands in:
--   - `studio/memory.md` (the "Sumit pivot" entries reframed to "Sumit
--     adoption alongside Morning")
--   - CFO worksheet (cost analysis assumed Sumit replaces Morning)
--   - ProgramWorkspace.tsx (drops the "Sumit-first / Morning-fallback"
--     hierarchy in the WhatsApp reminder; surfaces whichever vendor's
--     invoice the trainer used for the program)

alter table public.programs
  rename column legacy_morning_invoice_number to morning_invoice_number;

comment on column public.programs.morning_invoice_number is
  'Morning (Green Invoice) document number — set when a program''s invoice was issued via the Morning integration. Sibling to sumit_invoice_document_number. The two vendors are parallel options; trainers can use either, both, or neither per trainer preference.';
