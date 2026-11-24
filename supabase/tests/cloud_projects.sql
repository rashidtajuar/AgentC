-- Run against an empty test project with the cloud migration applied.
begin;

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'owner@agentc.test'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'other@agentc.test');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);

do $$
declare
  start_revision uuid;
  saved_revision uuid;
  doc jsonb := '{"schema":{"schemaVersion":2},"store":{}}';
begin
  insert into public.agentc_projects (id, name) values ('test-project', 'Private studio');
  insert into public.agentc_projects (id, name) values ('test-project', 'Repeated import')
    on conflict (owner_id, id) do nothing;
  select revision into strict start_revision
    from public.agentc_projects where id = 'test-project' and name = 'Private studio';

  saved_revision := public.agentc_save_document('test-project', start_revision, doc);
  if saved_revision is null or saved_revision = start_revision then
    raise exception 'Owner save did not advance the revision';
  end if;
  if public.agentc_save_document('test-project', start_revision, '{"schema":{},"store":{}}') is not null then
    raise exception 'A stale revision overwrote a project';
  end if;
  if (select document from public.agentc_projects where id = 'test-project') is distinct from doc then
    raise exception 'The valid save was not preserved';
  end if;

  begin
    update public.agentc_projects set document = doc where id = 'test-project';
    raise exception 'The owner bypassed revision-checked saves';
  exception when insufficient_privilege then null;
  end;

  insert into storage.objects (bucket_id, name) values
    ('agentc-board-media', 'aaaaaaaa-0000-4000-8000-000000000001/test-project/test-image');
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000002', true);

  if exists (select from public.agentc_projects where id = 'test-project')
     or public.agentc_save_document('test-project', saved_revision, doc) is not null
     or exists (select from storage.objects where bucket_id = 'agentc-board-media') then
    raise exception 'A second account reached the private project or its media';
  end if;
  begin
    insert into storage.objects (bucket_id, name) values
      ('agentc-board-media', 'aaaaaaaa-0000-4000-8000-000000000001/test-project/other-image');
    raise exception 'A second account uploaded into the owner’s folder';
  exception when insufficient_privilege then null;
  end;
  insert into public.agentc_projects (id, name) values ('test-project', 'Separate account copy');
end $$;

reset role;
set local role anon;
do $$
begin
  if has_table_privilege('public.agentc_projects', 'select')
     or has_function_privilege('public.agentc_save_document(text,uuid,jsonb)', 'execute') then
    raise exception 'An anonymous account has project privileges';
  end if;
end $$;

rollback;
