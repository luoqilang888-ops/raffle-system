insert into public.events(name, slug, display_token, status)
values ('会场抽奖', 'demo-event', 'demo-display-token', 'active')
on conflict (slug) do update set name = excluded.name
returning id;

do $$
declare
  v_event_id uuid;
begin
  select id into v_event_id from public.events where slug = 'demo-event';
  perform public.seed_event_defaults(v_event_id);
end;
$$;
