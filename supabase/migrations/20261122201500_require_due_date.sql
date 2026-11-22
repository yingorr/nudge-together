-- =====================================================================
-- Migration: every task must have a due date.
-- Any existing task without one gets the day it was created as its due date
-- (so it shows up as Today or Overdue and you can fix it), then the column
-- is made required.
-- =====================================================================

update public.tasks
set due_date = (created_at at time zone 'America/New_York')::date
where due_date is null;

alter table public.tasks alter column due_date set not null;
