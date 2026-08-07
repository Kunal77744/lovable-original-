import { normalizeCodingOutput } from "@/lib/coding-problems";

export const JAVASCRIPT_CAPSTONE_SLUG = "javascript-expense-report";
export const JAVASCRIPT_CAPSTONE_TITLE = "Expense report builder";
export const JAVASCRIPT_CAPSTONE_TOTAL_CHECKS = 6;
export const MAX_JAVASCRIPT_CAPSTONE_LENGTH = 20_000;

export const JAVASCRIPT_CAPSTONE_STARTER = `function solve(input) {
  const lines = input
    .split("\\n")
    .map((line) => line.trim())
    .filter(Boolean);

  // Each line is: category | description | amount
  // Return the total, largest expense, and category totals.
  // Category lines must be sorted alphabetically.

  return "Total: 0.00\\nLargest: None";
}`;

export type JavaScriptCapstoneCheckId =
  | "read-record"
  | "sum-expenses"
  | "group-categories"
  | "find-largest"
  | "format-decimals"
  | "handle-empty-lines";

export type JavaScriptCapstoneCheck = {
  id: JavaScriptCapstoneCheckId;
  label: string;
  guidance: string;
  passed: boolean;
};

export type JavaScriptCapstoneSubmission = {
  status: "completed" | "needs-revision";
  checks: JavaScriptCapstoneCheck[];
  passedChecks: number;
  totalChecks: number;
  submittedAt: string;
};

export type JavaScriptCapstoneRecord = {
  code: string;
  saved: boolean;
  updatedAt: string | null;
  hasUnreviewedChanges: boolean;
  submission: JavaScriptCapstoneSubmission | null;
};

export const JAVASCRIPT_CAPSTONE_SAMPLE = {
  input: `Food | Lunch | 12.50
Travel | Train | 18.00
Food | Coffee | 3.25`,
  expectedOutput: `Total: 33.75
Largest: Train (18.00)
Food: 15.75
Travel: 18.00`,
};

const CAPSTONE_CASES: Array<{
  id: JavaScriptCapstoneCheckId;
  label: string;
  guidance: string;
  input: string;
  expectedOutput: string;
}> = [
  {
    id: "read-record",
    label: "Read one expense record",
    guidance:
      "Split each non-empty line at | and read the category, description, and numeric amount.",
    input: "Food | Lunch | 12",
    expectedOutput: "Total: 12.00\nLargest: Lunch (12.00)\nFood: 12.00",
  },
  {
    id: "sum-expenses",
    label: "Add every expense",
    guidance:
      "Convert each amount to a number before adding it to the running total.",
    input: "Food | Lunch | 12.50\nFood | Coffee | 3.25",
    expectedOutput: "Total: 15.75\nLargest: Lunch (12.50)\nFood: 15.75",
  },
  {
    id: "group-categories",
    label: "Group and sort category totals",
    guidance:
      "Accumulate one total per category, then print category names in alphabetical order.",
    input: "Travel | Train | 18\nFood | Lunch | 12\nBooks | Guide | 9",
    expectedOutput:
      "Total: 39.00\nLargest: Train (18.00)\nBooks: 9.00\nFood: 12.00\nTravel: 18.00",
  },
  {
    id: "find-largest",
    label: "Name the largest expense",
    guidance:
      "Track the description and amount of the biggest individual row, not the biggest category.",
    input: "Tools | Keyboard | 48\nTravel | Bus | 4.50\nFood | Dinner | 21",
    expectedOutput:
      "Total: 73.50\nLargest: Keyboard (48.00)\nFood: 21.00\nTools: 48.00\nTravel: 4.50",
  },
  {
    id: "format-decimals",
    label: "Format every amount consistently",
    guidance:
      "Use exactly two decimal places for the total, largest expense, and each category.",
    input: "Books | Notes | 7.1\nBooks | Reference | 2.345\nFood | Tea | 0.5",
    expectedOutput:
      "Total: 9.95\nLargest: Notes (7.10)\nBooks: 9.45\nFood: 0.50",
  },
  {
    id: "handle-empty-lines",
    label: "Handle an empty report",
    guidance:
      "Ignore blank lines. With no expense rows, return only the zero total and Largest: None.",
    input: "\n   \n",
    expectedOutput: "Total: 0.00\nLargest: None",
  },
];

export function getEmptyJavaScriptCapstoneChecks(): JavaScriptCapstoneCheck[] {
  return CAPSTONE_CASES.map(({ id, label, guidance }) => ({
    id,
    label,
    guidance,
    passed: false,
  }));
}

export function getJavaScriptCapstoneInputs() {
  return CAPSTONE_CASES.map((testCase) => testCase.input);
}

export function gradeJavaScriptCapstoneOutputs(
  outputs: unknown,
): JavaScriptCapstoneCheck[] | null {
  if (
    !Array.isArray(outputs) ||
    outputs.length !== CAPSTONE_CASES.length ||
    outputs.some((output) => typeof output !== "string")
  ) {
    return null;
  }

  return CAPSTONE_CASES.map(({ id, label, guidance, expectedOutput }, index) => ({
    id,
    label,
    guidance,
    passed:
      normalizeCodingOutput(outputs[index] as string) ===
      normalizeCodingOutput(expectedOutput),
  }));
}

export function hasValidJavaScriptCapstoneCode(code: string) {
  return code.length > 0 && code.length <= MAX_JAVASCRIPT_CAPSTONE_LENGTH;
}
