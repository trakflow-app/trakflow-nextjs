-- Scope opaque catalog image reads to tool rows visible in the caller's org.
drop policy if exists tool_images_select_same_org on storage.objects;

create policy tool_images_select_same_org
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tool-images'
    and (storage.foldername(storage.objects.name))[1] = 'catalog'
    and exists (
      select 1
      from public.tools
      where tools.image_path = storage.objects.name
        and tools.org_id = public.get_my_org_id()
    )
  );
