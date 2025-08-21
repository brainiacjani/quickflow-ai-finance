-- Create reports table to store saved report definitions and access control
create extension if not exists "pgcrypto";

create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  -- a free-text SQL or DSL query that the report designer can interpret
  query text,
  -- JSONB array storing roles or user ids allowed to access this report
  access jsonb default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_reports_created_by on public.reports(created_by);
