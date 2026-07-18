"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, CalendarDays, CircleAlert, ClipboardCheck, Clock3, FileClock, ShieldCheck } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";
import { RoleJourneyBanner } from "@/components/role-journey-banner";

const pageLoadedAt = Date.now();

export default function AdminOverview() {
  const { jobs, applications, auditEvents, employerVerification, dataRequests } = useDemo();
  const pendingJobs = jobs.filter((job) => ["submitted", "under_review"].includes(job.status));
  const screening = applications.filter((application) => ["interest_submitted", "admin_screening", "shortlisted", "needs_information"].includes(application.status));
  const missingInformation = applications.filter((application) => application.status === "needs_information");
  const handoffs = applications.filter((application) => ["interview_ready", "interview_scheduled"].includes(application.status));
  const overdue = applications.filter((application) => application.status === "interview_scheduled" && application.interviewAt && new Date(application.interviewAt).getTime() < pageLoadedAt);
  const openRequests = dataRequests.filter((request) => request.status !== "completed");
  return <>
    <PageHeader title="Operations command centre" description="Review risk, move work forward, and control every identity handoff." />
    <RoleJourneyBanner role="admin" />
    <div className="ops-metrics"><Link href="/admin/employers"><span><Building2 size={19} /></span><div><strong>{employerVerification.status === "verified" ? 0 : 1}</strong><p>Employer checks</p></div><ArrowRight size={17} /></Link><Link href="/admin/jobs"><span><BriefcaseBusiness size={19} /></span><div><strong>{pendingJobs.length}</strong><p>Job approvals</p></div><ArrowRight size={17} /></Link><Link href="/admin/applications"><span><ClipboardCheck size={19} /></span><div><strong>{screening.length}</strong><p>Employee screening</p></div><ArrowRight size={17} /></Link><Link href="/admin/applications"><span><CircleAlert size={19} /></span><div><strong>{missingInformation.length}</strong><p>Missing information</p></div><ArrowRight size={17} /></Link><Link href="/admin/interviews"><span><CalendarDays size={19} /></span><div><strong>{handoffs.length}</strong><p>Interview handoffs</p></div><ArrowRight size={17} /></Link><Link href="/admin/interviews"><span><Clock3 size={19} /></span><div><strong>{overdue.length}</strong><p>Overdue follow-ups</p></div><ArrowRight size={17} /></Link><Link href="/admin/requests"><span><FileClock size={19} /></span><div><strong>{openRequests.length}</strong><p>Privacy requests</p></div><ArrowRight size={17} /></Link></div>
    <div className="dashboard-grid admin-grid"><section className="panel panel-large"><div className="panel-heading"><div><h2>Priority queue</h2><p>Items requiring an admin decision.</p></div></div><div className="queue-list">{pendingJobs.map((job) => <Link href="/admin/jobs" key={job.id}><span className="queue-icon"><BriefcaseBusiness size={18} /></span><div><strong>{job.title}</strong><small>{job.reference} · Employer verification recorded</small></div><span className="queue-age"><Clock3 size={14} /> {job.status.replaceAll("_", " ")}</span><ArrowRight size={17} /></Link>)}{screening.map((application) => <Link href="/admin/applications" key={application.id}><span className="queue-icon candidate"><ClipboardCheck size={18} /></span><div><strong>{application.status === "needs_information" ? "Employee information follow-up" : "Employee screening"}</strong><small>{application.reference} · Identity protected</small></div><span className="queue-age"><Clock3 size={14} /> {application.status.replaceAll("_", " ")}</span><ArrowRight size={17} /></Link>)}{openRequests.map((request) => <Link href="/admin/requests" key={request.id}><span className="queue-icon candidate"><FileClock size={18} /></span><div><strong>Privacy request</strong><small>{request.id} · {request.type.replaceAll("_", " ")}</small></div><span className="queue-age"><Clock3 size={14} /> {request.status.replaceAll("_", " ")}</span><ArrowRight size={17} /></Link>)}{pendingJobs.length + screening.length + openRequests.length === 0 ? <div className="empty-state"><ShieldCheck size={28} /><h3>Queue is clear</h3><p>No approvals, screening checks, or privacy requests are waiting.</p></div> : null}</div></section><section className="panel"><div className="panel-heading"><div><h2>Recent audit activity</h2><p>Sensitive actions recorded automatically.</p></div></div><div className="audit-list">{auditEvents.slice(0, 6).map((event) => <div key={event.id}><span /><p><strong>{event.action}</strong><small>{event.target} · {event.actor}</small></p><time>{new Date(event.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</time></div>)}</div></section></div>
  </>;
}
