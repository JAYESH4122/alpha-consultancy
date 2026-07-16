"use client";

import { CalendarDays, CheckCircle2, LockKeyhole, RotateCw, XCircle } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";

export default function AdminInterviewsPage() {
  const { applications, jobs, candidate, scheduleInterview, updateInterview } = useDemo();
  const [message, setMessage] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const interviewApplications = applications.filter((application) => ["interview_ready", "interview_scheduled", "interview_completed"].includes(application.status));

  return <>
    <PageHeader title="Interview handoffs" description="Release identity only after screening, candidate consent, and employer data-use acceptance." />
    {message ? <div className="toast"><CheckCircle2 size={17} />{message}</div> : null}
    <div className="handoff-list">{interviewApplications.map((application) => {
      const job = jobs.find((item) => item.id === application.jobId);
      const scheduled = application.status === "interview_scheduled";
      const completed = application.status === "interview_completed";
      const scheduleAction = (formData: FormData, mode: "schedule" | "reschedule") => {
        const date = String(formData.get("date"));
        const venue = String(formData.get("venue"));
        const result = mode === "schedule" ? scheduleInterview(application.id, date, venue) : updateInterview(application.id, "reschedule", date, venue);
        setMessage(result.message);
        if (result.ok) setRescheduling(null);
      };

      return <article className="handoff-card" key={application.id}>
        <header><div><span className="mono">{application.reference}</span><h2>{job?.title}</h2><p>{job?.reference} · {application.identityReleased ? "Identity released" : "Controlled handoff pending"}</p></div><StatusPill status={application.status} /></header>
        <div className="handoff-checks"><div className="complete"><CheckCircle2 size={17} /><p><strong>Admin screening</strong><span>Candidate is interview ready</span></p></div><div className={application.handoffConsent ? "complete" : "pending"}>{application.handoffConsent ? <CheckCircle2 size={17} /> : <LockKeyhole size={17} />}<p><strong>Candidate consent</strong><span>{application.handoffConsent ? "Recorded" : "Still required"}</span></p></div><div className={application.employerDataUseAccepted ? "complete" : "pending"}>{application.employerDataUseAccepted ? <CheckCircle2 size={17} /> : <LockKeyhole size={17} />}<p><strong>Employer terms</strong><span>{application.employerDataUseAccepted ? "Accepted" : "Still required"}</span></p></div></div>

        {application.status === "interview_ready" && !application.identityReleased ? <form className="interview-form" action={(formData) => scheduleAction(formData, "schedule")}><label>Interview date and time<input name="date" type="datetime-local" required /></label><label>Venue<input name="venue" defaultValue="Harbor Foods, Edappally, Kochi" required /></label><button className="button button-primary" disabled={!application.handoffConsent}><CalendarDays size={16} /> Schedule & release</button></form> : null}

        {application.identityReleased ? <div className="released-panel"><CheckCircle2 size={20} /><div><strong>{completed ? "Interview completed" : application.interviewStatus === "cancelled" ? "Interview cancelled — ready to schedule again" : "Controlled handoff completed"}</strong><p>{candidate.name} ↔ {job?.companyName}</p><small>{application.interviewAt ? new Date(application.interviewAt).toLocaleString("en-IN") : "Date pending"} · {application.interviewVenue}</small></div></div> : null}

        {application.identityReleased && !completed ? <div className="interview-actions"><button className="button button-secondary" onClick={() => setRescheduling(rescheduling === application.id ? null : application.id)}><RotateCw size={16} /> Reschedule</button>{scheduled ? <button className="button button-primary" onClick={() => setMessage(updateInterview(application.id, "complete").message)}><CheckCircle2 size={16} /> Mark completed</button> : null}<button className="button button-danger" onClick={() => setMessage(updateInterview(application.id, "cancel").message)}><XCircle size={16} /> Cancel interview</button></div> : null}
        {rescheduling === application.id ? <form className="interview-form reschedule-form" action={(formData) => scheduleAction(formData, "reschedule")}><label>New date and time<input name="date" type="datetime-local" required /></label><label>New venue<input name="venue" defaultValue={application.interviewVenue} required /></label><button className="button button-primary"><RotateCw size={16} /> Confirm reschedule</button></form> : null}
      </article>;
    })}{interviewApplications.length === 0 ? <div className="empty-state panel"><CalendarDays size={32} /><h2>No interview handoffs yet</h2><p>Shortlisted candidates appear after admin screening is complete.</p></div> : null}</div>
  </>;
}
