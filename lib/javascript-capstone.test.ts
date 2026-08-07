import { describe, expect, it } from "vitest";
import {
  getEmptyJavaScriptCapstoneChecks,
  getJavaScriptCapstoneInputs,
  gradeJavaScriptCapstoneOutputs,
  hasValidJavaScriptCapstoneCode,
  JAVASCRIPT_CAPSTONE_TOTAL_CHECKS,
} from "./javascript-capstone";

describe("JavaScript capstone", () => {
  it("exposes six distinct project outcomes", () => {
    const checks = getEmptyJavaScriptCapstoneChecks();

    expect(checks).toHaveLength(JAVASCRIPT_CAPSTONE_TOTAL_CHECKS);
    expect(new Set(checks.map((check) => check.id)).size).toBe(
      JAVASCRIPT_CAPSTONE_TOTAL_CHECKS,
    );
    expect(getJavaScriptCapstoneInputs()).toHaveLength(
      JAVASCRIPT_CAPSTONE_TOTAL_CHECKS,
    );
  });

  it("grades each hidden output independently", () => {
    const outputs = [
      "Total: 12.00\nLargest: Lunch (12.00)\nFood: 12.00",
      "wrong",
      "Total: 39.00\nLargest: Train (18.00)\nBooks: 9.00\nFood: 12.00\nTravel: 18.00",
      "Total: 73.50\nLargest: Keyboard (48.00)\nFood: 21.00\nTools: 48.00\nTravel: 4.50",
      "Total: 9.95\nLargest: Notes (7.10)\nBooks: 9.45\nFood: 0.50",
      "Total: 0.00\nLargest: None",
    ];

    expect(gradeJavaScriptCapstoneOutputs(outputs)?.map((check) => check.passed)).toEqual([
      true,
      false,
      true,
      true,
      true,
      true,
    ]);
  });

  it("rejects incomplete output records and oversized source", () => {
    expect(gradeJavaScriptCapstoneOutputs([])).toBeNull();
    expect(gradeJavaScriptCapstoneOutputs([1, 2, 3, 4, 5, 6])).toBeNull();
    expect(hasValidJavaScriptCapstoneCode("function solve() {}" )).toBe(true);
    expect(hasValidJavaScriptCapstoneCode("x".repeat(20_001))).toBe(false);
  });
});
