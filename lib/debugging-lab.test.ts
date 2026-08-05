import { describe, expect, it } from "vitest";
import {
  gradeDebuggingDrill,
  JAVASCRIPT_DEBUGGING_DRILLS,
} from "./debugging-lab";

describe("JavaScript debugging lab", () => {
  it("offers three distinct defects with bounded checks and guidance", () => {
    expect(JAVASCRIPT_DEBUGGING_DRILLS).toHaveLength(3);
    expect(
      new Set(JAVASCRIPT_DEBUGGING_DRILLS.map((drill) => drill.concept)).size,
    ).toBe(3);

    for (const drill of JAVASCRIPT_DEBUGGING_DRILLS) {
      expect(drill.tests).toHaveLength(3);
      expect(drill.recoveryCue.length).toBeGreaterThan(20);
      expect(drill.takeaway.length).toBeGreaterThan(20);
      expect(drill.starterCode).toContain("function solve(input)");
    }
  });

  it("grades normalized outputs without exposing expected answers", () => {
    const drill = JAVASCRIPT_DEBUGGING_DRILLS[0];

    expect(gradeDebuggingDrill(drill, ["Even\n", "Odd", "Even"])).toEqual({
      passedChecks: 3,
      totalChecks: 3,
      passed: true,
    });
    expect(gradeDebuggingDrill(drill, ["Odd", "Odd", "Even"])).toEqual({
      passedChecks: 2,
      totalChecks: 3,
      passed: false,
    });
  });
});
