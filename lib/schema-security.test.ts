// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = [
  "supabase/migrations/202607160001_initial_schema.sql",
  "supabase/migrations/202607160003_operational_completeness.sql",
  "supabase/migrations/202607180001_employee_privacy_and_employer_verification.sql",
].map((file) => readFileSync(resolve(process.cwd(), file), "utf8")).join("\n");

describe("database privacy controls", () => {
  const protectedTables = [
    "profiles", "organizations", "employer_members", "candidate_profiles", "candidate_preferences",
    "jobs", "job_matches", "applications", "documents", "screening_checks", "admin_notes",
    "interview_handoffs", "interviews", "legal_acceptances", "notifications", "audit_events", "privacy_requests", "employee_job_previews",
  ];

  it.each(protectedTables)("enables RLS on %s", (table) => {
    expect(migration).toContain(`alter table public.${table} enable row level security;`);
  });

  it("keeps company identity out of the candidate job catalog", () => {
    const view = migration.split("create view public.candidate_job_catalog").at(-1)!.split("grant select")[0];
    expect(view).not.toContain("legal_name");
    expect(view).not.toContain("registration_number");
    expect(view).not.toContain("registered_address");
    expect(view).not.toContain("work_area");
    expect(view).not.toContain("interview_availability");
    expect(view).toContain("employee_summary as description");
  });

  it("removes employee access to protected jobs, skills, and employer-authored questions", () => {
    expect(migration).toContain("drop policy if exists jobs_candidate_or_owner_read on public.jobs");
    expect(migration).toContain("create policy jobs_owner_or_admin_read on public.jobs");
    expect(migration).toContain("create policy job_skills_owner_or_admin_read");
    expect(migration).toContain("create policy questions_owner_or_admin_read");
    expect(migration).toContain("revoke all on table public.employee_job_previews from anon, authenticated");
    expect(migration).toContain("grant select on table public.employee_job_previews to authenticated");
  });

  it("gates publication and employer verification through audited database functions", () => {
    expect(migration).toContain("publish_employee_job_preview");
    expect(migration).toContain("enforce_private_job_publication");
    expect(migration).toContain("submit_employer_verification");
    expect(migration).toContain("review_employer_verification");
    expect(migration).toContain("all employer checks must pass");
  });

  it("reveals candidate ids to employers only after release", () => {
    expect(migration).toContain("case when a.identity_released then a.candidate_id else null end as released_candidate_id");
    expect(migration).toContain("profiles_released_employer_read");
    expect(migration).toContain("a.identity_released");
  });

  it("keeps privacy requests owner-scoped and admin-controlled", () => {
    expect(migration).toContain("privacy_requests_owner_read");
    expect(migration).toContain("privacy_requests_owner_insert");
    expect(migration).toContain("privacy_requests_admin_all");
  });

  it("queues idempotent in-app and email delivery records", () => {
    expect(migration).toContain("queue_notification_deliveries");
    expect(migration).toContain("'email:' || new.id::text");
    expect(migration).toContain("on conflict (idempotency_key) do nothing");
  });

  it("keeps the documents bucket private and size restricted", () => {
    expect(migration).toContain("'private-documents', 'private-documents', false, 10485760");
    expect(migration).toContain("storage_owner_upload");
    expect(migration).toContain("storage_owner_read");
  });
});
