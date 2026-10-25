begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

-- A separately authored draft has the same name as an existing published icon.
insert into public.drafts (id, project_id, name, description, status, created_by)
values ('31313131-3131-4313-8313-313131313131', '22222222-2222-4222-8222-222222222222',
  'circle-check', 'A reviewed two-weight replacement.', 'approved', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.validation_runs (id, project_id, target_type, target_id, validator_version, status, created_by) values
  ('32323232-3232-4323-8323-323232323232', '22222222-2222-4222-8222-222222222222', 'candidate', '34343434-3434-4343-8343-343434343434', 'formaglyph-svg/0.1.0', 'passed', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  ('33333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', 'candidate', '34343434-3434-4343-8343-343434343434', 'formaglyph-svg/0.1.0', 'passed', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.asset_blobs (id, project_id, storage_bucket, storage_path, byte_size, sha256, sanitization_status, created_by)
select case source.id when '77777777-7777-4777-8777-777777777777' then '38383838-3838-4383-8383-383838383838'::uuid else '39393939-3939-4393-8393-393939393939'::uuid end,
  '22222222-2222-4222-8222-222222222222', 'source-assets',
  '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/31313131-3131-4313-8313-313131313131/34343434-3434-4343-8343-343434343434/' || source.id::text || '.svg',
  source.byte_size, source.sha256, 'passed', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
from public.asset_blobs source where source.id in ('77777777-7777-4777-8777-777777777777', '78787878-7878-4787-8787-787878787878');
insert into public.candidates (id, draft_id, name, asset_id, validation_run_id, created_by)
values ('34343434-3434-4343-8343-343434343434', '31313131-3131-4313-8313-313131313131',
  'Reviewed pair', '38383838-3838-4383-8383-383838383838', '32323232-3232-4323-8323-323232323232', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.candidate_variant_assets (candidate_id, variant, asset_id, validation_run_id) values
  ('34343434-3434-4343-8343-343434343434', 'regular', '38383838-3838-4383-8383-383838383838', '32323232-3232-4323-8323-323232323232'),
  ('34343434-3434-4343-8343-343434343434', 'solid', '39393939-3939-4393-8393-393939393939', '33333333-3333-4333-8333-333333333333');
update public.drafts set selected_candidate_id = '34343434-3434-4343-8343-343434343434' where id = '31313131-3131-4313-8313-313131313131';
insert into public.proposals (id, project_id, draft_id, candidate_id, status, target_version, author_id)
values ('35353535-3535-4353-8353-353535353535', '22222222-2222-4222-8222-222222222222',
  '31313131-3131-4313-8313-313131313131', '34343434-3434-4343-8343-343434343434',
  'approved', '0.0.1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.asset_blobs (id, project_id, storage_bucket, storage_path, byte_size, sha256, sanitization_status, created_by)
select case cva.variant when 'regular' then '36363636-3636-4363-8363-363636363636'::uuid else '37373737-3737-4373-8373-373737373737'::uuid end,
  '22222222-2222-4222-8222-222222222222', 'published-assets',
  '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/31313131-3131-4313-8313-313131313131/35353535-3535-4353-8353-353535353535/34343434-3434-4343-8343-343434343434/' || cva.variant || '.svg',
  source.byte_size, source.sha256, 'passed', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
from public.candidate_variant_assets cva
join public.asset_blobs source on source.id = cva.asset_id
where cva.candidate_id = '34343434-3434-4343-8343-343434343434';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);
select extensions.throws_ok(
  $$select public.publish_proposal('35353535-3535-4353-8353-353535353535')$$,
  '42501', 'admin permission required', 'a contributor cannot link or publish the revision'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
select extensions.is(
  (select version from public.publish_proposal('35353535-3535-4353-8353-353535353535')),
  '0.0.2', 'publishing the approved pair advances beyond the existing version'
);
select extensions.is(
  (select icon_id from public.drafts where id = '31313131-3131-4313-8313-313131313131'),
  '99999999-9999-4999-8999-999999999999'::uuid, 'the separate draft is linked to the existing stable icon'
);
select extensions.is(
  (select count(*)::integer from public.icons where canonical_name = 'circle-check'),
  1, 'publication does not create a duplicate canonical icon'
);
select extensions.is(
  (select count(*)::integer from public.icon_versions where icon_id = '99999999-9999-4999-8999-999999999999' and version = '0.0.2'),
  2, 'Regular and Solid share the new immutable version'
);
select extensions.is(
  (select count(*)::integer from public.audit_events where action = 'draft.linked_to_existing_icon' and target_id = '31313131-3131-4313-8313-313131313131'),
  1, 'the identity handoff has an audit event in the publish transaction'
);
reset role;
select * from extensions.finish();
rollback;
