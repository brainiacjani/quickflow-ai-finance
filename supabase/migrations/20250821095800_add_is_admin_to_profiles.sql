-- Add is_admin boolean to profiles table
alter table if exists public.profiles
  add column if not exists is_admin boolean default false;

-- Optional index for queries filtering admins
create index if not exists idx_profiles_is_admin on public.profiles(is_admin);
