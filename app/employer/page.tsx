"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, Plus, ShieldCheck, UsersRound } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";
import { RoleJourneyBanner } from "@/components/role-journey-banner";
import { StatusPill } from "@/components/status-pill";

export default function EmployerOverview() {
  const { jobs, applications } = useDemo();
  const employerJobs = jobs.filter((job) => job.organizationId === "org-1");
  return <>
    <PageHeader title="Hiring overview" description="Post jobs, follow approval, and receive employee details only when an interview is ready." action={<Link className="button button-primary" href="/employer/jobs/new"><Plus size={17} /> Post a job</Link>} />
    <RoleJourneyBanner role="employer" />
    <section className="privacy-banner employer-banner"><ShieldCheck size={22} /><div><strong>Employee privacy is active</strong><p>Employee names, contact details, and resumes stay hidden until screening and consent are complete.</p></div></section>
    <div className="metric-row four"><article><BriefcaseBusiness size={20} /><div><strong>{employerJobs.length}</strong><span>Total jobs</span></div></article><article><CheckCircle2 size={20} /><div><strong>{employerJobs.filter((job) => job.status === "approved").length}</strong><span>Approved</span></div></article><article><Clock3 size={20} /><div><strong>{employerJobs.filter((job) => ["submitted", "under_review"].includes(job.status)).length}</strong><span>In review</span></div></article><article><UsersRound size={20} /><div><strong>{applications.length}</strong><span>Anonymous employees</span></div></article></div>
    <section className="panel table-panel"><div className="panel-heading"><div><h2>Recent jobs</h2><p>Approval status and interested employees at a glance.</p></div><Link href="/employer/jobs">View all</Link></div><div className="table-wrap"><table><thead><tr><th>Reference</th><th>Job</th><th>Status</th><th>Openings</th><th>Interested</th></tr></thead><tbody>{employerJobs.map((job) => <tr key={job.id}><td className="mono">{job.reference}</td><td><strong>{job.title}</strong><small>{job.workArea}, {job.city}</small></td><td><StatusPill status={job.status} /></td><td>{job.openings}</td><td>{applications.filter((application) => application.jobId === job.id).length} employees</td></tr>)}</tbody></table></div></section>
    <section className="next-step-panel"><div><h2>How employee details are shared</h2><p>We screen interested employees, ask for approval, and share identity only when the interview is ready.</p></div><div className="handoff-steps"><span><b>1</b> Private interest</span><ArrowRight size={17} /><span><b>2</b> Admin screening</span><ArrowRight size={17} /><span><b>3</b> Interview connection</span></div></section>
  </>;
}
