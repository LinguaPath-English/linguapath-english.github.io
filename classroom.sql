-- One class per project. No accounts or progress are removed by this migration.
begin;
create or replace function public.classroom_is_teacher()
returns boolean language sql stable security definer set search_path=''
as $$ select auth.uid() is not null and exists(select 1 from public.teacher_admins t where t.user_id=auth.uid()); $$;
revoke all on function public.classroom_is_teacher() from public,anon;
grant execute on function public.classroom_is_teacher() to authenticated;

create or replace function public.teacher_roster()
returns table(user_id uuid,email text,state jsonb,updated_at timestamptz,created_at timestamptz,email_confirmed_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if not public.classroom_is_teacher() then raise exception 'Teacher access required' using errcode='42501'; end if;
 return query select u.id,u.email::text,coalesce(p.state,'{}'::jsonb),p.updated_at,u.created_at,u.email_confirmed_at
 from auth.users u left join public.student_progress p on p.user_id=u.id
 where u.email is not null and not exists(select 1 from public.teacher_admins t where t.user_id=u.id)
 order by u.created_at desc;
end; $$;
revoke all on function public.teacher_roster() from public,anon;
grant execute on function public.teacher_roster() to authenticated;

create table if not exists public.class_assignments(
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(title) between 1 and 120),
 skill text not null check(skill in ('Any','Listening','Reading','Writing','Speaking')),
 target integer not null check(target between 1 and 300),
 due_at timestamptz not null,created_at timestamptz not null default now(),
 created_by uuid references auth.users(id) on delete set null,
 archived boolean not null default false
);
alter table public.class_assignments enable row level security;
revoke all on public.class_assignments from public,anon,authenticated;
grant select on public.class_assignments to authenticated;
drop policy if exists "Class members read active assignments" on public.class_assignments;
create policy "Class members read active assignments" on public.class_assignments for select to authenticated
 using(not archived or public.classroom_is_teacher());

create or replace function public.teacher_create_assignment(assignment_title text,assignment_skill text,assignment_target integer,assignment_due timestamptz)
returns uuid language plpgsql security definer set search_path='' as $$
declare assignment_id uuid;
begin
 if not public.classroom_is_teacher() then raise exception 'Teacher access required' using errcode='42501'; end if;
 if assignment_title is null or char_length(trim(assignment_title)) not between 1 and 120
 or assignment_skill is null or assignment_skill not in ('Any','Listening','Reading','Writing','Speaking')
 or assignment_target is null or assignment_target not between 1 and 300
 or assignment_due is null or assignment_due<=now() or assignment_due>now()+interval '366 days'
 then raise exception 'Check assignment title, skill, target, and future due date' using errcode='22023'; end if;
 insert into public.class_assignments(title,skill,target,due_at,created_by)
 values(trim(assignment_title),assignment_skill,assignment_target,assignment_due,auth.uid()) returning id into assignment_id;
 return assignment_id;
end; $$;
revoke all on function public.teacher_create_assignment(text,text,integer,timestamptz) from public,anon;
grant execute on function public.teacher_create_assignment(text,text,integer,timestamptz) to authenticated;

create or replace function public.teacher_archive_assignment(assignment_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not public.classroom_is_teacher() then raise exception 'Teacher access required' using errcode='42501'; end if;
 update public.class_assignments set archived=true where id=assignment_id;
 return found;
end; $$;
revoke all on function public.teacher_archive_assignment(uuid) from public,anon;
grant execute on function public.teacher_archive_assignment(uuid) to authenticated;

-- Allow confirmed removal of accounts that never created a progress row, too.
create or replace function public.teacher_delete_student(target_user_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not public.classroom_is_teacher() then raise exception 'Teacher access required' using errcode='42501'; end if;
 if target_user_id is null or target_user_id=auth.uid() or exists(select 1 from public.teacher_admins t where t.user_id=target_user_id)
 then raise exception 'Teacher accounts cannot be deleted here' using errcode='42501'; end if;
 delete from auth.users where id=target_user_id;
 return found;
end; $$;
revoke all on function public.teacher_delete_student(uuid) from public,anon;
grant execute on function public.teacher_delete_student(uuid) to authenticated;
commit;
