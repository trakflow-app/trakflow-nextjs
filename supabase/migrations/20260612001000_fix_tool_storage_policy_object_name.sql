-- Recreate tool storage policies with storage object names qualified.
-- Unqualified `name` inside subqueries can bind to public.tools.name instead
-- of storage.objects.name, causing valid uploads to fail RLS checks.
drop policy if exists tool_images_select_same_org on storage.objects;
drop policy if exists tool_images_insert_manageable_rows on storage.objects;
drop policy if exists tool_images_update_manageable_rows on storage.objects;
drop policy if exists tool_images_delete_manageable_rows on storage.objects;
drop policy if exists tool_evidence_select_visible_rows on storage.objects;
drop policy if exists tool_evidence_insert_visible_rows on storage.objects;

create policy tool_images_select_same_org
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tool-images'
    and (storage.foldername(storage.objects.name))[1] = 'tools'
    and exists (
      select 1
      from public.tools
      where tools.id = public.try_parse_uuid((storage.foldername(storage.objects.name))[2])
        and tools.org_id = public.get_my_org_id()
    )
  );

create policy tool_images_insert_manageable_rows
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tool-images'
    and (storage.foldername(storage.objects.name))[1] = 'tools'
    and exists (
      select 1
      from public.tools
      where tools.id = public.try_parse_uuid((storage.foldername(storage.objects.name))[2])
        and tools.org_id = public.get_my_org_id()
        and public.can_manage_ops()
    )
  );

create policy tool_images_update_manageable_rows
  on storage.objects for update to authenticated
  using (
    bucket_id = 'tool-images'
    and (storage.foldername(storage.objects.name))[1] = 'tools'
    and exists (
      select 1
      from public.tools
      where tools.id = public.try_parse_uuid((storage.foldername(storage.objects.name))[2])
        and tools.org_id = public.get_my_org_id()
        and public.can_manage_ops()
    )
  )
  with check (
    bucket_id = 'tool-images'
    and (storage.foldername(storage.objects.name))[1] = 'tools'
    and exists (
      select 1
      from public.tools
      where tools.id = public.try_parse_uuid((storage.foldername(storage.objects.name))[2])
        and tools.org_id = public.get_my_org_id()
        and public.can_manage_ops()
    )
  );

create policy tool_images_delete_manageable_rows
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'tool-images'
    and (storage.foldername(storage.objects.name))[1] = 'tools'
    and exists (
      select 1
      from public.tools
      where tools.id = public.try_parse_uuid((storage.foldername(storage.objects.name))[2])
        and tools.org_id = public.get_my_org_id()
        and public.can_manage_ops()
    )
  );

create policy tool_evidence_select_visible_rows
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tool-evidence'
    and (storage.foldername(storage.objects.name))[1] = 'tools'
    and (storage.foldername(storage.objects.name))[3] = 'transactions'
    and exists (
      select 1
      from public.tool_management
      where tool_management.tool_id = public.try_parse_uuid((storage.foldername(storage.objects.name))[2])
        and tool_management.id = public.try_parse_uuid((storage.foldername(storage.objects.name))[4])
        and tool_management.org_id = public.get_my_org_id()
        and (
          tool_management.user_id = auth.uid()
          or public.can_manage_ops()
        )
    )
  );

create policy tool_evidence_insert_visible_rows
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tool-evidence'
    and (storage.foldername(storage.objects.name))[1] = 'tools'
    and (storage.foldername(storage.objects.name))[3] = 'transactions'
    and exists (
      select 1
      from public.tool_management
      where tool_management.tool_id = public.try_parse_uuid((storage.foldername(storage.objects.name))[2])
        and tool_management.id = public.try_parse_uuid((storage.foldername(storage.objects.name))[4])
        and tool_management.org_id = public.get_my_org_id()
        and (
          tool_management.user_id = auth.uid()
          or public.can_manage_ops()
        )
    )
  );
