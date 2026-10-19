-- Approved legacy candidates with only one weight must return to the author.
-- A release is always an immutable Regular/Solid pair at one available version.

create or replace function private.guard_proposal_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  allowed boolean := false;
begin
  if old.status = new.status then return new; end if;
  allowed := case old.status
    when 'draft' then new.status = 'in_review'
    when 'in_review' then new.status in ('changes_requested', 'approved', 'rejected')
    when 'changes_requested' then new.status in ('in_review', 'rejected')
    when 'approved' then new.status in ('changes_requested', 'published')
    else false
  end;
  if not allowed then
    raise exception 'invalid proposal transition from % to %', old.status, new.status using errcode = '22023';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.reopen_approved_proposal_impl(p_proposal_id uuid)
returns public.proposals
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_proposal public.proposals;
  v_draft public.drafts;
  v_organization_id uuid;
  v_latest_version text;
  v_next_version text;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into v_proposal from public.proposals where id = p_proposal_id for update;
  if not found or v_proposal.status <> 'approved' then raise exception 'approved proposal required' using errcode = '22023'; end if;
  if not private.has_project_role(v_proposal.project_id, array['admin']) then
    raise exception 'admin permission required' using errcode = '42501';
  end if;
  if (select count(*) from public.candidate_variant_assets where candidate_id = v_proposal.candidate_id) = 2 then
    raise exception 'approved proposal already has both variants' using errcode = '22023';
  end if;
  select * into v_draft from public.drafts where id = v_proposal.draft_id;
  select organization_id into v_organization_id from public.projects where id = v_proposal.project_id;
  v_next_version := v_proposal.target_version;
  if v_draft.icon_id is not null then
    select version into v_latest_version from public.icon_versions
    where icon_id = v_draft.icon_id
    order by string_to_array(version, '.')::integer[] desc limit 1;
    if v_latest_version is not null and string_to_array(v_next_version, '.')::integer[] <= string_to_array(v_latest_version, '.')::integer[] then
      v_next_version := split_part(v_latest_version, '.', 1) || '.' || split_part(v_latest_version, '.', 2) || '.' || (split_part(v_latest_version, '.', 3)::integer + 1);
    end if;
  end if;
  update public.proposals
  set status = 'changes_requested', decided_at = now(), target_version = v_next_version
  where id = v_proposal.id returning * into v_proposal;
  update public.drafts set status = 'changes_requested', updated_at = now() where id = v_draft.id;
  insert into public.audit_events (organization_id, project_id, actor_id, action, target_type, target_id, source, metadata)
  values (v_organization_id, v_proposal.project_id, v_user_id, 'proposal.pair_requested', 'proposal', v_proposal.id, 'rpc',
    jsonb_build_object('reason', 'Regular and Solid are required for publication', 'target_version', v_next_version));
  return v_proposal;
end;
$$;

create or replace function public.reopen_approved_proposal(p_proposal_id uuid)
returns public.proposals language sql security invoker set search_path = '' as $$
  select private.reopen_approved_proposal_impl(p_proposal_id);
$$;

revoke all on function private.reopen_approved_proposal_impl(uuid) from public, anon, authenticated;
grant execute on function private.reopen_approved_proposal_impl(uuid) to authenticated;
revoke all on function public.reopen_approved_proposal(uuid) from public, anon, authenticated;
grant execute on function public.reopen_approved_proposal(uuid) to authenticated;

-- Reusing a weight's geometry in a later version is legitimate. The version
-- and variant, not the content hash, identify a unique immutable release.
alter table public.icon_versions drop constraint icon_versions_icon_id_content_hash_variant_key;

create or replace function private.publish_proposal_impl(p_proposal_id uuid)
returns public.icon_versions
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_proposal public.proposals;
  v_draft public.drafts;
  v_candidate public.candidates;
  v_variant record;
  v_source public.asset_blobs;
  v_published public.asset_blobs;
  v_icon_id uuid;
  v_regular_version public.icon_versions;
  v_organization_id uuid;
  v_latest_version text;
  v_release_version text;
  v_published_path text;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into v_proposal from public.proposals where id = p_proposal_id for update;
  if not found or v_proposal.status <> 'approved' then raise exception 'approved proposal required' using errcode = '22023'; end if;
  if not private.has_project_role(v_proposal.project_id, array['admin']) then
    raise exception 'admin permission required' using errcode = '42501';
  end if;
  if (select count(*) from public.candidate_variant_assets where candidate_id = v_proposal.candidate_id) <> 2 then
    raise exception 'Regular and Solid are required before publication' using errcode = '22023';
  end if;
  select * into v_draft from public.drafts where id = v_proposal.draft_id;
  select * into v_candidate from public.candidates where id = v_proposal.candidate_id and draft_id = v_draft.id and issue is null;
  if not found then raise exception 'validated candidate required' using errcode = '22023'; end if;
  select organization_id into v_organization_id from public.projects where id = v_proposal.project_id;
  v_icon_id := v_draft.icon_id;
  v_release_version := v_proposal.target_version;
  if v_icon_id is not null then
    select version into v_latest_version from public.icon_versions
    where icon_id = v_icon_id
    order by string_to_array(version, '.')::integer[] desc limit 1;
    if v_latest_version is not null and string_to_array(v_release_version, '.')::integer[] <= string_to_array(v_latest_version, '.')::integer[] then
      v_release_version := split_part(v_latest_version, '.', 1) || '.' || split_part(v_latest_version, '.', 2) || '.' || (split_part(v_latest_version, '.', 3)::integer + 1);
    end if;
  end if;

  -- Check every source, validation, and published copy before changing any
  -- release rows. The ensuing writes are one database transaction.
  for v_variant in select * from public.candidate_variant_assets where candidate_id = v_candidate.id loop
    select * into v_source from public.asset_blobs where id = v_variant.asset_id;
    if not found or v_source.project_id <> v_proposal.project_id or v_source.storage_bucket <> 'source-assets' or v_source.sanitization_status <> 'passed' then
      raise exception 'sanitized % source asset required', v_variant.variant using errcode = '22023';
    end if;
    if not exists (select 1 from public.validation_runs vr where vr.id = v_variant.validation_run_id and vr.project_id = v_proposal.project_id and vr.target_type = 'candidate' and vr.target_id = v_candidate.id and vr.status = 'passed') then
      raise exception 'passing % validation required', v_variant.variant using errcode = '22023';
    end if;
    v_published_path := v_organization_id::text || '/' || v_proposal.project_id::text || '/' || v_draft.id::text || '/' || v_proposal.id::text || '/' || v_candidate.id::text || '/' || v_variant.variant || '.svg';
    select * into v_published from public.asset_blobs where storage_bucket = 'published-assets' and storage_path = v_published_path and project_id = v_proposal.project_id and sha256 = v_source.sha256 and sanitization_status = 'passed';
    if not found then raise exception 'immutable published % asset required', v_variant.variant using errcode = '22023'; end if;
  end loop;

  if v_icon_id is null then
    insert into public.icons (stable_id, project_id, canonical_name, label, description, status, created_by)
    values ('ico_' || replace(v_draft.name, '-', '_') || '_' || substr(replace(v_draft.id::text, '-', ''), 1, 8), v_draft.project_id, v_draft.name, initcap(replace(v_draft.name, '-', ' ')), v_draft.description, 'approved', v_draft.created_by)
    returning id into v_icon_id;
    update public.drafts set icon_id = v_icon_id where id = v_draft.id;
  end if;

  for v_variant in select * from public.candidate_variant_assets where candidate_id = v_candidate.id order by variant loop
    select * into v_source from public.asset_blobs where id = v_variant.asset_id;
    v_published_path := v_organization_id::text || '/' || v_proposal.project_id::text || '/' || v_draft.id::text || '/' || v_proposal.id::text || '/' || v_candidate.id::text || '/' || v_variant.variant || '.svg';
    select * into v_published from public.asset_blobs where storage_bucket = 'published-assets' and storage_path = v_published_path;
    insert into public.icon_versions (icon_id, version, variant, source_asset_id, optimized_asset_id, validation_run_id, content_hash, metadata, provenance, created_by)
    values (v_icon_id, v_release_version, v_variant.variant, v_source.id, v_published.id, v_variant.validation_run_id, v_source.sha256,
      jsonb_build_object('canonical_name', v_draft.name), jsonb_build_object('kind', 'human-reviewed', 'proposal_id', v_proposal.public_id), v_user_id)
    returning * into v_regular_version;
    if v_variant.variant = 'regular' then
      update public.icons set current_version_id = v_regular_version.id where id = v_icon_id;
    end if;
  end loop;
  update public.icons set status = 'published', updated_at = now() where id = v_icon_id;
  update public.proposals set status = 'published', target_version = v_release_version, published_at = now() where id = p_proposal_id;
  update public.drafts set status = 'published', updated_at = now() where id = v_draft.id;
  select * into v_regular_version from public.icon_versions where icon_id = v_icon_id and version = v_release_version and variant = 'regular';
  insert into public.audit_events (organization_id, project_id, actor_id, action, target_type, target_id, source, metadata)
  values (v_organization_id, v_proposal.project_id, v_user_id, 'icon.published', 'icon_version', v_regular_version.id, 'rpc',
    jsonb_build_object('proposal_id', v_proposal.id, 'version', v_release_version, 'variants', jsonb_build_array('regular', 'solid')));
  return v_regular_version;
end;
$$;
