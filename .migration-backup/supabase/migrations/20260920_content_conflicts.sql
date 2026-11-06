create or replace function public.save_portfolio_draft(p_content jsonb, p_expected_version integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare next_version integer;
begin
  if not public.is_portfolio_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  if jsonb_typeof(p_content) <> 'object' or octet_length(p_content::text) > 1000000 or jsonb_typeof(p_content->'projects') <> 'array' then raise exception 'Invalid content'; end if;
  update public.portfolio_content set content = p_content, version = version + 1, updated_at = now(), updated_by = auth.uid()
    where id = 'draft' and version = p_expected_version returning version into next_version;
  if next_version is null then raise exception 'This draft changed in another session. Export your changes, then reload.' using errcode = 'PT409'; end if;
  return next_version;
end;
$$;
revoke all on function public.save_portfolio_draft(jsonb, integer) from public, anon;
grant execute on function public.save_portfolio_draft(jsonb, integer) to authenticated;

create or replace function public.publish_portfolio(p_draft_version integer, p_published_version integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare draft public.portfolio_content; published public.portfolio_content; next_version integer;
begin
  if not public.is_portfolio_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  select * into draft from public.portfolio_content where id = 'draft' for update;
  select * into published from public.portfolio_content where id = 'published' for update;
  if draft.version <> p_draft_version or published.version <> p_published_version then raise exception 'Content changed in another session. Reload before publishing.' using errcode = 'PT409'; end if;
  update public.portfolio_content set content = draft.content, version = version + 1, updated_at = now(), updated_by = auth.uid()
    where id = 'published' returning version into next_version;
  insert into public.portfolio_revisions(content, published_by) values (draft.content, auth.uid());
  return next_version;
end;
$$;
revoke all on function public.publish_portfolio(integer, integer) from public, anon;
grant execute on function public.publish_portfolio(integer, integer) to authenticated;

