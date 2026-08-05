import { describe, expect, it } from "vitest";
import { getEmptyGuidedProjectChecks } from "@/lib/guided-project";
import { getGuidedProjectRepairDrill } from "@/lib/guided-project-repair";

describe("guided project repair drills", () => {
  it("covers every review check with one bounded correct repair", () => {
    for (const check of getEmptyGuidedProjectChecks()) {
      const drill = getGuidedProjectRepairDrill(check.id);

      expect(drill.checkId).toBe(check.id);
      expect(drill.choices).toHaveLength(2);
      expect(drill.choices.filter((choice) => choice.correct)).toHaveLength(1);
      expect(drill.brokenCode.length).toBeGreaterThan(0);
    }
  });
});
