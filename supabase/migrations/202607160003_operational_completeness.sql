-- Operational additions reflected by the completed local workflows.
alter table public.jobs
  add column if not exists education_requirement text,
  add column if not exists required_documents text[] not null default '{}';

create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  request_type text not null check (request_type in ('export', 'correction', 'deletion', 'withdraw_consent')),
  status text not null default 'submitted' check (status in ('submitted', 'in_review', 'completed')),
  assigned_to uuid references public.profiles(id),
  admin_notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index privacy_requests_profile_created_idx on public.privacy_requests(profile_id, created_at desc);
create index privacy_requests_queue_idx on public.privacy_requests(status, created_at) where status <> 'completed';

alter table public.privacy_requests enable row level security;

create policy privacy_requests_owner_read on public.privacy_requests
for select to authenticated
using (profile_id = (select auth.uid()) or (select public.is_admin()));

create policy privacy_requests_owner_insert on public.privacy_requests
for insert to authenticated
with check (profile_id = (select auth.uid()) and status = 'submitted');

create policy privacy_requests_admin_all on public.privacy_requests
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Employers can read identity/profile fields only for applications explicitly released to their job.
create policy profiles_released_employer_read on public.profiles
for select to authenticated
using (exists (
  select 1
  from public.applications a
  where a.candidate_id = profiles.id
    and a.identity_released
    and (select public.owns_job(a.job_id))
));

create policy candidate_profiles_released_employer_read on public.candidate_profiles
for select to authenticated
using (exists (
  select 1
  from public.applications a
  where a.candidate_id = candidate_profiles.profile_id
    and a.identity_released
    and (select public.owns_job(a.job_id))
));

create or replace view public.candidate_job_catalog with (security_invoker = true) as
select j.id, j.reference, j.title, c.name as category, l.city, l.area as work_area,
       j.work_mode, j.employment_type, j.shift, j.salary_min, j.salary_max,
       j.openings, j.experience_min, j.education_requirement, j.required_documents,
       j.description, j.interview_availability, j.created_at
from public.jobs j
join public.job_categories c on c.id = j.category_id
join public.locations l on l.id = j.location_id
where j.status = 'approved';

grant select on public.candidate_job_catalog to authenticated;

create or replace function public.queue_notification_deliveries()
returns trigger language plpgsql security definer set search_path = '' as $$
declare recipient_email text;
begin
  insert into public.notification_deliveries(notification_id, channel, status, idempotency_key)
  values (new.id, 'in_app', 'delivered', 'in_app:' || new.id::text)
  on conflict (idempotency_key) do nothing;

  select email into recipient_email from public.profiles where id = new.profile_id;
  if recipient_email is not null and length(trim(recipient_email)) > 0 then
    insert into public.notification_deliveries(notification_id, channel, status, idempotency_key)
    values (new.id, 'email', 'queued', 'email:' || new.id::text)
    on conflict (idempotency_key) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_notification_created
after insert on public.notifications
for each row execute function public.queue_notification_deliveries();

create or replace function public.update_privacy_request(target_request uuid, next_status text, notes text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if next_status not in ('in_review', 'completed') then raise exception 'invalid request status'; end if;

  update public.privacy_requests
  set status = next_status,
      assigned_to = auth.uid(),
      admin_notes = coalesce(notes, admin_notes),
      completed_at = case when next_status = 'completed' then now() else null end,
      updated_at = now()
  where id = target_request;

  if not found then raise exception 'privacy request not found'; end if;

  insert into public.audit_events(actor_profile_id, action, target_type, target_id, after_state)
  values (auth.uid(), 'privacy_request.' || next_status, 'privacy_request', target_request, jsonb_build_object('status', next_status));
end;
$$;

revoke all on function public.update_privacy_request(uuid, text, text) from public;
grant execute on function public.update_privacy_request(uuid, text, text) to authenticated;
