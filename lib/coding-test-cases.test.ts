import { describe, expect, it } from "vitest";
import {
  buildLegacyCodingTestCases,
  MAX_CODING_TEST_CASE_EXPECTED_OUTPUT_LENGTH,
  MAX_CODING_TEST_CASE_INPUT_LENGTH,
  validateCodingTestCases,
} from "./coding-test-cases";

describe("coding test case validation", () => {
  it("preserves exact inputs, optional expectations, and empty output", () => {
    expect(
      validateCodingTestCases([
        { input: "  19 23\n", expectedOutput: "42\n" },
        { input: "-8 3", expectedOutput: null },
        { input: "0 0", expectedOutput: "" },
      ]),
    ).toEqual({
      valid: true,
      cases: [
        { input: "  19 23\n", expectedOutput: "42\n" },
        { input: "-8 3", expectedOutput: null },
        { input: "0 0", expectedOutput: "" },
      ],
    });
  });

  it("allows deleting the complete saved set", () => {
    expect(validateCodingTestCases([])).toEqual({
      valid: true,
      cases: [],
    });
  });

  it("converts legacy input-only saves without inventing expectations", () => {
    expect(buildLegacyCodingTestCases(["19 23", "0 0"])).toEqual([
      { input: "19 23", expectedOutput: null },
      { input: "0 0", expectedOutput: null },
    ]);
  });

  it("rejects more than six cases", () => {
    expect(
      validateCodingTestCases(
        Array.from({ length: 7 }, (_, index) => ({
          input: `${index} ${index + 1}`,
          expectedOutput: null,
        })),
      ),
    ).toEqual({
      valid: false,
      error: "Save up to 6 test cases per problem.",
    });
  });

  it("rejects malformed, blank, oversized, and duplicate cases", () => {
    expect(validateCodingTestCases([{ input: "4 9" }])).toMatchObject({
      valid: false,
    });
    expect(
      validateCodingTestCases([{ input: "  ", expectedOutput: null }]),
    ).toMatchObject({ valid: false });
    expect(
      validateCodingTestCases([
        {
          input: "x".repeat(MAX_CODING_TEST_CASE_INPUT_LENGTH + 1),
          expectedOutput: null,
        },
      ]),
    ).toMatchObject({ valid: false });
    expect(
      validateCodingTestCases([
        {
          input: "4 9",
          expectedOutput: "x".repeat(
            MAX_CODING_TEST_CASE_EXPECTED_OUTPUT_LENGTH + 1,
          ),
        },
      ]),
    ).toMatchObject({ valid: false });
    expect(
      validateCodingTestCases([
        { input: "4 9", expectedOutput: null },
        { input: "4 9", expectedOutput: "13" },
      ]),
    ).toMatchObject({ valid: false });
  });
});
