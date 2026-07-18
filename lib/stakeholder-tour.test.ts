import { describe, expect, it } from "vitest";
import { tourRoles, tourStages } from "@/lib/stakeholder-tour";

describe("stakeholder tour", () => {
  it("presents the complete employer-to-interview sequence", () => {
    expect(tourStages.map((stage) => stage.number)).toEqual([1, 2, 3, 4, 5]);
    expect(tourStages[0].actor).toBe("employer");
    expect(tourStages.at(-1)?.shortLabel).toBe("Interview handoff");
  });

  it("explains actions and visibility for every role at every stage", () => {
    for (const stage of tourStages) {
      for (const role of tourRoles) {
        expect(stage.actions[role.key]).toBeTruthy();
        expect(stage.visibility[role.key]).toBeTruthy();
      }
    }
  });

  it("keeps employer access anonymous before the handoff", () => {
    expect(tourStages.slice(0, 4).every((stage) => /anonymous|own job|review status/i.test(stage.visibility.employer))).toBe(true);
    expect(tourStages[4].visibility.employer).toContain("Released employee identity");
  });
});
