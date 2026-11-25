-- =====================================================================
-- Migration: per-step days, and goal-level priority / time needed.
-- * Each goal step has its own "days": how many days after the previous
--   step is finished it becomes due (replaces one gap for the whole goal;
--   goals.gap_days stays as a fallback).
-- * A goal can have an optional priority and time needed. They're copied
--   onto its steps when created (and onto steps added later); each step can
--   still be changed on its own.
-- =====================================================================

alter table public.tasks add column if not exists step_days int
  check (step_days between 1 and 60);

-- Existing steps take their goal's gap.
update public.tasks t
set step_days = g.gap_days
from public.goals g
where t.goal_id = g.id and t.step_days is null;

alter table public.goals add column if not exists priority text
  check (priority in ('low', 'medium', 'high'));
alter table public.goals add column if not exists time_needed text
  check (time_needed in ('low', 'medium', 'high'));
