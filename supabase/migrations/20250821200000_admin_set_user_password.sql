-- Admin RPC to set a user's password server-side (SECURITY DEFINER)
-- IMPORTANT: This relies on the auth.admin_update_user function existing in the 'auth' schema.
-- If your Supabase version exposes a different admin function, adjust the call accordingly.

create or replace function public.admin_set_user_password(target_uid uuid, new_password text)
returns void as $$
declare
  caller uuid := auth.uid();
  v_is_admin boolean;
begin
  if caller is null then
    raise exception 'not authenticated';
  end if;

  select coalesce(p.is_admin, false) into v_is_admin from public.profiles p where p.id = caller;
  if not v_is_admin then
    raise exception 'not authorized';
  end if;

  -- Attempt to call the auth.admin_update_user function if available.
  -- Many Supabase instances expose admin helper functions in the `auth` schema.
  if exists (
    select 1 from pg_proc p join pg_namespace n on p.pronamespace = n.oid where p.proname = 'admin_update_user' and n.nspname = 'auth'
  ) then
    -- Call the admin update function. Signature may vary by Supabase version; this attempts to pass uid and a JSON payload.
    perform auth.admin_update_user(target_uid::text, json_build_object('password', new_password));
  else
    raise exception 'auth.admin_update_user not available on this instance; please use service_role or update function name';
  end if;
end;
$$ language plpgsql security definer;

grant execute on function public.admin_set_user_password(uuid, text) to authenticated;

-- NOTE: Run this migration in your Supabase SQL editor as a privileged user (service role) to create the RPC.
-- After creation, the frontend can call `select public.admin_set_user_password(target_uid, new_password)` via a secured RPC.
