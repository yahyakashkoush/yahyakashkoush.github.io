-- Public content and private workspace data are deliberately separate rows.
create table public.portfolio_admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.portfolio_admins enable row level security;
revoke all on public.portfolio_admins from anon, authenticated;

create function public.is_portfolio_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u join public.portfolio_admins a on a.email = lower(u.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.is_portfolio_admin() from public, anon;
grant execute on function public.is_portfolio_admin() to authenticated;

create table public.portfolio_content (
  id text primary key check (id in ('draft', 'published')),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.portfolio_content enable row level security;
revoke all on public.portfolio_content from anon, authenticated;
grant select on public.portfolio_content to anon, authenticated;
create policy "Published content is readable" on public.portfolio_content for select to anon, authenticated using (id = 'published');
create policy "Administrators can read drafts" on public.portfolio_content for select to authenticated using ((select public.is_portfolio_admin()));

create table public.portfolio_revisions (
  id bigint generated always as identity primary key,
  content jsonb not null,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id)
);
alter table public.portfolio_revisions enable row level security;
revoke all on public.portfolio_revisions from anon, authenticated;
grant select on public.portfolio_revisions to authenticated;
create policy "Only administrators read revisions" on public.portfolio_revisions for select to authenticated using ((select public.is_portfolio_admin()));

create function public.save_portfolio_draft(p_content jsonb, p_expected_version integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare next_version integer;
begin
  if not public.is_portfolio_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  if jsonb_typeof(p_content) <> 'object' or octet_length(p_content::text) > 1000000 or jsonb_typeof(p_content->'projects') <> 'array' then raise exception 'Invalid content'; end if;
  update public.portfolio_content set content = p_content, version = version + 1, updated_at = now(), updated_by = auth.uid()
    where id = 'draft' and version = p_expected_version returning version into next_version;
  if next_version is null then raise exception 'This draft changed in another session. Export your changes, then reload.' using errcode = '40001'; end if;
  return next_version;
end;
$$;
revoke all on function public.save_portfolio_draft(jsonb, integer) from public, anon;
grant execute on function public.save_portfolio_draft(jsonb, integer) to authenticated;

create function public.publish_portfolio(p_draft_version integer, p_published_version integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare draft public.portfolio_content; published public.portfolio_content; next_version integer;
begin
  if not public.is_portfolio_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  select * into draft from public.portfolio_content where id = 'draft' for update;
  select * into published from public.portfolio_content where id = 'published' for update;
  if draft.version <> p_draft_version or published.version <> p_published_version then raise exception 'Content changed in another session. Reload before publishing.' using errcode = '40001'; end if;
  update public.portfolio_content set content = draft.content, version = version + 1, updated_at = now(), updated_by = auth.uid()
    where id = 'published' returning version into next_version;
  insert into public.portfolio_revisions(content, published_by) values (draft.content, auth.uid());
  return next_version;
end;
$$;
revoke all on function public.publish_portfolio(integer, integer) from public, anon;
grant execute on function public.publish_portfolio(integer, integer) to authenticated;

create table public.portfolio_messages (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact', 'project')),
  name text not null check (length(name) between 1 and 120),
  email text not null check (length(email) between 3 and 254),
  message text not null check (length(message) between 1 and 12000),
  details jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  note text not null default '' check (length(note) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.portfolio_messages enable row level security;
revoke all on public.portfolio_messages from anon, authenticated;
grant select on public.portfolio_messages to authenticated;
grant update (status, note, updated_at) on public.portfolio_messages to authenticated;
create policy "Administrators read inbox" on public.portfolio_messages for select to authenticated using ((select public.is_portfolio_admin()));
create policy "Administrators triage inbox" on public.portfolio_messages for update to authenticated using ((select public.is_portfolio_admin())) with check ((select public.is_portfolio_admin()));
create index portfolio_messages_created_idx on public.portfolio_messages (created_at desc);
create index portfolio_messages_status_idx on public.portfolio_messages (status);

create table public.portfolio_submission_limits (
  key text primary key,
  window_start timestamptz not null,
  count integer not null
);
alter table public.portfolio_submission_limits enable row level security;
revoke all on public.portfolio_submission_limits from anon, authenticated;

create function public.accept_portfolio_message(p_key text, p_id uuid, p_kind text, p_name text, p_email text, p_message text, p_details jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare requests integer;
begin
  -- This RPC is callable only by the submission edge function's service role.
  if exists(select 1 from public.portfolio_messages where id = p_id) then return p_id; end if;
  insert into public.portfolio_submission_limits(key, window_start, count) values (p_key, now(), 1)
  on conflict (key) do update set
    count = case when public.portfolio_submission_limits.window_start < now() - interval '1 hour' then 1 else public.portfolio_submission_limits.count + 1 end,
    window_start = case when public.portfolio_submission_limits.window_start < now() - interval '1 hour' then now() else public.portfolio_submission_limits.window_start end
  returning count into requests;
  if requests > 5 then raise exception 'Too many messages. Please try again later.' using errcode = 'P0001'; end if;
  insert into public.portfolio_messages(id, kind, name, email, message, details) values (p_id, p_kind, p_name, p_email, p_message, p_details) on conflict (id) do nothing;
  delete from public.portfolio_submission_limits where window_start < now() - interval '2 days';
  return p_id;
end;
$$;
revoke all on function public.accept_portfolio_message(text, uuid, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.accept_portfolio_message(text, uuid, text, text, text, text, jsonb) to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-images', 'portfolio-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
create policy "Administrators list portfolio images" on storage.objects for select to authenticated using (bucket_id = 'portfolio-images' and (select public.is_portfolio_admin()));
create policy "Administrators upload portfolio images" on storage.objects for insert to authenticated with check (bucket_id = 'portfolio-images' and (select public.is_portfolio_admin()));
-- Replacements use new immutable filenames; deletion is intentionally not exposed.
