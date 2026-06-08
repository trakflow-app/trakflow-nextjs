-- Private buckets for tool catalog photos and activity evidence photos.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'tool-images',
    'tool-images',
    false,
    3000000,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'tool-evidence',
    'tool-evidence',
    false,
    3000000,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.try_parse_uuid(value text)
returns uuid
language plpgsql
immutable
as $$
begin
  return value::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

drop policy if exists tool_images_select_same_org on storage.objects;
drop policy if exists tool_images_insert_manageable_rows on storage.objects;
drop policy if exists tool_images_update_manageable_rows on storage.objects;
drop policy if exists tool_images_delete_manageable_rows on storage.objects;
drop policy if exists tool_evidence_select_visible_rows on storage.objects;
drop policy if exists tool_evidence_insert_visible_rows on storage.objects;

-- Path format: tools/{toolId}/main.webp
create policy tool_images_select_same_org
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tool-images'
    and (storage.foldername(name))[1] = 'tools'
    and exists (
      select 1
      from public.tools
      where tools.id = public.try_parse_uuid((storage.foldername(name))[2])
        and tools.org_id = public.get_my_org_id()
    )
  );

create policy tool_images_insert_manageable_rows
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tool-images'
    and (storage.foldername(name))[1] = 'tools'
    and exists (
      select 1
      from public.tools
      where tools.id = public.try_parse_uuid((storage.foldername(name))[2])
        and tools.org_id = public.get_my_org_id()
        and public.can_manage_ops()
    )
  );

create policy tool_images_update_manageable_rows
  on storage.objects for update to authenticated
  using (
    bucket_id = 'tool-images'
    and (storage.foldername(name))[1] = 'tools'
    and exists (
      select 1
      from public.tools
      where tools.id = public.try_parse_uuid((storage.foldername(name))[2])
        and tools.org_id = public.get_my_org_id()
        and public.can_manage_ops()
    )
  )
  with check (
    bucket_id = 'tool-images'
    and (storage.foldername(name))[1] = 'tools'
    and exists (
      select 1
      from public.tools
      where tools.id = public.try_parse_uuid((storage.foldername(name))[2])
        and tools.org_id = public.get_my_org_id()
        and public.can_manage_ops()
    )
  );

create policy tool_images_delete_manageable_rows
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'tool-images'
    and (storage.foldername(name))[1] = 'tools'
    and exists (
      select 1
      from public.tools
      where tools.id = public.try_parse_uuid((storage.foldername(name))[2])
        and tools.org_id = public.get_my_org_id()
        and public.can_manage_ops()
    )
  );

-- Path format: tools/{toolId}/transactions/{transactionId}/{photoType}-{timestamp}.webp
create policy tool_evidence_select_visible_rows
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tool-evidence'
    and (storage.foldername(name))[1] = 'tools'
    and (storage.foldername(name))[3] = 'transactions'
    and exists (
      select 1
      from public.tool_management
      where tool_management.tool_id = public.try_parse_uuid((storage.foldername(name))[2])
        and tool_management.id = public.try_parse_uuid((storage.foldername(name))[4])
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
    and (storage.foldername(name))[1] = 'tools'
    and (storage.foldername(name))[3] = 'transactions'
    and exists (
      select 1
      from public.tool_management
      where tool_management.tool_id = public.try_parse_uuid((storage.foldername(name))[2])
        and tool_management.id = public.try_parse_uuid((storage.foldername(name))[4])
        and tool_management.org_id = public.get_my_org_id()
        and (
          tool_management.user_id = auth.uid()
          or public.can_manage_ops()
        )
    )
  );
