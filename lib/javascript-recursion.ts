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
  stackTrace: {
    title: string;
    steps: {
      phase: "Call" | "Base case" | "Return";
      label: string;
      frames: string[];
      explanation: string;
      result?: string;
    }[];
  };
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
    stackTrace: {
      title: "Watch countDown(3) build and unwind.",
      steps: [
        {
          phase: "Call",
          label: "Start with 3",
          frames: ["countDown(3)"],
          explanation:
            "The first call cannot finish yet. It pauses while countDown(2) solves the smaller countdown.",
        },
        {
          phase: "Call",
          label: "Move to 2",
          frames: ["countDown(3)", "countDown(2)"],
          explanation:
            "The second frame also pauses and asks countDown(1) for the rest of the answer.",
        },
        {
          phase: "Call",
          label: "Move to 1",
          frames: ["countDown(3)", "countDown(2)", "countDown(1)"],
          explanation:
            "One more smaller call will reach the stopping condition.",
        },
        {
          phase: "Base case",
          label: "Stop at 0",
          frames: [
            "countDown(3)",
            "countDown(2)",
            "countDown(1)",
            "countDown(0)",
          ],
          explanation:
            "The base case answers directly. It returns Go without adding another frame.",
          result: "Go",
        },
        {
          phase: "Return",
          label: "Finish 1",
          frames: ["countDown(3)", "countDown(2)", "countDown(1)"],
          explanation:
            "countDown(1) receives Go, adds its own number, and leaves the stack.",
          result: "1, Go",
        },
        {
          phase: "Return",
          label: "Finish 2",
          frames: ["countDown(3)", "countDown(2)"],
          explanation:
            "countDown(2) receives the finished inner result and adds 2 in front.",
          result: "2, 1, Go",
        },
        {
          phase: "Return",
          label: "Finish 3",
          frames: ["countDown(3)"],
          explanation:
            "The original frame receives the result, adds 3, and completes the countdown.",
          result: "3, 2, 1, Go",
        },
      ],
    },
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
    stackTrace: {
      title: "Watch sumTo(4) carry work down and back.",
      steps: [
        {
          phase: "Call",
          label: "Start with 4",
          frames: ["sumTo(4)"],
          explanation:
            "The call keeps 4 ready, then pauses while sumTo(3) finds the smaller total.",
        },
        {
          phase: "Call",
          label: "Reduce to 3",
          frames: ["sumTo(4)", "sumTo(3)"],
          explanation:
            "Each new frame keeps its own number and sends a smaller input forward.",
        },
        {
          phase: "Call",
          label: "Reduce to 2",
          frames: ["sumTo(4)", "sumTo(3)", "sumTo(2)"],
          explanation:
            "The stack grows because none of these calls can add its number yet.",
        },
        {
          phase: "Call",
          label: "Reduce to 1",
          frames: ["sumTo(4)", "sumTo(3)", "sumTo(2)", "sumTo(1)"],
          explanation: "sumTo(1) makes the final smaller call toward zero.",
        },
        {
          phase: "Base case",
          label: "Answer zero",
          frames: ["sumTo(4)", "sumTo(3)", "sumTo(2)", "sumTo(1)", "sumTo(0)"],
          explanation:
            "sumTo(0) returns 0 directly, giving the paused calls a value to use.",
          result: "0",
        },
        {
          phase: "Return",
          label: "Add 1",
          frames: ["sumTo(4)", "sumTo(3)", "sumTo(2)", "sumTo(1)"],
          explanation: "sumTo(1) adds its saved 1 to the returned 0.",
          result: "1 + 0 = 1",
        },
        {
          phase: "Return",
          label: "Add 2",
          frames: ["sumTo(4)", "sumTo(3)", "sumTo(2)"],
          explanation: "sumTo(2) receives 1 and adds the 2 it kept.",
          result: "2 + 1 = 3",
        },
        {
          phase: "Return",
          label: "Add 3",
          frames: ["sumTo(4)", "sumTo(3)"],
          explanation: "sumTo(3) receives 3 and adds its saved number.",
          result: "3 + 3 = 6",
        },
        {
          phase: "Return",
          label: "Add 4",
          frames: ["sumTo(4)"],
          explanation: "The original call adds 4 and produces the final total.",
          result: "4 + 6 = 10",
        },
      ],
    },
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
    stackTrace: {
      title: "Watch traceCalls(2) mirror the stack.",
      steps: [
        {
          phase: "Call",
          label: "Record call 2",
          frames: ["traceCalls(2)"],
          explanation:
            "The outer call records itself before pausing for traceCalls(1).",
          result: "call 2",
        },
        {
          phase: "Call",
          label: "Record call 1",
          frames: ["traceCalls(2)", "traceCalls(1)"],
          explanation:
            "The next call records itself, then asks the base case to finish the descent.",
          result: "call 2 > call 1",
        },
        {
          phase: "Base case",
          label: "Reach the base",
          frames: ["traceCalls(2)", "traceCalls(1)", "traceCalls(0)"],
          explanation:
            "The base case contributes base and begins the return trip.",
          result: "call 2 > call 1 > base",
        },
        {
          phase: "Return",
          label: "Record return 1",
          frames: ["traceCalls(2)", "traceCalls(1)"],
          explanation:
            "The most recent paused call finishes first, so return 1 comes next.",
          result: "call 2 > call 1 > base > return 1",
        },
        {
          phase: "Return",
          label: "Record return 2",
          frames: ["traceCalls(2)"],
          explanation:
            "The outer call finishes last and closes the mirrored trace.",
          result: "call 2 > call 1 > base > return 1 > return 2",
        },
      ],
    },
  },
  {
    slug: "repair-missing-progress",
    number: 4,
    concept: "Termination",
    title: "Repair a call that never gets closer",
    prompt:
      "The base case is correct, but repeatWord sends the same remaining count into every call. Repair the recursive step so it terminates.",
    inputFormat: 'A word and repeat count separated by "|".',
    outputFormat:
      "The word repeated the requested number of times with spaces.",
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
    stackTrace: {
      title: 'Watch repeatWord("go", 3) reach zero.',
      steps: [
        {
          phase: "Call",
          label: "Start with 3 left",
          frames: ['repeatWord("go", 3)'],
          explanation:
            "The call keeps one go and must reduce the remaining count before recursing.",
        },
        {
          phase: "Call",
          label: "Move to 2 left",
          frames: ['repeatWord("go", 3)', 'repeatWord("go", 2)'],
          explanation:
            "Because the count changed, this frame is closer to the base case than its caller.",
        },
        {
          phase: "Call",
          label: "Move to 1 left",
          frames: [
            'repeatWord("go", 3)',
            'repeatWord("go", 2)',
            'repeatWord("go", 1)',
          ],
          explanation:
            "The remaining count keeps shrinking instead of repeating the same unfinished work.",
        },
        {
          phase: "Base case",
          label: "Stop with 0 left",
          frames: [
            'repeatWord("go", 3)',
            'repeatWord("go", 2)',
            'repeatWord("go", 1)',
            'repeatWord("go", 0)',
          ],
          explanation:
            "Zero returns an empty list. No further recursive call is needed.",
          result: "[]",
        },
        {
          phase: "Return",
          label: "Return one word",
          frames: [
            'repeatWord("go", 3)',
            'repeatWord("go", 2)',
            'repeatWord("go", 1)',
          ],
          explanation: "The frame for 1 adds its saved word to the empty list.",
          result: '["go"]',
        },
        {
          phase: "Return",
          label: "Return two words",
          frames: ['repeatWord("go", 3)', 'repeatWord("go", 2)'],
          explanation: "The frame for 2 adds the next saved word.",
          result: '["go", "go"]',
        },
        {
          phase: "Return",
          label: "Return three words",
          frames: ['repeatWord("go", 3)'],
          explanation:
            "The original frame adds the last word and the joined output is ready.",
          result: "go go go",
        },
      ],
    },
  },
];
