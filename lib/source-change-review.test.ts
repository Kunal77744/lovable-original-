import { describe, expect, it } from "vitest";
import { getSourceChangeReview } from "./source-change-review";

describe("getSourceChangeReview", () => {
  it("separates added and removed lines around unchanged code", () => {
    const review = getSourceChangeReview(
      ["function solve(input) {", '  return "";', "}"].join("\n"),
      [
        "function solve(input) {",
        "  const values = input.split(' ').map(Number);",
        "  return String(values[0] + values[1]);",
        "}",
      ].join("\n"),
    );

    expect(review).toMatchObject({
      additions: 2,
      removals: 1,
      hiddenChangeCount: 0,
      tooLarge: false,
    });
    expect(review.changes).toEqual([
      { kind: "removed", lineNumber: 2, content: '  return "";' },
      {
        kind: "added",
        lineNumber: 2,
        content: "  const values = input.split(' ').map(Number);",
      },
      {
        kind: "added",
        lineNumber: 3,
        content: "  return String(values[0] + values[1]);",
      },
    ]);
  });

  it("reports no changes for identical source", () => {
    expect(getSourceChangeReview("return input;", "return input;")).toEqual({
      additions: 0,
      removals: 0,
      changes: [],
      hiddenChangeCount: 0,
      tooLarge: false,
    });
  });

  it("declines unusually long line-by-line comparisons", () => {
    const longSource = Array.from(
      { length: 241 },
      (_, index) => `line ${index}`,
    ).join("\n");

    expect(
      getSourceChangeReview(longSource, `${longSource}\nnew line`),
    ).toMatchObject({
      changes: [],
      tooLarge: true,
    });
  });
});
