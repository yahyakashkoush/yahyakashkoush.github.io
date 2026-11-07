-- Upgrade the EXISTING portfolio Supabase database. No data is deleted.
-- Run after the original CMS migrations; deploy portfolio-submit afterwards.
begin;

create table public.portfolio_bookings (
  id uuid primary key default gen_random_uuid(),
  message_id uuid unique references public.portfolio_messages(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'blocked', 'cancelled')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  constraint portfolio_bookings_no_overlap exclude using gist
    (tstzrange(starts_at, ends_at, '[)') with &&)
    where (status in ('requested', 'confirmed', 'blocked'))
);
alter table public.portfolio_bookings enable row level security;
revoke all on public.portfolio_bookings from anon, authenticated;
grant select on public.portfolio_bookings to authenticated;
create policy "Only administrators read bookings" on public.portfolio_bookings
  for select to authenticated using ((select public.is_portfolio_admin()));
create index portfolio_bookings_start_idx on public.portfolio_bookings(starts_at);

-- Preserve historical requests. Hold the earliest non-overlapping future slot;
-- flag any pre-existing duplicates rather than silently dropping their messages.
do $$
declare item record; zone text; instant timestamptz;
begin
  for item in select id, details from public.portfolio_messages
    where kind = 'project' and status <> 'archived'
      and details ? 'preferredDate' and details ? 'preferredTime'
    order by created_at, id
  loop
    begin
      zone := coalesce(item.details->>'timeZone', 'Africa/Cairo');
      instant := ((item.details->>'preferredDate') || ' ' || (item.details->>'preferredTime'))::timestamp at time zone zone;
      if instant > now() and coalesce(item.details->>'meetingStatus', '') not ilike '%cancel%' then
        insert into public.portfolio_bookings(message_id, starts_at, ends_at)
          values(item.id, instant, instant + interval '30 minutes');
        update public.portfolio_messages set details = details || jsonb_build_object('meetingStatus', 'Reserved — awaiting confirmation') where id = item.id;
      end if;
    exception
      when exclusion_violation then
        update public.portfolio_messages set details = details || jsonb_build_object('meetingStatus', 'Conflict — contact visitor to reschedule') where id = item.id;
        raise notice 'An existing request overlaps a reserved slot and needs rescheduling.';
      when invalid_datetime_format or datetime_field_overflow or invalid_parameter_value then
        raise notice 'An existing request has an invalid date/time/timezone; review it in the inbox.';
    end;
  end loop;
end;
$$;

-- Public output contains date/time availability only, never visitor details.
create function public.get_portfolio_booking_availability() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare config jsonb; zone text; first_day date; result jsonb;
begin
  select content->'start'->'scheduling' into config from public.portfolio_content where id = 'published';
  if config is null then raise exception 'Scheduling is unavailable'; end if;
  zone := coalesce(config->>'timeZone', 'Africa/Cairo');
  first_day := (now() at time zone zone)::date;
  with days as (
    select first_day + n as day
    from generate_series((config->>'leadTimeDays')::integer, (config->>'horizonDays')::integer) n
    where config->'weekdays' @> to_jsonb(extract(dow from first_day + n)::integer)
  ), slots as (
    select day, s.value as slot,
      (day::text || ' ' || s.value)::timestamp at time zone zone as instant
    from days cross join jsonb_array_elements_text(config->'slots') s
  ), availability as (
    select day, slot, exists (
      select 1 from public.portfolio_bookings b
      where b.status in ('requested','confirmed','blocked')
      and tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(instant, instant + interval '30 minutes', '[)')
    ) as booked
    from slots
  ), per_day as (
    select day,
      coalesce(jsonb_agg(slot order by slot) filter (where not booked), '[]'::jsonb) as open_slots,
      coalesce(jsonb_agg(slot order by slot) filter (where booked), '[]'::jsonb) as booked_slots
    from availability group by day
  )
  select jsonb_build_object(
    'timeZone', zone,
    'dates', coalesce(jsonb_agg(day::text order by day) filter (where jsonb_array_length(open_slots) > 0), '[]'::jsonb),
    'slotsByDate', coalesce(jsonb_object_agg(day::text, open_slots), '{}'::jsonb),
    'bookedByDate', coalesce(jsonb_object_agg(day::text, booked_slots), '{}'::jsonb)
  ) into result from per_day;
  return result;
end;
$$;
revoke all on function public.get_portfolio_booking_availability() from public;
grant execute on function public.get_portfolio_booking_availability() to anon, authenticated;

-- Message and reservation are committed together, or both roll back.
-- The exclusion constraint, not a read-before-write check, resolves races.
create or replace function public.accept_portfolio_message(p_key text, p_id uuid, p_kind text, p_name text, p_email text, p_message text, p_details jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare requests integer; config jsonb; zone text; instant timestamptz; local_day date; days_ahead integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_id::text, 0));
  if exists(select 1 from public.portfolio_messages where id = p_id) then
    if not exists(select 1 from public.portfolio_messages where id = p_id
      and kind = p_kind and name = p_name and email = p_email and message = p_message
      and (p_kind <> 'project' or (
        details->>'preferredDate' is not distinct from p_details->>'preferredDate'
        and details->>'preferredTime' is not distinct from p_details->>'preferredTime'
        and details->>'budget' is not distinct from p_details->>'budget'
      ))) then raise exception 'Request content changed' using errcode = '22023'; end if;
    if p_kind = 'project' and not exists(select 1 from public.portfolio_bookings where message_id = p_id and status in ('requested','confirmed')) then
      raise exception 'This request has no active reservation' using errcode = '23P01';
    end if;
    return p_id;
  end if;
  if p_kind = 'project' then
    select content->'start'->'scheduling' into config from public.portfolio_content where id = 'published';
    if config is null then raise exception 'Scheduling unavailable'; end if;
    zone := coalesce(config->>'timeZone', 'Africa/Cairo');
    local_day := (p_details->>'preferredDate')::date;
    days_ahead := local_day - (now() at time zone zone)::date;
    if days_ahead < (config->>'leadTimeDays')::integer
      or days_ahead > (config->>'horizonDays')::integer
      or not (config->'weekdays' @> to_jsonb(extract(dow from local_day)::integer))
      or not (config->'slots' @> to_jsonb(p_details->>'preferredTime')) then
      raise exception 'This slot is no longer available' using errcode = '23P01';
    end if;
    instant := (local_day::text || ' ' || (p_details->>'preferredTime'))::timestamp at time zone zone;
    if instant <= now() then raise exception 'This slot is in the past' using errcode = '23P01'; end if;
    p_details := p_details || jsonb_build_object('timeZone', zone, 'meetingStatus', 'Reserved — awaiting confirmation');
  end if;
  insert into public.portfolio_submission_limits(key, window_start, count) values (p_key, now(), 1)
  on conflict (key) do update set
    count = case when public.portfolio_submission_limits.window_start < now() - interval '1 hour' then 1 else public.portfolio_submission_limits.count + 1 end,
    window_start = case when public.portfolio_submission_limits.window_start < now() - interval '1 hour' then now() else public.portfolio_submission_limits.window_start end
  returning count into requests;
  if requests > 5 then raise exception 'Too many messages' using errcode = 'P0001'; end if;
  insert into public.portfolio_messages(id, kind, name, email, message, details)
    values (p_id, p_kind, p_name, p_email, p_message, p_details);
  if p_kind = 'project' then
    insert into public.portfolio_bookings(message_id, starts_at, ends_at)
      values(p_id, instant, instant + interval '30 minutes');
  end if;
  delete from public.portfolio_submission_limits where window_start < now() - interval '2 days';
  return p_id;
end;
$$;
revoke all on function public.accept_portfolio_message(text, uuid, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.accept_portfolio_message(text, uuid, text, text, text, text, jsonb) to service_role;

create function public.manage_portfolio_booking(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
declare record public.portfolio_bookings;
begin
  if not public.is_portfolio_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  if p_status not in ('confirmed','cancelled') then raise exception 'Invalid booking status'; end if;
  select * into record from public.portfolio_bookings where id = p_id for update;
  if not found then raise exception 'Booking not found'; end if;
  if record.status = 'cancelled' and p_status = 'confirmed' then raise exception 'Cancelled bookings cannot be reconfirmed. Reserve a new time.'; end if;
  if record.status = 'blocked' and p_status = 'confirmed' then raise exception 'Blocked time is not a meeting'; end if;
  update public.portfolio_bookings set status = p_status where id = p_id;
  if record.message_id is not null then
    update public.portfolio_messages set
      details = details || jsonb_build_object('meetingStatus', case when p_status = 'confirmed' then 'Confirmed' else 'Cancelled — slot reopened' end),
      updated_at = now()
    where id = record.message_id;
  end if;
end;
$$;
revoke all on function public.manage_portfolio_booking(uuid, text) from public, anon;
grant execute on function public.manage_portfolio_booking(uuid, text) to authenticated;

create function public.block_portfolio_time(p_date date, p_time time) returns uuid
language plpgsql security definer set search_path = '' as $$
declare zone text; instant timestamptz; result uuid;
begin
  if not public.is_portfolio_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  select coalesce(content->'start'->'scheduling'->>'timeZone', 'Africa/Cairo') into zone from public.portfolio_content where id = 'published';
  instant := (p_date + p_time) at time zone zone;
  if instant <= now() then raise exception 'Choose a future time'; end if;
  insert into public.portfolio_bookings(starts_at, ends_at, status) values(instant, instant + interval '30 minutes', 'blocked') returning id into result;
  return result;
end;
$$;
revoke all on function public.block_portfolio_time(date, time) from public, anon;
grant execute on function public.block_portfolio_time(date, time) to authenticated;
commit;
