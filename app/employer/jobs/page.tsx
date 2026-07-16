"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";

export default function EmployerJobsPage() {
  const { jobs, applications } = useDemo();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const matchesQuery = `${job.title} ${job.reference}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "all" || (status === "review" ? ["submitted", "under_review", "changes_requested"].includes(job.status) : job.status === status);
    return matchesQuery && matchesStatus;
  }), [jobs, query, status]);
  return <><PageHeader title="Job requirements" description="Create roles and track each requirement through admin approval." action={<Link className="button button-primary" href="/employer/jobs/new"><Plus size={17} /> Post a job</Link>} /><section className="panel table-panel"><div className="table-toolbar"><input aria-label="Search jobs" placeholder="Search by role or reference" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="approved">Approved</option><option value="review">In review</option><option value="changes_requested">Changes requested</option><option value="paused">Paused</option><option value="filled">Filled</option><option value="closed">Closed</option></select></div><div className="table-wrap"><table><thead><tr><th>Job</th><th>Location</th><th>Openings</th><th>Status</th><th>Anonymous pipeline</th></tr></thead><tbody>{filteredJobs.map((job) => <tr key={job.id}><td><strong>{job.title}</strong><small className="mono">{job.reference}</small></td><td>{job.workArea}, {job.city}</td><td>{job.openings}</td><td><StatusPill status={job.status} /></td><td>{applications.filter((application) => application.jobId === job.id).length}</td></tr>)}</tbody></table>{filteredJobs.length === 0 ? <div className="empty-state"><h3>No jobs match these filters</h3><p>Try a different role, reference, or status.</p></div> : null}</div></section></>;
}
