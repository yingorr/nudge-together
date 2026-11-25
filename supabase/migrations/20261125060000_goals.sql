-- =====================================================================
-- Migration: goals — group small steps under a big goal.
-- A goal's steps are ordinary tasks with goal_id + step_order. Only the
-- current step has a due date; the rest wait (due_date null) until the
-- previous one is finished, then the app gives the next step a due date
-- `gap_days` after that day.
-- =====================================================================

create table if not exists public.goals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  title      text not null check (char_length(title) between 1 and 200),
  category   text not null check (category in ('personal', 'school', 'work')),
  gap_days   int  not null default 2 check (gap_days between 1 and 60),
  created_at timestamptz not null default now()
);

create index if not exists goals_user_id_idx on public.goals (user_id);

alter table public.goals enable row level security;

-- Same rules as tasks: you and your accepted friends can see a goal; only you change it.
create policy "read own or friends goals"
  on public.goals for select to authenticated
  using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));

create policy "insert own goals"
  on public.goals for insert to authenticated
  with check (user_id = auth.uid());

create policy "update own goals"
  on public.goals for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "delete own goals"
  on public.goals for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.goals to authenticated;

-- Steps: tasks that belong to a goal. Deleting a goal deletes its steps.
alter table public.tasks add column if not exists goal_id uuid references public.goals (id) on delete cascade;
alter table public.tasks add column if not exists step_order int;
create index if not exists tasks_goal_id_idx on public.tasks (goal_id);

-- Due dates stay required for normal tasks; only waiting goal steps may have none.
alter table public.tasks alter column due_date drop not null;
alter table public.tasks add constraint tasks_due_date_required
  check (due_date is not null or goal_id is not null);

-- A step can only be added to one of your own goals.
drop policy if exists "insert own tasks" on public.tasks;
create policy "insert own tasks"
  on public.tasks for insert to authenticated
  with check (
    user_id = auth.uid()
    and (goal_id is null or exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()))
  );

drop policy if exists "update own tasks" on public.tasks;
create policy "update own tasks"
  on public.tasks for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (goal_id is null or exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()))
  );

-- Live: goal changes show up on your other devices.
alter publication supabase_realtime add table public.goals;
