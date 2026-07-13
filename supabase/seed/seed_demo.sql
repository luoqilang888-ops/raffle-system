insert into public.events(name, slug, display_token, status)
values ('会场抽奖', 'demo-event', 'demo-display-token', 'active')
on conflict (slug) do update set name = excluded.name
returning id;

do $$
declare
  v_event_id uuid;
  v_group_id uuid;
  v_names text[] := array['张三', '李四', '王五', '赵六', '孙七', '周八'];
  v_phones text[] := array['138****1234', '139****5678', '137****2468', '136****1357', '188****9876', '186****6622'];
begin
  select id into v_event_id from public.events where slug = 'demo-event';
  perform public.seed_event_defaults(v_event_id);

  update public.groups
  set participant_count = case name
    when '第一组' then 120
    when '第二组' then 98
    when '第三组' then 110
    when '第四组' then 105
    when '第五组' then 95
    when '第六组' then 102
    else participant_count
  end
  where event_id = v_event_id;

  select id into v_group_id
  from public.groups
  where event_id = v_event_id and name = '第一组'
  limit 1;

  for i in 1..array_length(v_names, 1) loop
    insert into public.participants(event_id, group_id, participant_code, name, phone)
    values (v_event_id, v_group_id, i::text, v_names[i], v_phones[i])
    on conflict (event_id, participant_code) do update
    set name = excluded.name,
        phone = excluded.phone,
        group_id = excluded.group_id;
  end loop;
end;
$$;
