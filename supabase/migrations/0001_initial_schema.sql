create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  display_name text,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  display_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'active' check (status in ('draft','active','archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  participant_count integer not null default 0 check (participant_count >= 0),
  enabled boolean not null default true,
  sort_order integer not null default 0,
  allow_repeat_win boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, name)
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete restrict,
  participant_code text not null,
  name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, participant_code)
);

create table public.prizes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  description text,
  total_draws integer not null default 1 check (total_draws > 0),
  completed_draws integer not null default 0 check (completed_draws >= 0),
  draw_count_per_round integer not null default 1 check (draw_count_per_round > 0),
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.draw_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  prize_id uuid not null references public.prizes(id) on delete restrict,
  status text not null default 'spinning' check (status in ('idle','spinning','stop_requested','revealed','cancelled')),
  candidate_group_snapshot jsonb not null default '[]'::jsonb,
  started_at timestamptz default now(),
  stop_requested_at timestamptz,
  reveal_at timestamptz,
  revealed_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.draw_results (
  id uuid primary key default gen_random_uuid(),
  draw_session_id uuid not null references public.draw_sessions(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  prize_id uuid not null references public.prizes(id) on delete restrict,
  group_id uuid not null references public.groups(id) on delete restrict,
  result_order integer not null default 1,
  revoked boolean not null default false,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (draw_session_id, group_id)
);

create table public.event_runtime (
  event_id uuid primary key references public.events(id) on delete cascade,
  phase text not null default 'idle' check (phase in ('idle','accelerating','spinning','decelerating','suspense','revealed','emergency')),
  current_draw_session_id uuid references public.draw_sessions(id) on delete set null,
  current_prize_id uuid references public.prizes(id) on delete set null,
  selected_group_ids uuid[] not null default '{}',
  revision integer not null default 1,
  settings jsonb not null default '{
    "acceleration_ms": 1500,
    "deceleration_ms": 2500,
    "suspense_ms": 1000,
    "shake_strength": 4,
    "animation_enabled": true,
    "music_enabled": true,
    "tension_volume": 0.55,
    "reveal_volume": 0.75,
    "keyboard_shortcuts_enabled": true,
    "allow_group_repeat_win": false,
    "exclude_prize_winners": true,
    "exclude_event_winners": false
  }'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.audio_assets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  file_url text not null,
  file_type text not null check (file_type in ('mp3','wav','m4a')),
  audio_role text not null check (audio_role in ('tension','reveal')),
  volume numeric not null default 0.7 check (volume >= 0 and volume <= 1),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.display_connections (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  connection_id text not null,
  last_seen_at timestamptz not null default now(),
  audio_unlocked boolean not null default false,
  user_agent text,
  unique (event_id, connection_id)
);

create index groups_event_sort_idx on public.groups(event_id, sort_order);
create index participants_event_group_idx on public.participants(event_id, group_id);
create index prizes_event_sort_idx on public.prizes(event_id, sort_order);
create index draw_sessions_event_status_idx on public.draw_sessions(event_id, status, created_at desc);
create index draw_results_event_prize_idx on public.draw_results(event_id, prize_id, created_at desc);
create index draw_results_group_idx on public.draw_results(group_id) where revoked = false;
create index display_connections_seen_idx on public.display_connections(event_id, last_seen_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_touch before update on public.events
for each row execute function public.touch_updated_at();
create trigger groups_touch before update on public.groups
for each row execute function public.touch_updated_at();
create trigger participants_touch before update on public.participants
for each row execute function public.touch_updated_at();
create trigger prizes_touch before update on public.prizes
for each row execute function public.touch_updated_at();

create or replace function public.refresh_group_participant_counts(p_event_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.groups g
  set participant_count = counts.total
  from (
    select group_id, count(*)::integer as total
    from public.participants
    where event_id = p_event_id
    group by group_id
  ) counts
  where g.id = counts.group_id and g.event_id = p_event_id;

  update public.groups g
  set participant_count = 0
  where g.event_id = p_event_id
    and not exists (
      select 1 from public.participants p where p.group_id = g.id
    );
$$;

create or replace function public.seed_event_defaults(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  prize_id uuid;
begin
  insert into public.groups(event_id, name, participant_count, enabled, sort_order)
  values
    (p_event_id, '第一组', 0, true, 1),
    (p_event_id, '第二组', 0, true, 2),
    (p_event_id, '第三组', 0, true, 3),
    (p_event_id, '第四组', 0, true, 4),
    (p_event_id, '第五组', 0, true, 5),
    (p_event_id, '第六组', 0, true, 6)
  on conflict do nothing;

  insert into public.prizes(event_id, name, description, total_draws, draw_count_per_round, enabled, sort_order)
  values
    (p_event_id, '幸运奖', '现场互动奖品', 3, 1, true, 1),
    (p_event_id, '神秘礼', '课程专属礼品', 2, 1, true, 2),
    (p_event_id, '互动奖', '互动环节奖励', 2, 1, true, 3),
    (p_event_id, '惊喜奖', '压轴惊喜礼物', 1, 1, true, 4)
  on conflict do nothing;

  select id into prize_id
  from public.prizes
  where event_id = p_event_id and enabled = true
  order by sort_order
  limit 1;

  insert into public.event_runtime(event_id, current_prize_id)
  values (p_event_id, prize_id)
  on conflict (event_id) do nothing;
end;
$$;

create or replace function public.start_draw_session(
  p_event_slug text,
  p_prize_id uuid,
  p_admin_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_prize public.prizes%rowtype;
  v_runtime public.event_runtime%rowtype;
  v_snapshot jsonb;
  v_session public.draw_sessions%rowtype;
begin
  select * into v_event from public.events where slug = p_event_slug and status = 'active';
  if not found then
    raise exception '活动不存在或未启用';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_event.id::text));

  select * into v_runtime from public.event_runtime where event_id = v_event.id for update;
  if v_runtime.phase in ('spinning', 'accelerating', 'decelerating', 'suspense') then
    raise exception '当前已有抽奖正在进行';
  end if;

  if p_prize_id is not null then
    select * into v_prize from public.prizes
    where id = p_prize_id and event_id = v_event.id and enabled = true;
  else
    select * into v_prize from public.prizes
    where event_id = v_event.id and enabled = true and completed_draws < total_draws
    order by sort_order
    limit 1;
  end if;

  if not found then
    raise exception '没有可用奖项';
  end if;

  with candidates as (
    select g.*
    from public.groups g
    where g.event_id = v_event.id and g.enabled = true
      and (
        coalesce((v_runtime.settings ->> 'exclude_event_winners')::boolean, false) = false
        or not exists (
          select 1 from public.draw_results r
          where r.event_id = v_event.id and r.group_id = g.id and r.revoked = false
        )
      )
      and (
        coalesce((v_runtime.settings ->> 'exclude_prize_winners')::boolean, true) = false
        or not exists (
          select 1 from public.draw_results r
          where r.event_id = v_event.id
            and r.prize_id = v_prize.id
            and r.group_id = g.id
            and r.revoked = false
        )
      )
  )
  select coalesce(jsonb_agg(to_jsonb(candidates) order by sort_order), '[]'::jsonb)
  into v_snapshot
  from candidates;

  if jsonb_array_length(v_snapshot) = 0 then
    raise exception '没有可参与抽奖的组别';
  end if;

  insert into public.draw_sessions(
    event_id, prize_id, status, candidate_group_snapshot, started_at, created_by
  )
  values (v_event.id, v_prize.id, 'spinning', v_snapshot, now(), p_admin_id)
  returning * into v_session;

  update public.event_runtime
  set phase = 'spinning',
      current_draw_session_id = v_session.id,
      current_prize_id = v_prize.id,
      selected_group_ids = '{}',
      revision = revision + 1,
      updated_at = now()
  where event_id = v_event.id;

  return to_jsonb(v_session);
end;
$$;

create or replace function public.stop_draw_session(
  p_event_slug text,
  p_admin_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_runtime public.event_runtime%rowtype;
  v_session public.draw_sessions%rowtype;
  v_prize public.prizes%rowtype;
  v_reveal_at timestamptz;
  v_winners uuid[];
  v_result_group uuid;
  v_index integer := 1;
begin
  select * into v_event from public.events where slug = p_event_slug and status = 'active';
  if not found then
    raise exception '活动不存在或未启用';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_event.id::text));

  select * into v_runtime from public.event_runtime where event_id = v_event.id for update;
  if v_runtime.current_draw_session_id is null then
    raise exception '当前没有正在进行的抽奖';
  end if;

  select * into v_session
  from public.draw_sessions
  where id = v_runtime.current_draw_session_id
  for update;

  if v_session.status in ('stop_requested', 'revealed') then
    return to_jsonb(v_session);
  end if;

  select * into v_prize from public.prizes where id = v_session.prize_id for update;
  v_reveal_at := now()
    + interval '300 milliseconds'
    + (coalesce((v_runtime.settings ->> 'deceleration_ms')::integer, 2500)::text || ' milliseconds')::interval
    + (coalesce((v_runtime.settings ->> 'suspense_ms')::integer, 1000)::text || ' milliseconds')::interval;

  select array_agg((item ->> 'id')::uuid)
  into v_winners
  from (
    select item
    from jsonb_array_elements(v_session.candidate_group_snapshot) item
    order by gen_random_uuid()
    limit v_prize.draw_count_per_round
  ) picked;

  if v_winners is null or array_length(v_winners, 1) = 0 then
    raise exception '候选组别为空';
  end if;

  foreach v_result_group in array v_winners loop
    insert into public.draw_results(
      draw_session_id, event_id, prize_id, group_id, result_order
    )
    values (
      v_session.id, v_event.id, v_prize.id, v_result_group, v_index
    )
    on conflict (draw_session_id, group_id) do nothing;
    v_index := v_index + 1;
  end loop;

  update public.draw_sessions
  set status = 'stop_requested',
      stop_requested_at = now(),
      reveal_at = v_reveal_at
  where id = v_session.id
  returning * into v_session;

  update public.prizes
  set completed_draws = least(total_draws, completed_draws + 1)
  where id = v_prize.id;

  update public.event_runtime
  set phase = 'decelerating',
      selected_group_ids = v_winners,
      revision = revision + 1,
      updated_at = now()
  where event_id = v_event.id;

  return to_jsonb(v_session);
end;
$$;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.groups enable row level security;
alter table public.participants enable row level security;
alter table public.prizes enable row level security;
alter table public.draw_sessions enable row level security;
alter table public.draw_results enable row level security;
alter table public.event_runtime enable row level security;
alter table public.audio_assets enable row level security;
alter table public.display_connections enable row level security;

create policy "admins can manage profiles" on public.profiles
  for all to authenticated using (true) with check (true);
create policy "admins can manage events" on public.events
  for all to authenticated using (true) with check (true);
create policy "admins can manage groups" on public.groups
  for all to authenticated using (true) with check (true);
create policy "admins can manage participants" on public.participants
  for all to authenticated using (true) with check (true);
create policy "admins can manage prizes" on public.prizes
  for all to authenticated using (true) with check (true);
create policy "admins can manage sessions" on public.draw_sessions
  for all to authenticated using (true) with check (true);
create policy "admins can manage results" on public.draw_results
  for all to authenticated using (true) with check (true);
create policy "admins can manage runtime" on public.event_runtime
  for all to authenticated using (true) with check (true);
create policy "admins can manage audio" on public.audio_assets
  for all to authenticated using (true) with check (true);
create policy "admins can manage display connections" on public.display_connections
  for all to authenticated using (true) with check (true);

create policy "anonymous can observe runtime only" on public.event_runtime
  for select to anon using (true);

insert into storage.buckets (id, name, public)
values ('raffle-audio', 'raffle-audio', true)
on conflict (id) do nothing;

create policy "authenticated users upload raffle audio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'raffle-audio');

create policy "public can read raffle audio" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'raffle-audio');
