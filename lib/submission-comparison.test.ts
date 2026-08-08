import { describe, expect, it } from "vitest";
import {
  buildSubmissionLineDiff,
  summarizeSubmissionDiff,
} from "./submission-comparison";

describe("submission comparison", () => {
  it("aligns unchanged, removed, and added lines without exposing another source", () => {
    const diff = buildSubmissionLineDiff(
      "function solve(input) {\n  return input;\n}",
      "function solve(input) {\n  const value = Number(input);\n  return value + 1;\n}",
    );

    expect(diff).toEqual([
      {
        kind: "same",
        previousLineNumber: 1,
        currentLineNumber: 1,
        previous: "function solve(input) {",
        current: "function solve(input) {",
      },
      {
        kind: "removed",
        previousLineNumber: 2,
        currentLineNumber: null,
        previous: "  return input;",
        current: null,
      },
      {
        kind: "added",
        previousLineNumber: null,
        currentLineNumber: 2,
        previous: null,
        current: "  const value = Number(input);",
      },
      {
        kind: "added",
        previousLineNumber: null,
        currentLineNumber: 3,
        previous: null,
        current: "  return value + 1;",
      },
      {
        kind: "same",
        previousLineNumber: 3,
        currentLineNumber: 4,
        previous: "}",
        current: "}",
      },
    ]);
    expect(summarizeSubmissionDiff(diff)).toEqual({ added: 2, removed: 1 });
  });

  it("keeps identical source truthful", () => {
    const diff = buildSubmissionLineDiff("return 1;", "return 1;");

    expect(diff).toHaveLength(1);
    expect(diff[0].kind).toBe("same");
    expect(summarizeSubmissionDiff(diff)).toEqual({ added: 0, removed: 0 });
  });
});
