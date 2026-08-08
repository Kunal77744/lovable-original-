export type JavaScriptRecursionExercise = {
  slug: string;
  number: number;
  concept: "Base case" | "Smaller input" | "Call stack" | "Termination";
  title: string;
  prompt: string;
  inputFormat: string;
  outputFormat: string;
  example: {
    input: string;
    output: string;
  };
  starterCode: string;
  tests: {
    input: string;
    expectedOutput: string;
  }[];
  recoveryCue: string;
  takeaway: string;
};

export const JAVASCRIPT_RECURSION_EXERCISES: JavaScriptRecursionExercise[] = [
  {
    slug: "stop-at-the-base-case",
    number: 1,
    concept: "Base case",
    title: "Give the recursion a stopping point",
    prompt:
      "Complete countDown with a base case so it stops at zero and returns Go instead of calling itself forever.",
    inputFormat: "One whole number from 0 to 8.",
    outputFormat: 'A countdown ending in "Go".',
    example: { input: "3", output: "3, 2, 1, Go" },
    starterCode: `function countDown(n) {
  // Add the stopping condition for zero.

  return \`\${n}, \${countDown(n - 1)}\`;
}

function solve(input) {
  return countDown(Number(input.trim()));
}`,
    tests: [
      { input: "0", expectedOutput: "Go" },
      { input: "3", expectedOutput: "3, 2, 1, Go" },
      { input: "6", expectedOutput: "6, 5, 4, 3, 2, 1, Go" },
    ],
    recoveryCue:
      "Find the smallest input that needs no recursive work. Return its final answer before the function reaches another self-call.",
    takeaway:
      "A base case answers the smallest input directly, giving every chain of recursive calls a definite place to stop.",
  },
  {
    slug: "reduce-toward-zero",
    number: 2,
    concept: "Smaller input",
    title: "Hand the function a smaller problem",
    prompt:
      "Complete sumTo so each call adds its current number and asks the next call to solve a smaller total.",
    inputFormat: "One whole number from 0 to 20.",
    outputFormat: "The sum of every whole number from 1 through the input.",
    example: { input: "4", output: "10" },
    starterCode: `function sumTo(n) {
  if (n === 0) return 0;

  // Add n to the result for the next smaller input.
}

function solve(input) {
  return String(sumTo(Number(input.trim())));
}`,
    tests: [
      { input: "1", expectedOutput: "1" },
      { input: "4", expectedOutput: "10" },
      { input: "8", expectedOutput: "36" },
    ],
    recoveryCue:
      "Keep the current number, then ask the same function for the total immediately below it. That next input must move closer to zero.",
    takeaway:
      "Recursion works when each call turns the original task into the same task with a smaller input that approaches the base case.",
  },
  {
    slug: "trace-calls-and-returns",
    number: 3,
    concept: "Call stack",
    title: "See calls descend and returns unwind",
    prompt:
      "Complete traceCalls so it places each call before the recursive trace and the matching return after it.",
    inputFormat: "One whole number from 1 to 5.",
    outputFormat: "A call-by-call trace separated by arrows.",
    example: {
      input: "2",
      output: "call 2 > call 1 > base > return 1 > return 2",
    },
    starterCode: `function traceCalls(n) {
  if (n === 0) return ["base"];

  const innerTrace = traceCalls(n - 1);
  // Return one array with this call before innerTrace and this return after it.
}

function solve(input) {
  return traceCalls(Number(input.trim())).join(" > ");
}`,
    tests: [
      { input: "1", expectedOutput: "call 1 > base > return 1" },
      {
        input: "2",
        expectedOutput: "call 2 > call 1 > base > return 1 > return 2",
      },
      {
        input: "3",
        expectedOutput:
          "call 3 > call 2 > call 1 > base > return 1 > return 2 > return 3",
      },
    ],
    recoveryCue:
      "The current call pauses while the smaller call finishes. Put the current call before the inner trace and its matching return after the trace.",
    takeaway:
      "Recursive calls build a stack on the way down, then finish in reverse order as each paused call receives its result.",
  },
  {
    slug: "repair-missing-progress",
    number: 4,
    concept: "Termination",
    title: "Repair a call that never gets closer",
    prompt:
      "The base case is correct, but repeatWord sends the same remaining count into every call. Repair the recursive step so it terminates.",
    inputFormat: 'A word and repeat count separated by "|".',
    outputFormat: "The word repeated the requested number of times with spaces.",
    example: { input: "echo|3", output: "echo echo echo" },
    starterCode: `function repeatWord(word, remaining) {
  if (remaining === 0) return [];

  // Repair the recursive input so it moves toward zero.
  return [word, ...repeatWord(word, remaining)];
}

function solve(input) {
  const [word, count] = input.trim().split("|");
  return repeatWord(word, Number(count)).join(" ");
}`,
    tests: [
      { input: "echo|1", expectedOutput: "echo" },
      { input: "go|3", expectedOutput: "go go go" },
      { input: "step|5", expectedOutput: "step step step step step" },
    ],
    recoveryCue:
      "Compare the recursive input with the base case. Every call needs a smaller remaining count, or the stopping condition can never be reached.",
    takeaway:
      "A base case is not enough by itself. Every recursive path must also make measurable progress toward that case.",
  },
];
