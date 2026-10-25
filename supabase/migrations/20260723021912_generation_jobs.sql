create table public.generation_jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  draft_id uuid references public.drafts(id) on delete set null,
  adapter text not null check (adapter in ('local_geometry', 'omnisvg', 'starvector', 'hosted')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  prompt text check (prompt is null or char_length(prompt) between 1 and 4000),
  prompt_sha256 text not null check (prompt_sha256 ~ '^[a-f0-9]{64}$'),
  retain_prompt boolean not null default false,
  candidate_count integer not null check (candidate_count between 1 and 8),
  progress integer not null default 0 check (progress between 0 and 100),
  result_summary jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  requested_by uuid not null references auth.users(id),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((retain_prompt and prompt is not null) or (not retain_prompt and prompt is null)),
  check ((status in ('completed', 'failed', 'cancelled') and completed_at is not null) or (status in ('queued', 'running') and completed_at is null))
);

alter table public.candidates
  add column generation_job_id uuid references public.generation_jobs(id) on delete set null,
  add column prompt_sha256 text check (prompt_sha256 is null or prompt_sha256 ~ '^[a-f0-9]{64}$'),
  add column provenance jsonb not null default '{"kind":"import","disclosed":true}'::jsonb;

create index generation_jobs_project_created_idx on public.generation_jobs (project_id, created_at desc);
create index generation_jobs_requester_status_idx on public.generation_jobs (requested_by, status);
create index candidates_generation_job_idx on public.candidates (generation_job_id) where generation_job_id is not null;

create or replace function private.guard_candidate_generation_link()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.generation_job_id is null then
    if new.prompt_sha256 is not null then
      raise exception 'prompt hash requires a generation job' using errcode = '23514';
    end if;
    return new;
  end if;
  if not exists (
    select 1
    from public.generation_jobs gj
    join public.drafts d on d.id = new.draft_id
    where gj.id = new.generation_job_id
      and gj.project_id = d.project_id
      and gj.requested_by = new.created_by
      and gj.status = 'completed'
      and gj.prompt_sha256 = new.prompt_sha256
  ) then
    raise exception 'candidate requires its author completed generation job and matching prompt hash' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger candidates_guard_generation_link
before insert or update of generation_job_id, prompt_sha256, draft_id, created_by on public.candidates
for each row execute function private.guard_candidate_generation_link();

revoke all on function private.guard_candidate_generation_link() from public, anon, authenticated;

create or replace function private.guard_generation_job_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_allowed boolean := false;
begin
  if old.project_id <> new.project_id
    or old.draft_id is distinct from new.draft_id
    or old.adapter <> new.adapter
    or old.prompt is distinct from new.prompt
    or old.prompt_sha256 <> new.prompt_sha256
    or old.retain_prompt <> new.retain_prompt
    or old.requested_by <> new.requested_by
    or old.created_at <> new.created_at then
    raise exception 'generation job identity and request fields are immutable' using errcode = '55000';
  end if;
  if old.status = new.status then
    new.updated_at := now();
    return new;
  end if;
  v_allowed := case old.status
    when 'queued' then new.status in ('running', 'failed', 'cancelled')
    when 'running' then new.status in ('completed', 'failed', 'cancelled')
    else false
  end;
  if not v_allowed then
    raise exception 'invalid generation job transition from % to %', old.status, new.status using errcode = '22023';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger generation_jobs_mutation_guard
before update on public.generation_jobs
for each row execute function private.guard_generation_job_mutation();

revoke all on function private.guard_generation_job_mutation() from public, anon, authenticated;

alter table public.generation_jobs enable row level security;

create policy generation_jobs_member_read on public.generation_jobs for select to authenticated
  using (private.can_read_project(project_id));

create or replace function private.start_generation_job_impl(
  p_project_id uuid,
  p_draft_id uuid,
  p_adapter text,
  p_prompt text,
  p_prompt_sha256 text,
  p_retain_prompt boolean default false,
  p_candidate_count integer default 3
) returns public.generation_jobs
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_job public.generation_jobs;
  v_organization_id uuid;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if not private.has_project_role(p_project_id, array['contributor','reviewer','admin']) then
    raise exception 'contributor permission required' using errcode = '42501';
  end if;
  if p_adapter <> 'local_geometry' then
    raise exception 'generation adapter is not enabled for this project' using errcode = '42501';
  end if;
  if p_prompt_sha256 !~ '^[a-f0-9]{64}$' then
    raise exception 'valid prompt hash required' using errcode = '22023';
  end if;
  if p_candidate_count not between 1 and 8 then
    raise exception 'candidate count must be between 1 and 8' using errcode = '22023';
  end if;
  if p_draft_id is not null and not exists (
    select 1 from public.drafts d
    where d.id = p_draft_id and d.project_id = p_project_id and d.created_by = v_user_id
  ) then
    raise exception 'draft not found or not owned' using errcode = '42501';
  end if;
  insert into public.generation_jobs (
    project_id, draft_id, adapter, status, prompt, prompt_sha256, retain_prompt,
    candidate_count, progress, requested_by, started_at
  ) values (
    p_project_id, p_draft_id, p_adapter, 'running',
    case when p_retain_prompt then nullif(trim(p_prompt), '') else null end,
    p_prompt_sha256, p_retain_prompt, p_candidate_count, 10, v_user_id, now()
  ) returning * into v_job;
  select organization_id into v_organization_id from public.projects where id = p_project_id;
  insert into public.audit_events (organization_id, project_id, actor_id, action, target_type, target_id, source, metadata)
    values (v_organization_id, p_project_id, v_user_id, 'generation.started', 'generation_job', v_job.id, 'rpc',
      jsonb_build_object('adapter', p_adapter, 'candidate_count', p_candidate_count, 'prompt_retained', p_retain_prompt));
  return v_job;
end;
$$;

create or replace function private.complete_generation_job_impl(
  p_job_id uuid,
  p_result_summary jsonb default '{}'::jsonb
) returns public.generation_jobs
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_job public.generation_jobs;
  v_organization_id uuid;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into v_job from public.generation_jobs where id = p_job_id for update;
  if not found or v_job.requested_by <> v_user_id then raise exception 'generation job not found or not owned' using errcode = '42501'; end if;
  if v_job.status <> 'running' then raise exception 'generation job is not running' using errcode = '22023'; end if;
  update public.generation_jobs
    set status = 'completed', progress = 100, result_summary = coalesce(p_result_summary, '{}'::jsonb), completed_at = now()
    where id = p_job_id returning * into v_job;
  select organization_id into v_organization_id from public.projects where id = v_job.project_id;
  insert into public.audit_events (organization_id, project_id, actor_id, action, target_type, target_id, source, metadata)
    values (v_organization_id, v_job.project_id, v_user_id, 'generation.completed', 'generation_job', v_job.id, 'rpc', v_job.result_summary);
  return v_job;
end;
$$;

create or replace function private.fail_generation_job_impl(
  p_job_id uuid,
  p_error_code text,
  p_error_message text
) returns public.generation_jobs
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_job public.generation_jobs;
  v_organization_id uuid;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into v_job from public.generation_jobs where id = p_job_id for update;
  if not found or v_job.requested_by <> v_user_id then raise exception 'generation job not found or not owned' using errcode = '42501'; end if;
  if v_job.status <> 'running' then raise exception 'generation job is not running' using errcode = '22023'; end if;
  update public.generation_jobs
    set status = 'failed', error_code = left(nullif(trim(p_error_code), ''), 80),
        error_message = left(nullif(trim(p_error_message), ''), 500), completed_at = now()
    where id = p_job_id returning * into v_job;
  select organization_id into v_organization_id from public.projects where id = v_job.project_id;
  insert into public.audit_events (organization_id, project_id, actor_id, action, target_type, target_id, source, metadata)
    values (v_organization_id, v_job.project_id, v_user_id, 'generation.failed', 'generation_job', v_job.id, 'rpc',
      jsonb_build_object('error_code', v_job.error_code));
  return v_job;
end;
$$;

create or replace function private.cancel_generation_job_impl(p_job_id uuid)
returns public.generation_jobs
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_job public.generation_jobs;
  v_organization_id uuid;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into v_job from public.generation_jobs where id = p_job_id for update;
  if not found or v_job.requested_by <> v_user_id then raise exception 'generation job not found or not owned' using errcode = '42501'; end if;
  if v_job.status not in ('queued', 'running') then raise exception 'generation job cannot be cancelled' using errcode = '22023'; end if;
  update public.generation_jobs set status = 'cancelled', completed_at = now()
    where id = p_job_id returning * into v_job;
  select organization_id into v_organization_id from public.projects where id = v_job.project_id;
  insert into public.audit_events (organization_id, project_id, actor_id, action, target_type, target_id, source)
    values (v_organization_id, v_job.project_id, v_user_id, 'generation.cancelled', 'generation_job', v_job.id, 'rpc');
  return v_job;
end;
$$;

create or replace function public.start_generation_job(
  p_project_id uuid,
  p_draft_id uuid,
  p_adapter text,
  p_prompt text,
  p_prompt_sha256 text,
  p_retain_prompt boolean default false,
  p_candidate_count integer default 3
) returns public.generation_jobs language sql security invoker set search_path = '' as $$
  select private.start_generation_job_impl(p_project_id, p_draft_id, p_adapter, p_prompt, p_prompt_sha256, p_retain_prompt, p_candidate_count);
$$;
create or replace function public.complete_generation_job(p_job_id uuid, p_result_summary jsonb default '{}'::jsonb)
returns public.generation_jobs language sql security invoker set search_path = '' as $$
  select private.complete_generation_job_impl(p_job_id, p_result_summary);
$$;
create or replace function public.fail_generation_job(p_job_id uuid, p_error_code text, p_error_message text)
returns public.generation_jobs language sql security invoker set search_path = '' as $$
  select private.fail_generation_job_impl(p_job_id, p_error_code, p_error_message);
$$;
create or replace function public.cancel_generation_job(p_job_id uuid)
returns public.generation_jobs language sql security invoker set search_path = '' as $$
  select private.cancel_generation_job_impl(p_job_id);
$$;

revoke all on function private.start_generation_job_impl(uuid,uuid,text,text,text,boolean,integer) from public, anon;
revoke all on function private.complete_generation_job_impl(uuid,jsonb) from public, anon;
revoke all on function private.fail_generation_job_impl(uuid,text,text) from public, anon;
revoke all on function private.cancel_generation_job_impl(uuid) from public, anon;
grant execute on function private.start_generation_job_impl(uuid,uuid,text,text,text,boolean,integer) to authenticated;
grant execute on function private.complete_generation_job_impl(uuid,jsonb) to authenticated;
grant execute on function private.fail_generation_job_impl(uuid,text,text) to authenticated;
grant execute on function private.cancel_generation_job_impl(uuid) to authenticated;

revoke all on function public.start_generation_job(uuid,uuid,text,text,text,boolean,integer) from public, anon;
revoke all on function public.complete_generation_job(uuid,jsonb) from public, anon;
revoke all on function public.fail_generation_job(uuid,text,text) from public, anon;
revoke all on function public.cancel_generation_job(uuid) from public, anon;
grant execute on function public.start_generation_job(uuid,uuid,text,text,text,boolean,integer) to authenticated;
grant execute on function public.complete_generation_job(uuid,jsonb) to authenticated;
grant execute on function public.fail_generation_job(uuid,text,text) to authenticated;
grant execute on function public.cancel_generation_job(uuid) to authenticated;

revoke all on public.generation_jobs from anon, authenticated;
grant select on public.generation_jobs to authenticated;
