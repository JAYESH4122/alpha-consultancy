"use client";

import { Check, Eye, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import type { Job, JobStatus } from "@/lib/types";

const lifecycleOptions: Partial<Record<JobStatus, Array<{ value: JobStatus; label: string }>>> = {
  approved: [{ value: "approved", label: "Active" }, { value: "paused", label: "Paused" }, { value: "filled", label: "Filled" }, { value: "closed", label: "Closed" }],
  paused: [{ value: "paused", label: "Paused" }, { value: "approved", label: "Active" }, { value: "filled", label: "Filled" }, { value: "closed", label: "Closed" }],
  filled: [{ value: "filled", label: "Filled" }, { value: "closed", label: "Closed" }],
};

export default function AdminJobsPage() {
  const { jobs, setJobStatus } = useDemo();
  const [notice, setNotice] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const reviewJobs = jobs.filter((job) => ["submitted", "under_review", "changes_requested"].includes(job.status));
  const processedJobs = jobs.filter((job) => !["submitted", "under_review", "changes_requested"].includes(job.status));
  const act = (job: Job, status: JobStatus) => { setJobStatus(job.id, status); setNotice(`${job.title} marked ${status.replaceAll("_", " ")}.`); };

  return <>
    <PageHeader title="Job approval queue" description="Verify legitimacy, salary, location, and eligibility before matching candidates." />
    {notice ? <div className="toast" role="status"><Check size={17} />{notice}</div> : null}
    <div className="review-list">
      {reviewJobs.map((job) => <article className="review-card" key={job.id}>
        <header><div><span className="mono">{job.reference}</span><h2>{job.title}</h2><p>{job.companyName} · {job.workArea}, {job.city}</p></div><StatusPill status={job.status} /></header>
        <div className="review-facts"><div><span>Salary</span><strong>₹{job.salaryMin.toLocaleString("en-IN")}–₹{job.salaryMax.toLocaleString("en-IN")}</strong></div><div><span>Openings</span><strong>{job.openings}</strong></div><div><span>Experience</span><strong>{job.experienceMin}+ years</strong></div><div><span>Shift</span><strong>{job.shift}</strong></div></div>
        <p className="review-description">{job.description}</p>
        <div className="skill-row">{job.requiredSkills.map((skill) => <span key={skill}>{skill}</span>)}</div>
        {expandedJob === job.id ? <div className="requirement-detail"><div><span>Education</span><strong>{job.education}</strong></div><div><span>Work mode</span><strong>{job.workMode}</strong></div><div><span>Preferred skills</span><strong>{job.preferredSkills.join(", ") || "None"}</strong></div><div><span>Documents</span><strong>{job.requiredDocuments.join(", ") || "None"}</strong></div><div><span>Interview availability</span><strong>{job.interviewAvailability}</strong></div><div className="wide"><span>Screening questions</span><strong>{job.screeningQuestions.join(" · ") || "None"}</strong></div></div> : null}
        <footer><button className="button button-secondary" onClick={() => setExpandedJob((current) => current === job.id ? null : job.id)}><Eye size={16} /> {expandedJob === job.id ? "Hide requirement" : "Full requirement"}</button>{job.status === "submitted" ? <button className="button button-secondary" onClick={() => act(job, "under_review")}><Eye size={16} /> Start review</button> : null}<button className="button button-secondary" onClick={() => act(job, "changes_requested")}><MessageCircle size={16} /> Request changes</button><button className="button button-danger" onClick={() => act(job, "rejected")}><X size={16} /> Reject</button><button className="button button-primary" onClick={() => act(job, "approved")}><Check size={16} /> Approve & match</button></footer>
      </article>)}
      {reviewJobs.length === 0 ? <div className="empty-state panel"><Check size={32} /><h2>All jobs reviewed</h2><p>New employer submissions will appear here.</p></div> : null}
    </div>
    <section className="panel table-panel compact"><div className="panel-heading"><div><h2>Recently processed</h2><p>Admins control active, paused, filled, and closed states.</p></div></div><div className="table-wrap"><table><thead><tr><th>Reference</th><th>Role</th><th>Employer</th><th>Status</th><th>Lifecycle</th></tr></thead><tbody>{processedJobs.map((job) => { const options = lifecycleOptions[job.status]; return <tr key={job.id}><td className="mono">{job.reference}</td><td>{job.title}</td><td>{job.companyName}</td><td><StatusPill status={job.status} /></td><td>{options ? <select aria-label={`Update ${job.title} lifecycle`} value={job.status} onChange={(event) => act(job, event.target.value as JobStatus)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <span className="muted-text">Final decision</span>}</td></tr>; })}</tbody></table></div></section>
  </>;
}
