create table if not exists public.parent_daily_checkins (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  checkin_date date not null,
  status text not null check (status in ('completed', 'stuck', 'unfinished')),
  note text null,
  guardian_signal text null check (guardian_signal in ('green', 'yellow', 'red')),
  top_blocker_label text null,
  stuck_stage text null,
  suggested_parent_prompt text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, student_id, checkin_date)
);

create index if not exists idx_parent_daily_checkins_parent_student_date
  on public.parent_daily_checkins(parent_id, student_id, checkin_date desc);

create index if not exists idx_parent_daily_checkins_student_date
  on public.parent_daily_checkins(student_id, checkin_date desc);

comment on table public.parent_daily_checkins is '家长每日陪学状态记录';
comment on column public.parent_daily_checkins.status is '家长每日状态: completed-已完成, stuck-卡住了, unfinished-未完成';
comment on column public.parent_daily_checkins.guardian_signal is '记录当天提交时的红黄绿信号快照';
comment on column public.parent_daily_checkins.top_blocker_label is '记录当天家长看到的最大卡点标签';
comment on column public.parent_daily_checkins.stuck_stage is '记录当天提交时识别出的卡住阶段';
comment on column public.parent_daily_checkins.suggested_parent_prompt is '记录当天建议给家长的话术/动作';

alter table public.parent_daily_checkins enable row level security;

drop policy if exists "Parents can view own daily checkins" on public.parent_daily_checkins;
create policy "Parents can view own daily checkins"
  on public.parent_daily_checkins
  for select
  using (parent_id = auth.uid());

drop policy if exists "Parents can manage own daily checkins" on public.parent_daily_checkins;
create policy "Parents can manage own daily checkins"
  on public.parent_daily_checkins
  for all
  using (parent_id = auth.uid())
  with check (parent_id = auth.uid());

drop trigger if exists update_parent_daily_checkins_updated_at on public.parent_daily_checkins;
create trigger update_parent_daily_checkins_updated_at
  before update on public.parent_daily_checkins
  for each row
  execute function public.update_updated_at_column();
