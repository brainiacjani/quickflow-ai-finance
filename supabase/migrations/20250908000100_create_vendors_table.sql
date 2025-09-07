-- Create vendors table
create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  address text,
  metadata jsonb,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_vendors_created_at on vendors (created_at desc);

-- trigger to update updated_at
create or replace function trigger_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_timestamp on vendors;
create trigger set_timestamp
before update on vendors
for each row
execute procedure trigger_set_updated_at();
