"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";
import { jobSchema } from "@/lib/validation";
import type { Job } from "@/lib/types";

const fieldError = (errors: Record<string, string[] | undefined>, name: string) => errors[name]?.[0];

export default function NewJobPage() {
  const router = useRouter();
  const { addJob, jobs } = useDemo();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (formData: FormData) => {
    const result = jobSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) { setErrors(result.error.flatten().fieldErrors); return; }
    const value = result.data;
    const job: Job = {
      id: `job-${crypto.randomUUID()}`,
      reference: `JOB-${2410 + jobs.length}`,
      organizationId: "org-1",
      companyName: "Harbor Foods Private Limited",
      title: value.title,
      category: value.category,
      city: value.city,
      workArea: value.workArea,
      workMode: value.workMode,
      employmentType: value.employmentType,
      shift: value.shift,
      salaryMin: value.salaryMin,
      salaryMax: value.salaryMax,
      openings: value.openings,
      experienceMin: value.experienceMin,
      education: value.education,
      description: value.description,
      requiredSkills: value.requiredSkills.split(",").map((item) => item.trim()).filter(Boolean),
      preferredSkills: value.preferredSkills.split(",").map((item) => item.trim()).filter(Boolean),
      requiredDocuments: value.requiredDocuments.split(",").map((item) => item.trim()).filter(Boolean),
      screeningQuestions: value.screeningQuestions.split("\n").map((item) => item.trim()).filter(Boolean),
      interviewAvailability: value.interviewAvailability,
      status: "submitted",
      createdAt: new Date().toISOString(),
    };
    addJob(job); setSubmitted(true); setErrors({});
  };

  if (submitted) return <><PageHeader title="Job submitted" description="Your requirement is now in the admin approval queue." /><section className="success-screen panel"><CheckCircle2 size={42} /><h2>Requirement received</h2><p>Admins will verify the role, salary, location, and eligibility criteria before candidates can see it.</p><button className="button button-primary" onClick={() => router.push("/employer/jobs")}>View job status</button></section></>;

  return <><PageHeader title="Post a new job" description="Give our recruitment team enough detail to verify and match the requirement." /><form className="job-form" action={handleSubmit}><section className="panel"><div className="form-section-heading"><div><span>1</span><h2>Role and requirement</h2></div></div><div className="form-grid"><label className="full-span">Job title<input name="title" placeholder="e.g. Restaurant Service Associate" aria-invalid={Boolean(fieldError(errors, "title"))} />{fieldError(errors, "title") ? <small className="field-error">{fieldError(errors, "title")}</small> : null}</label><label>Category<select name="category" defaultValue="Hospitality"><option>Hospitality</option><option>Retail</option><option>Logistics</option><option>Skilled trades</option><option>Office support</option></select></label><label>Number of openings<input name="openings" type="number" min="1" defaultValue="1" /></label><label>Employment type<select name="employmentType" defaultValue="Full-time"><option>Full-time</option><option>Part-time</option><option>Contract</option></select></label><label>Work mode<select name="workMode" defaultValue="On-site"><option>On-site</option><option>Hybrid</option><option>Remote</option></select></label><label>Shift<select name="shift" defaultValue="Day"><option>Day</option><option>Evening</option><option>Night</option><option>Flexible</option></select></label><label>Minimum experience (years)<input name="experienceMin" type="number" min="0" defaultValue="0" /></label><label className="full-span">Education requirement<input name="education" defaultValue="Higher Secondary or equivalent" /></label><label>Required skills<input name="requiredSkills" placeholder="Customer service, POS billing" /></label><label>Preferred skills<input name="preferredSkills" placeholder="English, Food safety" /></label><label className="full-span">Job description<textarea name="description" rows={5} placeholder="Describe day-to-day work, expectations, and working conditions." />{fieldError(errors, "description") ? <small className="field-error">{fieldError(errors, "description")}</small> : null}</label></div></section><section className="panel"><div className="form-section-heading"><div><span>2</span><h2>Location and compensation</h2></div></div><div className="form-grid"><label>City<input name="city" defaultValue="Kochi" /></label><label>Work area<input name="workArea" placeholder="e.g. Edappally" /></label><label>Minimum monthly salary<input name="salaryMin" type="number" defaultValue="18000" /></label><label>Maximum monthly salary<input name="salaryMax" type="number" defaultValue="24000" />{fieldError(errors, "salaryMax") ? <small className="field-error">{fieldError(errors, "salaryMax")}</small> : null}</label></div></section><section className="panel"><div className="form-section-heading"><div><span>3</span><h2>Screening and interview</h2></div></div><div className="form-grid"><label className="full-span">Required documents<input name="requiredDocuments" defaultValue="Government ID, Resume" /></label><label className="full-span">Screening questions, one per line<textarea name="screeningQuestions" rows={4} placeholder="Can you work weekends?" /></label><label className="full-span">Interview availability<input name="interviewAvailability" defaultValue="Weekdays, 10:00 AM–4:00 PM" /></label></div></section><section className="submit-bar"><div><ShieldCheck size={19} /><p><strong>Admin review required</strong><span>The job stays private until BridgeHire approves it.</span></p></div><button className="button button-primary" type="submit">Submit for review</button></section></form></>;
}
