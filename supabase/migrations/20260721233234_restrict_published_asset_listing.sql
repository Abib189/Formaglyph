-- Public buckets serve known immutable object URLs without a SELECT policy.
-- Removing the policy prevents anonymous directory-style object listing.
drop policy if exists published_assets_public_read on storage.objects;

-- Cache auth.uid() once per statement in policies that can scan many rows.
drop policy if exists memberships_organization_read on public.memberships;
create policy memberships_organization_read on public.memberships for select to authenticated
  using (user_id = (select auth.uid()) or private.is_organization_member(organization_id));

drop policy if exists drafts_contributor_insert on public.drafts;
create policy drafts_contributor_insert on public.drafts for insert to authenticated
  with check (created_by = (select auth.uid()) and private.has_project_role(project_id, array['contributor', 'reviewer', 'admin']));

drop policy if exists drafts_author_update on public.drafts;
create policy drafts_author_update on public.drafts for update to authenticated
  using (created_by = (select auth.uid()) and private.has_project_role(project_id, array['contributor', 'reviewer', 'admin']))
  with check (created_by = (select auth.uid()) and private.has_project_role(project_id, array['contributor', 'reviewer', 'admin']));

drop policy if exists candidates_author_insert on public.candidates;
create policy candidates_author_insert on public.candidates for insert to authenticated
  with check (created_by = (select auth.uid()) and exists (
    select 1 from public.drafts d
    where d.id = draft_id
      and d.created_by = (select auth.uid())
      and private.has_project_role(d.project_id, array['contributor', 'reviewer', 'admin'])
  ));

drop policy if exists validation_runs_contributor_insert on public.validation_runs;
create policy validation_runs_contributor_insert on public.validation_runs for insert to authenticated
  with check (created_by = (select auth.uid()) and private.has_project_role(project_id, array['contributor', 'reviewer', 'admin']));

drop policy if exists asset_blobs_contributor_insert on public.asset_blobs;
create policy asset_blobs_contributor_insert on public.asset_blobs for insert to authenticated
  with check (
    created_by = (select auth.uid()) and project_id is not null and (
      (storage_bucket = 'source-assets' and private.has_project_role(project_id, array['contributor', 'reviewer', 'admin']))
      or (storage_bucket = 'published-assets' and private.has_project_role(project_id, array['admin']))
    )
  );

-- Keep authenticated catalog and member reads in one policy, while anonymous
-- clients receive only published assets referenced by published public icons.
drop policy if exists asset_blobs_member_read on public.asset_blobs;
drop policy if exists asset_blobs_public_catalog_read on public.asset_blobs;
create policy asset_blobs_authenticated_read on public.asset_blobs for select to authenticated
  using (
    (project_id is not null and private.can_read_project(project_id))
    or (
      storage_bucket = 'published-assets' and exists (
        select 1 from public.icon_versions iv
        join public.icons i on i.id = iv.icon_id
        join public.projects p on p.id = i.project_id
        where (iv.source_asset_id = asset_blobs.id or iv.optimized_asset_id = asset_blobs.id)
          and i.status = 'published' and p.visibility = 'public'
      )
    )
  );
create policy asset_blobs_public_catalog_read on public.asset_blobs for select to anon
  using (
    storage_bucket = 'published-assets' and exists (
      select 1 from public.icon_versions iv
      join public.icons i on i.id = iv.icon_id
      join public.projects p on p.id = i.project_id
      where (iv.source_asset_id = asset_blobs.id or iv.optimized_asset_id = asset_blobs.id)
        and i.status = 'published' and p.visibility = 'public'
    )
  );
