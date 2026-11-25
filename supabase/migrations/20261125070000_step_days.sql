-- =====================================================================
-- Migration: days per goal step.
-- Each step has its own "days": how many days after the previous step is
-- finished this step becomes due. Replaces the single gap for the whole goal
-- (goals.gap_days stays as a fallback for steps without their own value).
-- =====================================================================

alter table public.tasks add column if not exists step_days int
  check (step_days between 1 and 60);

-- Existing waiting/upcoming steps take their goal's gap.
update public.tasks t
set step_days = g.gap_days
from public.goals g
where t.goal_id = g.id and t.step_days is null;
