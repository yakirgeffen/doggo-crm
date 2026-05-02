-- ============================================================
-- Migration: programs.sumit_invoice_document_id columns
-- Date: 2026-05-02
-- Author: Liat (CTO loop iteration 8 — Sumit invoice flow)
-- Purpose: track Sumit invoices issued per program. When a trainer
--   marks a program as paid + clicks 'Send invoice via Sumit', the
--   resulting Sumit DocumentID + DocumentNumber are stored here for
--   later reference (client receipts, audit trail).
-- ============================================================

alter table public.programs
  add column if not exists sumit_invoice_document_id bigint,
  add column if not exists sumit_invoice_document_number bigint;

comment on column public.programs.sumit_invoice_document_id is
  'Sumit DocumentID for the invoice issued when this program was marked paid (G-CTO loop iteration 8 — Sumit invoice flow). Null if no invoice has been sent or trainer uses a different vendor.';

comment on column public.programs.sumit_invoice_document_number is
  'Human-facing Sumit document number for the invoice; useful for client-facing references.';
