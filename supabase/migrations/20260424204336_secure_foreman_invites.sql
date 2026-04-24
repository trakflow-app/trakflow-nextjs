create or replace function public.get_invite_details(token_input text)
returns table (
  invited_email text,
  org_id uuid,
  org_name text,
  role text,
  is_valid boolean,
  error_message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
    invite_row record;
    org_name_val text;
begin
    -- 1. Fetch the invite
    select * into invite_row
    from public.org_invites
    where token = token_input
    limit 1;

    --  Validate existence
    if invite_row.id is null then
        return query select null::text, null::uuid, null::text, null::text, false, 'Invite not found.'::text;
        return;
    end if;

    --  Get the Org Name
    select name into org_name_val
    from public.organizations
    where id = invite_row.org_id;

    --  Check usage
    if invite_row.used_at is not null then
        return query select null::text, null::uuid, null::text, null::text, false, 'Invite already used.'::text;
        return;
    end if;

    --  Check expiration
    if invite_row.expires_at < now() then
        return query select null::text, null::uuid, null::text, null::text, false, 'Invite expired.'::text;
        return;
    end if;

    -- Success return
    return query select
        invite_row.invited_email,
        invite_row.org_id,
        org_name_val,
        invite_row.role::text,
        true,
        null::text;
end;
$$;

--  Re-grant permissions (dropping the function removes these)
grant execute on function public.get_invite_details(text) to anon, authenticated;
