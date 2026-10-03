create table if not exists public.student_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.student_progress enable row level security;

create policy "Students can read their own progress"
  on public.student_progress for select
  using (auth.uid() = user_id);

create policy "Students can create their own progress"
  on public.student_progress for insert
  with check (auth.uid() = user_id);

create policy "Students can update their own progress"
  on public.student_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.teacher_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.teacher_admins enable row level security;

create or replace function public.teacher_progress()
returns table(user_id uuid, email text, state jsonb, updated_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.user_id, u.email, p.state, p.updated_at
  from public.student_progress p
  join auth.users u on u.id = p.user_id
  where exists (select 1 from public.teacher_admins t where t.user_id = auth.uid())
  order by p.updated_at desc;
$$;

revoke all on function public.teacher_progress() from public;
grant execute on function public.teacher_progress() to authenticated;
