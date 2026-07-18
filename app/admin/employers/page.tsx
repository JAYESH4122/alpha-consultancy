"use client";

import { Building2, Check, CheckCircle2, Clock3, FileCheck2, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { canVerifyEmployer } from "@/lib/workflow";

export default function AdminEmployersPage() {
  const { employerVerification, jobs, setEmployerVerificationCheck, decideEmployerVerification } = useDemo();
  const [notes, setNotes] = useState(employerVerification.notes);
  const [message, setMessage] = useState<string | null>(null);
  const reviewing = employerVerification.status === "under_review";
  const readyToVerify = canVerifyEmployer(employerVerification.checks);

  const decide = (status: "verified" | "rejected") => {
    const result = decideEmployerVerification(status, notes);
    setMessage(result.message);
  };

  return <>
    <PageHeader title="Employer verification" description="Review registration, documents, and data-use acceptance before permitting publication or employee handoff." />
    {message ? <div className="toast" role="status"><Check size={17} />{message}</div> : null}
    <article className="review-card employer-review">
      <header><div className="org-icon"><Building2 size={23} /></div><div><span className="mono">ORG-1092</span><h2>Harbor Foods Private Limited</h2><p>Hospitality & Food Service · Kochi, Kerala</p></div><StatusPill status={employerVerification.status} /></header>
      <div className="review-facts"><div><span>Registration</span><strong>U55101KL2022PTC074210</strong></div><div><span>Primary contact</span><strong>{employerVerification.checks.contact ? "Phone & email confirmed" : "Phone & email submitted"}</strong></div><div><span>Active jobs</span><strong>{jobs.filter((job) => job.status === "approved").length}</strong></div><div><span>Risk flags</span><strong>None reported</strong></div></div>
      <div className="document-row"><FileCheck2 size={21} /><div><strong>Certificate of incorporation</strong><small>PDF · uploaded 11 July 2026</small></div><span className="verified-label"><CheckCircle2 size={14} /> Document ready</span></div>
      <div className="secure-note"><ShieldCheck size={16} /> Employer Data-Use Terms v1.0 accepted on 12 July 2026.</div>

      {reviewing ? <section className="verification-checklist" aria-labelledby="verification-checklist-title">
        <div><h3 id="verification-checklist-title">Admin verification checklist</h3><p>Complete each independent check before approval.</p></div>
        <label><input type="checkbox" checked={employerVerification.checks.registration} onChange={(event) => setEmployerVerificationCheck("registration", event.target.checked)} /><span><strong>Registration document checked</strong><small>Confirm the registration number and certificate match.</small></span></label>
        <label><input type="checkbox" checked={employerVerification.checks.contact} onChange={(event) => setEmployerVerificationCheck("contact", event.target.checked)} /><span><strong>Primary contact confirmed</strong><small>Confirm the submitted phone number and email belong to the organization.</small></span></label>
        <label><input type="checkbox" checked={employerVerification.checks.dataUseTerms} disabled /><span><strong>Data-use terms accepted</strong><small>Recorded from the employer account on 12 July 2026.</small></span></label>
      </section> : <div className="verification-state-note">{employerVerification.status === "verified" ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}<div><strong>{employerVerification.status === "pending" ? "Waiting for employer submission" : employerVerification.status === "verified" ? "Employer verification complete" : "Employer must correct and resubmit"}</strong><p>{employerVerification.notes}</p></div></div>}

      {reviewing ? <>
        <label className="verification-notes">Private verification notes<textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Record document checks, risk findings, or rejection reason" /></label>
        <div className="review-actions">
          <span className="review-readiness">{readyToVerify ? <><CheckCircle2 size={16} /> All checks complete</> : <><Clock3 size={16} /> Complete all checks to verify</>}</span>
          <button className="button button-danger" onClick={() => decide("rejected")}><XCircle size={16} /> Reject</button>
          <button className="button button-primary" disabled={!readyToVerify} onClick={() => decide("verified")}><CheckCircle2 size={16} /> Verify employer</button>
        </div>
      </> : null}
    </article>
  </>;
}
