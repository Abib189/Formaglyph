-- Review and governance vertical slice.
-- All mutations remain behind authenticated RPCs and write an audit event
-- inside the same transaction.

create or replace function private.review_proposal_impl(
  p_proposal_id uuid,
  p_decision text,
  p_body text default ''
)
returns public.proposals
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_proposal public.proposals;
  v_next_status text;
  v_organization_id uuid;
  v_review_id uuid;
  v_body text := btrim(coalesce(p_body, ''));
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select *
  into v_proposal
  from public.proposals
  where id = p_proposal_id
  for update;

  if not found or v_proposal.status <> 'in_review' then
    raise exception 'proposal is not in review' using errcode = '22023';
  end if;
  if v_proposal.author_id = v_user_id then
    raise exception 'authors cannot review their own proposal' using errcode = '42501';
  end if;
  if not private.has_project_role(v_proposal.project_id, array['reviewer', 'admin']) then
    raise exception 'reviewer permission required' using errcode = '42501';
  end if;

  v_next_status := case p_decision
    when 'approve' then 'approved'
    when 'request_changes' then 'changes_requested'
    when 'reject' then 'rejected'
    else null
  end;
  if v_next_status is null then
    raise exception 'invalid review decision' using errcode = '22023';
  end if;
  if p_decision in ('request_changes', 'reject') and char_length(v_body) < 10 then
    raise exception 'a decision note of at least 10 characters is required' using errcode = '22023';
  end if;

  insert into public.reviews (proposal_id, reviewer_id, decision, body)
  values (p_proposal_id, v_user_id, p_decision, v_body)
  returning id into v_review_id;

  update public.proposals
  set status = v_next_status, decided_at = now()
  where id = p_proposal_id
  returning * into v_proposal;

  update public.drafts
  set status = v_next_status, updated_at = now()
  where id = v_proposal.draft_id;

  select organization_id
  into v_organization_id
  from public.projects
  where id = v_proposal.project_id;

  insert into public.audit_events (
    organization_id, project_id, actor_id, action, target_type, target_id, source, metadata
  ) values (
    v_organization_id,
    v_proposal.project_id,
    v_user_id,
    'proposal.' || v_next_status,
    'proposal',
    v_proposal.id,
    'rpc',
    jsonb_build_object('decision', p_decision, 'review_id', v_review_id)
  );

  return v_proposal;
end;
$$;

create or replace function private.comment_proposal_impl(
  p_proposal_id uuid,
  p_title text,
  p_body text
)
returns public.reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_proposal public.proposals;
  v_review public.reviews;
  v_organization_id uuid;
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := btrim(coalesce(p_body, ''));
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select *
  into v_proposal
  from public.proposals
  where id = p_proposal_id
  for share;

  if not found or v_proposal.status <> 'in_review' then
    raise exception 'proposal is not in review' using errcode = '22023';
  end if;
  if v_proposal.author_id = v_user_id then
    raise exception 'authors cannot review their own proposal' using errcode = '42501';
  end if;
  if not private.has_project_role(v_proposal.project_id, array['reviewer', 'admin']) then
    raise exception 'reviewer permission required' using errcode = '42501';
  end if;
  if char_length(v_body) < 3 or char_length(v_body) > 2000 then
    raise exception 'review comment must contain 3 to 2000 characters' using errcode = '22023';
  end if;
  if char_length(v_title) < 2 or char_length(v_title) > 80 then
    raise exception 'review title must contain 2 to 80 characters' using errcode = '22023';
  end if;

  insert into public.reviews (proposal_id, reviewer_id, decision, title, body)
  values (p_proposal_id, v_user_id, 'comment', v_title, v_body)
  returning * into v_review;

  select organization_id
  into v_organization_id
  from public.projects
  where id = v_proposal.project_id;

  insert into public.audit_events (
    organization_id, project_id, actor_id, action, target_type, target_id, source, metadata
  ) values (
    v_organization_id,
    v_proposal.project_id,
    v_user_id,
    'review.comment_added',
    'review',
    v_review.id,
    'rpc',
    jsonb_build_object('proposal_id', v_proposal.id, 'title', v_title)
  );

  return v_review;
end;
$$;

create or replace function private.resolve_review_impl(
  p_review_id uuid,
  p_resolved boolean
)
returns public.reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_review public.reviews;
  v_proposal public.proposals;
  v_organization_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select *
  into v_review
  from public.reviews
  where id = p_review_id
  for update;
  if not found or v_review.decision <> 'comment' then
    raise exception 'review comment was not found' using errcode = '22023';
  end if;

  select *
  into v_proposal
  from public.proposals
  where id = v_review.proposal_id;
  if not private.has_project_role(v_proposal.project_id, array['reviewer', 'admin']) then
    raise exception 'reviewer permission required' using errcode = '42501';
  end if;
  if v_review.reviewer_id <> v_user_id
     and not private.has_project_role(v_proposal.project_id, array['admin']) then
    raise exception 'only the comment author or an admin can resolve it' using errcode = '42501';
  end if;

  update public.reviews
  set resolved = p_resolved
  where id = p_review_id
  returning * into v_review;

  select organization_id
  into v_organization_id
  from public.projects
  where id = v_proposal.project_id;

  insert into public.audit_events (
    organization_id, project_id, actor_id, action, target_type, target_id, source, metadata
  ) values (
    v_organization_id,
    v_proposal.project_id,
    v_user_id,
    case when p_resolved then 'review.comment_resolved' else 'review.comment_reopened' end,
    'review',
    v_review.id,
    'rpc',
    jsonb_build_object('proposal_id', v_proposal.id)
  );

  return v_review;
end;
$$;

create or replace function private.deprecate_icon_impl(
  p_icon_id uuid,
  p_reason text
)
returns public.icons
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_icon public.icons;
  v_organization_id uuid;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select *
  into v_icon
  from public.icons
  where id = p_icon_id
  for update;

  if not found or v_icon.status <> 'published' then
    raise exception 'published icon required' using errcode = '22023';
  end if;
  if not private.has_project_role(v_icon.project_id, array['admin']) then
    raise exception 'admin permission required' using errcode = '42501';
  end if;
  if char_length(v_reason) < 10 or char_length(v_reason) > 500 then
    raise exception 'deprecation reason must contain 10 to 500 characters' using errcode = '22023';
  end if;

  update public.icons
  set status = 'deprecated', updated_at = now()
  where id = p_icon_id
  returning * into v_icon;

  select organization_id
  into v_organization_id
  from public.projects
  where id = v_icon.project_id;

  insert into public.audit_events (
    organization_id, project_id, actor_id, action, target_type, target_id, source, metadata
  ) values (
    v_organization_id,
    v_icon.project_id,
    v_user_id,
    'icon.deprecated',
    'icon',
    v_icon.id,
    'rpc',
    jsonb_build_object(
      'reason', v_reason,
      'current_version_id', v_icon.current_version_id,
      'canonical_name', v_icon.canonical_name
    )
  );

  return v_icon;
end;
$$;

create or replace function public.comment_proposal(
  p_proposal_id uuid,
  p_title text,
  p_body text
)
returns public.reviews
language sql
security invoker
set search_path = ''
as $$
  select private.comment_proposal_impl(p_proposal_id, p_title, p_body);
$$;

create or replace function public.resolve_review(
  p_review_id uuid,
  p_resolved boolean
)
returns public.reviews
language sql
security invoker
set search_path = ''
as $$
  select private.resolve_review_impl(p_review_id, p_resolved);
$$;

create or replace function public.deprecate_icon(
  p_icon_id uuid,
  p_reason text
)
returns public.icons
language sql
security invoker
set search_path = ''
as $$
  select private.deprecate_icon_impl(p_icon_id, p_reason);
$$;

revoke all on function private.review_proposal_impl(uuid, text, text) from public, anon;
revoke all on function private.comment_proposal_impl(uuid, text, text) from public, anon;
revoke all on function private.resolve_review_impl(uuid, boolean) from public, anon;
revoke all on function private.deprecate_icon_impl(uuid, text) from public, anon;
grant execute on function private.review_proposal_impl(uuid, text, text) to authenticated;
grant execute on function private.comment_proposal_impl(uuid, text, text) to authenticated;
grant execute on function private.resolve_review_impl(uuid, boolean) to authenticated;
grant execute on function private.deprecate_icon_impl(uuid, text) to authenticated;

revoke all on function public.comment_proposal(uuid, text, text) from public, anon;
revoke all on function public.resolve_review(uuid, boolean) from public, anon;
revoke all on function public.deprecate_icon(uuid, text) from public, anon;
grant execute on function public.comment_proposal(uuid, text, text) to authenticated;
grant execute on function public.resolve_review(uuid, boolean) to authenticated;
grant execute on function public.deprecate_icon(uuid, text) to authenticated;

-- Public projects expose only their current published icons. Authenticated
-- project members retain access to non-public lifecycle states for governance.
drop policy if exists icons_catalog_or_member_read on public.icons;
create policy icons_catalog_or_member_read
on public.icons for select to anon, authenticated
using (
  (
    status = 'published'
    and exists (
      select 1
      from public.projects p
      where p.id = project_id and p.visibility = 'public'
    )
  )
  or private.has_project_role(project_id, array['contributor', 'reviewer', 'admin'])
);

drop policy if exists icon_versions_catalog_or_member_read on public.icon_versions;
create policy icon_versions_catalog_or_member_read
on public.icon_versions for select to anon, authenticated
using (
  exists (
    select 1
    from public.icons i
    where i.id = icon_id
      and (
        (
          i.status = 'published'
          and exists (
            select 1
            from public.projects p
            where p.id = i.project_id and p.visibility = 'public'
          )
        )
        or private.has_project_role(i.project_id, array['contributor', 'reviewer', 'admin'])
      )
  )
);

drop policy if exists icon_aliases_catalog_or_member_read on public.icon_aliases;
create policy icon_aliases_catalog_or_member_read
on public.icon_aliases for select to anon, authenticated
using (
  exists (
    select 1
    from public.icons i
    where i.id = icon_id
      and (
        (
          i.status = 'published'
          and exists (
            select 1
            from public.projects p
            where p.id = i.project_id and p.visibility = 'public'
          )
        )
        or private.has_project_role(i.project_id, array['contributor', 'reviewer', 'admin'])
      )
  )
);
