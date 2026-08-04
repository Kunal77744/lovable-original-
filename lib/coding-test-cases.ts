export const MAX_CODING_TEST_CASES = 6;
export const MAX_CODING_TEST_CASE_INPUT_LENGTH = 2_000;

export type CodingTestCaseValidation =
  | { valid: true; inputs: string[] }
  | { valid: false; error: string };

export function validateCodingTestCaseInputs(
  value: unknown,
): CodingTestCaseValidation {
  if (!Array.isArray(value) || value.some((input) => typeof input !== "string")) {
    return { valid: false, error: "Test cases must be a list of inputs." };
  }

  if (value.length > MAX_CODING_TEST_CASES) {
    return {
      valid: false,
      error: `Save up to ${MAX_CODING_TEST_CASES} test cases per problem.`,
    };
  }

  if (value.some((input) => input.trim().length === 0)) {
    return { valid: false, error: "Each saved test case needs an input." };
  }

  if (value.some((input) => input.length > MAX_CODING_TEST_CASE_INPUT_LENGTH)) {
    return {
      valid: false,
      error: `Keep each test case under ${MAX_CODING_TEST_CASE_INPUT_LENGTH.toLocaleString()} characters.`,
    };
  }

  if (new Set(value).size !== value.length) {
    return { valid: false, error: "Each saved test case must be different." };
  }

  return { valid: true, inputs: value };
}
