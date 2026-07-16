import type { CandidateProfile, Job, JobMatch, MatchReason } from "@/lib/types";

const normalize = (value: string) => value.trim().toLowerCase();

export function calculateMatch(job: Job, candidate: CandidateProfile): JobMatch | null {
  if (job.status !== "approved" || !candidate.available) return null;
  if (!candidate.employmentTypes.includes(job.employmentType)) return null;
  if (!candidate.workModes.includes(job.workMode)) return null;

  const reasons: MatchReason[] = [];
  const candidateCategories = new Set(candidate.categories.map(normalize));
  const candidateSkills = new Set(candidate.skills.map(normalize));
  const candidateAreas = new Set([candidate.city, ...candidate.preferredAreas].map(normalize));
  const supportedLocation = job.workMode === "Remote" || candidate.relocationAllowed || candidateAreas.has(normalize(job.city)) || candidateAreas.has(normalize(job.workArea));
  if (!supportedLocation) return null;

  if (candidateCategories.has(normalize(job.category))) {
    reasons.push({ label: "Preferred job category", points: 35 });
  }

  const allSkills = [...job.requiredSkills, ...job.preferredSkills].map(normalize);
  const skillMatches = allSkills.filter((skill) => candidateSkills.has(skill));
  if (allSkills.length > 0 && skillMatches.length > 0) {
    reasons.push({
      label: `${skillMatches.length} matching skill${skillMatches.length === 1 ? "" : "s"}`,
      points: Math.round(30 * (skillMatches.length / allSkills.length)),
    });
  }

  reasons.push({ label: "Preferred work location", points: 20 });

  if (candidate.experienceYears >= job.experienceMin) {
    reasons.push({ label: "Experience requirement met", points: 10 });
  }

  if (candidate.shifts.includes(job.shift) || candidate.shifts.includes("Flexible")) {
    reasons.push({ label: "Shift preference", points: 5 });
  }

  const score = reasons.reduce((total, reason) => total + reason.points, 0);
  if (score < 60) return null;

  return {
    id: `match-${candidate.id}-${job.id}`,
    jobId: job.id,
    candidateId: candidate.id,
    score,
    reasons,
    notified: false,
  };
}

export function calculateMatches(jobs: Job[], candidate: CandidateProfile): JobMatch[] {
  const uniqueMatches = new Map<string, JobMatch>();
  jobs.forEach((job) => {
    const match = calculateMatch(job, candidate);
    if (match) uniqueMatches.set(`${match.jobId}:${match.candidateId}`, match);
  });
  return [...uniqueMatches.values()];
}
