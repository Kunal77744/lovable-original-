export const MAX_CODING_TEST_CASES = 6;
export const MAX_CODING_TEST_CASE_INPUT_LENGTH = 2_000;
export const MAX_CODING_TEST_CASE_EXPECTED_OUTPUT_LENGTH = 2_000;

export type CodingTestCase = {
  input: string;
  expectedOutput: string | null;
};

export type CodingTestCaseValidation =
  | { valid: true; cases: CodingTestCase[] }
  | { valid: false; error: string };

export function validateCodingTestCases(
  value: unknown,
): CodingTestCaseValidation {
  if (
    !Array.isArray(value) ||
    value.some(
      (testCase) =>
        typeof testCase !== "object" ||
        testCase === null ||
        !("input" in testCase) ||
        typeof testCase.input !== "string" ||
        !("expectedOutput" in testCase) ||
        (testCase.expectedOutput !== null &&
          typeof testCase.expectedOutput !== "string"),
    )
  ) {
    return {
      valid: false,
      error: "Test cases must include an input and an optional expected output.",
    };
  }

  const cases = value as CodingTestCase[];

  if (cases.length > MAX_CODING_TEST_CASES) {
    return {
      valid: false,
      error: `Save up to ${MAX_CODING_TEST_CASES} test cases per problem.`,
    };
  }

  if (cases.some((testCase) => testCase.input.trim().length === 0)) {
    return { valid: false, error: "Each saved test case needs an input." };
  }

  if (
    cases.some(
      (testCase) =>
        testCase.input.length > MAX_CODING_TEST_CASE_INPUT_LENGTH,
    )
  ) {
    return {
      valid: false,
      error: `Keep each test case under ${MAX_CODING_TEST_CASE_INPUT_LENGTH.toLocaleString()} characters.`,
    };
  }

  if (
    cases.some(
      (testCase) =>
        testCase.expectedOutput !== null &&
        testCase.expectedOutput.length >
          MAX_CODING_TEST_CASE_EXPECTED_OUTPUT_LENGTH,
    )
  ) {
    return {
      valid: false,
      error: `Keep each expected output under ${MAX_CODING_TEST_CASE_EXPECTED_OUTPUT_LENGTH.toLocaleString()} characters.`,
    };
  }

  const inputs = cases.map((testCase) => testCase.input);
  if (new Set(inputs).size !== inputs.length) {
    return { valid: false, error: "Each saved test case must be different." };
  }

  return { valid: true, cases };
}

export function buildLegacyCodingTestCases(value: unknown): unknown {
  if (!Array.isArray(value) || value.some((input) => typeof input !== "string")) {
    return value;
  }

  return value.map((input) => ({ input, expectedOutput: null }));
}
