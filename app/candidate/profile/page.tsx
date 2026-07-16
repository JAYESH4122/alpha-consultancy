"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Download, FilePenLine, FileText, Save, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";

export default function CandidateProfilePage() {
  const { candidate, updateCandidate, uploadResume, dataRequests, submitDataRequest } = useDemo();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const saveProfile = (formData: FormData) => {
    updateCandidate({
      name: String(formData.get("name")),
      phone: String(formData.get("phone")),
      email: String(formData.get("email")),
      city: String(formData.get("city")),
      education: String(formData.get("education")),
      experienceYears: Number(formData.get("experienceYears")),
      salaryExpectation: Number(formData.get("salaryExpectation")),
      preferredAreas: String(formData.get("preferredAreas")).split(",").map((item) => item.trim()).filter(Boolean),
      categories: String(formData.get("categories")).split(",").map((item) => item.trim()).filter(Boolean),
      skills: String(formData.get("skills")).split(",").map((item) => item.trim()).filter(Boolean),
      shifts: String(formData.get("shifts")).split(",").map((item) => item.trim()).filter(Boolean),
      employmentTypes: String(formData.get("employmentTypes")).split(",").map((item) => item.trim()).filter(Boolean),
      workModes: String(formData.get("workModes")).split(",").map((item) => item.trim()).filter((item): item is "On-site" | "Remote" | "Hybrid" => ["On-site", "Remote", "Hybrid"].includes(item)),
      relocationAllowed: formData.get("relocationAllowed") === "on",
      languages: String(formData.get("languages")).split(",").map((item) => item.trim()).filter(Boolean),
      termsAccepted: formData.get("termsAccepted") === "on",
      profileCompletion: 100,
    });
    setMessage("Profile and matching preferences updated.");
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    const result = uploadResume(file);
    setMessage(result.message);
  };

  const request = (type: "export" | "correction" | "deletion" | "withdraw_consent") => {
    submitDataRequest(type);
    setMessage(`${type.replaceAll("_", " ")} request submitted to the admin team.`);
  };

  return <>
    <PageHeader title="Candidate profile" description="Update your matching information, resume, consent, and privacy requests." />
    {message ? <div className="toast" role="status"><CheckCircle2 size={17} />{message}</div> : null}
    <form className="form-layout" action={saveProfile}>
      <section className="panel"><div className="form-section-heading"><h2>Personal information</h2><span><ShieldCheck size={14} /> Private</span></div><div className="form-grid"><label>Full name<input name="name" defaultValue={candidate.name} required /></label><label>Phone number<input name="phone" defaultValue={candidate.phone} required /></label><label>Email<input name="email" type="email" defaultValue={candidate.email} /></label><label>Current city<input name="city" defaultValue={candidate.city} required /></label><label className="full-span">Education<input name="education" defaultValue={candidate.education} /></label><label>Experience in years<input name="experienceYears" type="number" min="0" step="0.5" defaultValue={candidate.experienceYears} /></label><label>Expected monthly salary<input name="salaryExpectation" type="number" min="0" defaultValue={candidate.salaryExpectation} /></label><label className="full-span">Languages, comma separated<input name="languages" defaultValue={candidate.languages.join(", ")} /></label></div></section>
      <aside className="panel resume-panel"><FileText size={26} /><h2>Resume</h2><p>{candidate.resumeName ?? "No resume uploaded"}</p>{candidate.resumeName ? <span><CheckCircle2 size={15} /> Ready for screening</span> : null}<input ref={fileInput} className="visually-hidden" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => handleFile(event.target.files?.[0])} /><button type="button" className="button button-secondary button-full" onClick={() => fileInput.current?.click()}><Upload size={16} /> Replace resume</button><small>PDF or DOCX · maximum 10 MB</small></aside>
      <section className="panel full-span"><div className="form-section-heading"><h2>Work preferences</h2></div><div className="form-grid"><label>Job categories<input name="categories" defaultValue={candidate.categories.join(", ")} /></label><label>Skills<input name="skills" defaultValue={candidate.skills.join(", ")} /></label><label>Preferred areas<input name="preferredAreas" defaultValue={candidate.preferredAreas.join(", ")} /></label><label>Preferred shifts<input name="shifts" defaultValue={candidate.shifts.join(", ")} /></label><label>Employment types<input name="employmentTypes" defaultValue={candidate.employmentTypes.join(", ")} /></label><label>Work modes<input name="workModes" defaultValue={candidate.workModes.join(", ")} placeholder="On-site, Hybrid, Remote" /></label><label className="checkbox-label"><input name="relocationAllowed" type="checkbox" defaultChecked={candidate.relocationAllowed} /> I am open to relocating for suitable work.</label><label className="checkbox-label"><input name="termsAccepted" type="checkbox" defaultChecked={candidate.termsAccepted} /> I accept the current Candidate Terms and Privacy Notice.</label></div><div className="form-footer"><span>Saving preferences recalculates approved job matches.</span><button className="button button-primary" type="submit"><Save size={16} /> Save profile</button></div></section>
    </form>
    <section className="panel privacy-requests"><div className="panel-heading"><div><h2>Privacy and data requests</h2><p>Exercise your access, correction, deletion, and consent rights.</p></div></div><div className="privacy-actions"><button className="button button-secondary" onClick={() => request("export")}><Download size={16} /> Request data export</button><button className="button button-secondary" onClick={() => request("correction")}><FilePenLine size={16} /> Request correction</button><button className="button button-secondary" onClick={() => request("withdraw_consent")}><ShieldCheck size={16} /> Withdraw consent</button><button className="button button-danger" onClick={() => request("deletion")}><Trash2 size={16} /> Request deletion</button></div>{dataRequests.length > 0 ? <div className="request-list">{dataRequests.map((item) => <div key={item.id}><span className="mono">{item.id}</span><strong>{item.type.replaceAll("_", " ")}</strong><span className="status-pill status-warning">{item.status.replaceAll("_", " ")}</span><time>{new Date(item.createdAt).toLocaleDateString("en-IN")}</time></div>)}</div> : null}</section>
  </>;
}
