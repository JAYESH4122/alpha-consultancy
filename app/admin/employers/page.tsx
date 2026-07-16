"use client";

import { Building2, Check, CheckCircle2, FileCheck2, SearchCheck, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";

export default function AdminEmployersPage() {
  const { employerVerification, jobs, setEmployerVerification } = useDemo();
  const [notes, setNotes] = useState(employerVerification.notes);
  const [message, setMessage] = useState<string | null>(null);
  const decide = (status: "under_review" | "verified" | "rejected") => {
    setEmployerVerification(status, notes);
    setMessage(`Organization marked ${status.replaceAll("_", " ")}.`);
  };

  return <>
    <PageHeader title="Employer verification" description="Review registration, documents, and data-use acceptance before permitting publication or candidate handoff." />
    {message ? <div className="toast"><Check size={17} />{message}</div> : null}
    <article className="review-card employer-review">
      <header><div className="org-icon"><Building2 size={23} /></div><div><span className="mono">ORG-1092</span><h2>Harbor Foods Private Limited</h2><p>Hospitality & Food Service · Kochi, Kerala</p></div><StatusPill status={employerVerification.status} /></header>
      <div className="review-facts"><div><span>Registration</span><strong>U55101KL2022PTC074210</strong></div><div><span>Primary contact</span><strong>Phone & email verified</strong></div><div><span>Active jobs</span><strong>{jobs.filter((job) => job.status === "approved").length}</strong></div><div><span>Risk flags</span><strong>None</strong></div></div>
      <div className="document-row"><FileCheck2 size={21} /><div><strong>Certificate of incorporation</strong><small>PDF · uploaded 11 July 2026</small></div><span className="verified-label"><CheckCircle2 size={14} /> Document ready</span></div>
      <div className="secure-note"><ShieldCheck size={16} /> Employer Data-Use Terms v1.0 accepted on 12 July 2026.</div>
      <label className="verification-notes">Private verification notes<textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Record document checks, risk findings, or rejection reason" /></label>
      <div className="review-actions">
        <button className="button button-secondary" onClick={() => decide("under_review")}><SearchCheck size={16} /> Mark under review</button>
        <button className="button button-danger" onClick={() => decide("rejected")}><XCircle size={16} /> Reject</button>
        <button className="button button-primary" onClick={() => decide("verified")}><CheckCircle2 size={16} /> Verify employer</button>
      </div>
    </article>
  </>;
}
