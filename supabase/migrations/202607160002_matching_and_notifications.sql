create unique index notifications_dedupe_idx
on public.notifications(profile_id, notification_type, resource_type, resource_id)
where resource_id is not null;

create or replace function public.recalculate_matches_for_job(target_job uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare matched_count integer;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;

  with job_data as (
    select * from public.jobs where id = target_job and status = 'approved'
  ), scored as materialized (
    select cp.profile_id as candidate_id,
      (case when pref.category_id = j.category_id then 35 else 0 end) +
      (case when skill_totals.total = 0 then 0 else round(30.0 * skill_totals.matched / skill_totals.total)::integer end) +
      (case when j.work_mode = 'remote' or pref.relocation_allowed or exists (
        select 1 from public.candidate_locations cl where cl.candidate_id = cp.profile_id and cl.location_id = j.location_id
      ) then 20 else 0 end) +
      (case when cp.experience_years >= j.experience_min then 10 else 0 end) +
      (case when j.shift = any(pref.shifts) or 'flexible' = any(pref.shifts) then 5 else 0 end) as score,
      jsonb_build_array(
        jsonb_build_object('label', 'Preferred job category', 'points', case when pref.category_id = j.category_id then 35 else 0 end),
        jsonb_build_object('label', 'Matching skills', 'points', case when skill_totals.total = 0 then 0 else round(30.0 * skill_totals.matched / skill_totals.total)::integer end),
        jsonb_build_object('label', 'Preferred work location', 'points', case when j.work_mode = 'remote' or pref.relocation_allowed or exists (select 1 from public.candidate_locations cl where cl.candidate_id = cp.profile_id and cl.location_id = j.location_id) then 20 else 0 end),
        jsonb_build_object('label', 'Experience requirement met', 'points', case when cp.experience_years >= j.experience_min then 10 else 0 end),
        jsonb_build_object('label', 'Shift preference', 'points', case when j.shift = any(pref.shifts) or 'flexible' = any(pref.shifts) then 5 else 0 end)
      ) as reasons
    from public.candidate_profiles cp
    join public.candidate_preferences pref on pref.candidate_id = cp.profile_id
    cross join job_data j
    cross join lateral (
      select count(js.skill_id)::numeric as total,
             count(cs.skill_id) filter (where cs.skill_id is not null)::numeric as matched
      from public.job_skills js
      left join public.candidate_skills cs on cs.skill_id = js.skill_id and cs.candidate_id = cp.profile_id
      where js.job_id = j.id
    ) skill_totals
    where cp.available
      and j.employment_type = any(pref.employment_types)
      and j.work_mode = any(pref.work_modes)
      and (j.work_mode = 'remote' or pref.relocation_allowed or exists (
        select 1 from public.candidate_locations cl where cl.candidate_id = cp.profile_id and cl.location_id = j.location_id
      ))
  ), eligible as (
    select * from scored where score >= 60
  ), inserted as (
    insert into public.job_matches(job_id, candidate_id, score, reasons)
    select target_job, candidate_id, score, reasons from eligible
    on conflict (job_id, candidate_id) do nothing
    returning candidate_id
  ), updated as (
    update public.job_matches jm
    set score = e.score, reasons = e.reasons, updated_at = now()
    from eligible e
    where jm.job_id = target_job and jm.candidate_id = e.candidate_id
    returning jm.candidate_id
  ), queued as (
    insert into public.notifications(profile_id, notification_type, title, body, resource_type, resource_id)
    select i.candidate_id, 'job_match', 'A new job matches your profile',
           'A verified opportunity is ready for your review.', 'job', target_job
    from inserted i
    on conflict do nothing
    returning id
  )
  select count(*) into matched_count from eligible;

  delete from public.job_matches jm
  where jm.job_id = target_job
    and not exists (
      select 1 from public.candidate_profiles cp
      join public.candidate_preferences pref on pref.candidate_id = cp.profile_id
      where cp.profile_id = jm.candidate_id and cp.available
    );

  return matched_count;
end;
$$;

revoke all on function public.recalculate_matches_for_job(uuid) from public;
grant execute on function public.recalculate_matches_for_job(uuid) to authenticated;

create or replace function public.approve_job(target_job uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare matches_created integer;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  update public.jobs set status = 'approved', approved_at = now(), approved_by = auth.uid(), updated_at = now()
  where id = target_job and status in ('submitted', 'under_review');
  if not found then raise exception 'job cannot be approved from its current status'; end if;
  matches_created := public.recalculate_matches_for_job(target_job);
  insert into public.audit_events(actor_profile_id, action, target_type, target_id, after_state)
  values (auth.uid(), 'job.approved', 'job', target_job, jsonb_build_object('status', 'approved', 'matches_created', matches_created));
  return matches_created;
end;
$$;

revoke all on function public.approve_job(uuid) from public;
grant execute on function public.approve_job(uuid) to authenticated;
