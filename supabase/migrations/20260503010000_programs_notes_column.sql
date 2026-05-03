-- ============================================================
-- Migration: programs.notes column
-- Date: 2026-05-03
-- Author: Liat (CPO loop iteration 38)
-- Purpose: per-program operational notes (distinct from per-session
--   session_notes). Trainers record things like client preferences,
--   dog medical conditions, or workflow context that applies across
--   the whole training program.
-- ============================================================

alter table public.programs
  add column if not exists notes text;

comment on column public.programs.notes is
  'Per-program operational notes for the trainer. Distinct from session_notes (which are per-session). Use for things like "client prefers morning sessions" or "dog has hip issue, no jumping".';
