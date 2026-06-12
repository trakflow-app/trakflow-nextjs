-- Recreate catalog image policies for opaque storage paths.
-- New catalog images are stored as catalog/{randomImageId}.webp so signed URLs
-- do not expose tool ids. Tool ownership is enforced before signed URLs are
-- created from tools.image_path.
drop policy if exists tool_images_select_same_org on storage.objects;
drop policy if exists tool_images_insert_manageable_rows on storage.objects;
drop policy if exists tool_images_update_manageable_rows on storage.objects;
drop policy if exists tool_images_delete_manageable_rows on storage.objects;

create policy tool_images_select_same_org
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tool-images'
    and (storage.foldername(storage.objects.name))[1] = 'catalog'
    and public.get_my_org_id() is not null
  );

create policy tool_images_insert_manageable_rows
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tool-images'
    and (storage.foldername(storage.objects.name))[1] = 'catalog'
    and public.can_manage_ops()
  );

create policy tool_images_update_manageable_rows
  on storage.objects for update to authenticated
  using (
    bucket_id = 'tool-images'
    and (storage.foldername(storage.objects.name))[1] = 'catalog'
    and public.can_manage_ops()
  )
  with check (
    bucket_id = 'tool-images'
    and (storage.foldername(storage.objects.name))[1] = 'catalog'
    and public.can_manage_ops()
  );

create policy tool_images_delete_manageable_rows
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'tool-images'
    and (storage.foldername(storage.objects.name))[1] = 'catalog'
    and public.can_manage_ops()
  );
