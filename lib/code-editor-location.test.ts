import { describe, expect, it } from "vitest";
import { getCodeEditorLocation } from "@/lib/code-editor-location";

describe("getCodeEditorLocation", () => {
  const source = [
    "function solve(input) {",
    "  const value = Number(input);",
    "  return missingValue + value;",
    "}",
  ].join("\n");

  it("maps a runner line and column to the exact editor offset", () => {
    expect(
      getCodeEditorLocation(
        source,
        "Line 3, column 10: missingValue is not defined",
      ),
    ).toEqual({
      line: 3,
      column: 10,
      cursorOffset: source.indexOf("missingValue"),
    });
  });

  it("keeps an oversized browser column on the reported line", () => {
    expect(
      getCodeEditorLocation(source, "Line 2, column 200: Unexpected token"),
    ).toEqual({
      line: 2,
      column: 200,
      cursorOffset: source.indexOf("\n", source.indexOf("\n") + 1),
    });
  });

  it("ignores generic and out-of-range runner messages", () => {
    expect(
      getCodeEditorLocation(source, "missingValue is not defined"),
    ).toBeNull();
    expect(
      getCodeEditorLocation(source, "Line 9, column 1: Unexpected token"),
    ).toBeNull();
  });
});
