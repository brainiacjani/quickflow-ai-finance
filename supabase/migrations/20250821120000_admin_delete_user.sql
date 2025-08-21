-- Secure admin RPC to delete a user profile and auth user
-- This function checks that the caller is an admin (profiles.is_admin = true)
-- and then deletes related rows and the profile. If available, it calls auth.admin_delete_user
-- to remove the auth user as well. Create this in the Supabase SQL editor (service role or SQL runner).

create or replace function public.admin_delete_user(target_uid uuid)
returns void as $$
declare
  caller uuid := auth.uid();
  v_is_admin boolean;
begin
  -- Ensure caller is authenticated
  if caller is null then
    raise exception 'not authenticated';
  end if;

  -- Check if caller is admin (qualify column with table alias to avoid ambiguity)
  select coalesce(p.is_admin, false) into v_is_admin from public.profiles p where p.id = caller;
  if not v_is_admin then
    raise exception 'not authorized';
  end if;

  -- delete app-level references (adjust as needed)
  delete from public.reports where created_by = target_uid;

  -- delete profile row
  delete from public.profiles where id = target_uid;

  -- If Supabase auth admin function exists, try to remove the auth user
  if exists (select 1 from pg_proc p join pg_namespace n on p.pronamespace = n.oid where p.proname = 'admin_delete_user' and n.nspname = 'auth') then
    perform auth.admin_delete_user(target_uid::text);
  end if;
end;
$$ language plpgsql security definer;

-- Grant execute to authenticated role so logged-in admins can call it
grant execute on function public.admin_delete_user(uuid) to authenticated;
