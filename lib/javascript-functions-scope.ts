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
    example: { input: "Mina|JavaScript", output: "Mina is learning JavaScript." },
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
  },
];
