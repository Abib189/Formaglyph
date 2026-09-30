create table public.candidate_variant_assets (
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  variant text not null check (variant in ('regular', 'solid')),
  asset_id uuid not null references public.asset_blobs(id) on delete restrict,
  validation_run_id uuid not null references public.validation_runs(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (candidate_id, variant),
  unique (asset_id)
);

comment on table public.candidate_variant_assets is
  'Immutable Regular and Solid source assets that travel together with a candidate revision.';

insert into public.candidate_variant_assets (candidate_id, variant, asset_id, validation_run_id, created_at)
select id, variant, asset_id, validation_run_id, created_at
from public.candidates
where validation_run_id is not null
on conflict (candidate_id, variant) do nothing;

create index candidate_variant_assets_validation_idx
  on public.candidate_variant_assets (validation_run_id);

create or replace function private.guard_candidate_variant_asset()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_project_id uuid;
  v_created_by uuid;
begin
  select d.project_id, c.created_by
  into v_project_id, v_created_by
  from public.candidates c
  join public.drafts d on d.id = c.draft_id
  where c.id = new.candidate_id;

  if v_project_id is null or v_created_by <> (select auth.uid()) then
    raise exception 'candidate variant must belong to its author' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.asset_blobs a
    where a.id = new.asset_id
      and a.project_id = v_project_id
      and a.storage_bucket = 'source-assets'
      and a.sanitization_status = 'passed'
  ) then
    raise exception 'candidate variant requires a sanitized source asset in the same project' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.validation_runs vr
    where vr.id = new.validation_run_id
      and vr.project_id = v_project_id
      and vr.target_type = 'candidate'
      and vr.target_id = new.candidate_id
      and vr.created_by = v_created_by
  ) then
    raise exception 'candidate variant requires its own validation run in the same project' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger candidate_variant_assets_guard
before insert or update on public.candidate_variant_assets
for each row execute function private.guard_candidate_variant_asset();

revoke all on function private.guard_candidate_variant_asset() from public, anon, authenticated;

alter table public.candidate_variant_assets enable row level security;

create policy candidate_variant_assets_member_read
on public.candidate_variant_assets
for select
to authenticated
using (
  exists (
    select 1
    from public.candidates c
    join public.drafts d on d.id = c.draft_id
    where c.id = candidate_id
      and private.can_read_project(d.project_id)
  )
);

create policy candidate_variant_assets_author_insert
on public.candidate_variant_assets
for insert
to authenticated
with check (
  exists (
    select 1
    from public.candidates c
    join public.drafts d on d.id = c.draft_id
    where c.id = candidate_id
      and c.created_by = (select auth.uid())
      and d.created_by = (select auth.uid())
      and private.has_project_role(d.project_id, array['contributor', 'reviewer', 'admin'])
  )
);

grant select, insert on public.candidate_variant_assets to authenticated;

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
    where c.id = p_candidate_id
      and c.draft_id = p_draft_id
      and c.issue is null
      and (
        select count(*)
        from public.candidate_variant_assets cva
        join public.asset_blobs a on a.id = cva.asset_id
        join public.validation_runs vr on vr.id = cva.validation_run_id
        where cva.candidate_id = c.id
          and cva.variant in ('regular', 'solid')
          and a.project_id = v_draft.project_id
          and a.storage_bucket = 'source-assets'
          and a.sanitization_status = 'passed'
          and vr.project_id = v_draft.project_id
          and vr.target_type = 'candidate'
          and vr.target_id = c.id
          and vr.status = 'passed'
      ) = 2
  ) then
    raise exception 'Regular and Solid candidates with passing validation are required' using errcode = '22023';
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
    jsonb_build_object(
      'candidate_id', p_candidate_id,
      'variants', jsonb_build_array('regular', 'solid')
    )
  );

  return v_proposal;
end;
$$;

revoke all on function private.submit_proposal_impl(uuid, uuid, text) from public, anon;
grant execute on function private.submit_proposal_impl(uuid, uuid, text) to authenticated;
