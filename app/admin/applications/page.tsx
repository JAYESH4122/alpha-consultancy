"use client";

import { ArrowRight, Check, CircleAlert, MessageCircle, NotebookPen, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import type { ApplicationStatus } from "@/lib/types";

const nextStatus: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  interest_submitted: "admin_screening",
  admin_screening: "shortlisted",
  needs_information: "admin_screening",
  shortlisted: "interview_ready",
};

const checkLabels = { identity: "Identity", resume: "Resume", eligibility: "Eligibility" } as const;

export default function AdminApplicationsPage() {
  const { applications, jobs, candidate, setApplicationStatus, addScreeningNote, setScreeningCheck, assignApplication } = useDemo();
  const [notice, setNotice] = useState<string | null>(null);
  const whatsappNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER ?? "919876543210";

  return <>
    <PageHeader title="Employee screening" description="Run checks, keep private notes, request information, and move only cleared profiles toward interview." />
    {notice ? <div className="toast"><Check size={17} />{notice}</div> : null}
    <div className="screening-list">{applications.map((application) => {
      const job = jobs.find((item) => item.id === application.jobId);
      const next = nextStatus[application.status];
      const allPassed = Object.values(application.screeningChecks).every((status) => status === "passed");
      const needsPassedChecks = application.status === "admin_screening" && !allPassed;
      const message = encodeURIComponent(`Hello, this is Alpha Consultancy regarding ${application.reference}. Please reply when convenient. No employer details are shared at this stage.`);

      return <article className="screening-card" key={application.id}>
        <div className="screening-identity"><div className="candidate-avatar">AN</div><div><span>Admin-only identity</span><h2>{candidate.name}</h2><p>{candidate.city} · {candidate.experienceYears} years · {candidate.resumeName}</p></div></div>
        <div className="screening-job"><span>Interested in</span><strong>{job?.title}</strong><small>{job?.reference} · {job?.workArea}</small></div>
        <div><StatusPill status={application.status} /></div>

        <section className="screening-workbench">
          <div className="workbench-heading"><div><h3>Screening checks</h3><p>Each decision is written to the audit trail.</p></div><label>Case owner<select aria-label="Case owner" value={application.assignedTo ?? "Unassigned"} onChange={(event) => assignApplication(application.id, event.target.value)}><option>Unassigned</option><option>Priya</option><option>Rahul</option><option>Meera</option></select></label></div>
          <div className="check-grid">{Object.entries(checkLabels).map(([check, label]) => <label key={check}>{label}<select aria-label={`${label} check`} value={application.screeningChecks[check as keyof typeof checkLabels]} onChange={(event) => setScreeningCheck(application.id, check as keyof typeof checkLabels, event.target.value as "pending" | "passed" | "failed")}><option value="pending">Pending</option><option value="passed">Passed</option><option value="failed">Failed</option></select></label>)}</div>
          {job?.employeeScreeningQuestions.length ? <div className="screening-answer-list"><h3>Application answers</h3>{job.employeeScreeningQuestions.map((question, index) => <div key={question}><strong>{question}</strong><p>{application.screeningAnswers[index] || "No answer provided"}</p></div>)}</div> : null}
          <form className="note-form" action={(formData) => { const note = String(formData.get("note")); addScreeningNote(application.id, note); setNotice(`Private note saved for ${application.reference}.`); }}>
            <label><NotebookPen size={15} /> Private admin note<input name="note" placeholder="Record verification evidence or follow-up" required /></label>
            <button className="button button-secondary">Save note</button>
          </form>
          {application.adminNotes.length > 0 ? <ul className="admin-note-list">{application.adminNotes.map((note, index) => <li key={`${note}-${index}`}><NotebookPen size={14} />{note}</li>)}</ul> : null}
        </section>

        <div className="screening-actions">
          <a className="button button-secondary" target="_blank" rel="noreferrer" href={`https://wa.me/${whatsappNumber}?text=${message}`}><MessageCircle size={16} /> WhatsApp employee</a>
          {!['rejected', 'withdrawn', 'interview_scheduled', 'interview_completed'].includes(application.status) ? <>
            <button className="button button-secondary" onClick={() => { setApplicationStatus(application.id, "needs_information"); setNotice(`${application.reference} moved to needs information.`); }}><CircleAlert size={16} /> Request information</button>
            <button className="button button-danger" onClick={() => { setApplicationStatus(application.id, "rejected"); setNotice(`${application.reference} rejected.`); }}><XCircle size={16} /> Reject</button>
          </> : null}
          {next ? <button className="button button-primary" disabled={needsPassedChecks} title={needsPassedChecks ? "Pass all screening checks first" : undefined} onClick={() => { setApplicationStatus(application.id, next); setNotice(`${application.reference} moved to ${next.replaceAll("_", " ")}.`); }}>Advance <ArrowRight size={16} /></button> : <span className="consent-indicator"><ShieldCheck size={15} /> {application.handoffConsent ? "Handoff consent recorded" : "Workflow decision recorded"}</span>}
        </div>
        {needsPassedChecks ? <div className="secure-note"><ShieldCheck size={16} /> Pass identity, resume, and eligibility checks before shortlisting.</div> : null}
      </article>;
    })}{applications.length === 0 ? <div className="empty-state panel"><ShieldCheck size={32} /><h2>No employees waiting</h2><p>Employee interest will appear after an approved job is matched.</p></div> : null}</div>
  </>;
}
