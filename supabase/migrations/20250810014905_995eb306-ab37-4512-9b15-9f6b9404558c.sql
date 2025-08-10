
-- Enable pgcrypto for gen_random_uuid (usually enabled by default)
create extension if not exists pgcrypto with schema public;

-- 1) Helper function to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) Profiles table: one row per auth user
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at in sync
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- RLS: only the owner can access their profile
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id);

-- 3) Auto-insert a blank profile on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 4) Companies table: one company per user (for now)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  business_type text,
  region text,
  currency text,
  fiscal_year_start date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);

-- Keep updated_at in sync
drop trigger if exists trg_companies_updated_at on public.companies;
create trigger trg_companies_updated_at
before update on public.companies
for each row execute procedure public.set_updated_at();

-- RLS: only the owner can access their company
alter table public.companies enable row level security;

drop policy if exists "companies_select_own" on public.companies;
create policy "companies_select_own"
on public.companies
for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "companies_insert_own" on public.companies;
create policy "companies_insert_own"
on public.companies
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "companies_update_own" on public.companies;
create policy "companies_update_own"
on public.companies
for update
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "companies_delete_own" on public.companies;
create policy "companies_delete_own"
on public.companies
for delete
to authenticated
using (auth.uid() = owner_id);
