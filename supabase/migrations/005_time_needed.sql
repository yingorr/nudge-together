-- =====================================================================
-- Migration 005: optional "time needed" estimate on tasks (low / medium / high).
-- Run once in Supabase -> SQL Editor. Safe to re-run.
-- =====================================================================

alter table public.tasks
  add column if not exists time_needed text
  check (time_needed in ('low', 'medium', 'high'));
