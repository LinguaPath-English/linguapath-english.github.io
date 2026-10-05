-- Run once in the Supabase SQL Editor to enable teacher account management.
-- The browser only has the publishable key; authorization is checked in these functions.

begin;

create or replace function public.teacher_progress()
returns table(user_id uuid, email text, state jsonb, updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.teacher_admins where teacher_admins.user_id = auth.uid()
  ) then
    raise exception 'Teacher access required' using errcode = '42501';
  end if;

  return query
    select p.user_id, u.email::text, p.state, p.updated_at
    from public.student_progress as p
    join auth.users as u on u.id = p.user_id
    order by p.updated_at desc;
end;
$$;

revoke all on function public.teacher_progress() from public, anon;
grant execute on function public.teacher_progress() to authenticated;

create or replace function public.teacher_delete_student(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.teacher_admins where teacher_admins.user_id = auth.uid()
  ) then
    raise exception 'Teacher access required' using errcode = '42501';
  end if;

  if target_user_id is null or target_user_id = auth.uid() or exists (
    select 1 from public.teacher_admins where teacher_admins.user_id = target_user_id
  ) then
    raise exception 'Teacher accounts cannot be deleted here' using errcode = '42501';
  end if;

  if not exists (select 1 from public.student_progress where student_progress.user_id = target_user_id) then
    return false;
  end if;

  delete from auth.users where id = target_user_id;
  return found;
end;
$$;

revoke all on function public.teacher_delete_student(uuid) from public, anon;
grant execute on function public.teacher_delete_student(uuid) to authenticated;

commit;
