import { describe, expect, it } from "vitest";
import { canReleaseIdentity, canReviewEmployerVerification, canSubmitEmployerVerification, canTransitionApplication, canTransitionJob, canVerifyEmployer } from "@/lib/workflow";
import type { Application } from "@/lib/types";

const readyApplication: Application = {
  id: "application-1",
  reference: "APP-1042",
  jobId: "job-1",
  candidateId: "candidate-1",
  status: "interview_ready",
  submittedAt: "2026-07-16T08:00:00.000Z",
  consentVersion: "application-consent-v1.0",
  handoffConsent: true,
  employerDataUseAccepted: true,
  identityReleased: false,
  adminNotes: [],
  screeningAnswers: ["Yes"],
  screeningChecks: { identity: "passed", resume: "passed", eligibility: "passed" },
};

describe("controlled workflow state transitions", () => {
  it("allows the intended screening path and blocks identity-stage skipping", () => {
    expect(canTransitionApplication("interest_submitted", "admin_screening")).toBe(true);
    expect(canTransitionApplication("admin_screening", "shortlisted")).toBe(true);
    expect(canTransitionApplication("interest_submitted", "interview_ready")).toBe(false);
  });

  it("keeps job publication and lifecycle changes in valid order", () => {
    expect(canTransitionJob("submitted", "approved")).toBe(true);
    expect(canTransitionJob("approved", "paused")).toBe(true);
    expect(canTransitionJob("closed", "approved")).toBe(false);
  });

  it("requires employer submission and all admin checks before verification", () => {
    expect(canSubmitEmployerVerification("pending")).toBe(true);
    expect(canSubmitEmployerVerification("rejected")).toBe(true);
    expect(canSubmitEmployerVerification("under_review")).toBe(false);
    expect(canReviewEmployerVerification("under_review")).toBe(true);
    expect(canReviewEmployerVerification("verified")).toBe(false);
    expect(canVerifyEmployer({ registration: true, contact: true, dataUseTerms: true })).toBe(true);
    expect(canVerifyEmployer({ registration: true, contact: false, dataUseTerms: true })).toBe(false);
  });

  it("requires screening, both acceptances, and interview-ready status before release", () => {
    expect(canReleaseIdentity(readyApplication)).toBe(true);
    expect(canReleaseIdentity({ ...readyApplication, handoffConsent: false })).toBe(false);
    expect(canReleaseIdentity({ ...readyApplication, screeningChecks: { ...readyApplication.screeningChecks, identity: "pending" } })).toBe(false);
    expect(canReleaseIdentity({ ...readyApplication, status: "shortlisted" })).toBe(false);
  });
});
