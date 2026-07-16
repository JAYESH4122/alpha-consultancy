// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = [
  "supabase/migrations/202607160001_initial_schema.sql",
  "supabase/migrations/202607160003_operational_completeness.sql",
].map((file) => readFileSync(resolve(process.cwd(), file), "utf8")).join("\n");

describe("database privacy controls", () => {
  const protectedTables = [
    "profiles", "organizations", "employer_members", "candidate_profiles", "candidate_preferences",
    "jobs", "job_matches", "applications", "documents", "screening_checks", "admin_notes",
    "interview_handoffs", "interviews", "legal_acceptances", "notifications", "audit_events", "privacy_requests",
  ];

  it.each(protectedTables)("enables RLS on %s", (table) => {
    expect(migration).toContain(`alter table public.${table} enable row level security;`);
  });

  it("keeps company identity out of the candidate job catalog", () => {
    const view = migration.split("create view public.candidate_job_catalog")[1].split("grant select")[0];
    expect(view).not.toContain("legal_name");
    expect(view).not.toContain("registration_number");
    expect(view).not.toContain("registered_address");
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
