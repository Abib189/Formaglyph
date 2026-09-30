-- Scoped agent credentials and text-only draft handoff.
--
-- Project tokens are stored only as SHA-256 hashes in the private schema.
-- The public agent RPC can create a draft, but cannot attach an SVG, submit a
-- proposal, review, approve, publish, or read private project data.

alter table public.audit_events
  drop constraint audit_events_source_check;
alter table public.audit_events
  add constraint audit_events_source_check
  check (source in ('web', 'rpc', 'mcp', 'seed', 'system'));

create table private.project_access_tokens (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  token_prefix text not null,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  scopes text[] not null default array['drafts:write']::text[],
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (scopes <@ array['drafts:write']::text[])
);

create index project_access_tokens_project_idx
  on private.project_access_tokens (project_id, created_at desc);

revoke all on private.project_access_tokens from public, anon, authenticated;

create or replace function private.issue_project_token_impl(
  p_project_id uuid,
  p_name text,
  p_expires_in_days integer default 30
)
returns table (
  id uuid,
  name text,
  token_prefix text,
  scopes text[],
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz,
  token text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_token text;
  v_record private.project_access_tokens;
  v_organization_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not private.has_project_role(p_project_id, array['admin']) then
    raise exception 'admin permission required' using errcode = '42501';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'token name must contain 2 to 80 characters' using errcode = '22023';
  end if;
  if p_expires_in_days < 1 or p_expires_in_days > 90 then
    raise exception 'token lifetime must be between 1 and 90 days' using errcode = '22023';
  end if;

  v_token := 'fgp_' || encode(extensions.gen_random_bytes(24), 'hex');
  insert into private.project_access_tokens (
    project_id,
    name,
    token_prefix,
    token_hash,
    scopes,
    expires_at,
    created_by
  ) values (
    p_project_id,
    v_name,
    left(v_token, 12),
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    array['drafts:write']::text[],
    now() + make_interval(days => p_expires_in_days),
    v_user_id
  )
  returning * into v_record;

  select organization_id
  into v_organization_id
  from public.projects
  where public.projects.id = p_project_id;

  insert into public.audit_events (
    organization_id, project_id, actor_id, action, target_type, target_id, source, metadata
  ) values (
    v_organization_id,
    p_project_id,
    v_user_id,
    'agent.token_issued',
    'project_access_token',
    v_record.id,
    'rpc',
    jsonb_build_object(
      'name', v_record.name,
      'token_prefix', v_record.token_prefix,
      'scopes', to_jsonb(v_record.scopes),
      'expires_at', v_record.expires_at
    )
  );

  return query
  select
    v_record.id,
    v_record.name,
    v_record.token_prefix,
    v_record.scopes,
    v_record.expires_at,
    v_record.last_used_at,
    v_record.revoked_at,
    v_record.created_at,
    v_token;
end;
$$;

create or replace function private.list_project_tokens_impl(p_project_id uuid)
returns table (
  id uuid,
  name text,
  token_prefix text,
  scopes text[],
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not private.has_project_role(p_project_id, array['admin']) then
    raise exception 'admin permission required' using errcode = '42501';
  end if;

  return query
  select
    pat.id,
    pat.name,
    pat.token_prefix,
    pat.scopes,
    pat.expires_at,
    pat.last_used_at,
    pat.revoked_at,
    pat.created_at
  from private.project_access_tokens pat
  where pat.project_id = p_project_id
  order by pat.created_at desc;
end;
$$;

create or replace function private.revoke_project_token_impl(p_token_id uuid)
returns table (
  id uuid,
  name text,
  token_prefix text,
  scopes text[],
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_record private.project_access_tokens;
  v_organization_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select *
  into v_record
  from private.project_access_tokens
  where private.project_access_tokens.id = p_token_id
  for update;

  if not found then
    raise exception 'project token was not found' using errcode = '22023';
  end if;
  if not private.has_project_role(v_record.project_id, array['admin']) then
    raise exception 'admin permission required' using errcode = '42501';
  end if;

  update private.project_access_tokens
  set revoked_at = coalesce(private.project_access_tokens.revoked_at, now())
  where private.project_access_tokens.id = p_token_id
  returning * into v_record;

  select organization_id
  into v_organization_id
  from public.projects
  where public.projects.id = v_record.project_id;

  insert into public.audit_events (
    organization_id, project_id, actor_id, action, target_type, target_id, source, metadata
  ) values (
    v_organization_id,
    v_record.project_id,
    v_user_id,
    'agent.token_revoked',
    'project_access_token',
    v_record.id,
    'rpc',
    jsonb_build_object('name', v_record.name, 'token_prefix', v_record.token_prefix)
  );

  return query
  select
    v_record.id,
    v_record.name,
    v_record.token_prefix,
    v_record.scopes,
    v_record.expires_at,
    v_record.last_used_at,
    v_record.revoked_at,
    v_record.created_at;
end;
$$;

create or replace function private.create_agent_draft_impl(
  p_token text,
  p_name text,
  p_description text default '',
  p_keywords text[] default '{}'::text[]
)
returns table (
  draft_id uuid,
  project_slug text,
  draft_name text,
  status text,
  create_path text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token private.project_access_tokens;
  v_project public.projects;
  v_draft public.drafts;
  v_name text := lower(btrim(coalesce(p_name, '')));
  v_description text := btrim(coalesce(p_description, ''));
  v_keywords text[];
begin
  if p_token is null or char_length(p_token) < 40 then
    raise exception 'invalid or expired project token' using errcode = '28000';
  end if;

  select *
  into v_token
  from private.project_access_tokens
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and revoked_at is null
    and expires_at > now()
    and 'drafts:write' = any(scopes)
  for update;

  if not found then
    raise exception 'invalid or expired project token' using errcode = '28000';
  end if;
  if v_name !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or char_length(v_name) > 80 then
    raise exception 'draft name must be a lowercase kebab-case name of at most 80 characters' using errcode = '22023';
  end if;
  if char_length(v_description) < 3 or char_length(v_description) > 500 then
    raise exception 'draft description must contain 3 to 500 characters' using errcode = '22023';
  end if;
  if cardinality(p_keywords) > 12 then
    raise exception 'draft keywords cannot contain more than 12 values' using errcode = '22023';
  end if;
  if exists (
    select 1
    from unnest(p_keywords) as keyword
    where char_length(btrim(keyword)) < 1 or char_length(btrim(keyword)) > 40
  ) then
    raise exception 'each draft keyword must contain 1 to 40 characters' using errcode = '22023';
  end if;

  select array_agg(distinct lower(btrim(keyword)) order by lower(btrim(keyword)))
  into v_keywords
  from unnest(p_keywords) as keyword;
  v_keywords := coalesce(v_keywords, '{}'::text[]);

  select *
  into v_project
  from public.projects
  where id = v_token.project_id;

  insert into public.drafts (
    project_id,
    name,
    description,
    keywords,
    status,
    created_by
  ) values (
    v_token.project_id,
    v_name,
    v_description,
    v_keywords,
    'draft',
    v_token.created_by
  )
  returning * into v_draft;

  update private.project_access_tokens
  set last_used_at = now()
  where id = v_token.id;

  insert into public.audit_events (
    organization_id, project_id, actor_id, action, target_type, target_id, source, metadata
  ) values (
    v_project.organization_id,
    v_project.id,
    null,
    'agent.draft_created',
    'draft',
    v_draft.id,
    'mcp',
    jsonb_build_object(
      'token_id', v_token.id,
      'token_name', v_token.name,
      'token_prefix', v_token.token_prefix,
      'scopes', to_jsonb(v_token.scopes)
    )
  );

  return query
  select
    v_draft.id,
    v_project.slug,
    v_draft.name,
    v_draft.status,
    '/projects/' || v_project.slug || '/create?draft=' || v_draft.id::text;
end;
$$;

create or replace function public.issue_project_token(
  p_project_id uuid,
  p_name text,
  p_expires_in_days integer default 30
)
returns table (
  id uuid,
  name text,
  token_prefix text,
  scopes text[],
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz,
  token text
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.issue_project_token_impl(p_project_id, p_name, p_expires_in_days);
$$;

create or replace function public.list_project_tokens(p_project_id uuid)
returns table (
  id uuid,
  name text,
  token_prefix text,
  scopes text[],
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.list_project_tokens_impl(p_project_id);
$$;

create or replace function public.revoke_project_token(p_token_id uuid)
returns table (
  id uuid,
  name text,
  token_prefix text,
  scopes text[],
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.revoke_project_token_impl(p_token_id);
$$;

create or replace function public.create_agent_draft(
  p_token text,
  p_name text,
  p_description text default '',
  p_keywords text[] default '{}'::text[]
)
returns table (
  draft_id uuid,
  project_slug text,
  draft_name text,
  status text,
  create_path text
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.create_agent_draft_impl(p_token, p_name, p_description, p_keywords);
$$;

revoke all on function private.issue_project_token_impl(uuid, text, integer) from public, anon;
revoke all on function private.list_project_tokens_impl(uuid) from public, anon;
revoke all on function private.revoke_project_token_impl(uuid) from public, anon;
revoke all on function private.create_agent_draft_impl(text, text, text, text[]) from public;
grant execute on function private.issue_project_token_impl(uuid, text, integer) to authenticated;
grant execute on function private.list_project_tokens_impl(uuid) to authenticated;
grant execute on function private.revoke_project_token_impl(uuid) to authenticated;
grant execute on function private.create_agent_draft_impl(text, text, text, text[]) to anon, authenticated;

revoke all on function public.issue_project_token(uuid, text, integer) from public, anon;
revoke all on function public.list_project_tokens(uuid) from public, anon;
revoke all on function public.revoke_project_token(uuid) from public, anon;
revoke all on function public.create_agent_draft(text, text, text, text[]) from public;
grant execute on function public.issue_project_token(uuid, text, integer) to authenticated;
grant execute on function public.list_project_tokens(uuid) to authenticated;
grant execute on function public.revoke_project_token(uuid) to authenticated;
grant execute on function public.create_agent_draft(text, text, text, text[]) to anon, authenticated;
