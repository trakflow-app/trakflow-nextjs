-- =============================================================================
-- MIGRATION 2: workflow functions — the only approved write path for
--              multi-step business operations
-- =============================================================================
-- All functions:
--   - derive the caller from auth.uid() internally (never trust a passed user_id)
--   - run atomically (all steps succeed or all roll back)
--   - use SECURITY DEFINER to bypass RLS on function-only write tables
--   - lock relevant rows with FOR UPDATE to prevent race conditions

-- ---------------------------------------------------------------------------
-- ORG ONBOARDING
-- ---------------------------------------------------------------------------

-- Creates a new org and promotes the caller to OWNER.
-- Join code is generated here; env-based org creation gating is enforced in
-- the Next.js layer before this function is called.
-- Retries up to 25 times on join_code unique collision (collision is extremely unlikely).
create or replace function public.create_org(name text)
returns uuid
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  caller_user_id            uuid    := auth.uid();
  caller_account            public.accounts%rowtype;
  trimmed_name              text    := nullif(btrim(name), '');
  join_code_alphabet        constant text    := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  join_code_alphabet_length constant integer := length(join_code_alphabet);
  candidate_join_code       text;
  created_org_id            uuid;
begin
  if caller_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if trimmed_name is null then
    raise exception 'Organization name is required.';
  end if;

  -- FOR UPDATE prevents two concurrent calls from both passing the org_id = null check
  select accounts.* into caller_account
  from public.accounts as accounts
  where accounts.id = caller_user_id
  for update;

  if not found then
    raise exception 'Account row is required before creating an organization.';
  end if;

  if caller_account.org_id is not null then
    raise exception 'Caller already belongs to an organization.';
  end if;

  for attempt in 1..25 loop
    candidate_join_code := '';

    for character_index in 1..8 loop
      candidate_join_code := candidate_join_code
        || substr(join_code_alphabet,
             1 + floor(random() * join_code_alphabet_length)::integer, 1);
      if character_index = 4 then
        candidate_join_code := candidate_join_code || '-';
      end if;
    end loop;

    begin
      insert into public.organizations (name, join_code, created_by)
      values (trimmed_name, candidate_join_code, caller_user_id)
      returning id into created_org_id;

      update public.accounts
      set org_id = created_org_id, role = 'OWNER'
      where id = caller_user_id;

      return created_org_id;
    exception
      when unique_violation then candidate_join_code := null;
    end;
  end loop;

  raise exception 'Unable to generate a unique join code.';
end;
$$;


-- Attaches the caller to an existing org as CREW using the org's join code.
create or replace function public.join_org_by_code(code text)
returns uuid
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  caller_user_id  uuid := auth.uid();
  caller_account  public.accounts%rowtype;
  normalized_code text := upper(nullif(btrim(code), ''));
  target_org_id   uuid;
begin
  if caller_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if normalized_code is null then
    raise exception 'Join code is required.';
  end if;

  if normalized_code !~ '^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$' then
    raise exception 'Join code format is invalid.';
  end if;

  select accounts.* into caller_account
  from public.accounts as accounts
  where accounts.id = caller_user_id
  for update;

  if not found then
    raise exception 'Account row is required before joining an organization.';
  end if;

  if caller_account.org_id is not null then
    raise exception 'Caller already belongs to an organization.';
  end if;

  select organizations.id into target_org_id
  from public.organizations as organizations
  where organizations.join_code = normalized_code;

  if target_org_id is null then
    raise exception 'Join code was not found.';
  end if;

  update public.accounts
  set org_id = target_org_id, role = 'CREW'
  where id = caller_user_id;

  return target_org_id;
end;
$$;


-- Generates a secure invite token and stores a pending invite row.
-- OWNER may invite FOREMAN or CREW. FOREMAN may invite CREW only.
-- FOREMAN invites require invited_email. CREW invites can be open.
-- Token: 24 random bytes encoded as hex (48 chars, 192 bits of entropy).
create or replace function public.create_org_invite(
  role          public.user_role,
  invited_email text default null
)
returns text
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  caller_user_id   uuid := auth.uid();
  caller_account   public.accounts%rowtype;
  normalized_email text := lower(nullif(btrim(invited_email), ''));
  invite_token     text;
begin
  if caller_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select accounts.* into caller_account
  from public.accounts as accounts
  where accounts.id = caller_user_id;

  if not found then
    raise exception 'Account row is required before creating an invite.';
  end if;

  if caller_account.org_id is null then
    raise exception 'Caller must belong to an organization to create an invite.';
  end if;

  if role not in ('FOREMAN', 'CREW') then
    raise exception 'Invites may only be created for FOREMAN or CREW.';
  end if;

  if caller_account.role = 'OWNER' then
    null;
  elsif caller_account.role = 'FOREMAN' and role = 'CREW' then
    null;
  else
    raise exception 'Caller does not have permission to create that invite.';
  end if;

  if role = 'FOREMAN' and normalized_email is null then
    raise exception 'FOREMAN invites require a targeted email address.';
  end if;

  for attempt in 1..25 loop
    invite_token := encode(gen_random_bytes(24), 'hex');

    begin
      insert into public.org_invites (
        org_id, token, role, invited_email, created_by, expires_at
      )
      values (
        caller_account.org_id, invite_token, role, normalized_email,
        caller_user_id, now() + interval '7 days'
      );

      return invite_token;
    exception
      when unique_violation then invite_token := null;
    end;
  end loop;

  raise exception 'Unable to generate a unique invite token.';
end;
$$;


-- Validates an invite token and attaches the caller to the target org.
-- Targeted invites (invited_email set) require the caller's email to match.
-- FOR UPDATE on both accounts and org_invites prevents double-claim races.
create or replace function public.claim_org_invite(token text)
returns uuid
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  caller_user_id   uuid := auth.uid();
  caller_account   public.accounts%rowtype;
  invite_record    public.org_invites%rowtype;
  normalized_token text := nullif(btrim(token), '');
  caller_email     text;
begin
  if caller_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if normalized_token is null then
    raise exception 'Invite token is required.';
  end if;

  select accounts.* into caller_account
  from public.accounts as accounts
  where accounts.id = caller_user_id
  for update;

  if not found then
    raise exception 'Account row is required before claiming an invite.';
  end if;

  if caller_account.org_id is not null then
    raise exception 'Caller already belongs to an organization.';
  end if;

  select users.email into caller_email
  from auth.users as users
  where users.id = caller_user_id;

  -- used_at is null + expires_at > now() = valid unclaimed invite
  select org_invites.* into invite_record
  from public.org_invites as org_invites
  where org_invites.token     = normalized_token
    and org_invites.used_at   is null
    and org_invites.expires_at > now()
  for update;

  if not found then
    raise exception 'Invite token is invalid, expired, or already used.';
  end if;

  if invite_record.invited_email is not null
     and coalesce(lower(caller_email), '') <> lower(invite_record.invited_email) then
    raise exception 'Invite email does not match the authenticated user.';
  end if;

  update public.accounts
  set org_id = invite_record.org_id, role = invite_record.role
  where id = caller_user_id;

  update public.org_invites
  set used_at = now(), used_by = caller_user_id
  where id = invite_record.id;

  return invite_record.org_id;
end;
$$;


-- Replaces the org join code. OWNER only.
-- Skips the new code if it randomly matches the current one.
create or replace function public.regenerate_join_code()
returns text
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  caller_user_id            uuid := auth.uid();
  caller_account            public.accounts%rowtype;
  current_join_code         text;
  candidate_join_code       text;
  join_code_alphabet        constant text    := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  join_code_alphabet_length constant integer := length(join_code_alphabet);
begin
  if caller_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select accounts.* into caller_account
  from public.accounts as accounts
  where accounts.id = caller_user_id;

  if not found then
    raise exception 'Account row is required before regenerating a join code.';
  end if;

  if caller_account.org_id is null or caller_account.role <> 'OWNER' then
    raise exception 'Only the organization OWNER may regenerate the join code.';
  end if;

  select organizations.join_code into current_join_code
  from public.organizations as organizations
  where organizations.id = caller_account.org_id
  for update;

  if current_join_code is null then
    raise exception 'Organization was not found.';
  end if;

  for attempt in 1..25 loop
    candidate_join_code := '';

    for character_index in 1..8 loop
      candidate_join_code := candidate_join_code
        || substr(join_code_alphabet,
             1 + floor(random() * join_code_alphabet_length)::integer, 1);
      if character_index = 4 then
        candidate_join_code := candidate_join_code || '-';
      end if;
    end loop;

    if candidate_join_code = current_join_code then
      continue;
    end if;

    begin
      update public.organizations
      set join_code = candidate_join_code
      where id = caller_account.org_id;

      return candidate_join_code;
    exception
      when unique_violation then candidate_join_code := null;
    end;
  end loop;

  raise exception 'Unable to generate a unique join code.';
end;
$$;


-- ---------------------------------------------------------------------------
-- CHECKOUT
-- ---------------------------------------------------------------------------

-- Checks out one or many tools in a single atomic transaction.
-- All tools are locked (FOR UPDATE) before availability is checked to prevent
-- double-checkout races. Tools sorted by id before locking to prevent deadlocks.
-- Returns the checkout_sessions.id.
create or replace function public.checkout_tools(
  tool_ids     uuid[],
  condition    public.tool_condition,
  notes        text,
  session_name text default null
)
returns uuid
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  caller_user_id         uuid := auth.uid();
  caller_account         public.accounts%rowtype;
  normalized_notes       text := nullif(btrim(notes), '');
  normalized_session_name text := nullif(btrim(session_name), '');
  request_count          integer;
  distinct_request_count integer;
  found_tool_count       integer;
  available_tool_count   integer;
  locked_tool_ids        uuid[];
  created_session_id     uuid;
begin
  if caller_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if condition is null then
    raise exception 'Checkout condition is required.';
  end if;

  if condition = 'OUT_OF_SERVICE' then
    raise exception 'Tools cannot be checked out as OUT_OF_SERVICE.';
  end if;

  select accounts.* into caller_account
  from public.accounts as accounts
  where accounts.id = caller_user_id;

  if not found then
    raise exception 'Account row is required before checking out tools.';
  end if;

  if caller_account.org_id is null then
    raise exception 'Caller must belong to an organization to check out tools.';
  end if;

  if tool_ids is null or coalesce(array_length(tool_ids, 1), 0) = 0 then
    raise exception 'At least one tool is required for checkout.';
  end if;

  if exists (
    select 1 from unnest(tool_ids) as requested(tool_id)
    where requested.tool_id is null
  ) then
    raise exception 'Tool checkout requests may not contain null ids.';
  end if;

  select count(*), count(distinct requested.tool_id)
  into request_count, distinct_request_count
  from unnest(tool_ids) as requested(tool_id);

  if request_count <> distinct_request_count then
    raise exception 'Tool checkout requests may not contain duplicate ids.';
  end if;

  -- Lock all tool rows before checking status to prevent races.
  -- order by id prevents deadlocks when two checkouts share tools.
  select
    count(*),
    count(*) filter (where locked_tools.status = 'AVAILABLE'),
    array_agg(locked_tools.id order by locked_tools.id)
  into found_tool_count, available_tool_count, locked_tool_ids
  from (
    select tools.id, tools.status
    from public.tools as tools
    join unnest(tool_ids) as requested_tools(tool_id) on requested_tools.tool_id = tools.id
    where tools.org_id = caller_account.org_id
    for update
  ) as locked_tools;

  if found_tool_count <> distinct_request_count then
    raise exception 'All tools must belong to the caller organization.';
  end if;

  if available_tool_count <> distinct_request_count then
    raise exception 'All requested tools must currently be AVAILABLE.';
  end if;

  insert into public.checkout_sessions (org_id, user_id, session_name)
  values (caller_account.org_id, caller_user_id, normalized_session_name)
  returning id into created_session_id;

  insert into public.tool_management (
    org_id, tool_id, user_id, session_id, condition_checkout, notes
  )
  select
    caller_account.org_id,
    requested_tool_id.tool_id,
    caller_user_id,
    created_session_id,
    checkout_tools.condition,
    normalized_notes
  from unnest(locked_tool_ids) as requested_tool_id(tool_id);

  update public.tools
  set status = 'CHECKEDOUT', condition = checkout_tools.condition
  where org_id = caller_account.org_id
    and id = any(locked_tool_ids);

  return created_session_id;
end;
$$;


-- Closes one tool_management row, updates tool current state, and auto-closes
-- the parent session when all tools in it have been returned.
-- GOOD/FAIR return → tool becomes AVAILABLE.
-- DAMAGED/OUT_OF_SERVICE return → tool becomes OUT_OF_SERVICE (manager must restore).
-- Notes are appended (not replaced) if both checkout and return notes exist.
create or replace function public.return_tool(
  tool_management_id uuid,
  condition_return   public.tool_condition,
  notes              text default null,
  return_image_path  text default null
)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  caller_user_id               uuid := auth.uid();
  caller_account               public.accounts%rowtype;
  checkout_record              public.tool_management%rowtype;
  normalized_notes             text := nullif(btrim(notes), '');
  normalized_return_image_path text := nullif(btrim(return_image_path), '');
begin
  if caller_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if tool_management_id is null then
    raise exception 'Tool management id is required.';
  end if;

  if condition_return is null then
    raise exception 'Return condition is required.';
  end if;

  select accounts.* into caller_account
  from public.accounts as accounts
  where accounts.id = caller_user_id;

  if not found then
    raise exception 'Account row is required before returning a tool.';
  end if;

  if caller_account.org_id is null then
    raise exception 'Caller must belong to an organization to return a tool.';
  end if;

  select tool_management.* into checkout_record
  from public.tool_management as tool_management
  where tool_management.id     = tool_management_id
    and tool_management.org_id = caller_account.org_id
    and tool_management.checked_in is null
  for update;

  if not found then
    raise exception 'Open tool checkout row was not found.';
  end if;

  -- The person who checked it out can return it, or any OWNER/FOREMAN
  if checkout_record.user_id <> caller_user_id
     and caller_account.role not in ('OWNER', 'FOREMAN') then
    raise exception 'Caller may only return their own tools unless they manage operations.';
  end if;

  update public.tool_management
  set
    checked_in        = now(),
    condition_return  = return_tool.condition_return,
    return_image_path = coalesce(normalized_return_image_path, checkout_record.return_image_path),
    notes             = case
      when normalized_notes is null                          then checkout_record.notes
      when nullif(btrim(checkout_record.notes), '') is null  then normalized_notes
      else checkout_record.notes || E'\n' || normalized_notes
    end
  where id = checkout_record.id;

  update public.tools
  set
    condition = return_tool.condition_return,
    status    = case
      when return_tool.condition_return in ('GOOD', 'FAIR') then 'AVAILABLE'::public.tool_status
      else 'OUT_OF_SERVICE'::public.tool_status
    end
  where id = checkout_record.tool_id and org_id = checkout_record.org_id;

  -- Close the session only when no other open rows remain in it
  update public.checkout_sessions
  set checked_in_at = coalesce(checked_in_at, now())
  where id     = checkout_record.session_id
    and org_id = checkout_record.org_id
    and not exists (
      select 1 from public.tool_management as remaining
      where remaining.session_id = checkout_record.session_id
        and remaining.org_id     = checkout_record.org_id
        and remaining.checked_in is null
    );
end;
$$;


-- ---------------------------------------------------------------------------
-- MATERIAL USAGE
-- ---------------------------------------------------------------------------

-- Logs material consumption, decrements stock, and writes an immutable usage
-- row in one transaction. OWNER/FOREMAN only.
-- Project-specific materials (project_id set) may only be consumed by that project.
-- total_cost is frozen at log time so historical costs survive future price changes.
create or replace function public.log_material_usage(
  material_id   uuid,
  project_id    uuid,
  quantity_used numeric,
  notes         text default null
)
returns uuid
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  caller_user_id   uuid := auth.uid();
  caller_account   public.accounts%rowtype;
  material_record  public.materials%rowtype;
  usage_id         uuid;
  total_cost_value numeric(12, 2);
  normalized_notes text := nullif(btrim(notes), '');
begin
  if caller_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if material_id is null then
    raise exception 'Material id is required.';
  end if;

  if project_id is null then
    raise exception 'Project id is required.';
  end if;

  if quantity_used is null or quantity_used <= 0 then
    raise exception 'Material usage quantity must be greater than zero.';
  end if;

  select accounts.* into caller_account
  from public.accounts as accounts
  where accounts.id = caller_user_id;

  if not found then
    raise exception 'Account row is required before logging material usage.';
  end if;

  if caller_account.org_id is null or caller_account.role not in ('OWNER', 'FOREMAN') then
    raise exception 'Only OWNER or FOREMAN may log material usage.';
  end if;

  select materials.* into material_record
  from public.materials as materials
  where materials.id = material_id and materials.org_id = caller_account.org_id
  for update;

  if not found then
    raise exception 'Material was not found in the caller organization.';
  end if;

  perform 1 from public.projects as projects
  where projects.id = project_id and projects.org_id = caller_account.org_id;

  if not found then
    raise exception 'Project was not found in the caller organization.';
  end if;

  if material_record.project_id is not null
     and material_record.project_id <> project_id then
    raise exception 'Project-specific materials may only be consumed by their assigned project.';
  end if;

  if material_record.unit_qty < quantity_used then
    raise exception 'Material stock is insufficient for that usage entry.';
  end if;

  total_cost_value := round(quantity_used * material_record.unit_cost, 2);

  update public.materials
  set unit_qty = unit_qty - quantity_used
  where id = material_record.id and org_id = material_record.org_id;

  insert into public.material_usage (
    org_id, material_id, project_id, user_id, quantity_used, total_cost, notes
  )
  values (
    caller_account.org_id, material_record.id, project_id,
    caller_user_id, quantity_used, total_cost_value, normalized_notes
  )
  returning id into usage_id;

  return usage_id;
end;
$$;


-- ---------------------------------------------------------------------------
-- PROFILE
-- ---------------------------------------------------------------------------

-- The only path for a user to update their name in v1.
-- Direct UPDATE on accounts is intentionally blocked by RLS to prevent
-- a user from changing their own org_id or role.
create or replace function public.update_my_profile(name text)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  caller_user_id uuid := auth.uid();
  trimmed_name   text := nullif(btrim(name), '');
begin
  if caller_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if trimmed_name is null then
    raise exception 'Profile name is required.';
  end if;

  update public.accounts set name = trimmed_name where id = caller_user_id;

  if not found then
    raise exception 'Account row was not found.';
  end if;
end;
$$;
