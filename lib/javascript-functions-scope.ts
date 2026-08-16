export type JavaScriptFunctionExercise = {
  slug: string;
  number: number;
  concept: "Parameters" | "Return values" | "Local scope" | "Closures";
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
  callFrameReplay: {
    input: string;
    steps: {
      title: string;
      detail: string;
      callPath: string[];
      frameLabel: string;
      bindings: { name: string; value: string }[];
      returnedValue?: string;
    }[];
  };
};

export const JAVASCRIPT_FUNCTION_EXERCISES: JavaScriptFunctionExercise[] = [
  {
    slug: "pass-arguments",
    number: 1,
    concept: "Parameters",
    title: "Pass values into a function",
    prompt:
      "Complete describeLearner so it uses both parameters to build the requested sentence.",
    inputFormat: 'A learner name and topic separated by "|".',
    outputFormat: 'One sentence: "name is learning topic."',
    example: {
      input: "Mina|JavaScript",
      output: "Mina is learning JavaScript.",
    },
    starterCode: `function describeLearner(name, topic) {
  // Use both parameters to build the sentence.
}

function solve(input) {
  const [name, topic] = input.trim().split("|");
  return describeLearner(name, topic);
}`,
    tests: [
      {
        input: "Mina|JavaScript",
        expectedOutput: "Mina is learning JavaScript.",
      },
      { input: "Sam|CSS", expectedOutput: "Sam is learning CSS." },
      { input: "Lee|HTML", expectedOutput: "Lee is learning HTML." },
    ],
    recoveryCue:
      "A parameter is a local name for an incoming value. Build the sentence from name and topic instead of fixed text.",
    takeaway:
      "Parameters let one function work with different values, so the same behavior can be reused instead of copied.",
    callFrameReplay: {
      input: "Mina|JavaScript",
      steps: [
        {
          title: "solve receives the raw input",
          detail:
            "The caller opens solve with one input value. No describeLearner frame exists yet.",
          callPath: ["caller", "solve(input)"],
          frameLabel: "Active frame · solve",
          bindings: [{ name: "input", value: '"Mina|JavaScript"' }],
        },
        {
          title: "solve prepares two arguments",
          detail:
            "Splitting the input creates the two values that the next function call will receive.",
          callPath: ["caller", "solve(input)"],
          frameLabel: "Active frame · solve",
          bindings: [
            { name: "name", value: '"Mina"' },
            { name: "topic", value: '"JavaScript"' },
          ],
        },
        {
          title: "parameters get local names",
          detail:
            "Calling describeLearner opens a new frame. Its parameters name the incoming values inside this call.",
          callPath: ["caller", "solve(input)", "describeLearner(name, topic)"],
          frameLabel: "Active frame · describeLearner",
          bindings: [
            { name: "name", value: '"Mina"' },
            { name: "topic", value: '"JavaScript"' },
          ],
        },
        {
          title: "the reusable function returns one sentence",
          detail:
            "The describeLearner frame closes after returning. solve passes that result back to its caller.",
          callPath: ["caller", "solve(input)"],
          frameLabel: "Returned to · solve",
          bindings: [
            { name: "result", value: '"Mina is learning JavaScript."' },
          ],
          returnedValue: 'Return → "Mina is learning JavaScript."',
        },
      ],
    },
  },
  {
    slug: "return-a-result",
    number: 2,
    concept: "Return values",
    title: "Send a result back to the caller",
    prompt:
      "Complete applyDiscount so it returns the price after the percentage discount has been removed.",
    inputFormat: "A price and discount percentage separated by one space.",
    outputFormat: "One number with exactly two decimal places.",
    example: { input: "80 25", output: "60.00" },
    starterCode: `function applyDiscount(price, percent) {
  // Calculate and return the discounted price.
}

function solve(input) {
  const [price, percent] = input.trim().split(/\\s+/).map(Number);
  return applyDiscount(price, percent).toFixed(2);
}`,
    tests: [
      { input: "80 25", expectedOutput: "60.00" },
      { input: "49.99 10", expectedOutput: "44.99" },
      { input: "120 0", expectedOutput: "120.00" },
    ],
    recoveryCue:
      "Find the fraction that remains after the discount, multiply the price by it, and return that number.",
    takeaway:
      "Return gives the caller a value it can keep using. Logging a result displays it, but does not send it back.",
    callFrameReplay: {
      input: "80 25",
      steps: [
        {
          title: "solve parses two numbers",
          detail:
            "The input becomes the price and percentage that solve will pass into applyDiscount.",
          callPath: ["caller", "solve(input)"],
          frameLabel: "Active frame · solve",
          bindings: [
            { name: "price", value: "80" },
            { name: "percent", value: "25" },
          ],
        },
        {
          title: "applyDiscount receives its own bindings",
          detail:
            "A new frame opens with local parameter names. Changing them here would not rename variables in solve.",
          callPath: ["caller", "solve(input)", "applyDiscount(price, percent)"],
          frameLabel: "Active frame · applyDiscount",
          bindings: [
            { name: "price", value: "80" },
            { name: "percent", value: "25" },
          ],
        },
        {
          title: "the function calculates a result",
          detail:
            "The remaining fraction is 0.75, so this frame produces the number 60.",
          callPath: ["caller", "solve(input)", "applyDiscount(price, percent)"],
          frameLabel: "Active frame · applyDiscount",
          bindings: [
            { name: "remaining", value: "0.75" },
            { name: "discountedPrice", value: "60" },
          ],
          returnedValue: "Return → 60",
        },
        {
          title: "the caller keeps using the return value",
          detail:
            "applyDiscount closes. Back in solve, toFixed formats the returned number for the final output.",
          callPath: ["caller", "solve(input)"],
          frameLabel: "Returned to · solve",
          bindings: [
            { name: "returned number", value: "60" },
            { name: "formatted output", value: '"60.00"' },
          ],
          returnedValue: 'Return → "60.00"',
        },
      ],
    },
  },
  {
    slug: "keep-state-local",
    number: 3,
    concept: "Local scope",
    title: "Keep temporary state inside the function",
    prompt:
      "Complete labelScore so its temporary label stays local and each call returns Pass or Retry independently.",
    inputFormat: "One whole-number score from 0 to 100.",
    outputFormat: 'Either "Pass" for 70 or above, or "Retry".',
    example: { input: "74", output: "Pass" },
    starterCode: `function labelScore(score) {
  // Create a local label, update it when needed, then return it.
}

function solve(input) {
  const score = Number(input.trim());
  return labelScore(score);
}`,
    tests: [
      { input: "74", expectedOutput: "Pass" },
      { input: "69", expectedOutput: "Retry" },
      { input: "70", expectedOutput: "Pass" },
    ],
    recoveryCue:
      "Declare the temporary label inside labelScore. Start with Retry, change it only when score reaches 70, then return it.",
    takeaway:
      "A local variable belongs to one function call, which prevents temporary state from leaking into unrelated work.",
    callFrameReplay: {
      input: "74",
      steps: [
        {
          title: "solve prepares one score",
          detail:
            "The input is converted to a number before solve calls labelScore.",
          callPath: ["caller", "solve(input)"],
          frameLabel: "Active frame · solve",
          bindings: [{ name: "score", value: "74" }],
        },
        {
          title: "labelScore opens a separate frame",
          detail:
            "The score parameter and temporary label both belong to this single function call.",
          callPath: ["caller", "solve(input)", "labelScore(score)"],
          frameLabel: "Active frame · labelScore",
          bindings: [
            { name: "score", value: "74" },
            { name: "label", value: '"Retry"' },
          ],
        },
        {
          title: "only the local label changes",
          detail:
            "Because 74 reaches the threshold, this call updates its own label. Other calls keep independent state.",
          callPath: ["caller", "solve(input)", "labelScore(score)"],
          frameLabel: "Active frame · labelScore",
          bindings: [
            { name: "score", value: "74" },
            { name: "label", value: '"Pass"' },
          ],
          returnedValue: 'Return → "Pass"',
        },
        {
          title: "temporary state disappears after return",
          detail:
            "The labelScore frame closes. solve receives only the returned string, not the local label variable.",
          callPath: ["caller", "solve(input)"],
          frameLabel: "Returned to · solve",
          bindings: [{ name: "result", value: '"Pass"' }],
          returnedValue: 'Return → "Pass"',
        },
      ],
    },
  },
  {
    slug: "remember-with-a-closure",
    number: 4,
    concept: "Closures",
    title: "Return a function that remembers",
    prompt:
      "Complete createMultiplier so the function it returns remembers the original factor and applies it later.",
    inputFormat: "A factor and value separated by one space.",
    outputFormat: "One number: factor multiplied by value.",
    example: { input: "3 7", output: "21" },
    starterCode: `function createMultiplier(factor) {
  // Return a function that multiplies its value by factor.
}

function solve(input) {
  const [factor, value] = input.trim().split(/\\s+/).map(Number);
  const multiply = createMultiplier(factor);
  return String(multiply(value));
}`,
    tests: [
      { input: "3 7", expectedOutput: "21" },
      { input: "5 -2", expectedOutput: "-10" },
      { input: "0 99", expectedOutput: "0" },
    ],
    recoveryCue:
      "Return a new function that accepts value. It can still read factor because factor existed when the inner function was created.",
    takeaway:
      "A closure lets a returned function remember variables from where it was created, even after the outer call has finished.",
    callFrameReplay: {
      input: "3 7",
      steps: [
        {
          title: "solve calls the function factory",
          detail:
            "The factor 3 enters createMultiplier. The later value 7 stays in solve for now.",
          callPath: ["caller", "solve(input)", "createMultiplier(factor)"],
          frameLabel: "Active frame · createMultiplier",
          bindings: [{ name: "factor", value: "3" }],
        },
        {
          title: "the returned function closes over factor",
          detail:
            "createMultiplier returns a new function. That function keeps access to factor even when the outer frame closes.",
          callPath: ["caller", "solve(input)"],
          frameLabel: "Remembered environment · multiply",
          bindings: [
            { name: "factor", value: "3 (remembered)" },
            { name: "multiply", value: "returned function" },
          ],
          returnedValue: "Return → multiply(value)",
        },
        {
          title: "the closure receives a later value",
          detail:
            "Calling multiply(7) opens the inner function with value 7 and restores access to the remembered factor 3.",
          callPath: ["caller", "solve(input)", "multiply(value)"],
          frameLabel: "Active frame · multiply",
          bindings: [
            { name: "value", value: "7" },
            { name: "factor", value: "3 (remembered)" },
          ],
        },
        {
          title: "both bindings produce the result",
          detail:
            "The inner function multiplies its current argument by the value preserved from where it was created.",
          callPath: ["caller", "solve(input)"],
          frameLabel: "Returned to · solve",
          bindings: [
            { name: "factor × value", value: "3 × 7" },
            { name: "result", value: "21" },
          ],
          returnedValue: 'Return → "21"',
        },
      ],
    },
  },
];
