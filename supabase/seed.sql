-- Development-only seed data. The Phosphor-derived fixture metadata below must
-- never be promoted as the public Formaglyph library.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'admin@formaglyph.local', extensions.crypt('local-admin-only', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Admin"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'contributor@formaglyph.local', extensions.crypt('local-contributor-only', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Contributor"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'authenticated', 'authenticated', 'reviewer@formaglyph.local', extensions.crypt('local-reviewer-only', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Reviewer"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into public.organizations (id, slug, name, created_by) values
  ('11111111-1111-4111-8111-111111111111', 'formaglyph-dev', 'Formaglyph Development', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

insert into public.memberships (organization_id, user_id, role) values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'admin'),
  ('11111111-1111-4111-8111-111111111111', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'contributor'),
  ('11111111-1111-4111-8111-111111111111', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'reviewer');

insert into public.projects (id, organization_id, slug, name, visibility, created_by) values
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'core', 'Formaglyph Core', 'public', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'experiments', 'Formaglyph Experiments', 'private', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

insert into public.style_profiles (id, project_id, name, created_by) values
  ('44444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222222', 'Formaglyph Core', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.style_profile_versions (id, style_profile_id, version, status, rules, created_by) values
  ('55555555-5555-4555-8555-555555555555', '44444444-4444-4444-8444-444444444444', 1, 'published', '{"grid":24,"stroke":2,"variants":["regular","solid"],"joins":"round"}', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
update public.projects set default_style_profile_id = '44444444-4444-4444-8444-444444444444' where id = '22222222-2222-4222-8222-222222222222';

insert into public.asset_blobs (id, project_id, storage_bucket, storage_path, byte_size, sha256, sanitization_status, created_by) values
  ('66666666-6666-4666-8666-666666666666', '22222222-2222-4222-8222-222222222222', 'published-assets', '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/99999999-9999-4999-8999-999999999999/12121212-1212-4212-8212-121212121212/regular.svg', 284, repeat('a', 64), 'passed', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('77777777-7777-4777-8777-777777777777', '22222222-2222-4222-8222-222222222222', 'source-assets', '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/dddddddd-dddd-4ddd-8ddd-dddddddddddd/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/regular/77777777-7777-4777-8777-777777777777.svg', 312, repeat('b', 64), 'passed', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  ('78787878-7878-4787-8787-787878787878', '22222222-2222-4222-8222-222222222222', 'source-assets', '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/dddddddd-dddd-4ddd-8ddd-dddddddddddd/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/solid/78787878-7878-4787-8787-787878787878.svg', 264, repeat('c', 64), 'passed', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

insert into public.validation_runs (id, project_id, target_type, target_id, validator_version, status, summary, created_by) values
  ('88888888-8888-4888-8888-888888888888', '22222222-2222-4222-8222-222222222222', 'icon_version', '12121212-1212-4212-8212-121212121212', 'formaglyph-validator/0.1.0', 'passed', '{"checks":8,"fixture":true}', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('89898989-8989-4989-8989-898989898989', '22222222-2222-4222-8222-222222222222', 'candidate', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'formaglyph-svg/0.1.0', 'passed', '{"safe":true,"fixture":true,"variant":"regular"}', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  ('90909090-9090-4090-8090-909090909090', '22222222-2222-4222-8222-222222222222', 'candidate', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'formaglyph-svg/0.1.0', 'passed', '{"safe":true,"fixture":true,"variant":"solid"}', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

insert into public.icons (id, stable_id, project_id, canonical_name, label, description, category, status, licence, created_by) values
  ('99999999-9999-4999-8999-999999999999', 'ico_dev_circle_check', '22222222-2222-4222-8222-222222222222', 'circle-check', 'Circle check', 'Development fixture for the published catalog path.', 'Status', 'published', 'MIT', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.icon_versions (id, icon_id, version, variant, source_asset_id, optimized_asset_id, validation_run_id, content_hash, metadata, provenance, created_by) values
  ('12121212-1212-4212-8212-121212121212', '99999999-9999-4999-8999-999999999999', '0.0.1', 'regular', '66666666-6666-4666-8666-666666666666', '66666666-6666-4666-8666-666666666666', '88888888-8888-4888-8888-888888888888', repeat('a', 64), '{"fixture":true}', '{"kind":"development-fixture","source":"Phosphor Icons","deploy":false}', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
update public.icons set current_version_id = '12121212-1212-4212-8212-121212121212' where id = '99999999-9999-4999-8999-999999999999';
insert into public.icon_aliases (icon_id, alias, kind, reviewed, created_by) values
  ('99999999-9999-4999-8999-999999999999', 'success', 'synonym', true, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

insert into public.drafts (id, project_id, name, description, keywords, status, created_by) values
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '22222222-2222-4222-8222-222222222222', 'cloud-upload', 'Upload to cloud storage.', array['upload','cloud'], 'draft', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.candidates (id, draft_id, name, description, asset_id, validation_run_id, created_by) values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Balanced aperture', 'Development candidate fixture.', '77777777-7777-4777-8777-777777777777', '89898989-8989-4989-8989-898989898989', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.candidate_variant_assets (candidate_id, variant, asset_id, validation_run_id) values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'regular', '77777777-7777-4777-8777-777777777777', '89898989-8989-4989-8989-898989898989'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'solid', '78787878-7878-4787-8787-787878787878', '90909090-9090-4090-8090-909090909090');
update public.drafts set selected_candidate_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

insert into public.audit_events (organization_id, project_id, actor_id, action, target_type, target_id, source, metadata) values
  ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'development.seeded', 'project', '22222222-2222-4222-8222-222222222222', 'seed', '{"fixtures_only":true}');
