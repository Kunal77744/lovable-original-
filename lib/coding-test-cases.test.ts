import { describe, expect, it } from "vitest";
import {
  MAX_CODING_TEST_CASE_INPUT_LENGTH,
  validateCodingTestCaseInputs,
} from "./coding-test-cases";

describe("coding test case validation", () => {
  it("preserves exact bounded inputs", () => {
    expect(validateCodingTestCaseInputs(["  19 23\n", "-8 3"])).toEqual({
      valid: true,
      inputs: ["  19 23\n", "-8 3"],
    });
  });

  it("allows deleting the complete saved set", () => {
    expect(validateCodingTestCaseInputs([])).toEqual({
      valid: true,
      inputs: [],
    });
  });

  it("rejects more than six inputs", () => {
    expect(
      validateCodingTestCaseInputs(
        Array.from({ length: 7 }, (_, index) => `${index} ${index + 1}`),
      ),
    ).toEqual({
      valid: false,
      error: "Save up to 6 test cases per problem.",
    });
  });

  it("rejects blank, oversized, and duplicate cases", () => {
    expect(validateCodingTestCaseInputs(["  "])).toMatchObject({ valid: false });
    expect(
      validateCodingTestCaseInputs([
        "x".repeat(MAX_CODING_TEST_CASE_INPUT_LENGTH + 1),
      ]),
    ).toMatchObject({ valid: false });
    expect(validateCodingTestCaseInputs(["4 9", "4 9"])).toMatchObject({
      valid: false,
    });
  });
});
