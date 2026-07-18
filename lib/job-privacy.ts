import type { Job } from "@/lib/types";

export type EmployeeJobPreview = Pick<
  Job,
  | "id"
  | "reference"
  | "title"
  | "category"
  | "city"
  | "workMode"
  | "employmentType"
  | "shift"
  | "salaryMin"
  | "salaryMax"
  | "openings"
  | "experienceMin"
  | "education"
  | "requiredSkills"
> & {
  summary: string;
  screeningQuestions: string[];
  locationLabel: string;
};

const CONTACT_PATTERN = /(?:\b(?:contact|call|phone|mobile|whatsapp|email|website|address)\b|\+?\d[\d\s()-]{7,}|[\w.+-]+@[\w.-]+\.[a-z]{2,}|https?:\/\/|www\.)/i;

export function isEmployeePreviewSafe(job: Job) {
  const protectedTerms = [job.companyName, job.workArea].map((term) => term.trim().toLowerCase()).filter(Boolean);
  const previewText = [job.employeeSummary, ...job.employeeScreeningQuestions].join(" ").toLowerCase();
  return !CONTACT_PATTERN.test(previewText) && protectedTerms.every((term) => !previewText.includes(term));
}

export function toEmployeeJobPreview(job: Job): EmployeeJobPreview {
  if (!isEmployeePreviewSafe(job)) {
    throw new Error(`Employee preview for ${job.reference} contains protected employer information.`);
  }

  return {
    id: job.id,
    reference: job.reference,
    title: job.title,
    category: job.category,
    city: job.city,
    workMode: job.workMode,
    employmentType: job.employmentType,
    shift: job.shift,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    openings: job.openings,
    experienceMin: job.experienceMin,
    education: job.education,
    requiredSkills: [...job.requiredSkills],
    summary: job.employeeSummary,
    screeningQuestions: [...job.employeeScreeningQuestions],
    locationLabel: `${job.city} · exact work area shared after admin clearance`,
  };
}
