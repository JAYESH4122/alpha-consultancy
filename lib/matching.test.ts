import { describe, expect, it } from "vitest";
import { calculateMatch, calculateMatches } from "@/lib/matching";
import { initialDemoState } from "@/lib/demo-data";

describe("privacy-safe job matching", () => {
  it("scores the approved demo job using all five rule groups", () => {
    const job = initialDemoState.jobs.find((item) => item.id === "job-1");
    expect(job).toBeDefined();
    const match = calculateMatch(job!, initialDemoState.candidate);
    expect(match).not.toBeNull();
    expect(match?.score).toBe(93);
    expect(match?.reasons.map((reason) => reason.label)).toEqual([
      "Preferred job category",
      "3 matching skills",
      "Preferred work location",
      "Experience requirement met",
      "Shift preference",
    ]);
  });

  it("never matches a job before admin approval", () => {
    const pendingJob = initialDemoState.jobs.find((item) => item.status === "submitted");
    expect(calculateMatch(pendingJob!, initialDemoState.candidate)).toBeNull();
  });

  it("applies availability and employment type as hard filters", () => {
    const approvedJob = initialDemoState.jobs.find((item) => item.status === "approved")!;
    expect(calculateMatch(approvedJob, { ...initialDemoState.candidate, available: false })).toBeNull();
    expect(calculateMatch(approvedJob, { ...initialDemoState.candidate, employmentTypes: ["Part-time"] })).toBeNull();
    expect(calculateMatch(approvedJob, { ...initialDemoState.candidate, workModes: ["Remote"] })).toBeNull();
  });

  it("deduplicates candidates to one match per approved job", () => {
    const matches = calculateMatches([...initialDemoState.jobs, { ...initialDemoState.jobs[0] }], initialDemoState.candidate);
    const unique = new Set(matches.map((match) => `${match.jobId}:${match.candidateId}`));
    expect(unique.size).toBe(matches.length);
    expect(calculateMatches(initialDemoState.jobs, initialDemoState.candidate)).toHaveLength(1);
  });

  it("treats unsupported location as a hard filter", () => {
    const approvedJob = initialDemoState.jobs.find((item) => item.status === "approved")!;
    expect(calculateMatch({ ...approvedJob, city: "Delhi", workArea: "Saket" }, initialDemoState.candidate)).toBeNull();
    expect(calculateMatch({ ...approvedJob, city: "Delhi", workArea: "Saket" }, { ...initialDemoState.candidate, relocationAllowed: true })).not.toBeNull();
  });
});
