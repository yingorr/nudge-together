-- =====================================================================
-- Migration: guest accounts + usernames
--  * Guests are Supabase anonymous users. They can use tasks and goals,
--    but can't send/accept friend requests or nudge, and can't be found.
--  * Usernames come back: used to add friends and to log in.
--    3-20 chars, lowercase letters, numbers, "_" and "."; no dot at the
--    start or end and no ".."; unique. Existing accounts pick one in the app.
-- =====================================================================

-- ---------- USERNAMES ---------------------------------------------------
alter table public.profiles add column if not exists username text;

alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format check (
  username is null
  or (username ~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$' and username !~ '\.\.')
);

create unique index if not exists profiles_username_key on public.profiles (username);

-- ---------- GUEST CHECK -------------------------------------------------
-- True for anonymous (guest) users. Reads auth.users so it stays correct
-- right after a guest upgrades to a real account.
create or replace function public.is_guest(uid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select u.is_anonymous from auth.users u where u.id = uid), false);
$$;

-- ---------- NEW USERS ---------------------------------------------------
-- Display name: from the form, else the email's first part, else "Guest".
-- Username: from the form if given (guests have none yet).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Guest'
    ),
    nullif(lower(trim(new.raw_user_meta_data ->> 'username')), '')
  );
  return new;
end;
$$;

-- ---------- USERNAME HELPERS --------------------------------------------
-- Is this username free? Used by the sign-up and "pick a username" forms.
create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select not exists (select 1 from public.profiles where username = lower(trim(p_username)));
$$;

revoke execute on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- Find someone to befriend by exact username or exact email.
-- Returns id + display name + username for one match; never returns emails.
-- Guests get no results, and guests can't be found.
create or replace function public.find_profile(p_identifier text)
returns table (id uuid, display_name text, username text)
language sql
stable
security definer set search_path = public
as $$
  select p.id, p.display_name, p.username
  from public.profiles p
  join auth.users u on u.id = p.id
  where not public.is_guest(auth.uid())
    and not coalesce(u.is_anonymous, false)
    and (
      (position('@' in p_identifier) > 0 and lower(u.email) = lower(trim(p_identifier)))
      or (position('@' in p_identifier) = 0 and p.username = lower(trim(p_identifier)))
    )
  limit 1;
$$;

revoke execute on function public.find_profile(text) from public, anon;
grant execute on function public.find_profile(text) to authenticated;

-- Old email-only lookup: keep it working, but not for guests.
create or replace function public.find_profile_by_email(p_email text)
returns table (id uuid, display_name text)
language sql
stable
security definer set search_path = public
as $$
  select p.id, p.display_name
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = lower(trim(p_email))
    and not public.is_guest(auth.uid())
  limit 1;
$$;

-- ---------- GUESTS CAN'T DO FRIEND THINGS -------------------------------
drop policy if exists "send friend request" on public.friendships;
create policy "send friend request"
  on public.friendships for insert to authenticated
  with check (
    requester_id = auth.uid() and status = 'pending'
    and not public.is_guest(auth.uid())
    and not public.is_guest(addressee_id)
  );

drop policy if exists "accept friend request" on public.friendships;
create policy "accept friend request"
  on public.friendships for update to authenticated
  using (addressee_id = auth.uid() and not public.is_guest(auth.uid()))
  with check (addressee_id = auth.uid());

drop policy if exists "send nudge to friend" on public.nudges;
create policy "send nudge to friend"
  on public.nudges for insert to authenticated
  with check (
    from_id = auth.uid()
    and not public.is_guest(auth.uid())
    and public.are_friends(from_id, to_id)
    and exists (select 1 from public.tasks t where t.id = task_id and t.user_id = to_id)
  );
