import { describe, expect, it } from "vitest";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import {
  getCodingRepairDrill,
  getCodingRepairDrillSlugs,
} from "@/lib/coding-repair-drills";

describe("coding repair drills", () => {
  it("covers every judged JavaScript problem exactly once", () => {
    expect(getCodingRepairDrillSlugs().sort()).toEqual(
      CODING_PROBLEMS.map((problem) => problem.slug).sort(),
    );
  });

  it("keeps each repair decision bounded and answerable", () => {
    for (const problem of CODING_PROBLEMS) {
      const drill = getCodingRepairDrill(problem.slug);

      expect(drill).not.toBeNull();
      expect(drill?.choices).toHaveLength(3);
      expect(new Set(drill?.choices.map((choice) => choice.id)).size).toBe(3);
      expect(
        drill?.choices.some((choice) => choice.id === drill.correctChoiceId),
      ).toBe(true);
      expect(drill?.prompt).not.toHaveLength(0);
      expect(drill?.recoveryCue).not.toHaveLength(0);
      expect(drill?.explanation).not.toHaveLength(0);
    }
  });

  it("rejects an unknown problem slug", () => {
    expect(getCodingRepairDrill("not-a-real-problem")).toBeNull();
  });
});
