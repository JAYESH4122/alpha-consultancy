-- Separate employee-facing job previews from protected employer requirements.
-- "candidate" remains the internal database role for backward compatibility;
-- the product labels this role "Employee" in the client.

create or replace function public.is_candidate()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'candidate' and status = 'active'
  );
$$;

create or replace function public.is_approved_job(target_job uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.jobs
    where id = target_job and status = 'approved'
  );
$$;

revoke all on function public.is_candidate() from public;
revoke all on function public.is_approved_job(uuid) from public;
grant execute on function public.is_candidate() to authenticated;
grant execute on function public.is_approved_job(uuid) to authenticated;

create table public.employee_job_previews (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  reference text not null unique,
  title text not null,
  category text not null,
  city text not null,
  work_mode text not null,
  employment_type text not null,
  shift text not null,
  salary_min numeric(12,2) not null check (salary_min >= 0),
  salary_max numeric(12,2) not null check (salary_max >= salary_min),
  openings integer not null check (openings between 1 and 500),
  experience_min numeric(4,1) not null default 0 check (experience_min >= 0),
  education_requirement text,
  employee_summary text not null check (char_length(employee_summary) between 30 and 800),
  required_skills text[] not null default '{}',
  screening_questions text[] not null default '{}',
  published_by uuid not null references public.profiles(id),
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index employee_job_previews_published_idx on public.employee_job_previews(published_at desc);
create index employee_job_previews_published_by_idx on public.employee_job_previews(published_by);

alter table public.employee_job_previews enable row level security;

create policy employee_job_previews_safe_read on public.employee_job_previews
for select to authenticated
using (
  ((select public.is_candidate()) and (select public.is_approved_job(job_id)))
  or (select public.owns_job(job_id))
  or (select public.is_admin())
);

revoke all on table public.employee_job_previews from anon, authenticated;
grant select on table public.employee_job_previews to authenticated;

-- Authenticated employees must never select protected job records directly.
drop policy if exists jobs_candidate_or_owner_read on public.jobs;
create policy jobs_owner_or_admin_read on public.jobs
for select to authenticated
using ((select public.owns_job(id)) or (select public.is_admin()));

drop policy if exists job_skills_read on public.job_skills;
create policy job_skills_owner_or_admin_read on public.job_skills
for select to authenticated
using ((select public.owns_job(job_id)) or (select public.is_admin()));

drop policy if exists questions_read on public.job_screening_questions;
create policy questions_owner_or_admin_read on public.job_screening_questions
for select to authenticated
using ((select public.owns_job(job_id)) or (select public.is_admin()));

drop policy if exists applications_candidate_insert on public.applications;
create policy applications_candidate_insert on public.applications
for insert to authenticated
with check (
  candidate_id = (select auth.uid())
  and (select public.is_approved_job(job_id))
);

-- Keep the old catalog name for API compatibility, but source it only from the
-- separate allowlisted preview table. It contains no organization id, company,
-- exact area, address, contact data, private description, or interview details.
drop view if exists public.candidate_job_catalog;
create view public.candidate_job_catalog with (security_invoker = true) as
select job_id as id, reference, title, category, city, work_mode,
       employment_type, shift, salary_min, salary_max, openings,
       experience_min, education_requirement, employee_summary as description,
       required_skills, screening_questions, published_at as created_at
from public.employee_job_previews;

grant select on public.candidate_job_catalog to authenticated;

-- Admins publish the employee-safe snapshot and approve the job in one atomic call.
create or replace function public.publish_employee_job_preview(
  target_job uuid,
  safe_summary text,
  safe_skills text[] default '{}',
  safe_questions text[] default '{}'
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  protected_company text;
  protected_area text;
  normalized_preview text;
  target_status public.job_status;
  target_org_status text;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;

  select lower(o.legal_name), lower(l.area), j.status, o.verification_status
  into protected_company, protected_area, target_status, target_org_status
  from public.jobs j
  join public.organizations o on o.id = j.organization_id
  join public.locations l on l.id = j.location_id
  where j.id = target_job;

  if target_status is null then raise exception 'job not found'; end if;
  if target_org_status <> 'verified' then raise exception 'employer must be verified before publication'; end if;
  if target_status not in ('submitted', 'under_review', 'changes_requested') then raise exception 'job is not reviewable'; end if;

  normalized_preview := lower(concat_ws(' ', safe_summary, array_to_string(safe_questions, ' ')));
  if char_length(trim(safe_summary)) < 30 then raise exception 'employee summary is too short'; end if;
  if position(protected_company in normalized_preview) > 0 or position(protected_area in normalized_preview) > 0 then
    raise exception 'employee preview contains protected employer information';
  end if;
  if normalized_preview ~ '(https?://|www\.|[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}|\+?[0-9][0-9 ()-]{7,}|\m(contact|call|phone|mobile|whatsapp|email|website|address)\M)' then
    raise exception 'employee preview contains contact or address information';
  end if;

  insert into public.employee_job_previews (
    job_id, reference, title, category, city, work_mode, employment_type,
    shift, salary_min, salary_max, openings, experience_min,
    education_requirement, employee_summary, required_skills,
    screening_questions, published_by, published_at, updated_at
  )
  select j.id, j.reference, j.title, c.name, l.city, j.work_mode,
         j.employment_type, j.shift, j.salary_min, j.salary_max, j.openings,
         j.experience_min, j.education_requirement, trim(safe_summary),
         coalesce(safe_skills, '{}'), coalesce(safe_questions, '{}'),
         (select auth.uid()), now(), now()
  from public.jobs j
  join public.job_categories c on c.id = j.category_id
  join public.locations l on l.id = j.location_id
  where j.id = target_job
  on conflict (job_id) do update set
    title = excluded.title,
    category = excluded.category,
    city = excluded.city,
    work_mode = excluded.work_mode,
    employment_type = excluded.employment_type,
    shift = excluded.shift,
    salary_min = excluded.salary_min,
    salary_max = excluded.salary_max,
    openings = excluded.openings,
    experience_min = excluded.experience_min,
    education_requirement = excluded.education_requirement,
    employee_summary = excluded.employee_summary,
    required_skills = excluded.required_skills,
    screening_questions = excluded.screening_questions,
    published_by = excluded.published_by,
    published_at = excluded.published_at,
    updated_at = now();

  update public.jobs
  set status = 'approved', approved_at = now(), approved_by = (select auth.uid()), updated_at = now()
  where id = target_job;

  insert into public.audit_events(actor_profile_id, action, target_type, target_id, after_state)
  values ((select auth.uid()), 'job_employee_preview_published', 'job', target_job, jsonb_build_object('status', 'approved'));
end;
$$;

revoke all on function public.publish_employee_job_preview(uuid, text, text[], text[]) from public;
grant execute on function public.publish_employee_job_preview(uuid, text, text[], text[]) to authenticated;

create or replace function public.enforce_private_job_publication()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    if not exists (
      select 1 from public.organizations
      where id = new.organization_id and verification_status = 'verified'
    ) then
      raise exception 'employer must be verified before publication';
    end if;
    if not exists (select 1 from public.employee_job_previews where job_id = new.id) then
      raise exception 'an employee-safe preview is required before publication';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_private_job_publication
before update of status on public.jobs
for each row execute function public.enforce_private_job_publication();

-- Employer submission and admin decision are explicit, audited state transitions.
alter table public.employer_verifications
  add column if not exists registration_checked boolean not null default false,
  add column if not exists contact_checked boolean not null default false,
  add column if not exists data_use_terms_accepted boolean not null default false;

create or replace function public.submit_employer_verification(target_org uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare current_status text;
begin
  if not public.is_organization_member(target_org) then raise exception 'not authorized'; end if;
  select verification_status into current_status from public.organizations where id = target_org for update;
  if current_status not in ('pending', 'rejected') then raise exception 'verification is already active'; end if;

  update public.organizations set verification_status = 'under_review', verified_at = null, updated_at = now() where id = target_org;
  insert into public.employer_verifications(organization_id, status, notes, data_use_terms_accepted)
  values (target_org, 'under_review', 'Submitted by employer for admin review.', true);
  insert into public.audit_events(actor_profile_id, action, target_type, target_id, after_state)
  values ((select auth.uid()), 'employer_verification_submitted', 'organization', target_org, jsonb_build_object('status', 'under_review'));
end;
$$;

create or replace function public.review_employer_verification(
  target_org uuid,
  next_status text,
  review_notes text,
  registration_passed boolean,
  contact_passed boolean
)
returns void language plpgsql security definer set search_path = '' as $$
declare current_status text;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if next_status not in ('verified', 'rejected') then raise exception 'invalid verification decision'; end if;
  select verification_status into current_status from public.organizations where id = target_org for update;
  if current_status <> 'under_review' then raise exception 'employer verification is not under review'; end if;
  if next_status = 'verified' and not (registration_passed and contact_passed) then raise exception 'all employer checks must pass'; end if;
  if next_status = 'rejected' and length(trim(coalesce(review_notes, ''))) = 0 then raise exception 'rejection notes are required'; end if;

  update public.organizations
  set verification_status = next_status,
      verified_at = case when next_status = 'verified' then now() else null end,
      updated_at = now()
  where id = target_org;

  insert into public.employer_verifications(
    organization_id, status, notes, reviewed_by, reviewed_at,
    registration_checked, contact_checked, data_use_terms_accepted
  ) values (
    target_org, next_status, nullif(trim(review_notes), ''), (select auth.uid()), now(),
    registration_passed, contact_passed, true
  );

  insert into public.audit_events(actor_profile_id, action, target_type, target_id, after_state)
  values ((select auth.uid()), 'employer_verification_' || next_status, 'organization', target_org, jsonb_build_object('status', next_status));
end;
$$;

revoke all on function public.submit_employer_verification(uuid) from public;
revoke all on function public.review_employer_verification(uuid, text, text, boolean, boolean) from public;
grant execute on function public.submit_employer_verification(uuid) to authenticated;
grant execute on function public.review_employer_verification(uuid, text, text, boolean, boolean) to authenticated;
