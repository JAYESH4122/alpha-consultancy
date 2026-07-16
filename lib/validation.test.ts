import { describe, expect, it } from "vitest";
import { jobSchema } from "@/lib/validation";

const validJob = {
  title: "Service Associate",
  category: "Hospitality",
  city: "Kochi",
  workArea: "Edappally",
  employmentType: "Full-time",
  workMode: "On-site",
  shift: "Day",
  openings: "3",
  salaryMin: "18000",
  salaryMax: "24000",
  experienceMin: "1",
  description: "Support guests and keep the service area organized throughout each shift.",
  requiredSkills: "Customer service, POS billing",
  preferredSkills: "English",
  education: "Higher Secondary",
  requiredDocuments: "Government ID, Resume",
  screeningQuestions: "Can you work weekends?",
  interviewAvailability: "Weekdays 10 AM to 4 PM",
};

describe("job requirement validation", () => {
  it("accepts and coerces a complete employer requirement", () => {
    const result = jobSchema.safeParse(validJob);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.openings).toBe(3);
  });

  it("rejects an inverted salary range", () => {
    const result = jobSchema.safeParse({ ...validJob, salaryMin: "30000", salaryMax: "20000" });
    expect(result.success).toBe(false);
  });

  it("rejects vague job descriptions", () => {
    const result = jobSchema.safeParse({ ...validJob, description: "Help staff." });
    expect(result.success).toBe(false);
  });
});
