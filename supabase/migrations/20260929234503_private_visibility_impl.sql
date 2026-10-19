-- Keep the privileged operation out of the exposed public API schema. The
-- public function remains the same authenticated, security-invoker RPC.
create or replace function private.set_project_visibility_impl(p_project_id uuid, p_visibility text)
returns public.projects
language plpgsql security definer set search_path = '' as $$
declare
  v_project public.projects;
  v_previous text;
begin
  if auth.uid() is null or not private.has_project_role(p_project_id, array['admin']) then
    raise exception 'admin permission required' using errcode = '42501';
  end if;
  if p_visibility not in ('private', 'public') or p_visibility is null then
    raise exception 'project visibility must be private or public' using errcode = '22023';
  end if;

  select * into v_project from public.projects where id = p_project_id for update;
  if not found then
    raise exception 'project not found' using errcode = '22023';
  end if;
  if v_project.visibility = p_visibility then return v_project; end if;

  if p_visibility = 'public' and exists (
    select 1 from public.icons i
    where i.project_id = p_project_id and i.status = 'published'
      and (i.licence <> 'MIT' or not exists (
        select 1 from public.icon_versions current_version
        where current_version.id = i.current_version_id
          and (select count(distinct v.variant)
               from public.icon_versions v
               join public.asset_blobs a on a.id = coalesce(v.optimized_asset_id, v.source_asset_id)
               where v.icon_id = i.id and v.version = current_version.version
                 and a.project_id = i.project_id
                 and a.storage_bucket = 'published-assets'
                 and a.sanitization_status = 'passed'
                 and a.sha256 = v.content_hash) = 2
      ))
  ) then
    raise exception 'all published icons need a validated MIT-licensed Regular and Solid pair before this project can be public'
      using errcode = '22023';
  end if;

  v_previous := v_project.visibility;
  update public.projects set visibility = p_visibility where id = p_project_id returning * into v_project;
  insert into public.audit_events (organization_id, project_id, actor_id, action, target_type, target_id, source, metadata)
  values (v_project.organization_id, v_project.id, auth.uid(), 'project.visibility_changed', 'project', v_project.id, 'rpc',
    jsonb_build_object('previous', v_previous, 'next', p_visibility));
  return v_project;
end;
$$;

revoke all on function private.set_project_visibility_impl(uuid, text) from public, anon, authenticated;
grant execute on function private.set_project_visibility_impl(uuid, text) to authenticated;

create or replace function public.set_project_visibility(p_project_id uuid, p_visibility text)
returns public.projects
language sql security invoker set search_path = '' as $$
  select private.set_project_visibility_impl(p_project_id, p_visibility);
$$;

revoke all on function public.set_project_visibility(uuid, text) from public, anon, authenticated;
grant execute on function public.set_project_visibility(uuid, text) to authenticated;
