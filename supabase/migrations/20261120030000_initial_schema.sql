-- =====================================================================
-- Migration: initial schema (profiles, tasks, friendships, security rules)
-- =====================================================================

-- ---------- PROFILES ----------------------------------------------------
-- One row per user. Created automatically when someone signs up.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text,
  created_at   timestamptz not null default now()
);

-- Copy username / display name from the sign-up form into profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- TASKS -------------------------------------------------------
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  title        text not null check (char_length(title) between 1 and 200),
  category     text not null check (category in ('personal', 'school', 'work')),
  priority     text check (priority in ('low', 'medium', 'high')),  -- optional
  due_date     date,                                                 -- optional
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);

-- ---------- FRIENDSHIPS -------------------------------------------------
-- requester sends a request, addressee accepts it.
create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

-- Only one friendship per pair of people, whichever direction.
create unique index if not exists friendships_pair_idx on public.friendships (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
);

-- Helper: are two users accepted friends?
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a))
  );
$$;

-- ---------- ROW LEVEL SECURITY -----------------------------------------
-- RLS = the database itself checks who is allowed to see/change each row,
-- so even though the anon key is public, nobody can read other people's data.
alter table public.profiles    enable row level security;
alter table public.tasks       enable row level security;
alter table public.friendships enable row level security;

-- Profiles: any logged-in user can look up usernames (to add friends);
-- you can only edit your own profile.
drop policy if exists "profiles readable by logged-in users" on public.profiles;
create policy "profiles readable by logged-in users"
  on public.profiles for select to authenticated using (true);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Tasks: you see your own + your accepted friends'. You only change your own.
drop policy if exists "read own or friends tasks" on public.tasks;
create policy "read own or friends tasks"
  on public.tasks for select to authenticated
  using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));

drop policy if exists "insert own tasks" on public.tasks;
create policy "insert own tasks"
  on public.tasks for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "update own tasks" on public.tasks;
create policy "update own tasks"
  on public.tasks for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "delete own tasks" on public.tasks;
create policy "delete own tasks"
  on public.tasks for delete to authenticated
  using (user_id = auth.uid());

-- Friendships: you see requests you're part of; you can send requests as
-- yourself; only the person who received a request can accept it; either
-- person can remove it.
drop policy if exists "read own friendships" on public.friendships;
create policy "read own friendships"
  on public.friendships for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));

drop policy if exists "send friend request" on public.friendships;
create policy "send friend request"
  on public.friendships for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending');

drop policy if exists "accept friend request" on public.friendships;
create policy "accept friend request"
  on public.friendships for update to authenticated
  using (addressee_id = auth.uid()) with check (addressee_id = auth.uid());

drop policy if exists "remove friendship" on public.friendships;
create policy "remove friendship"
  on public.friendships for delete to authenticated
  using (auth.uid() in (requester_id, addressee_id));

-- ---------- LIVE SYNC ---------------------------------------------------
-- Lets the app hear about task changes instantly (e.g. checked off on phone,
-- updates on laptop). Safe to re-run.
do $$
begin
  alter publication supabase_realtime add table public.tasks;
exception when duplicate_object then null;
end $$;
