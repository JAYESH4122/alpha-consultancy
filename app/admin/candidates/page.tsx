"use client";

import { FileText, MapPin, ShieldCheck } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";

export default function AdminCandidatesPage() {
  const { candidate, applications, matches } = useDemo();
  return <><PageHeader title="Candidate directory" description="Candidate identities are visible only in the admin workspace and never exposed through public job data." /><article className="candidate-directory-card"><div className="candidate-avatar large">AN</div><div><span className="protected-label"><ShieldCheck size={13} /> Admin-only record</span><h2>{candidate.name}</h2><p><MapPin size={14} /> {candidate.city} · {candidate.experienceYears} years experience</p><div className="skill-row">{candidate.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div><div className="candidate-stats"><div><strong>{matches.length}</strong><span>Matches</span></div><div><strong>{applications.length}</strong><span>Applications</span></div><div><FileText size={18} /><span>Resume ready</span></div></div></article></>;
}
