-- ============================================================
-- Migration: function_search_path_hardening
-- Live version: 20260502174639 (applied via Supabase MCP during soft-launch session)
-- Author: Liat (TG-2 reconcile pass — iteration 58)
-- Purpose: closes 3 Supabase advisor security warnings (function_search_path_mutable)
--   by pinning search_path on all 3 SECURITY-flagged functions to a fixed
--   schema list, preventing privilege-escalation via search_path manipulation.
--
-- This migration was originally applied directly to the live DB via
-- mcp__supabase__apply_migration in the 2026-05-02 soft-launch session but
-- the corresponding repo file was never created. This file backfills it.
--
-- The ALTER pattern is idempotent: re-applying it against an already-hardened
-- function is a no-op.
-- ============================================================

alter function public.adopt_orphans() set search_path = 'public', 'pg_temp';
alter function public.handle_updated_at() set search_path = 'public', 'pg_temp';
alter function public.update_sessions_completed() set search_path = 'public', 'pg_temp';
