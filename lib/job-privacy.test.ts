import { describe, expect, it } from "vitest";
import { initialDemoState } from "@/lib/demo-data";
import { isEmployeePreviewSafe, toEmployeeJobPreview } from "@/lib/job-privacy";

describe("employee job privacy projection", () => {
  const job = initialDemoState.jobs[0];

  it("returns only allowlisted employee fields", () => {
    const preview = toEmployeeJobPreview(job);

    expect(preview).not.toHaveProperty("organizationId");
    expect(preview).not.toHaveProperty("companyName");
    expect(preview).not.toHaveProperty("workArea");
    expect(preview).not.toHaveProperty("description");
    expect(preview).not.toHaveProperty("interviewAvailability");
    expect(preview).not.toHaveProperty("requiredDocuments");
    expect(JSON.stringify(preview)).not.toContain(job.companyName);
    expect(JSON.stringify(preview)).not.toContain(job.workArea);
    expect(preview.locationLabel).toBe("Kochi · exact work area shared after admin clearance");
  });

  it("blocks previews containing employer identity, exact area, or contact data", () => {
    expect(isEmployeePreviewSafe({ ...job, employeeSummary: `Work at ${job.companyName}` })).toBe(false);
    expect(isEmployeePreviewSafe({ ...job, employeeSummary: `Report to ${job.workArea}` })).toBe(false);
    expect(isEmployeePreviewSafe({ ...job, employeeSummary: "Call +91 98765 43210 for this role." })).toBe(false);
    expect(() => toEmployeeJobPreview({ ...job, employeeSummary: "Email jobs@example.com to apply." })).toThrow(/protected employer information/);
  });
});
