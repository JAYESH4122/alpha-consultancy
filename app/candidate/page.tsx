"use client";

import Link from "next/link";
import { ArrowRight, Bell, BriefcaseBusiness, CheckCircle2, FileText, MapPin, ShieldCheck } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";
import { RoleJourneyBanner } from "@/components/role-journey-banner";
import { StatusPill } from "@/components/status-pill";

export default function CandidateOverview() {
  const { candidate, matches, applications, jobs, notifications } = useDemo();
  const recentMatch = matches[0];
  const matchedJob = jobs.find((job) => job.id === recentMatch?.jobId);

  return (
    <>
      <PageHeader title={`Good morning, ${candidate.name.split(" ")[0]}`} description="Your identity stays private until you approve an interview handoff." action={<Link className="button button-primary" href="/candidate/matches">View matches <ArrowRight size={17} /></Link>} />
      <RoleJourneyBanner role="candidate" />
      <section className="privacy-banner"><ShieldCheck size={22} /><div><strong>Your privacy is active</strong><p>Employers cannot see your name, phone number, or resume until our team clears an interview and you consent.</p></div></section>
      <div className="metric-row">
        <article><BriefcaseBusiness size={20} /><div><strong>{matches.length}</strong><span>Active matches</span></div></article>
        <article><FileText size={20} /><div><strong>{applications.length}</strong><span>Applications</span></div></article>
        <article><Bell size={20} /><div><strong>{notifications.filter((n) => n.role === "candidate" && !n.read).length}</strong><span>New updates</span></div></article>
      </div>
      <div className="dashboard-grid">
        <section className="panel panel-large">
          <div className="panel-heading"><div><h2>Best match for you</h2><p>Based on your category, skills, location, experience, and shift.</p></div><Link href="/candidate/matches">All matches</Link></div>
          {matchedJob && recentMatch ? <div className="featured-job">
            <div className="job-score"><strong>{recentMatch.score}</strong><span>match score</span></div>
            <div className="featured-job-main"><div className="featured-job-title"><span className="company-placeholder">Company protected</span><h3>{matchedJob.title}</h3><p><MapPin size={15} /> {matchedJob.workArea}, {matchedJob.city} · {matchedJob.shift} shift</p></div><div className="salary">₹{(matchedJob.salaryMin / 1000).toFixed(0)}k–₹{(matchedJob.salaryMax / 1000).toFixed(0)}k <span>/ month</span></div></div>
            <div className="match-reasons">{recentMatch.reasons.slice(0, 3).map((reason) => <span key={reason.label}><CheckCircle2 size={14} /> {reason.label}</span>)}</div>
            <Link className="button button-dark" href="/candidate/matches">Review opportunity <ArrowRight size={16} /></Link>
          </div> : <div className="empty-state"><BriefcaseBusiness size={30} /><h3>No active matches</h3><p>Update your preferences so we can find suitable work.</p></div>}
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h2>Profile readiness</h2><p>Recruiters use this information for matching.</p></div></div>
          <div className="completion-ring" style={{ "--completion": `${candidate.profileCompletion * 3.6}deg` } as React.CSSProperties}><div><strong>{candidate.profileCompletion}%</strong><span>complete</span></div></div>
          <ul className="check-list"><li><CheckCircle2 size={16} /> Resume uploaded</li><li><CheckCircle2 size={16} /> Skills added</li><li><CheckCircle2 size={16} /> Preferences selected</li></ul>
          <Link className="button button-secondary button-full" href="/candidate/profile">Review profile</Link>
        </section>
      </div>
      {applications.length > 0 ? <section className="panel table-panel"><div className="panel-heading"><div><h2>Recent applications</h2><p>Official status updates appear here first.</p></div></div><div className="table-wrap"><table><thead><tr><th>Reference</th><th>Job</th><th>Status</th><th>Submitted</th></tr></thead><tbody>{applications.slice(0, 3).map((application) => { const job = jobs.find((item) => item.id === application.jobId); return <tr key={application.id}><td className="mono">{application.reference}</td><td>{job?.title}</td><td><StatusPill status={application.status} /></td><td>{new Date(application.submittedAt).toLocaleDateString("en-IN")}</td></tr>; })}</tbody></table></div></section> : null}
    </>
  );
}
