create extension if not exists pgcrypto;

create type public.user_role as enum ('candidate', 'employer', 'admin');
create type public.account_status as enum ('pending', 'active', 'suspended', 'deleted');
create type public.job_status as enum ('draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected', 'paused', 'filled', 'closed');
create type public.application_status as enum ('interest_submitted', 'admin_screening', 'needs_information', 'shortlisted', 'interview_ready', 'interview_scheduled', 'interview_completed', 'selected', 'rejected', 'withdrawn');
create type public.document_kind as enum ('resume', 'organization_verification', 'candidate_verification');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  status public.account_status not null default 'active',
  display_name text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  industry text not null,
  registration_number text not null unique,
  primary_city text not null,
  registered_address text not null,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'under_review', 'verified', 'rejected')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employer_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'owner' check (member_role in ('owner', 'recruiter', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, profile_id)
);

create table public.employer_verifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'under_review', 'verified', 'rejected')),
  notes text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.candidate_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  city text not null,
  education text,
  experience_years numeric(4,1) not null default 0 check (experience_years >= 0),
  salary_expectation numeric(12,2) check (salary_expectation >= 0),
  languages text[] not null default '{}',
  available boolean not null default true,
  profile_completion smallint not null default 0 check (profile_completion between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  area text not null,
  state text not null,
  active boolean not null default true,
  unique (city, area, state)
);

create table public.candidate_preferences (
  candidate_id uuid primary key references public.candidate_profiles(profile_id) on delete cascade,
  category_id uuid references public.job_categories(id),
  shifts text[] not null default '{}',
  employment_types text[] not null default '{}',
  work_modes text[] not null default array['on_site', 'remote', 'hybrid'],
  relocation_allowed boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.candidate_skills (
  candidate_id uuid not null references public.candidate_profiles(profile_id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  primary key (candidate_id, skill_id)
);

create table public.candidate_locations (
  candidate_id uuid not null references public.candidate_profiles(profile_id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  primary key (candidate_id, location_id)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references public.profiles(id),
  category_id uuid not null references public.job_categories(id),
  location_id uuid not null references public.locations(id),
  title text not null,
  description text not null,
  openings integer not null check (openings between 1 and 500),
  work_mode text not null check (work_mode in ('on_site', 'remote', 'hybrid')),
  employment_type text not null check (employment_type in ('full_time', 'part_time', 'contract')),
  shift text not null check (shift in ('day', 'evening', 'night', 'flexible')),
  salary_min numeric(12,2) not null check (salary_min >= 0),
  salary_max numeric(12,2) not null check (salary_max >= salary_min),
  experience_min numeric(4,1) not null default 0 check (experience_min >= 0),
  interview_availability text,
  status public.job_status not null default 'draft',
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_skills (
  job_id uuid not null references public.jobs(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  required boolean not null default true,
  primary key (job_id, skill_id)
);

create table public.job_screening_questions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  question text not null,
  required boolean not null default true,
  sort_order smallint not null default 0
);

create table public.job_matches (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.candidate_profiles(profile_id) on delete cascade,
  score smallint not null check (score between 0 and 100),
  reasons jsonb not null default '[]'::jsonb,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  job_id uuid not null references public.jobs(id) on delete restrict,
  candidate_id uuid not null references public.candidate_profiles(profile_id) on delete restrict,
  status public.application_status not null default 'interest_submitted',
  consent_version text not null,
  employer_data_use_accepted boolean not null default false,
  identity_released boolean not null default false,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);

create table public.application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  question_id uuid not null references public.job_screening_questions(id) on delete restrict,
  answer text not null,
  unique (application_id, question_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  kind public.document_kind not null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null check (mime_type in ('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  check (owner_profile_id is not null or organization_id is not null)
);

create table public.screening_checks (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  check_type text not null,
  status text not null check (status in ('pending', 'passed', 'failed', 'not_applicable')),
  notes text,
  checked_by uuid references public.profiles(id),
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  body text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check (application_id is not null or job_id is not null or organization_id is not null)
);

create table public.interview_handoffs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  candidate_consent_version text,
  candidate_consented_at timestamptz,
  employer_terms_version text,
  employer_accepted_at timestamptz,
  released_by uuid references public.profiles(id),
  released_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  handoff_id uuid not null unique references public.interview_handoffs(id) on delete cascade,
  scheduled_at timestamptz not null,
  venue text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'rescheduled', 'completed', 'cancelled', 'no_show')),
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null,
  version text not null,
  title text not null,
  content text not null,
  audience public.user_role[] not null,
  published_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (document_type, version)
);

create table public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  legal_document_id uuid not null references public.legal_documents(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  purpose text not null,
  ip_address inet,
  user_agent text,
  accepted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  unique nulls not distinct (legal_document_id, profile_id, application_id, purpose)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  resource_type text,
  resource_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel text not null check (channel in ('in_app', 'email', 'sms', 'whatsapp')),
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'failed', 'retried')),
  idempotency_key text not null unique,
  provider_message_id text,
  attempt_count smallint not null default 0,
  last_error text,
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id uuid,
  before_state jsonb,
  after_state jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Foreign-key and queue indexes. PostgreSQL does not create these automatically.
create index employer_members_profile_idx on public.employer_members(profile_id);
create index employer_verifications_org_idx on public.employer_verifications(organization_id);
create index candidate_preferences_category_idx on public.candidate_preferences(category_id);
create index candidate_skills_skill_idx on public.candidate_skills(skill_id);
create index candidate_locations_location_idx on public.candidate_locations(location_id);
create index jobs_org_status_created_idx on public.jobs(organization_id, status, created_at desc);
create index jobs_approved_location_idx on public.jobs(location_id, created_at desc) where status = 'approved';
create index jobs_category_idx on public.jobs(category_id);
create index job_skills_skill_idx on public.job_skills(skill_id);
create index job_screening_questions_job_idx on public.job_screening_questions(job_id);
create index job_matches_candidate_created_idx on public.job_matches(candidate_id, created_at desc);
create index applications_candidate_created_idx on public.applications(candidate_id, submitted_at desc);
create index applications_job_status_idx on public.applications(job_id, status);
create index application_answers_question_idx on public.application_answers(question_id);
create index documents_owner_idx on public.documents(owner_profile_id);
create index documents_org_idx on public.documents(organization_id);
create index screening_checks_application_idx on public.screening_checks(application_id);
create index notifications_profile_unread_idx on public.notifications(profile_id, created_at desc) where read_at is null;
create index notification_deliveries_queue_idx on public.notification_deliveries(status, updated_at) where status in ('queued', 'failed', 'retried');
create index audit_events_target_idx on public.audit_events(target_type, target_id, created_at desc);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_organization_member(target_org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.employer_members
    where organization_id = target_org and profile_id = (select auth.uid())
  );
$$;

create or replace function public.owns_job(target_job uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.jobs j
    join public.employer_members em on em.organization_id = j.organization_id
    where j.id = target_job and em.profile_id = (select auth.uid())
  );
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.owns_job(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.employer_members enable row level security;
alter table public.employer_verifications enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.job_categories enable row level security;
alter table public.skills enable row level security;
alter table public.locations enable row level security;
alter table public.candidate_preferences enable row level security;
alter table public.candidate_skills enable row level security;
alter table public.candidate_locations enable row level security;
alter table public.jobs enable row level security;
alter table public.job_skills enable row level security;
alter table public.job_screening_questions enable row level security;
alter table public.job_matches enable row level security;
alter table public.applications enable row level security;
alter table public.application_answers enable row level security;
alter table public.documents enable row level security;
alter table public.screening_checks enable row level security;
alter table public.admin_notes enable row level security;
alter table public.interview_handoffs enable row level security;
alter table public.interviews enable row level security;
alter table public.legal_documents enable row level security;
alter table public.legal_acceptances enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_self_read on public.profiles for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_self_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_admin_all on public.profiles for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy organizations_member_read on public.organizations for select to authenticated using ((select public.is_organization_member(id)) or (select public.is_admin()));
create policy organizations_admin_all on public.organizations for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy employer_members_member_read on public.employer_members for select to authenticated using (profile_id = (select auth.uid()) or (select public.is_admin()));
create policy employer_members_admin_all on public.employer_members for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy employer_verifications_member_read on public.employer_verifications for select to authenticated using ((select public.is_organization_member(organization_id)) or (select public.is_admin()));
create policy employer_verifications_admin_all on public.employer_verifications for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy candidate_profiles_owner on public.candidate_profiles for all to authenticated using (profile_id = (select auth.uid()) or (select public.is_admin())) with check (profile_id = (select auth.uid()) or (select public.is_admin()));
create policy candidate_preferences_owner on public.candidate_preferences for all to authenticated using (candidate_id = (select auth.uid()) or (select public.is_admin())) with check (candidate_id = (select auth.uid()) or (select public.is_admin()));
create policy candidate_skills_owner on public.candidate_skills for all to authenticated using (candidate_id = (select auth.uid()) or (select public.is_admin())) with check (candidate_id = (select auth.uid()) or (select public.is_admin()));
create policy candidate_locations_owner on public.candidate_locations for all to authenticated using (candidate_id = (select auth.uid()) or (select public.is_admin())) with check (candidate_id = (select auth.uid()) or (select public.is_admin()));

create policy reference_categories_read on public.job_categories for select to authenticated using (active or (select public.is_admin()));
create policy reference_skills_read on public.skills for select to authenticated using (active or (select public.is_admin()));
create policy reference_locations_read on public.locations for select to authenticated using (active or (select public.is_admin()));
create policy reference_categories_admin on public.job_categories for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy reference_skills_admin on public.skills for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy reference_locations_admin on public.locations for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy jobs_candidate_or_owner_read on public.jobs for select to authenticated using (status = 'approved' or (select public.owns_job(id)) or (select public.is_admin()));
create policy jobs_employer_insert on public.jobs for insert to authenticated with check ((select public.is_organization_member(organization_id)) and created_by = (select auth.uid()));
create policy jobs_employer_update on public.jobs for update to authenticated using ((select public.owns_job(id)) and status in ('draft', 'changes_requested')) with check ((select public.owns_job(id)));
create policy jobs_admin_all on public.jobs for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy job_skills_read on public.job_skills for select to authenticated using ((select public.owns_job(job_id)) or exists (select 1 from public.jobs j where j.id = job_id and j.status = 'approved') or (select public.is_admin()));
create policy job_skills_owner_write on public.job_skills for all to authenticated using ((select public.owns_job(job_id)) or (select public.is_admin())) with check ((select public.owns_job(job_id)) or (select public.is_admin()));
create policy questions_read on public.job_screening_questions for select to authenticated using ((select public.owns_job(job_id)) or exists (select 1 from public.jobs j where j.id = job_id and j.status = 'approved') or (select public.is_admin()));
create policy questions_owner_write on public.job_screening_questions for all to authenticated using ((select public.owns_job(job_id)) or (select public.is_admin())) with check ((select public.owns_job(job_id)) or (select public.is_admin()));

create policy matches_candidate_read on public.job_matches for select to authenticated using (candidate_id = (select auth.uid()) or (select public.is_admin()));
create policy matches_admin_all on public.job_matches for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy applications_candidate_read on public.applications for select to authenticated using (candidate_id = (select auth.uid()) or (select public.is_admin()) or (identity_released and (select public.owns_job(job_id))));
create policy applications_candidate_insert on public.applications for insert to authenticated with check (candidate_id = (select auth.uid()) and exists (select 1 from public.jobs j where j.id = job_id and j.status = 'approved'));
create policy applications_candidate_withdraw on public.applications for update to authenticated using (candidate_id = (select auth.uid())) with check (candidate_id = (select auth.uid()) and status = 'withdrawn');
create policy applications_admin_all on public.applications for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy answers_candidate on public.application_answers for all to authenticated using (exists (select 1 from public.applications a where a.id = application_id and (a.candidate_id = (select auth.uid()) or (select public.is_admin())))) with check (exists (select 1 from public.applications a where a.id = application_id and (a.candidate_id = (select auth.uid()) or (select public.is_admin()))));

create policy documents_owner_read on public.documents for select to authenticated using (owner_profile_id = (select auth.uid()) or (organization_id is not null and (select public.is_organization_member(organization_id))) or (select public.is_admin()) or exists (select 1 from public.applications a where a.candidate_id = owner_profile_id and a.identity_released and (select public.owns_job(a.job_id))));
create policy documents_owner_insert on public.documents for insert to authenticated with check (owner_profile_id = (select auth.uid()) or (organization_id is not null and (select public.is_organization_member(organization_id))));
create policy documents_admin_all on public.documents for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy screening_admin_only on public.screening_checks for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy admin_notes_admin_only on public.admin_notes for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy handoffs_parties_read on public.interview_handoffs for select to authenticated using ((select public.is_admin()) or exists (select 1 from public.applications a where a.id = application_id and (a.candidate_id = (select auth.uid()) or (a.identity_released and (select public.owns_job(a.job_id))))));
create policy handoffs_candidate_consent on public.interview_handoffs for update to authenticated using (exists (select 1 from public.applications a where a.id = application_id and a.candidate_id = (select auth.uid()))) with check (exists (select 1 from public.applications a where a.id = application_id and a.candidate_id = (select auth.uid())));
create policy handoffs_admin_all on public.interview_handoffs for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy interviews_parties_read on public.interviews for select to authenticated using ((select public.is_admin()) or exists (select 1 from public.interview_handoffs h join public.applications a on a.id = h.application_id where h.id = handoff_id and a.identity_released and (a.candidate_id = (select auth.uid()) or (select public.owns_job(a.job_id)))));
create policy interviews_admin_all on public.interviews for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy legal_published_read on public.legal_documents for select to authenticated using (published_at is not null or (select public.is_admin()));
create policy legal_admin_all on public.legal_documents for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy acceptances_owner_read on public.legal_acceptances for select to authenticated using (profile_id = (select auth.uid()) or (select public.is_admin()));
create policy acceptances_owner_insert on public.legal_acceptances for insert to authenticated with check (profile_id = (select auth.uid()));
create policy acceptances_owner_withdraw on public.legal_acceptances for update to authenticated using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy notifications_owner on public.notifications for select to authenticated using (profile_id = (select auth.uid()) or (select public.is_admin()));
create policy notifications_owner_update on public.notifications for update to authenticated using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy notifications_admin_all on public.notifications for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy deliveries_admin_only on public.notification_deliveries for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy audit_admin_read on public.audit_events for select to authenticated using ((select public.is_admin()));
create policy audit_admin_insert on public.audit_events for insert to authenticated with check ((select public.is_admin()));

-- Candidates receive only approved, anonymized job fields through this view.
create view public.candidate_job_catalog with (security_invoker = true) as
select j.id, j.reference, j.title, c.name as category, l.city, l.area as work_area,
       j.work_mode, j.employment_type, j.shift, j.salary_min, j.salary_max,
       j.openings, j.experience_min, j.description, j.created_at
from public.jobs j
join public.job_categories c on c.id = j.category_id
join public.locations l on l.id = j.location_id
where j.status = 'approved';

grant select on public.candidate_job_catalog to authenticated;

-- Employer pipeline view never exposes candidate_id before identity release.
create view public.employer_application_pipeline with (security_invoker = true) as
select a.id, a.reference, a.job_id, a.status, a.submitted_at, a.identity_released,
       case when a.identity_released then a.candidate_id else null end as released_candidate_id
from public.applications a
where (select public.owns_job(a.job_id));

grant select on public.employer_application_pipeline to authenticated;

-- Storage bucket and object policies keep resumes private.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('private-documents', 'private-documents', false, 10485760, array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

create policy storage_owner_upload on storage.objects for insert to authenticated
with check (bucket_id = 'private-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy storage_owner_read on storage.objects for select to authenticated
using (bucket_id = 'private-documents' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));
create policy storage_owner_update on storage.objects for update to authenticated
using (bucket_id = 'private-documents' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'private-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy storage_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'private-documents' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

-- New public users may choose candidate or employer; admins must be provisioned separately.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare requested_role public.user_role;
begin
  requested_role := case when new.raw_user_meta_data ->> 'role' = 'employer' then 'employer'::public.user_role else 'candidate'::public.user_role end;
  insert into public.profiles (id, role, display_name, phone, email)
  values (new.id, requested_role, new.raw_user_meta_data ->> 'display_name', new.phone, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Transactional admin operations include immutable audit events.
create or replace function public.approve_job(target_job uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  update public.jobs set status = 'approved', approved_at = now(), approved_by = auth.uid(), updated_at = now() where id = target_job and status in ('submitted', 'under_review');
  if not found then raise exception 'job cannot be approved from its current status'; end if;
  insert into public.audit_events(actor_profile_id, action, target_type, target_id, after_state)
  values (auth.uid(), 'job.approved', 'job', target_job, jsonb_build_object('status', 'approved'));
end;
$$;

create or replace function public.release_interview_handoff(target_application uuid, scheduled_for timestamptz, interview_venue text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare handoff_record public.interview_handoffs; interview_id uuid;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  select h.* into handoff_record from public.interview_handoffs h where h.application_id = target_application for update;
  if handoff_record.candidate_consented_at is null or handoff_record.employer_accepted_at is null then raise exception 'both consents are required'; end if;
  update public.interview_handoffs set released_by = auth.uid(), released_at = now() where id = handoff_record.id;
  update public.applications set identity_released = true, status = 'interview_scheduled', updated_at = now() where id = target_application;
  insert into public.interviews(handoff_id, scheduled_at, venue) values (handoff_record.id, scheduled_for, interview_venue) returning id into interview_id;
  insert into public.audit_events(actor_profile_id, action, target_type, target_id, after_state)
  values (auth.uid(), 'interview_handoff.released', 'application', target_application, jsonb_build_object('interview_id', interview_id));
  return interview_id;
end;
$$;

revoke all on function public.approve_job(uuid) from public;
revoke all on function public.release_interview_handoff(uuid, timestamptz, text) from public;
grant execute on function public.approve_job(uuid) to authenticated;
grant execute on function public.release_interview_handoff(uuid, timestamptz, text) to authenticated;
