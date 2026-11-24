create table public.agentc_projects (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (id ~ '^[A-Za-z0-9_-]{1,100}$'),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  brief text not null default '' check (char_length(brief) <= 2000),
  created_at timestamptz not null default now(),
  document jsonb check (
    document is null or (
      jsonb_typeof(document) = 'object' and
      coalesce(jsonb_typeof(document->'schema') = 'object', false) and
      coalesce(jsonb_typeof(document->'store') = 'object', false) and
      octet_length(document::text) <= 2000000
    )
  ),
  revision uuid default gen_random_uuid() not null,
  primary key (owner_id, id)
);

alter table public.agentc_projects enable row level security;
revoke all on public.agentc_projects from public, anon, authenticated;
grant select on public.agentc_projects to authenticated;
grant insert (id, name, brief, document) on public.agentc_projects to authenticated;

create policy "Owners can read projects" on public.agentc_projects
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "Owners can create projects" on public.agentc_projects
  for insert to authenticated with check (owner_id = (select auth.uid()));

create function public.agentc_save_document(
  project_id text, expected_revision uuid, next_document jsonb
) returns uuid
language sql security definer set search_path = ''
as $$
  update public.agentc_projects
     set document = next_document, revision = gen_random_uuid()
   where id = project_id and owner_id = (select auth.uid())
     and revision = expected_revision and next_document is not null
  returning revision;
$$;

revoke all on function public.agentc_save_document(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.agentc_save_document(text, uuid, jsonb) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'agentc-board-media', 'agentc-board-media', false, 10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/bmp',
        'video/mp4', 'video/webm', 'video/quicktime']
);

create policy "Owners can read board media" on storage.objects
  for select to authenticated using (
    bucket_id = 'agentc-board-media' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Owners can upload board media" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'agentc-board-media' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Owners can retry board media uploads" on storage.objects
  for update to authenticated using (
    bucket_id = 'agentc-board-media' and (storage.foldername(name))[1] = (select auth.uid())::text
  ) with check (
    bucket_id = 'agentc-board-media' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
