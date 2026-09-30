begin;
create extension if not exists pgtap with schema extensions;
select plan(84);

select extensions.has_table('public', 'organizations', 'organizations exists');
select extensions.has_table('public', 'icons', 'icons exists');
select extensions.has_table('public', 'audit_events', 'audit events exists');
select extensions.has_table('public', 'generation_jobs', 'generation jobs exists');
select extensions.has_table('public', 'candidate_variant_assets', 'candidate variant assets exist');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.icons'::regclass), 'icons has RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.audit_events'::regclass), 'audit events has RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.generation_jobs'::regclass), 'generation jobs have RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.candidate_variant_assets'::regclass), 'candidate variant assets have RLS enabled');
select extensions.is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'candidate_variant_assets'),
  2,
  'candidate variant policies are explicit'
);
select extensions.is(
  (select count(*)::integer from public.candidate_variant_assets where candidate_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'),
  2,
  'development candidate stores Regular and Solid assets together'
);
select extensions.is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'drafts'), 3, 'draft policies are explicit');
select extensions.is(
  (select count(*)::integer from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'published_assets_%' and cmd in ('UPDATE', 'DELETE')),
  0,
  'published storage objects cannot be replaced or deleted through the Data API'
);
select extensions.is(
  (select count(*)::integer from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'published_assets_%' and cmd = 'SELECT'),
  2,
  'published assets have separate member and public download policies'
);
select extensions.is((select public from storage.buckets where id = 'published-assets'), false, 'published storage is private');
select extensions.ok(
  (select qual like '%allow_any_operation%' from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'published_assets_member_download'),
  'member reads are limited to authenticated object downloads'
);
select extensions.ok(
  (select qual like '%allow_any_operation%' from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'published_assets_public_download'),
  'public reads are limited to authenticated object downloads'
);

select extensions.throws_ok(
  $$insert into public.icons (stable_id, project_id, canonical_name, label, created_by) values ('ico_duplicate_name', '22222222-2222-4222-8222-222222222222', 'circle-check', 'Duplicate', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$$,
  '23505',
  'duplicate key value violates unique constraint "icons_project_id_canonical_name_key"',
  'canonical names are unique within a project'
);
select extensions.throws_ok(
  $$insert into public.asset_blobs (project_id, storage_bucket, storage_path, byte_size, sha256, sanitization_status, created_by) values ('22222222-2222-4222-8222-222222222222', 'source-assets', 'invalid/hash.svg', 10, 'not-a-hash', 'passed', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$$,
  '23514',
  'new row for relation "asset_blobs" violates check constraint "asset_blobs_sha256_check"',
  'asset content hashes must be lowercase SHA-256 values'
);
select extensions.throws_ok(
  $$insert into public.asset_blobs (project_id, storage_bucket, storage_path, byte_size, sha256, sanitization_status, created_by) values ('22222222-2222-4222-8222-222222222222', 'published-assets', '11111111-1111-4111-8111-111111111111/wrong-project/icon/version/regular.svg', 10, repeat('c', 64), 'passed', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$$,
  '23514',
  'published asset path must include its immutable project id',
  'published asset paths include the immutable project id'
);

set local role anon;
select extensions.is((select count(*)::integer from public.icons), 1, 'anonymous users see only the published public fixture');
select extensions.is((select count(*)::integer from public.projects), 1, 'anonymous users cannot see private projects');
reset role;

insert into public.organizations (id, slug, name, created_by) values
  ('13131313-1313-4313-8313-131313131313', 'isolated-org', 'Isolated organization', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.projects (id, organization_id, slug, name, visibility, created_by) values
  ('14141414-1414-4414-8414-141414141414', '13131313-1313-4313-8313-131313131313', 'private', 'Isolated private project', 'private', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select extensions.is((select count(*)::integer from public.projects), 2, 'contributor sees only projects in their organization');
select extensions.lives_ok($$update public.drafts set description = 'Contributor edit' where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'$$, 'contributor can update their own draft');
select extensions.is((select description from public.drafts where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'), 'Contributor edit', 'draft update persists through RLS');
select extensions.lives_ok(
  $$insert into public.validation_issues (validation_run_id, rule_id, severity, message) values ('89898989-8989-4989-8989-898989898989', 'svg.style.viewbox-mismatch', 'warning', 'Development fixture uses the Phosphor coordinate system.')$$,
  'contributors can append immutable issues to their own validation run'
);
select extensions.is(
  (select status from public.start_generation_job(
    '22222222-2222-4222-8222-222222222222',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'local_geometry',
    'Private cloud upload brief',
    repeat('e', 64),
    false,
    3
  )),
  'running',
  'contributors can start an allowed local generation job'
);
select extensions.is(
  (select prompt from public.generation_jobs where requested_by = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' order by created_at desc limit 1),
  null,
  'generation prompts are omitted when retention is disabled'
);
select extensions.is(
  (select count(*)::integer from public.audit_events),
  0,
  'contributors cannot read privileged audit history'
);
select extensions.throws_ok(
  $$select public.start_generation_job('22222222-2222-4222-8222-222222222222', null, 'hosted', 'private prompt', repeat('f', 64), false, 3)$$,
  '42501',
  'generation adapter is not enabled for this project',
  'hosted generation cannot run without project opt-in'
);
select extensions.is(
  (select status from public.cancel_generation_job((select id from public.generation_jobs where requested_by = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' order by created_at desc limit 1))),
  'cancelled',
  'job authors can cancel running generation'
);
select extensions.throws_ok(
  $$select public.complete_generation_job((select id from public.generation_jobs where requested_by = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' order by created_at desc limit 1), '{}'::jsonb)$$,
  '22023',
  'generation job is not running',
  'cancelled jobs cannot be completed'
);
select extensions.throws_ok(
  $$insert into public.candidates (id, draft_id, name, asset_id, validation_run_id, generation_job_id, prompt_sha256, provenance, created_by)
    select '18181818-1818-4818-8818-181818181818', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Forged provenance', c.asset_id, c.validation_run_id,
      gj.id, repeat('e', 64), '{"kind":"generated","disclosed":true}'::jsonb, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    from public.candidates c cross join public.generation_jobs gj
    where c.id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' and gj.requested_by = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    order by gj.created_at desc limit 1$$,
  '23514',
  'candidate requires its author completed generation job and matching prompt hash',
  'candidate provenance cannot link to an unfinished generation job'
);
reset role;

update public.candidates
set asset_id = '66666666-6666-4666-8666-666666666666'
where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

insert into public.asset_blobs (id, project_id, storage_bucket, storage_path, byte_size, sha256, sanitization_status, created_by) values
  ('15151515-1515-4515-8515-151515151515', '22222222-2222-4222-8222-222222222222', 'source-assets', '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/dddddddd-dddd-4ddd-8ddd-dddddddddddd/15151515-1515-4515-8515-151515151515/source.svg', 128, repeat('d', 64), 'passed', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.validation_runs (id, project_id, target_type, target_id, validator_version, status, created_by) values
  ('16161616-1616-4616-8616-161616161616', '22222222-2222-4222-8222-222222222222', 'candidate', '17171717-1717-4717-8717-171717171717', 'formaglyph-svg/0.1.0', 'failed', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.candidates (id, draft_id, name, description, asset_id, validation_run_id, created_by) values
  ('17171717-1717-4717-8717-171717171717', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Failed validation', 'Safe markup with a failing style check.', '15151515-1515-4515-8515-151515151515', '16161616-1616-4616-8616-161616161616', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);
select extensions.throws_ok(
  $$select public.submit_proposal('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '17171717-1717-4717-8717-171717171717', '1.0.0')$$,
  '22023',
  'Regular and Solid candidates with passing validation are required',
  'a failed validation run cannot be submitted for review'
);
select extensions.is(
  (select status from public.submit_proposal('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '1.0.0')),
  'in_review',
  'contributor can submit a valid proposal'
);
select extensions.throws_ok(
  $$select public.comment_proposal((select id from public.proposals where draft_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'), 'Self review', 'The author should not add a privileged review comment.')$$,
  '42501',
  'authors cannot review their own proposal',
  'proposal authors cannot add reviewer comments'
);
select extensions.throws_ok(
  $$select public.review_proposal((select id from public.proposals where draft_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'), 'approve', 'self review')$$,
  '42501',
  'authors cannot review their own proposal'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', true);
select extensions.throws_ok(
  $$select public.review_proposal((select id from public.proposals where draft_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'), 'request_changes', 'too short')$$,
  '22023',
  'a decision note of at least 10 characters is required',
  'change requests require an actionable decision note'
);
select extensions.is(
  (select decision from public.comment_proposal(
    (select id from public.proposals where draft_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
    'Geometry',
    'The shoulder alignment now matches the project keyline.'
  )),
  'comment',
  'a non-author reviewer can add a review comment'
);
select extensions.ok(
  (select resolved from public.resolve_review(
    (select id from public.reviews where decision = 'comment' and title = 'Geometry' order by created_at desc limit 1),
    true
  )),
  'a comment author can resolve their review comment'
);
select extensions.ok(
  (select count(*) > 0 from public.audit_events where action = 'review.comment_added'),
  'review comments produce immutable audit events'
);
select extensions.throws_ok(
  $$select public.deprecate_icon('99999999-9999-4999-8999-999999999999', 'The icon is replaced by a more precise system concept.')$$,
  '42501',
  'admin permission required',
  'reviewers cannot deprecate published icons'
);
select extensions.is(
  (select status from public.review_proposal((select id from public.proposals where draft_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'), 'approve', 'reviewed')),
  'approved',
  'a non-author reviewer can approve'
);
reset role;

insert into public.asset_blobs (id, project_id, storage_bucket, storage_path, byte_size, sha256, sanitization_status, created_by)
select case cva.variant
    when 'regular' then '19191919-1919-4919-8919-191919191919'::uuid
    else '20202020-2020-4020-8020-202020202020'::uuid
  end,
  p.project_id, 'published-assets',
  pr.organization_id::text || '/' || p.project_id::text || '/' || p.draft_id::text || '/' || p.id::text || '/' || p.candidate_id::text || '/' || cva.variant || '.svg',
  source.byte_size, source.sha256, 'passed', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
from public.proposals p
join public.projects pr on pr.id = p.project_id
join public.candidate_variant_assets cva on cva.candidate_id = p.candidate_id
join public.asset_blobs source on source.id = cva.asset_id
where p.draft_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
select extensions.throws_ok(
  $$select public.reopen_approved_proposal((select id from public.proposals where draft_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'))$$,
  '22023',
  'approved proposal already has both variants',
  'paired approved proposals cannot be returned as legacy single-weight repairs'
);
select extensions.is(
  (select version from public.publish_proposal((select id from public.proposals where draft_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'))),
  '1.0.0',
  'an admin can publish an approved proposal'
);
select extensions.is(
  (select count(*)::integer from public.icon_versions where version = '1.0.0' and icon_id = (select icon_id from public.drafts where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd')),
  2,
  'publication stores immutable Regular and Solid versions together'
);
select extensions.ok(
  has_function_privilege('anon', 'public.list_public_catalog_assets()', 'execute'),
  'anonymous catalog callers can request eligible public assets'
);
insert into storage.objects (bucket_id, name)
select storage_bucket, storage_path from public.asset_blobs
where id in ('66666666-6666-4666-8666-666666666666', '19191919-1919-4919-8919-191919191919', '20202020-2020-4020-8020-202020202020');
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('storage.operation', 'object.get_authenticated', true);
select extensions.is(
  (select count(*)::integer from storage.objects where bucket_id = 'published-assets'),
  2,
  'anonymous authenticated-download requests see only paired public published objects'
);
select set_config('storage.operation', 'object.list', true);
select extensions.is(
  (select count(*)::integer from storage.objects where bucket_id = 'published-assets'),
  0,
  'anonymous callers cannot list private-bucket object names'
);
select set_config('storage.operation', 'object.get_authenticated', true);
select extensions.is(
  (select count(*)::integer from public.list_public_catalog_assets()),
  2,
  'a complete public release exposes exactly Regular and Solid while an incomplete legacy release stays out'
);
reset role;
update public.projects set visibility = 'private' where id = '22222222-2222-4222-8222-222222222222';
set local role anon;
select extensions.is(
  (select count(*)::integer from public.list_public_catalog_assets()),
  0,
  'changing a project to private removes its assets from anonymous catalog reads'
);
select extensions.is(
  (select count(*)::integer from storage.objects where bucket_id = 'published-assets'),
  0,
  'changing a project to private also removes anonymous Storage download access'
);
reset role;
update public.projects set visibility = 'public' where id = '22222222-2222-4222-8222-222222222222';
set local role anon;
select extensions.is(
  (select count(*)::integer from public.list_public_catalog_assets()),
  2,
  'restoring public visibility restores only the complete paired release'
);
reset role;
select extensions.ok(
  not has_function_privilege('anon', 'public.set_project_visibility(uuid,text)', 'execute'),
  'anonymous callers cannot change project visibility'
);
select extensions.ok(
  not has_function_privilege('anon', 'private.set_project_visibility_impl(uuid,text)', 'execute'),
  'anonymous callers cannot invoke the privileged visibility implementation'
);
select extensions.ok(
  not (select prosecdef from pg_proc where oid = 'public.set_project_visibility(uuid,text)'::regprocedure),
  'the exposed visibility RPC executes as the caller'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);
select extensions.throws_ok(
  $$select public.set_project_visibility('22222222-2222-4222-8222-222222222222', 'private')$$,
  '42501', 'admin permission required', 'contributors cannot change project visibility'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
select extensions.is((select count(*)::integer from public.icons where status = 'published'), 2, 'published icon is visible in the catalog');
select extensions.is(
  (select visibility from public.set_project_visibility('22222222-2222-4222-8222-222222222222', 'private')),
  'private', 'an admin can make a project private'
);
select extensions.is(
  (select metadata->>'previous' from public.audit_events where action = 'project.visibility_changed' order by created_at desc limit 1),
  'public', 'visibility changes write a transactional audit record'
);
select extensions.throws_ok(
  $$select public.set_project_visibility('22222222-2222-4222-8222-222222222222', 'public')$$,
  '22023',
  'all published icons need a validated MIT-licensed Regular and Solid pair before this project can be public',
  'an incomplete legacy release blocks public visibility'
);
select extensions.is(
  (select status from public.deprecate_icon(
    '99999999-9999-4999-8999-999999999999',
    'Replaced by the reviewed check-circle family.'
  )),
  'deprecated',
  'an admin can deprecate a published icon'
);
select extensions.is(
  (select metadata->>'reason' from public.audit_events where action = 'icon.deprecated' order by created_at desc limit 1),
  'Replaced by the reviewed check-circle family.',
  'deprecation audit events retain the required reason'
);
select extensions.is(
  (select visibility from public.set_project_visibility('22222222-2222-4222-8222-222222222222', 'public')),
  'public', 'an admin can expose the project after incomplete releases are removed'
);
reset role;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select extensions.is(
  (select count(*)::integer from public.icons),
  1,
  'deprecated icons leave the public catalog while immutable versions remain stored'
);
reset role;

select extensions.throws_ok(
  $$update public.audit_events set action = 'tampered' where id = (select min(id) from public.audit_events)$$,
  '55000',
  'audit events are immutable'
);
select extensions.ok((select count(*) >= 4 from public.audit_events), 'workflow writes audit events transactionally');

select extensions.has_table('private', 'project_access_tokens', 'project access tokens are kept outside the Data API schema');
select extensions.ok(
  not has_function_privilege('anon', 'public.issue_project_token(uuid,text,integer)', 'execute'),
  'anonymous callers cannot issue project tokens'
);
select extensions.ok(
  has_function_privilege('anon', 'public.create_agent_draft(text,text,text,text[])', 'execute'),
  'anonymous MCP transport can exchange a scoped project token for a draft handoff'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
create temp table issued_agent_token on commit drop as
  select * from public.issue_project_token(
    '22222222-2222-4222-8222-222222222222',
    'pgTAP handoff',
    30
  );
select extensions.matches((select token from issued_agent_token), '^fgp_[a-f0-9]{48}$', 'admins receive a high-entropy token once');
reset role;
select extensions.is(
  (select char_length(token_hash) from private.project_access_tokens where id = (select id from issued_agent_token)),
  64,
  'only a SHA-256 token hash is stored'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
select extensions.is(
  (select count(*)::integer from public.list_project_tokens('22222222-2222-4222-8222-222222222222')),
  1,
  'admins can list safe token summaries'
);
reset role;
select set_config('test.agent_token', (select token from issued_agent_token), true);
select set_config('test.agent_token_id', (select id::text from issued_agent_token), true);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);
select extensions.throws_ok(
  $$select public.issue_project_token('22222222-2222-4222-8222-222222222222', 'Contributor token', 30)$$,
  '42501',
  'admin permission required',
  'contributors cannot issue agent credentials'
);
reset role;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select extensions.throws_ok(
  $$select public.create_agent_draft('fgp_invalid', 'payment-retry', 'Retry a recoverable payment.', array['payment'])$$,
  '28000',
  'invalid or expired project token',
  'invalid project tokens cannot create drafts'
);
create temp table agent_draft_handoff on commit drop as
  select * from public.create_agent_draft(
    current_setting('test.agent_token'),
    'payment-retry',
    'Retry a recoverable payment after a processor failure.',
    array['payment', 'retry']
  );
select extensions.is((select status from agent_draft_handoff), 'draft', 'a valid token creates only a draft');
reset role;
select extensions.is(
  (select selected_candidate_id from public.drafts where id = (select draft_id from agent_draft_handoff)),
  null,
  'agent handoff cannot attach or select an SVG candidate'
);

select extensions.is(
  (select source from public.audit_events where target_id = (select draft_id from agent_draft_handoff)),
  'mcp',
  'agent draft creation writes an MCP audit event'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
select extensions.ok(
  (select revoked_at is not null from public.revoke_project_token(current_setting('test.agent_token_id')::uuid)),
  'admins can revoke a project token'
);
reset role;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select extensions.throws_ok(
  format(
    'select public.create_agent_draft(%L, %L, %L, array[%L])',
    current_setting('test.agent_token'),
    'payment-retry-later',
    'Retry another recoverable payment.',
    'payment'
  ),
  '28000',
  'invalid or expired project token',
  'revoked project tokens stop working immediately'
);
reset role;

-- A pre-pair approved proposal cannot be published. An admin must return it
-- to its author at the next available version, with an audit record.
select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);
insert into public.drafts (id, project_id, icon_id, name, status, created_by) values
  ('21212121-2121-4212-8212-212121212121', '22222222-2222-4222-8222-222222222222',
    (select icon_id from public.drafts where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
    'legacy-regular-only', 'approved', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.asset_blobs (id, project_id, storage_bucket, storage_path, byte_size, sha256, sanitization_status, created_by) values
  ('25252525-2525-4252-8252-252525252525', '22222222-2222-4222-8222-222222222222', 'source-assets',
    '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/21212121-2121-4212-8212-212121212121/25252525-2525-4252-8252-252525252525/regular.svg',
    128, repeat('b', 64), 'passed', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.validation_runs (id, project_id, target_type, target_id, validator_version, status, created_by) values
  ('24242424-2424-4242-8242-242424242424', '22222222-2222-4222-8222-222222222222', 'candidate',
    '23232323-2323-4232-8232-232323232323', 'formaglyph-svg/0.1.0', 'passed', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.candidates (id, draft_id, name, asset_id, validation_run_id, created_by) values
  ('23232323-2323-4232-8232-232323232323', '21212121-2121-4212-8212-212121212121', 'Legacy Regular',
    '25252525-2525-4252-8252-252525252525', '24242424-2424-4242-8242-242424242424', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.candidate_variant_assets (candidate_id, variant, asset_id, validation_run_id) values
  ('23232323-2323-4232-8232-232323232323', 'regular', '25252525-2525-4252-8252-252525252525', '24242424-2424-4242-8242-242424242424');
update public.drafts set selected_candidate_id = '23232323-2323-4232-8232-232323232323' where id = '21212121-2121-4212-8212-212121212121';
insert into public.proposals (id, project_id, draft_id, candidate_id, status, target_version, author_id) values
  ('26262626-2626-4262-8262-262626262626', '22222222-2222-4222-8222-222222222222',
    '21212121-2121-4212-8212-212121212121', '23232323-2323-4232-8232-232323232323',
    'approved', '1.0.0', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

set local role authenticated;
select extensions.throws_ok(
  $$select public.reopen_approved_proposal('26262626-2626-4262-8262-262626262626')$$,
  '42501', 'admin permission required', 'a contributor cannot return an approved legacy proposal'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
select extensions.is(
  (select status from public.reopen_approved_proposal('26262626-2626-4262-8262-262626262626')),
  'changes_requested', 'an admin returns a Regular-only proposal for a complete pair'
);
select extensions.is(
  (select target_version from public.proposals where id = '26262626-2626-4262-8262-262626262626'),
  '1.0.1', 'returned legacy proposal advances past the existing published version'
);
select extensions.is(
  (select count(*)::integer from public.audit_events where action = 'proposal.pair_requested' and target_id = '26262626-2626-4262-8262-262626262626'),
  1, 'returning a legacy proposal writes an audit event'
);
reset role;

select * from extensions.finish();
rollback;
