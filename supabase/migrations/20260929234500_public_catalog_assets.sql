-- Anonymous catalog access is limited to complete MIT-licensed releases in
-- public projects. This function runs as the caller, so table RLS still applies.
create or replace function public.list_public_catalog_assets()
returns table (
  stable_id text,
  canonical_name text,
  label text,
  category text,
  description text,
  directionality text,
  licence text,
  variant text,
  version text,
  is_current boolean,
  byte_size bigint,
  sha256 text,
  storage_path text,
  tags jsonb,
  aliases jsonb
)
language sql stable security invoker set search_path = '' as $$
  select i.stable_id, i.canonical_name, i.label, i.category,
    i.description, i.directionality, i.licence, v.variant, v.version,
    v.version = current_version.version,
    a.byte_size, a.sha256, a.storage_path,
    case when jsonb_typeof(v.metadata->'tags') = 'array' then v.metadata->'tags' else '[]'::jsonb end,
    coalesce((
      select jsonb_agg(jsonb_build_object('locale', ia.locale, 'value', ia.alias, 'reviewed', true) order by ia.alias)
      from public.icon_aliases ia
      where ia.icon_id = i.id and ia.reviewed
    ), '[]'::jsonb)
  from public.icons i
  join public.projects p on p.id = i.project_id
  join public.icon_versions current_version on current_version.id = i.current_version_id
  join public.icon_versions v on v.icon_id = i.id
  join public.asset_blobs a on a.id = coalesce(v.optimized_asset_id, v.source_asset_id)
  where p.visibility = 'public'
    and i.status = 'published'
    and i.licence = 'MIT'
    and a.project_id = i.project_id
    and a.storage_bucket = 'published-assets'
    and a.sanitization_status = 'passed'
    and a.sha256 = v.content_hash
    and (select count(distinct paired.variant)
         from public.icon_versions paired
         join public.asset_blobs paired_asset
           on paired_asset.id = coalesce(paired.optimized_asset_id, paired.source_asset_id)
         where paired.icon_id = i.id and paired.version = v.version
           and paired.variant in ('regular', 'solid')
           and paired_asset.project_id = i.project_id
           and paired_asset.storage_bucket = 'published-assets'
           and paired_asset.sanitization_status = 'passed'
           and paired_asset.sha256 = paired.content_hash) = 2;
$$;

revoke all on function public.list_public_catalog_assets() from public;
grant execute on function public.list_public_catalog_assets() to anon, authenticated;
