import { normalizeCodingOutput } from "./coding-problems";

export type DebuggingDrill = {
  slug: string;
  number: number;
  title: string;
  concept: string;
  brief: string;
  starterCode: string;
  tests: { input: string; expectedOutput: string }[];
  recoveryCue: string;
  takeaway: string;
};

export const JAVASCRIPT_DEBUGGING_DRILLS: DebuggingDrill[] = [
  {
    slug: "repair-a-condition",
    number: 1,
    title: "Repair the condition",
    concept: "Boolean branches",
    brief:
      'This program should return "Even" for even integers and "Odd" for odd integers. One branch is reversed.',
    starterCode: `function solve(input) {
  const number = Number(input.trim());

  return number % 2 === 0 ? "Odd" : "Even";
}`,
    tests: [
      { input: "24", expectedOutput: "Even" },
      { input: "17", expectedOutput: "Odd" },
      { input: "0", expectedOutput: "Even" },
    ],
    recoveryCue:
      "Trace what the true branch returns when the remainder is exactly zero.",
    takeaway:
      "A condition can be correct while its two result branches are in the wrong order.",
  },
  {
    slug: "reset-the-total",
    number: 2,
    title: "Reset the total",
    concept: "Accumulator state",
    brief:
      "This program should add every integer in the input. Its starting total changes every answer.",
    starterCode: `function solve(input) {
  const numbers = input.trim().split(/\\s+/).map(Number);
  let total = 1;

  for (const number of numbers) {
    total += number;
  }

  return String(total);
}`,
    tests: [
      { input: "4 9", expectedOutput: "13" },
      { input: "-8 3", expectedOutput: "-5" },
      { input: "0 0 0", expectedOutput: "0" },
    ],
    recoveryCue:
      "Ask what value should represent an empty sum before the loop begins.",
    takeaway:
      "An accumulator must start from the identity value for the operation it performs.",
  },
  {
    slug: "include-the-last-step",
    number: 3,
    title: "Include the last step",
    concept: "Loop boundaries",
    brief:
      "This program should return every integer from 1 through n. The final value never reaches the output.",
    starterCode: `function solve(input) {
  const limit = Number(input.trim());
  const values = [];

  for (let number = 1; number < limit; number += 1) {
    values.push(number);
  }

  return values.join(" ");
}`,
    tests: [
      { input: "5", expectedOutput: "1 2 3 4 5" },
      { input: "1", expectedOutput: "1" },
      { input: "3", expectedOutput: "1 2 3" },
    ],
    recoveryCue:
      "Compare the last allowed loop value with the value named by the brief.",
    takeaway:
      "A strict boundary excludes the endpoint; an inclusive boundary keeps it.",
  },
];

export function gradeDebuggingDrill(
  drill: DebuggingDrill,
  outputs: string[],
) {
  const passedChecks = drill.tests.reduce(
    (count, test, index) =>
      count +
      (normalizeCodingOutput(outputs[index] ?? "") ===
      normalizeCodingOutput(test.expectedOutput)
        ? 1
        : 0),
    0,
  );

  return {
    passedChecks,
    totalChecks: drill.tests.length,
    passed: passedChecks === drill.tests.length,
  };
}
