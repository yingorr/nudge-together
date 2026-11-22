-- =====================================================================
-- Migration: optional "time needed" estimate on tasks (low / medium / high).
-- =====================================================================

alter table public.tasks
  add column if not exists time_needed text
  check (time_needed in ('low', 'medium', 'high'));
