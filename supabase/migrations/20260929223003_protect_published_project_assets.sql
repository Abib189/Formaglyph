-- A public Storage bucket bypasses RLS for downloads, including assets from
-- private projects. Keep the immutable paths but require authenticated Storage
-- downloads, with a narrow anonymous exception for published public pairs.
update storage.buckets set public = false where id = 'published-assets';

create policy published_assets_member_download on storage.objects
for select to authenticated
using (
  bucket_id = 'published-assets'
  and storage.allow_any_operation(array['object.get_authenticated', 'object.get_authenticated_info'])
  and private.can_read_project(private.project_id_from_storage_name(name))
);

create policy published_assets_public_download on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'published-assets'
  and storage.allow_any_operation(array['object.get_authenticated', 'object.get_authenticated_info'])
  and exists (
    select 1 from public.asset_blobs asset
    join public.icon_versions version
      on version.source_asset_id = asset.id or version.optimized_asset_id = asset.id
    join public.icons icon on icon.id = version.icon_id
    join public.projects project on project.id = icon.project_id
    where asset.storage_bucket = 'published-assets'
      and asset.storage_path = storage.objects.name
      and asset.sha256 = version.content_hash
      and icon.status = 'published'
      and project.visibility = 'public'
      and exists (
        select 1 from public.icon_versions sibling
        where sibling.icon_id = version.icon_id
          and sibling.version = version.version
          and sibling.variant <> version.variant
      )
  )
);
