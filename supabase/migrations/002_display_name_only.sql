-- =====================================================================
-- Migration 002: drop usernames, use display name only.
-- Friends are now added by email (looked up privately, emails aren't listed).
-- Run once in Supabase -> SQL Editor if you already ran the original schema.sql.
-- =====================================================================

alter table public.profiles drop column if exists username;

update public.profiles set display_name = 'Friend' where display_name is null or display_name = '';
alter table public.profiles alter column display_name set not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- Find someone by their exact email to send a friend request.
-- Runs with elevated rights so it can read auth.users, but only returns
-- id + display name for one exact match (nobody can browse emails).
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
  limit 1;
$$;

revoke execute on function public.find_profile_by_email(text) from public, anon;
grant execute on function public.find_profile_by_email(text) to authenticated;
