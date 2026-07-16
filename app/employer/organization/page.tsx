"use client";

import { Building2, CheckCircle2, Clock3, FileCheck2, ShieldCheck } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";

export default function OrganizationPage() {
  const { employerVerification } = useDemo();
  const verified = employerVerification.status === "verified";

  return <>
    <PageHeader title="Organization" description="Verified employer details are visible only to the admin team until interview handoff." />
    <div className="form-layout">
      <section className="panel"><div className="form-section-heading"><h2>Company information</h2><StatusPill status={employerVerification.status} /></div><div className="form-grid"><label>Legal company name<input value="Harbor Foods Private Limited" readOnly /></label><label>Industry<input value="Hospitality & Food Service" readOnly /></label><label>Registration number<input value="U55101KL2022PTC074210" readOnly /></label><label>Primary city<input value="Kochi, Kerala" readOnly /></label><label className="full-span">Registered address<textarea value="4th Floor, Marine Plaza, Kochi, Kerala 682031" readOnly rows={3} /></label></div></section>
      <aside className="panel verification-panel"><Building2 size={26} /><h2>Employer verification</h2><p>Updated {new Date(employerVerification.updatedAt).toLocaleDateString("en-IN")}</p><ul className="check-list"><li>{verified ? <CheckCircle2 size={16} /> : <Clock3 size={16} />} Registration {verified ? "checked" : "pending review"}</li><li>{verified ? <CheckCircle2 size={16} /> : <Clock3 size={16} />} Contact {verified ? "verified" : "pending"}</li><li><CheckCircle2 size={16} /> Data-use terms accepted</li></ul><div className="secure-note"><ShieldCheck size={16} /> {employerVerification.notes || "Candidate data can be used only for approved recruitment."}</div></aside>
      <section className="panel full-span"><div className="form-section-heading"><h2>Verification documents</h2></div><div className="document-row"><FileCheck2 size={21} /><div><strong>Certificate of incorporation</strong><small>Uploaded 11 July 2026 · PDF</small></div><span className="verified-label">{verified ? "Verified" : "Submitted"}</span></div></section>
    </div>
  </>;
}
