"use client";

import { ContactRound, FileText, LockKeyhole, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";

export default function EmployerCandidatesPage() {
  const { applications, jobs, candidate } = useDemo();
  const released = applications.filter((application) => application.identityReleased);
  const protectedApplications = applications.filter((application) => !application.identityReleased);

  return <>
    <PageHeader title="Interested employees" description="See application totals first. Personal details appear only after the admin approves an interview." />
    <div className="pipeline-summary"><article><span><ContactRound size={19} /></span><strong>{applications.length}</strong><p>Total interests</p></article><article><span><LockKeyhole size={19} /></span><strong>{protectedApplications.length}</strong><p>Identity protected</p></article><article><span><ShieldCheck size={19} /></span><strong>{released.length}</strong><p>Released for interview</p></article></div>

    {protectedApplications.length > 0 ? <section className="panel protected-pipeline"><div className="panel-heading"><div><h2>Employees being screened</h2><p>Names, contact details, and resumes stay hidden until an interview is approved.</p></div></div>{protectedApplications.map((application) => { const job = jobs.find((item) => item.id === application.jobId); return <div className="protected-row" key={application.id}><LockKeyhole size={18} /><div><strong>Employee details hidden</strong><small>{application.reference} · {job?.title}</small></div><StatusPill status={application.status} /></div>; })}</section> : null}

    <section className="panel released-candidates"><div className="panel-heading"><div><h2>Employees approved for interview</h2><p>Use these details only for this approved recruitment process.</p></div></div>{released.length > 0 ? released.map((application) => { const job = jobs.find((item) => item.id === application.jobId); return <article className="released-candidate" key={application.id}><div className="candidate-avatar">AN</div><div className="released-profile"><span className="mono">{application.reference}</span><h3>{candidate.name}</h3><p>{job?.title} · {candidate.experienceYears} years experience</p><div><span><Phone size={14} />{candidate.phone}</span><span><Mail size={14} />{candidate.email}</span><span><MapPin size={14} />{candidate.city}</span><span><FileText size={14} />{candidate.resumeName}</span></div></div><div className="released-interview"><StatusPill status={application.status} /><small>{application.interviewAt ? new Date(application.interviewAt).toLocaleString("en-IN") : "Date pending"}</small><small>{application.interviewVenue}</small></div></article>; }) : <div className="empty-state"><ShieldCheck size={30} /><h3>No employee details shared yet</h3><p>Details appear only after screening, employee approval, and employer privacy-terms acceptance are complete.</p></div>}</section>
  </>;
}
