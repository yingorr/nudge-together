-- =====================================================================
-- Migration: nudges — friends checking in on each other's tasks.
-- A nudge is a short preset message from one friend to another about one
-- of the recipient's tasks. Only accepted friends can send them, and you
-- can only nudge someone about their own task.
-- =====================================================================

create table if not exists public.nudges (
  id         uuid primary key default gen_random_uuid(),
  from_id    uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  to_id      uuid not null references public.profiles (id) on delete cascade,
  task_id    uuid not null references public.tasks (id) on delete cascade,
  message    text not null check (char_length(message) between 1 and 80),
  created_at timestamptz not null default now(),
  seen_at    timestamptz,
  check (from_id <> to_id)
);

create index if not exists nudges_to_id_idx on public.nudges (to_id, seen_at);
create index if not exists nudges_task_id_idx on public.nudges (task_id);

alter table public.nudges enable row level security;

-- Sender and recipient can see a nudge.
create policy "read own nudges"
  on public.nudges for select to authenticated
  using (auth.uid() in (from_id, to_id));

-- Send: as yourself, to an accepted friend, about one of *their* tasks.
create policy "send nudge to friend"
  on public.nudges for insert to authenticated
  with check (
    from_id = auth.uid()
    and public.are_friends(from_id, to_id)
    and exists (select 1 from public.tasks t where t.id = task_id and t.user_id = to_id)
  );

-- The recipient marks nudges as seen, or clears them.
create policy "recipient marks nudge seen"
  on public.nudges for update to authenticated
  using (to_id = auth.uid()) with check (to_id = auth.uid());

create policy "recipient clears nudge"
  on public.nudges for delete to authenticated
  using (to_id = auth.uid());

grant select, insert, update, delete on public.nudges to authenticated;

-- Live: a nudge shows up for the recipient without refreshing.
alter publication supabase_realtime add table public.nudges;
