"use client";

import { Building2, Check, CheckCircle2, Clock3, FileCheck2, Send, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { canSubmitEmployerVerification } from "@/lib/workflow";

export default function OrganizationPage() {
  const { employerVerification, submitEmployerVerification } = useDemo();
  const [message, setMessage] = useState<string | null>(null);
  const verified = employerVerification.status === "verified";
  const canSubmit = canSubmitEmployerVerification(employerVerification.status);
  const checkIcon = (passed: boolean) => passed ? <CheckCircle2 size={16} /> : <Clock3 size={16} />;

  const submit = () => {
    const result = submitEmployerVerification();
    setMessage(result.message);
  };

  return <>
    <PageHeader title="Organization" description="Organization details stay with Alpha Consultancy until an interview is approved." />
    {message ? <div className="toast" role="status"><Check size={17} />{message}</div> : null}
    <div className="form-layout">
      <section className="panel"><div className="form-section-heading"><h2>Company information</h2><StatusPill status={employerVerification.status} /></div><div className="form-grid"><label>Legal company name<input value="Harbor Foods Private Limited" readOnly /></label><label>Industry<input value="Hospitality & Food Service" readOnly /></label><label>Registration number<input value="U55101KL2022PTC074210" readOnly /></label><label>Primary city<input value="Kochi, Kerala" readOnly /></label><label className="full-span">Registered address<textarea value="4th Floor, Marine Plaza, Kochi, Kerala 682031" readOnly rows={3} /></label></div></section>
      <aside className="panel verification-panel"><Building2 size={26} /><h2>Employer verification</h2><p>Updated {new Date(employerVerification.updatedAt).toLocaleDateString("en-IN")}</p><ul className="check-list"><li>{checkIcon(employerVerification.checks.registration)} Registration {employerVerification.checks.registration ? "checked" : "waiting for admin"}</li><li>{checkIcon(employerVerification.checks.contact)} Phone and email {employerVerification.checks.contact ? "confirmed" : "waiting for admin"}</li><li><CheckCircle2 size={16} /> Employer privacy terms accepted</li></ul><div className={employerVerification.status === "rejected" ? "secure-note verification-rejected" : "secure-note"}>{employerVerification.status === "rejected" ? <XCircle size={16} /> : <ShieldCheck size={16} />} {employerVerification.notes}</div>{canSubmit ? <button className="button button-primary button-full" type="button" onClick={submit}><Send size={16} /> {employerVerification.status === "rejected" ? "Resubmit verification" : "Submit for admin verification"}</button> : null}{verified ? <div className="verified-label verification-complete"><CheckCircle2 size={14} /> Verified for job publishing</div> : null}</aside>
      <section className="panel full-span"><div className="form-section-heading"><h2>Verification documents</h2></div><div className="document-row"><FileCheck2 size={21} /><div><strong>Certificate of incorporation</strong><small>Uploaded 11 July 2026 · PDF</small></div><span className="verified-label">{verified ? "Verified" : employerVerification.status === "under_review" ? "Admin review" : "Submitted"}</span></div></section>
    </div>
  </>;
}
