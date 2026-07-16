"use client";

import { CheckCircle2, FileText, MapPin, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";

export default function CandidateMatchesPage() {
  const { matches, jobs, applications, candidate, submitInterest } = useDemo();
  const [message, setMessage] = useState<string | null>(null);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);

  return <>
    <PageHeader title="Job matches" description="Only verified, approved opportunities matching your preferences appear here." />
    <section className="identity-notice"><ShieldCheck size={18} /><span>Company names and contact details stay hidden until a cleared interview handoff.</span></section>
    {message ? <div className="toast" role="status"><CheckCircle2 size={17} />{message}</div> : null}
    <div className="match-list">{matches.map((match) => {
      const job = jobs.find((item) => item.id === match.jobId);
      if (!job) return null;
      const applied = applications.some((application) => application.jobId === job.id && application.status !== "withdrawn");
      const applying = applyingTo === job.id;

      return <article className="match-card" key={match.id}>
        <div className="match-score-block"><strong>{match.score}</strong><span>match</span></div>
        <div className="match-content"><span className="protected-label"><ShieldCheck size={13} /> Verified employer · identity protected</span><h2>{job.title}</h2><p className="job-meta"><MapPin size={15} /> {job.workArea}, {job.city}<span />{job.workMode}<span />{job.employmentType}<span />{job.shift} shift</p><p>{job.description}</p><div className="skill-row">{job.requiredSkills.map((skill) => <span key={skill}>{skill}</span>)}</div><div className="reason-row">{match.reasons.map((reason) => <span key={reason.label}><CheckCircle2 size={14} /> {reason.label} <b>+{reason.points}</b></span>)}</div></div>
        <div className="match-action"><strong>₹{job.salaryMin.toLocaleString("en-IN")}–₹{job.salaryMax.toLocaleString("en-IN")}</strong><span>per month</span><button className="button button-primary button-full" disabled={applied} onClick={() => setApplyingTo(job.id)}>{applied ? "Interest submitted" : "Show interest"}</button></div>

        {applying ? <form className="interest-form" action={(formData) => { const answers = job.screeningQuestions.map((_, index) => String(formData.get(`answer-${index}`))); const result = submitInterest(job.id, answers, formData.get("consent") === "on"); setMessage(result.message); if (result.ok) setApplyingTo(null); }}>
          <div className="interest-form-heading"><div><h3>Submit interest privately</h3><p>Your response goes only to BridgeHire’s admin screening team.</p></div><button type="button" className="icon-button" aria-label="Close application form" onClick={() => setApplyingTo(null)}><X size={17} /></button></div>
          <div className="application-summary"><FileText size={18} /><div><strong>Selected resume</strong><span>{candidate.resumeName ?? "No resume uploaded"}</span></div></div>
          {job.screeningQuestions.map((question, index) => <label key={question}>{question}<textarea name={`answer-${index}`} rows={2} required /></label>)}
          <label className="checkbox-label"><input name="consent" type="checkbox" required /> I accept Application Consent v1.0 and allow BridgeHire to screen this application.</label>
          <div className="interest-form-footer"><span><ShieldCheck size={14} /> Employer identity remains hidden.</span><button className="button button-primary">Accept & submit interest</button></div>
        </form> : null}
      </article>;
    })}</div>
  </>;
}
