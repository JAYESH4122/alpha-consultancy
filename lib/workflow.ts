import type { Application, ApplicationStatus, EmployerVerification, JobStatus } from "@/lib/types";

const applicationTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  interest_submitted: ["admin_screening", "needs_information", "rejected", "withdrawn"],
  admin_screening: ["needs_information", "shortlisted", "rejected", "withdrawn"],
  needs_information: ["admin_screening", "rejected", "withdrawn"],
  shortlisted: ["needs_information", "interview_ready", "rejected", "withdrawn"],
  interview_ready: ["interview_scheduled", "rejected", "withdrawn"],
  interview_scheduled: ["interview_ready", "interview_completed"],
  interview_completed: ["selected", "rejected"],
  selected: [],
  rejected: [],
  withdrawn: [],
};

const jobTransitions: Record<JobStatus, JobStatus[]> = {
  draft: ["submitted"],
  submitted: ["under_review", "changes_requested", "approved", "rejected"],
  under_review: ["changes_requested", "approved", "rejected"],
  changes_requested: ["submitted", "under_review", "approved", "rejected"],
  approved: ["paused", "filled", "closed"],
  rejected: [],
  paused: ["approved", "filled", "closed"],
  filled: ["closed"],
  closed: [],
};

export function canTransitionApplication(from: ApplicationStatus, to: ApplicationStatus) {
  return applicationTransitions[from].includes(to);
}

export function canTransitionJob(from: JobStatus, to: JobStatus) {
  return jobTransitions[from].includes(to);
}

export function canSubmitEmployerVerification(status: EmployerVerification["status"]) {
  return status === "pending" || status === "rejected";
}

export function canReviewEmployerVerification(status: EmployerVerification["status"]) {
  return status === "under_review";
}

export function canVerifyEmployer(checks: EmployerVerification["checks"]) {
  return Object.values(checks).every(Boolean);
}

export function canReleaseIdentity(application: Application) {
  return application.status === "interview_ready"
    && application.handoffConsent
    && application.employerDataUseAccepted
    && Object.values(application.screeningChecks).every((status) => status === "passed");
}
