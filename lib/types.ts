export type Role = "candidate" | "employer" | "admin";

export type JobStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "paused"
  | "filled"
  | "closed";

export type ApplicationStatus =
  | "interest_submitted"
  | "admin_screening"
  | "needs_information"
  | "shortlisted"
  | "interview_ready"
  | "interview_scheduled"
  | "interview_completed"
  | "selected"
  | "rejected"
  | "withdrawn";

export type Job = {
  id: string;
  reference: string;
  organizationId: string;
  companyName: string;
  title: string;
  category: string;
  city: string;
  workArea: string;
  workMode: "On-site" | "Remote" | "Hybrid";
  employmentType: string;
  shift: string;
  salaryMin: number;
  salaryMax: number;
  openings: number;
  experienceMin: number;
  education: string;
  description: string;
  employeeSummary: string;
  requiredSkills: string[];
  preferredSkills: string[];
  requiredDocuments: string[];
  screeningQuestions: string[];
  employeeScreeningQuestions: string[];
  interviewAvailability: string;
  status: JobStatus;
  createdAt: string;
};

export type CandidateProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  preferredAreas: string[];
  categories: string[];
  skills: string[];
  experienceYears: number;
  education: string;
  languages: string[];
  salaryExpectation: number;
  shifts: string[];
  employmentTypes: string[];
  workModes: Array<"On-site" | "Remote" | "Hybrid">;
  relocationAllowed: boolean;
  available: boolean;
  resumeName: string | null;
  profileCompletion: number;
  termsAccepted: boolean;
};

export type MatchReason = { label: string; points: number };

export type JobMatch = {
  id: string;
  jobId: string;
  candidateId: string;
  score: number;
  reasons: MatchReason[];
  notified: boolean;
};

export type Application = {
  id: string;
  reference: string;
  jobId: string;
  candidateId: string;
  status: ApplicationStatus;
  submittedAt: string;
  consentVersion: string;
  handoffConsent: boolean;
  employerDataUseAccepted: boolean;
  identityReleased: boolean;
  interviewAt?: string;
  interviewVenue?: string;
  interviewStatus?: "scheduled" | "rescheduled" | "completed" | "cancelled";
  adminNotes: string[];
  screeningAnswers: string[];
  assignedTo?: string;
  screeningChecks: {
    identity: "pending" | "passed" | "failed";
    resume: "pending" | "passed" | "failed";
    eligibility: "pending" | "passed" | "failed";
  };
};

export type Notification = {
  id: string;
  role: Role;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type AuditEvent = {
  id: string;
  action: string;
  target: string;
  actor: string;
  createdAt: string;
};

export type LegalDocument = {
  id: string;
  name: string;
  version: string;
  audience: string;
  status: "draft" | "published";
  publishedAt?: string;
  content: string;
};

export type DataRequest = {
  id: string;
  type: "export" | "correction" | "deletion" | "withdraw_consent";
  status: "submitted" | "in_review" | "completed";
  createdAt: string;
};

export type EmployerVerification = {
  status: "pending" | "under_review" | "verified" | "rejected";
  notes: string;
  updatedAt: string;
  submittedAt?: string;
  checks: {
    registration: boolean;
    contact: boolean;
    dataUseTerms: boolean;
  };
};

export type DemoState = {
  jobs: Job[];
  candidate: CandidateProfile;
  matches: JobMatch[];
  applications: Application[];
  notifications: Notification[];
  auditEvents: AuditEvent[];
  legalDocuments: LegalDocument[];
  dataRequests: DataRequest[];
  employerVerification: EmployerVerification;
};
