-- =====================================================================
-- Migration: let logged-in users reach the tables through the API.
-- Newer Supabase projects don't auto-grant access to tables created in SQL,
-- which shows up in the app as "permission denied for table ...".
-- Row Level Security policies still decide WHICH rows each user can touch.
-- =====================================================================

grant usage on schema public to authenticated;

grant select, update                 on public.profiles    to authenticated;
grant select, insert, update, delete on public.tasks       to authenticated;
grant select, insert, update, delete on public.friendships to authenticated;

grant execute on function public.are_friends(uuid, uuid)        to authenticated;
grant execute on function public.find_profile_by_email(text)    to authenticated;
