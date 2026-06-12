-- Supabase Storage uploads use INSERT ... RETURNING *.
-- During catalog image upload, tools.image_path is updated after the object is
-- created, so the uploading owner must be able to select the new object row.
drop policy if exists tool_images_select_same_org on storage.objects;

create policy tool_images_select_same_org
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tool-images'
    and (storage.foldername(storage.objects.name))[1] = 'catalog'
    and (
      owner_id = (auth.uid())::text
      or exists (
        select 1
        from public.tools
        where tools.image_path = storage.objects.name
          and tools.org_id = public.get_my_org_id()
      )
    )
  );
