export type TourRole = "employer" | "admin" | "candidate";

export type TourStage = {
  number: number;
  shortLabel: string;
  title: string;
  summary: string;
  actor: TourRole;
  reference: string;
  roleTitle: string;
  location: string;
  checks: string[];
  nextAction: string;
  nextDescription: string;
  workspaceHref: string;
  workspaceLabel: string;
  actions: Record<TourRole, string>;
  visibility: Record<TourRole, string>;
};

export const tourRoles: Array<{ key: TourRole; label: string; description: string }> = [
  { key: "employer", label: "Employer", description: "Requests the role" },
  { key: "admin", label: "Alpha Admin", description: "Verifies and screens" },
  { key: "candidate", label: "Candidate", description: "Explores and applies" },
];

export const tourStages: TourStage[] = [
  {
    number: 1,
    shortLabel: "Employer submits role",
    title: "Employer submits the requirement",
    summary: "The employer provides a complete hiring brief. It goes to Alpha Consultancy first—not directly to candidates.",
    actor: "employer",
    reference: "JOB-2410",
    roleTitle: "Warehouse Associate",
    location: "Kochi",
    checks: ["Organization profile complete", "Job requirements complete", "Employer terms accepted"],
    nextAction: "Send the job to admin review",
    nextDescription: "The employer can track status, but the role stays private until approval.",
    workspaceHref: "/employer/jobs/new",
    workspaceLabel: "Open employer job form",
    actions: {
      employer: "Define the role, pay, location, eligibility, and interview availability.",
      admin: "No action yet. The requirement enters the approval queue after submission.",
      candidate: "Nothing is visible yet because the job has not been approved.",
    },
    visibility: {
      employer: "Their own job requirement and submission status",
      admin: "The submitted organization and job details",
      candidate: "Nothing—the job is not published yet",
    },
  },
  {
    number: 2,
    shortLabel: "Admin verifies job",
    title: "Admin verifies and approves the job",
    summary: "Alpha Consultancy checks the employer and requirement before any candidate receives the opportunity.",
    actor: "admin",
    reference: "JOB-2410",
    roleTitle: "Warehouse Associate",
    location: "Kochi",
    checks: ["Employer verified", "Requirements reviewed", "Hiring criteria permitted"],
    nextAction: "Approve the job and generate matches",
    nextDescription: "Approval makes an anonymized version available only to suitable candidates.",
    workspaceHref: "/admin/jobs",
    workspaceLabel: "Open admin job approvals",
    actions: {
      employer: "Wait for approval or respond if the admin requests changes.",
      admin: "Verify the organization, review the requirement, and approve or request changes.",
      candidate: "Nothing is visible until the admin approves the role.",
    },
    visibility: {
      employer: "Review status and any requested changes",
      admin: "Full employer and job verification records",
      candidate: "Nothing until approval is complete",
    },
  },
  {
    number: 3,
    shortLabel: "Candidate shows interest",
    title: "Candidate receives a private match",
    summary: "A suitable candidate sees the approved opportunity without the company identity and chooses whether to apply.",
    actor: "candidate",
    reference: "MATCH-6812",
    roleTitle: "Warehouse Associate",
    location: "Kochi",
    checks: ["92% rules-based match", "Resume selected", "Application consent accepted"],
    nextAction: "Submit interest and screening answers",
    nextDescription: "The employer receives only an anonymous pipeline update at this point.",
    workspaceHref: "/candidate/matches",
    workspaceLabel: "Open candidate job matches",
    actions: {
      employer: "See that a candidate entered the anonymous pipeline—no identity or resume.",
      admin: "Receive the application, resume, consent record, and screening answers.",
      candidate: "Review the anonymized job, answer questions, select a resume, and show interest.",
    },
    visibility: {
      employer: "Anonymous interest and pipeline totals only",
      admin: "Candidate profile, resume, consent, and answers",
      candidate: "Anonymized job details and match reasons",
    },
  },
  {
    number: 4,
    shortLabel: "Admin screens candidate",
    title: "Admin screens the candidate",
    summary: "Alpha Consultancy reviews the candidate privately and decides whether the application is ready for handoff.",
    actor: "admin",
    reference: "APP-1042",
    roleTitle: "Warehouse Associate",
    location: "Kochi",
    checks: ["Identity passed", "Resume passed", "Eligibility passed"],
    nextAction: "Collect candidate handoff consent",
    nextDescription: "The candidate must approve sharing verified details with this specific employer.",
    workspaceHref: "/admin/applications",
    workspaceLabel: "Open admin screening",
    actions: {
      employer: "Continue seeing an anonymous candidate while Alpha Consultancy screens the application.",
      admin: "Review documents and answers, record checks, request information, and shortlist.",
      candidate: "Respond to information requests and wait for a verified status update.",
    },
    visibility: {
      employer: "Anonymous candidate and pipeline status only",
      admin: "Verified candidate records and private notes",
      candidate: "Anonymized job and application status",
    },
  },
  {
    number: 5,
    shortLabel: "Interview handoff",
    title: "Admin releases the interview handoff",
    summary: "Only after screening and both consent gates pass does Alpha Consultancy schedule the interview and reveal identities.",
    actor: "admin",
    reference: "INT-0318",
    roleTitle: "Warehouse Associate",
    location: "Kochi",
    checks: ["Candidate handoff consent", "Employer data-use acceptance", "Admin interview clearance"],
    nextAction: "Share interview details with both parties",
    nextDescription: "The release is recorded in the audit trail with the interview date and venue.",
    workspaceHref: "/admin/interviews",
    workspaceLabel: "Open interview handoffs",
    actions: {
      employer: "Receive the released candidate identity, resume, and interview record.",
      admin: "Schedule the interview, release approved details, and record the handoff.",
      candidate: "Receive the verified employer identity, venue, date, and contact instructions.",
    },
    visibility: {
      employer: "Released candidate identity, resume, and interview details",
      admin: "Complete handoff record and permanent audit event",
      candidate: "Employer identity, venue, date, and instructions",
    },
  },
];
