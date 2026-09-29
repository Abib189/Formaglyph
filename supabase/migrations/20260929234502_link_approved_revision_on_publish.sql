-- A new draft with the same canonical name as a published icon is a revision,
-- not a second icon. Resolve that identity in the same transaction as publish.
create or replace function private.prepare_publish_revision(p_proposal_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_proposal public.proposals;
  v_draft public.drafts;
  v_existing public.icons;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select * into v_proposal from public.proposals where id = p_proposal_id for update;
  if not found or v_proposal.status <> 'approved' then
    raise exception 'approved proposal required' using errcode = '22023';
  end if;
  if not private.has_project_role(v_proposal.project_id, array['admin']) then
    raise exception 'admin permission required' using errcode = '42501';
  end if;
  select * into v_draft from public.drafts where id = v_proposal.draft_id for update;
  if not found or v_draft.project_id <> v_proposal.project_id then
    raise exception 'proposal draft not found' using errcode = '22023';
  end if;
  if v_draft.icon_id is not null then return; end if;

  select * into v_existing from public.icons
  where project_id = v_proposal.project_id and canonical_name = v_draft.name for update;
  if not found then return; end if;
  if v_existing.status <> 'published' then
    raise exception 'the existing icon is not published; resolve its lifecycle before using the same name'
      using errcode = '22023';
  end if;

  update public.drafts set icon_id = v_existing.id where id = v_draft.id;
  insert into public.audit_events (organization_id, project_id, actor_id, action, target_type, target_id, source, metadata)
  values ((select organization_id from public.projects where id = v_proposal.project_id),
    v_proposal.project_id, auth.uid(), 'draft.linked_to_existing_icon', 'draft', v_draft.id, 'rpc',
    jsonb_build_object('proposal_id', v_proposal.id, 'icon_id', v_existing.id, 'canonical_name', v_draft.name));
end;
$$;

revoke all on function private.prepare_publish_revision(uuid) from public, anon, authenticated;
grant execute on function private.prepare_publish_revision(uuid) to authenticated;

create or replace function public.publish_proposal(p_proposal_id uuid)
returns public.icon_versions
language plpgsql security invoker set search_path = '' as $$
begin
  perform private.prepare_publish_revision(p_proposal_id);
  return private.publish_proposal_impl(p_proposal_id);
end;
$$;
