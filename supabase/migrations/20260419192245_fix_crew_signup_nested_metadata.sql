-- =============================================================================
-- MIGRATION: Fix handle_new_user trigger for nested metadata
-- =============================================================================
-- This migration fixes the trigger to handle Supabase's nested metadata structure
-- where user data is stored under raw_user_meta_data->'metadata' instead of
-- directly in raw_user_meta_data

-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with nested metadata support
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  new_name text;
  new_org_id uuid;
  new_role public.user_role;
  user_meta jsonb;
BEGIN
  -- Log the raw metadata for debugging
  RAISE NOTICE 'Raw user metadata: %', new.raw_user_meta_data;

  -- Check if metadata is nested under 'metadata' key
  IF new.raw_user_meta_data ? 'metadata' THEN
    user_meta := new.raw_user_meta_data -> 'metadata';
    RAISE NOTICE 'Using nested metadata: %', user_meta;
  ELSE
    user_meta := new.raw_user_meta_data;
    RAISE NOTICE 'Using direct metadata: %', user_meta;
  END IF;

  -- Extract display name
  new_name := COALESCE(
    NULLIF(BTRIM(user_meta ->> 'name'), ''),
    NULLIF(BTRIM(user_meta ->> 'full_name'), ''),
    NULLIF(BTRIM(new.raw_user_meta_data ->> 'name'), ''),
    NULLIF(BTRIM(new.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(SPLIT_PART(COALESCE(new.email, ''), '@', 1), ''),
    new.id::text
  );

  -- Extract organization_id
  IF user_meta ->> 'organization_id' IS NOT NULL THEN
    new_org_id := (user_meta ->> 'organization_id')::uuid;
    RAISE NOTICE 'Extracted org_id: %', new_org_id;
  ELSE
    new_org_id := NULL;
    RAISE NOTICE 'No org_id found in metadata';
  END IF;

  -- Extract role
  IF user_meta ->> 'role' IN ('OWNER', 'FOREMAN', 'CREW') THEN
    new_role := (user_meta ->> 'role')::public.user_role;
    RAISE NOTICE 'Extracted role: %', new_role;
  ELSE
    new_role := 'CREW'::public.user_role;
    RAISE NOTICE 'Defaulting to CREW role';
  END IF;

  RAISE NOTICE 'Inserting account: name=%, org_id=%, role=%', new_name, new_org_id, new_role;

  INSERT INTO public.accounts (id, org_id, name, email, role)
  VALUES (new.id, new_org_id, new_name, LOWER(new.email), new_role);

  RETURN new;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
