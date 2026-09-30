create policy validation_issues_author_insert
on public.validation_issues
for insert
to authenticated
with check (
  exists (
    select 1
    from public.validation_runs vr
    where vr.id = validation_run_id
      and vr.created_by = (select auth.uid())
      and private.has_project_role(vr.project_id, array['contributor', 'reviewer', 'admin'])
  )
);

grant insert on public.validation_issues to authenticated;

create or replace function private.guard_candidate_validation_link()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_project_id uuid;
begin
  select d.project_id
  into v_project_id
  from public.drafts d
  where d.id = new.draft_id
    and d.created_by = new.created_by;

  if v_project_id is null then
    raise exception 'candidate draft must exist and belong to its author' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.asset_blobs a
    where a.id = new.asset_id
      and a.project_id = v_project_id
      and a.sanitization_status = 'passed'
  ) then
    raise exception 'candidate requires a sanitized asset in the same project' using errcode = '23514';
  end if;

  if new.validation_run_id is null or not exists (
    select 1
    from public.validation_runs vr
    where vr.id = new.validation_run_id
      and vr.project_id = v_project_id
      and vr.target_type = 'candidate'
      and vr.target_id = new.id
      and vr.created_by = new.created_by
  ) then
    raise exception 'candidate requires its own validation run in the same project' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists candidates_guard_validation_link on public.candidates;
create trigger candidates_guard_validation_link
before insert or update of draft_id, asset_id, validation_run_id, created_by
on public.candidates
for each row execute function private.guard_candidate_validation_link();

revoke all on function private.guard_candidate_validation_link() from public, anon, authenticated;

create or replace function private.submit_proposal_impl(
  p_draft_id uuid,
  p_candidate_id uuid,
  p_target_version text default '1.0.0'
)
returns public.proposals
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_draft public.drafts;
  v_proposal public.proposals;
  v_organization_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_draft
  from public.drafts
  where id = p_draft_id
  for update;

  if not found or v_draft.created_by <> v_user_id then
    raise exception 'draft not found or not owned' using errcode = '42501';
  end if;

  if not private.has_project_role(v_draft.project_id, array['contributor', 'reviewer', 'admin']) then
    raise exception 'contributor permission required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.candidates c
    join public.asset_blobs a on a.id = c.asset_id
    join public.validation_runs vr on vr.id = c.validation_run_id
    where c.id = p_candidate_id
      and c.draft_id = p_draft_id
      and c.issue is null
      and a.project_id = v_draft.project_id
      and a.sanitization_status = 'passed'
      and vr.project_id = v_draft.project_id
      and vr.target_type = 'candidate'
      and vr.target_id = c.id
      and vr.status = 'passed'
  ) then
    raise exception 'sanitized candidate with passing validation required' using errcode = '22023';
  end if;

  select * into v_proposal
  from public.proposals
  where draft_id = p_draft_id
    and status not in ('rejected', 'published')
  for update;

  if found then
    if v_proposal.status <> 'changes_requested' then
      raise exception 'proposal cannot be submitted from %', v_proposal.status using errcode = '22023';
    end if;
    update public.proposals
    set status = 'in_review', candidate_id = p_candidate_id, submitted_at = now(), decided_at = null
    where id = v_proposal.id
    returning * into v_proposal;
  else
    insert into public.proposals (project_id, draft_id, candidate_id, status, target_version, author_id, submitted_at)
    values (v_draft.project_id, p_draft_id, p_candidate_id, 'in_review', p_target_version, v_user_id, now())
    returning * into v_proposal;
  end if;

  update public.drafts
  set selected_candidate_id = p_candidate_id, status = 'in_review', updated_at = now()
  where id = p_draft_id;

  select organization_id into v_organization_id
  from public.projects
  where id = v_draft.project_id;

  insert into public.audit_events (
    organization_id, project_id, actor_id, action, target_type, target_id, source, metadata
  ) values (
    v_organization_id,
    v_draft.project_id,
    v_user_id,
    'proposal.submitted',
    'proposal',
    v_proposal.id,
    'rpc',
    jsonb_build_object('candidate_id', p_candidate_id)
  );

  return v_proposal;
end;
$$;

revoke all on function private.submit_proposal_impl(uuid, uuid, text) from public, anon;
grant execute on function private.submit_proposal_impl(uuid, uuid, text) to authenticated;
