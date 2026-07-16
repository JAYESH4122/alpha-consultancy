"use client";

import { Check, CheckCircle2, FileText, Gavel, Plus, X } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";

export default function AdminLegalPage() {
  const { legalDocuments, publishLegalDocument } = useDemo();
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return <>
    <PageHeader title="Legal documents" description="Publish immutable versions so every acceptance remains traceable." action={<button className="button button-primary" onClick={() => setCreating(true)}><Plus size={17} /> New version</button>} />
    {message ? <div className="toast"><Check size={17} />{message}</div> : null}
    <section className="legal-banner"><Gavel size={22} /><div><strong>Legal review required before launch</strong><p>These operational templates must be reviewed by qualified Indian counsel and aligned with the final retention policy.</p></div></section>
    {creating ? <section className="panel legal-editor"><div className="panel-heading"><div><h2>Publish a document version</h2><p>Publishing creates a new record and does not rewrite prior acceptances.</p></div><button className="icon-button" aria-label="Close legal document form" onClick={() => setCreating(false)}><X size={18} /></button></div><form className="form-grid" action={(formData) => { const name = String(formData.get("name")); const version = String(formData.get("version")); publishLegalDocument({ name, version, audience: String(formData.get("audience")), content: String(formData.get("content")) }); setCreating(false); setMessage(`${name} ${version} published.`); }}><label>Document name<input name="name" placeholder="Candidate Terms" required /></label><label>Version<input name="version" placeholder="v1.1" required /></label><label>Audience<select name="audience" required><option>Candidate</option><option>Employer</option><option>Candidate & employer</option></select></label><label className="full-span">Document content<textarea name="content" rows={7} placeholder="Paste the legally reviewed text here" required /></label><div className="form-footer full-span"><span>Past versions remain immutable.</span><button className="button button-primary"><CheckCircle2 size={16} /> Publish version</button></div></form></section> : null}
    <section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Document</th><th>Version</th><th>Audience</th><th>Status</th><th>Published</th></tr></thead><tbody>{legalDocuments.map((document) => <tr key={document.id}><td><span className="document-name"><FileText size={17} />{document.name}</span></td><td className="mono">{document.version}</td><td>{document.audience}</td><td><span className="verified-label"><CheckCircle2 size={14} /> {document.status}</span></td><td>{document.publishedAt ? new Date(document.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Draft"}</td></tr>)}</tbody></table></div></section>
  </>;
}
