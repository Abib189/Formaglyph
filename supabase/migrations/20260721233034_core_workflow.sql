create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.organizations (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('contributor', 'reviewer', 'admin')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.projects (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  default_style_profile_id uuid,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.style_profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

alter table public.projects
  add constraint projects_default_style_profile_id_fkey
  foreign key (default_style_profile_id) references public.style_profiles(id) on delete set null;

create table public.style_profile_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  style_profile_id uuid not null references public.style_profiles(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null default 'draft' check (status in ('draft', 'published')),
  rules jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (style_profile_id, version)
);

create table public.asset_blobs (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  storage_bucket text not null check (storage_bucket in ('source-assets', 'published-assets')),
  storage_path text not null unique,
  mime_type text not null default 'image/svg+xml' check (mime_type = 'image/svg+xml'),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 1048576),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  sanitization_status text not null default 'pending' check (sanitization_status in ('pending', 'passed', 'failed')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.validation_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  target_type text not null check (target_type in ('candidate', 'icon_version', 'style_profile')),
  target_id uuid not null,
  validator_version text not null,
  status text not null check (status in ('pending', 'passed', 'failed')),
  summary jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.validation_issues (
  id uuid primary key default extensions.gen_random_uuid(),
  validation_run_id uuid not null references public.validation_runs(id) on delete cascade,
  rule_id text not null,
  severity text not null check (severity in ('blocker', 'error', 'warning', 'info')),
  location text,
  message text not null,
  remediation text,
  created_at timestamptz not null default now()
);

create table public.icons (
  id uuid primary key default extensions.gen_random_uuid(),
  stable_id text not null unique check (stable_id ~ '^ico_[a-z0-9_]+$'),
  project_id uuid not null references public.projects(id) on delete cascade,
  canonical_name text not null check (canonical_name ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  label text not null,
  description text not null default '',
  category text not null default 'Uncategorized',
  directionality text not null default 'neutral' check (directionality in ('neutral', 'ltr', 'rtl', 'mirrored')),
  licence text not null default 'MIT',
  status text not null default 'draft' check (status in ('draft', 'in_review', 'changes_requested', 'approved', 'published', 'archived', 'deprecated')),
  current_version_id uuid,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, canonical_name)
);

create table public.icon_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  icon_id uuid not null references public.icons(id) on delete restrict,
  version text not null check (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  variant text not null check (variant in ('regular', 'solid')),
  source_asset_id uuid not null references public.asset_blobs(id) on delete restrict,
  optimized_asset_id uuid references public.asset_blobs(id) on delete restrict,
  validation_run_id uuid references public.validation_runs(id) on delete restrict,
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  metadata jsonb not null default '{}'::jsonb,
  provenance jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (icon_id, version, variant),
  unique (icon_id, content_hash, variant)
);

alter table public.icons
  add constraint icons_current_version_id_fkey
  foreign key (current_version_id) references public.icon_versions(id) on delete restrict;

create table public.icon_aliases (
  id uuid primary key default extensions.gen_random_uuid(),
  icon_id uuid not null references public.icons(id) on delete cascade,
  alias text not null,
  locale text not null default 'en',
  kind text not null default 'synonym' check (kind in ('canonical', 'synonym', 'deprecated')),
  reviewed boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (icon_id, locale, alias)
);

create table public.drafts (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  icon_id uuid references public.icons(id) on delete set null,
  name text not null check (name ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  keywords text[] not null default '{}',
  selected_candidate_id uuid,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'changes_requested', 'approved', 'rejected', 'published', 'archived')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidates (
  id uuid primary key default extensions.gen_random_uuid(),
  draft_id uuid not null references public.drafts(id) on delete cascade,
  name text not null,
  description text not null default '',
  variant text not null default 'regular' check (variant in ('regular', 'solid')),
  asset_id uuid not null references public.asset_blobs(id) on delete restrict,
  validation_run_id uuid references public.validation_runs(id) on delete restrict,
  issue text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.drafts
  add constraint drafts_selected_candidate_id_fkey
  foreign key (selected_candidate_id) references public.candidates(id) on delete set null;

create table public.proposals (
  id uuid primary key default extensions.gen_random_uuid(),
  public_id text not null unique default ('PRP-' || upper(substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 8))),
  project_id uuid not null references public.projects(id) on delete cascade,
  draft_id uuid not null references public.drafts(id) on delete restrict,
  candidate_id uuid not null references public.candidates(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'changes_requested', 'approved', 'rejected', 'published')),
  target_version text not null default '1.0.0' check (target_version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  author_id uuid not null references auth.users(id),
  submitted_at timestamptz,
  decided_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index proposals_one_active_per_draft
  on public.proposals (draft_id)
  where status not in ('rejected', 'published');

create table public.reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  decision text not null check (decision in ('approve', 'request_changes', 'reject', 'comment')),
  title text not null default 'Reviewer note',
  body text not null default '',
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id uuid references public.projects(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  request_id uuid not null default extensions.gen_random_uuid(),
  source text not null default 'web' check (source in ('web', 'rpc', 'seed', 'system')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index memberships_user_idx on public.memberships (user_id, organization_id);
create index projects_organization_idx on public.projects (organization_id);
create index style_profiles_project_idx on public.style_profiles (project_id);
create index icons_project_status_idx on public.icons (project_id, status);
create index icon_versions_icon_idx on public.icon_versions (icon_id, created_at desc);
create index drafts_project_creator_idx on public.drafts (project_id, created_by);
create index candidates_draft_idx on public.candidates (draft_id);
create index proposals_project_status_idx on public.proposals (project_id, status);
create index reviews_proposal_idx on public.reviews (proposal_id);
create index validation_runs_project_idx on public.validation_runs (project_id, created_at desc);
create index asset_blobs_project_idx on public.asset_blobs (project_id);
create index audit_events_project_idx on public.audit_events (project_id, created_at desc);

create or replace function private.has_project_role(p_project_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    join public.memberships m on m.organization_id = p.organization_id
    where p.id = p_project_id
      and m.user_id = auth.uid()
      and m.role = any (p_roles)
  );
$$;

create or replace function private.can_read_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and (
        p.visibility = 'public'
        or exists (
          select 1 from public.memberships m
          where m.organization_id = p.organization_id and m.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function private.is_organization_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = p_organization_id and m.user_id = auth.uid()
  );
$$;

create or replace function private.project_id_from_storage_name(p_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return split_part(p_name, '/', 2)::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.has_project_role(uuid, text[]) to anon, authenticated;
grant execute on function private.can_read_project(uuid) to anon, authenticated;
grant execute on function private.is_organization_member(uuid) to authenticated;
grant execute on function private.project_id_from_storage_name(text) to authenticated;

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
    when 'approved' then new.status = 'published'
    else false
  end;
  if not allowed then
    raise exception 'invalid proposal transition from % to %', old.status, new.status using errcode = '22023';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger proposals_transition_guard
before update of status on public.proposals
for each row execute function private.guard_proposal_transition();

create or replace function private.prevent_audit_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'audit events are immutable' using errcode = '55000';
end;
$$;

create trigger audit_events_immutable
before update or delete on public.audit_events
for each row execute function private.prevent_audit_mutation();

create or replace function private.guard_published_asset()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.storage_bucket = 'published-assets' then
    if new.sanitization_status <> 'passed' then
      raise exception 'published assets must pass sanitization' using errcode = '23514';
    end if;
    if new.project_id is null or split_part(new.storage_path, '/', 2) <> new.project_id::text then
      raise exception 'published asset path must include its immutable project id' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger asset_blobs_published_guard
before insert or update on public.asset_blobs
for each row execute function private.guard_published_asset();

revoke all on function private.guard_proposal_transition() from public, anon, authenticated;
revoke all on function private.prevent_audit_mutation() from public, anon, authenticated;
revoke all on function private.guard_published_asset() from public, anon, authenticated;

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.projects enable row level security;
alter table public.style_profiles enable row level security;
alter table public.style_profile_versions enable row level security;
alter table public.icons enable row level security;
alter table public.icon_versions enable row level security;
alter table public.icon_aliases enable row level security;
alter table public.drafts enable row level security;
alter table public.candidates enable row level security;
alter table public.proposals enable row level security;
alter table public.reviews enable row level security;
alter table public.validation_runs enable row level security;
alter table public.validation_issues enable row level security;
alter table public.asset_blobs enable row level security;
alter table public.audit_events enable row level security;

create policy organizations_member_read on public.organizations for select to authenticated
  using (private.is_organization_member(id));
create policy memberships_organization_read on public.memberships for select to authenticated
  using (user_id = auth.uid() or private.is_organization_member(organization_id));
create policy projects_catalog_or_member_read on public.projects for select to anon, authenticated
  using (visibility = 'public' or private.can_read_project(id));
create policy style_profiles_member_read on public.style_profiles for select to authenticated
  using (private.can_read_project(project_id));
create policy style_profile_versions_member_read on public.style_profile_versions for select to authenticated
  using (exists (select 1 from public.style_profiles sp where sp.id = style_profile_id and private.can_read_project(sp.project_id)));

create policy icons_catalog_or_member_read on public.icons for select to anon, authenticated
  using ((status = 'published' and exists (select 1 from public.projects p where p.id = project_id and p.visibility = 'public')) or private.can_read_project(project_id));
create policy icon_versions_catalog_or_member_read on public.icon_versions for select to anon, authenticated
  using (exists (select 1 from public.icons i where i.id = icon_id and ((i.status = 'published' and exists (select 1 from public.projects p where p.id = i.project_id and p.visibility = 'public')) or private.can_read_project(i.project_id))));
create policy icon_aliases_catalog_or_member_read on public.icon_aliases for select to anon, authenticated
  using (exists (select 1 from public.icons i where i.id = icon_id and ((i.status = 'published' and exists (select 1 from public.projects p where p.id = i.project_id and p.visibility = 'public')) or private.can_read_project(i.project_id))));

create policy drafts_member_read on public.drafts for select to authenticated using (private.can_read_project(project_id));
create policy drafts_contributor_insert on public.drafts for insert to authenticated
  with check (created_by = auth.uid() and private.has_project_role(project_id, array['contributor', 'reviewer', 'admin']));
create policy drafts_author_update on public.drafts for update to authenticated
  using (created_by = auth.uid() and private.has_project_role(project_id, array['contributor', 'reviewer', 'admin']))
  with check (created_by = auth.uid() and private.has_project_role(project_id, array['contributor', 'reviewer', 'admin']));

create policy candidates_member_read on public.candidates for select to authenticated
  using (exists (select 1 from public.drafts d where d.id = draft_id and private.can_read_project(d.project_id)));
create policy candidates_author_insert on public.candidates for insert to authenticated
  with check (created_by = auth.uid() and exists (
    select 1 from public.drafts d where d.id = draft_id and d.created_by = auth.uid()
      and private.has_project_role(d.project_id, array['contributor', 'reviewer', 'admin'])
  ));
create policy candidates_admin_update on public.candidates for update to authenticated
  using (exists (select 1 from public.drafts d where d.id = draft_id and private.has_project_role(d.project_id, array['admin'])))
  with check (exists (select 1 from public.drafts d where d.id = draft_id and private.has_project_role(d.project_id, array['admin'])));

create policy proposals_member_read on public.proposals for select to authenticated using (private.can_read_project(project_id));
create policy reviews_member_read on public.reviews for select to authenticated
  using (exists (select 1 from public.proposals p where p.id = proposal_id and private.can_read_project(p.project_id)));
create policy validation_runs_member_read on public.validation_runs for select to authenticated using (private.can_read_project(project_id));
create policy validation_runs_contributor_insert on public.validation_runs for insert to authenticated
  with check (created_by = auth.uid() and private.has_project_role(project_id, array['contributor', 'reviewer', 'admin']));
create policy validation_issues_member_read on public.validation_issues for select to authenticated
  using (exists (select 1 from public.validation_runs vr where vr.id = validation_run_id and private.can_read_project(vr.project_id)));
create policy asset_blobs_member_read on public.asset_blobs for select to authenticated
  using (project_id is not null and private.can_read_project(project_id));
create policy asset_blobs_public_catalog_read on public.asset_blobs for select to anon, authenticated
  using (storage_bucket = 'published-assets' and exists (
    select 1 from public.icon_versions iv
    join public.icons i on i.id = iv.icon_id
    join public.projects p on p.id = i.project_id
    where (iv.source_asset_id = asset_blobs.id or iv.optimized_asset_id = asset_blobs.id)
      and i.status = 'published' and p.visibility = 'public'
  ));
create policy asset_blobs_contributor_insert on public.asset_blobs for insert to authenticated
  with check (
    created_by = auth.uid() and project_id is not null and (
      (storage_bucket = 'source-assets' and private.has_project_role(project_id, array['contributor', 'reviewer', 'admin']))
      or (storage_bucket = 'published-assets' and private.has_project_role(project_id, array['admin']))
    )
  );
create policy audit_events_privileged_read on public.audit_events for select to authenticated
  using (project_id is not null and private.has_project_role(project_id, array['reviewer', 'admin']));

create or replace function private.bootstrap_workspace_impl(
  p_organization_name text,
  p_organization_slug text,
  p_project_name text,
  p_project_slug text
) returns table (organization_id uuid, project_id uuid, project_slug text)
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_organization_id uuid;
  v_project_id uuid;
  v_profile_id uuid;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if exists (select 1 from public.memberships where user_id = v_user_id) then
    raise exception 'onboarding already completed' using errcode = '23505';
  end if;
  insert into public.organizations (name, slug, created_by)
    values (trim(p_organization_name), lower(trim(p_organization_slug)), v_user_id) returning id into v_organization_id;
  insert into public.memberships (organization_id, user_id, role) values (v_organization_id, v_user_id, 'admin');
  insert into public.projects (organization_id, name, slug, created_by)
    values (v_organization_id, trim(p_project_name), lower(trim(p_project_slug)), v_user_id) returning id into v_project_id;
  insert into public.style_profiles (project_id, name, created_by)
    values (v_project_id, 'Formaglyph Core', v_user_id) returning id into v_profile_id;
  insert into public.style_profile_versions (style_profile_id, version, status, rules, created_by)
    values (v_profile_id, 1, 'published', '{"grid":24,"stroke":2,"variants":["regular","solid"],"joins":"round"}'::jsonb, v_user_id);
  update public.projects set default_style_profile_id = v_profile_id where id = v_project_id;
  insert into public.audit_events (organization_id, project_id, actor_id, action, target_type, target_id, source)
    values (v_organization_id, v_project_id, v_user_id, 'workspace.bootstrapped', 'project', v_project_id, 'rpc');
  return query select v_organization_id, v_project_id, lower(trim(p_project_slug));
end;
$$;

create or replace function private.submit_proposal_impl(p_draft_id uuid, p_candidate_id uuid, p_target_version text default '1.0.0')
returns public.proposals
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_draft public.drafts;
  v_proposal public.proposals;
  v_organization_id uuid;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into v_draft from public.drafts where id = p_draft_id for update;
  if not found or v_draft.created_by <> v_user_id then raise exception 'draft not found or not owned' using errcode = '42501'; end if;
  if not private.has_project_role(v_draft.project_id, array['contributor','reviewer','admin']) then raise exception 'contributor permission required' using errcode = '42501'; end if;
  if not exists (select 1 from public.candidates c where c.id = p_candidate_id and c.draft_id = p_draft_id and c.issue is null) then raise exception 'valid candidate required' using errcode = '22023'; end if;
  select * into v_proposal from public.proposals where draft_id = p_draft_id and status not in ('rejected','published') for update;
  if found then
    if v_proposal.status <> 'changes_requested' then raise exception 'proposal cannot be submitted from %', v_proposal.status using errcode = '22023'; end if;
    update public.proposals set status = 'in_review', candidate_id = p_candidate_id, submitted_at = now(), decided_at = null
      where id = v_proposal.id returning * into v_proposal;
  else
    insert into public.proposals (project_id, draft_id, candidate_id, status, target_version, author_id, submitted_at)
      values (v_draft.project_id, p_draft_id, p_candidate_id, 'in_review', p_target_version, v_user_id, now()) returning * into v_proposal;
  end if;
  update public.drafts set selected_candidate_id = p_candidate_id, status = 'in_review', updated_at = now() where id = p_draft_id;
  select organization_id into v_organization_id from public.projects where id = v_draft.project_id;
  insert into public.audit_events (organization_id, project_id, actor_id, action, target_type, target_id, source, metadata)
    values (v_organization_id, v_draft.project_id, v_user_id, 'proposal.submitted', 'proposal', v_proposal.id, 'rpc', jsonb_build_object('candidate_id', p_candidate_id));
  return v_proposal;
end;
$$;

create or replace function private.review_proposal_impl(p_proposal_id uuid, p_decision text, p_body text default '')
returns public.proposals
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_proposal public.proposals;
  v_next_status text;
  v_organization_id uuid;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into v_proposal from public.proposals where id = p_proposal_id for update;
  if not found or v_proposal.status <> 'in_review' then raise exception 'proposal is not in review' using errcode = '22023'; end if;
  if v_proposal.author_id = v_user_id then raise exception 'authors cannot review their own proposal' using errcode = '42501'; end if;
  if not private.has_project_role(v_proposal.project_id, array['reviewer','admin']) then raise exception 'reviewer permission required' using errcode = '42501'; end if;
  v_next_status := case p_decision when 'approve' then 'approved' when 'request_changes' then 'changes_requested' when 'reject' then 'rejected' else null end;
  if v_next_status is null then raise exception 'invalid review decision' using errcode = '22023'; end if;
  insert into public.reviews (proposal_id, reviewer_id, decision, body) values (p_proposal_id, v_user_id, p_decision, coalesce(p_body, ''));
  update public.proposals set status = v_next_status, decided_at = now() where id = p_proposal_id returning * into v_proposal;
  update public.drafts set status = v_next_status, updated_at = now() where id = v_proposal.draft_id;
  select organization_id into v_organization_id from public.projects where id = v_proposal.project_id;
  insert into public.audit_events (organization_id, project_id, actor_id, action, target_type, target_id, source, metadata)
    values (v_organization_id, v_proposal.project_id, v_user_id, 'proposal.' || v_next_status, 'proposal', v_proposal.id, 'rpc', jsonb_build_object('decision', p_decision));
  return v_proposal;
end;
$$;

create or replace function private.publish_proposal_impl(p_proposal_id uuid)
returns public.icon_versions
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_proposal public.proposals;
  v_draft public.drafts;
  v_candidate public.candidates;
  v_asset public.asset_blobs;
  v_icon_id uuid;
  v_version public.icon_versions;
  v_organization_id uuid;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into v_proposal from public.proposals where id = p_proposal_id for update;
  if not found or v_proposal.status <> 'approved' then raise exception 'approved proposal required' using errcode = '22023'; end if;
  if not private.has_project_role(v_proposal.project_id, array['admin']) then raise exception 'admin permission required' using errcode = '42501'; end if;
  select * into v_draft from public.drafts where id = v_proposal.draft_id;
  select * into v_candidate from public.candidates where id = v_proposal.candidate_id;
  select * into v_asset from public.asset_blobs where id = v_candidate.asset_id;
  if v_asset.storage_bucket <> 'published-assets' or v_asset.sanitization_status <> 'passed' then raise exception 'immutable sanitized published asset required' using errcode = '22023'; end if;
  if v_candidate.validation_run_id is null or not exists (select 1 from public.validation_runs vr where vr.id = v_candidate.validation_run_id and vr.status = 'passed') then raise exception 'passing validation run required' using errcode = '22023'; end if;
  v_icon_id := v_draft.icon_id;
  if v_icon_id is null then
    insert into public.icons (stable_id, project_id, canonical_name, label, description, status, created_by)
      values ('ico_' || replace(v_draft.name, '-', '_') || '_' || substr(replace(v_draft.id::text, '-', ''), 1, 8), v_draft.project_id, v_draft.name, initcap(replace(v_draft.name, '-', ' ')), v_draft.description, 'approved', v_draft.created_by)
      returning id into v_icon_id;
    update public.drafts set icon_id = v_icon_id where id = v_draft.id;
  end if;
  insert into public.icon_versions (icon_id, version, variant, source_asset_id, optimized_asset_id, validation_run_id, content_hash, metadata, provenance, created_by)
    values (v_icon_id, v_proposal.target_version, v_candidate.variant, v_candidate.asset_id, v_candidate.asset_id, v_candidate.validation_run_id, v_asset.sha256,
      jsonb_build_object('canonical_name', v_draft.name), jsonb_build_object('kind', 'human-reviewed', 'proposal_id', v_proposal.public_id), v_user_id)
    returning * into v_version;
  update public.icons set current_version_id = v_version.id, status = 'published', updated_at = now() where id = v_icon_id;
  update public.proposals set status = 'published', published_at = now() where id = p_proposal_id returning * into v_proposal;
  update public.drafts set status = 'published', updated_at = now() where id = v_draft.id;
  select organization_id into v_organization_id from public.projects where id = v_proposal.project_id;
  insert into public.audit_events (organization_id, project_id, actor_id, action, target_type, target_id, source, metadata)
    values (v_organization_id, v_proposal.project_id, v_user_id, 'icon.published', 'icon_version', v_version.id, 'rpc', jsonb_build_object('proposal_id', v_proposal.id, 'content_hash', v_asset.sha256));
  return v_version;
end;
$$;

create or replace function public.bootstrap_workspace(p_organization_name text, p_organization_slug text, p_project_name text, p_project_slug text)
returns table (organization_id uuid, project_id uuid, project_slug text)
language sql security invoker set search_path = '' as $$
  select * from private.bootstrap_workspace_impl(p_organization_name, p_organization_slug, p_project_name, p_project_slug);
$$;
create or replace function public.submit_proposal(p_draft_id uuid, p_candidate_id uuid, p_target_version text default '1.0.0')
returns public.proposals language sql security invoker set search_path = '' as $$
  select private.submit_proposal_impl(p_draft_id, p_candidate_id, p_target_version);
$$;
create or replace function public.review_proposal(p_proposal_id uuid, p_decision text, p_body text default '')
returns public.proposals language sql security invoker set search_path = '' as $$
  select private.review_proposal_impl(p_proposal_id, p_decision, p_body);
$$;
create or replace function public.publish_proposal(p_proposal_id uuid)
returns public.icon_versions language sql security invoker set search_path = '' as $$
  select private.publish_proposal_impl(p_proposal_id);
$$;

revoke all on function private.bootstrap_workspace_impl(text,text,text,text) from public, anon;
revoke all on function private.submit_proposal_impl(uuid,uuid,text) from public, anon;
revoke all on function private.review_proposal_impl(uuid,text,text) from public, anon;
revoke all on function private.publish_proposal_impl(uuid) from public, anon;
grant execute on function private.bootstrap_workspace_impl(text,text,text,text) to authenticated;
grant execute on function private.submit_proposal_impl(uuid,uuid,text) to authenticated;
grant execute on function private.review_proposal_impl(uuid,text,text) to authenticated;
grant execute on function private.publish_proposal_impl(uuid) to authenticated;
revoke all on function public.bootstrap_workspace(text,text,text,text) from public, anon;
revoke all on function public.submit_proposal(uuid,uuid,text) from public, anon;
revoke all on function public.review_proposal(uuid,text,text) from public, anon;
revoke all on function public.publish_proposal(uuid) from public, anon;
grant execute on function public.bootstrap_workspace(text,text,text,text) to authenticated;
grant execute on function public.submit_proposal(uuid,uuid,text) to authenticated;
grant execute on function public.review_proposal(uuid,text,text) to authenticated;
grant execute on function public.publish_proposal(uuid) to authenticated;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.projects, public.icons, public.icon_versions, public.icon_aliases, public.asset_blobs to anon;
grant select on all tables in schema public to authenticated;
grant insert, update on public.drafts to authenticated;
grant insert on public.candidates, public.validation_runs, public.asset_blobs to authenticated;
grant update on public.candidates to authenticated;
grant usage, select on sequence public.audit_events_id_seq to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('source-assets', 'source-assets', false, 1048576, array['image/svg+xml']),
  ('published-assets', 'published-assets', true, 1048576, array['image/svg+xml'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy source_assets_member_read on storage.objects for select to authenticated
  using (bucket_id = 'source-assets' and private.can_read_project(private.project_id_from_storage_name(name)));
create policy source_assets_contributor_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'source-assets' and private.has_project_role(private.project_id_from_storage_name(name), array['contributor','reviewer','admin']));
create policy source_assets_contributor_update on storage.objects for update to authenticated
  using (bucket_id = 'source-assets' and private.has_project_role(private.project_id_from_storage_name(name), array['contributor','reviewer','admin']))
  with check (bucket_id = 'source-assets' and private.has_project_role(private.project_id_from_storage_name(name), array['contributor','reviewer','admin']));
create policy source_assets_contributor_delete on storage.objects for delete to authenticated
  using (bucket_id = 'source-assets' and private.has_project_role(private.project_id_from_storage_name(name), array['contributor','reviewer','admin']));
create policy published_assets_public_read on storage.objects for select to anon, authenticated using (bucket_id = 'published-assets');
create policy published_assets_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'published-assets' and private.has_project_role(private.project_id_from_storage_name(name), array['admin']));
