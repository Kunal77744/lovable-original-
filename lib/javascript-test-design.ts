export type JavaScriptTestChoice = {
  input: string;
  expectedOutput: string;
  faultyOutput: string;
};

export type JavaScriptTestDesignExercise = {
  id: string;
  number: number;
  title: string;
  concept: string;
  problem: string;
  faultyCode: string;
  choices: JavaScriptTestChoice[];
  correctInput: string;
  recoveryCue: string;
  explanation: string;
  takeaway: string;
};

export const JAVASCRIPT_TEST_DESIGN_EXERCISES: JavaScriptTestDesignExercise[] = [
  {
    id: "multi-digit-input",
    number: 1,
    title: "Break the input parser",
    concept: "Input shape",
    problem: "Read two whole numbers and return their sum.",
    faultyCode: `function solve(input) {
  const first = Number(input[0]);
  const second = Number(input[2]);

  return String(first + second);
}`,
    choices: [
      { input: "4 9", expectedOutput: "13", faultyOutput: "13" },
      { input: "12 3", expectedOutput: "15", faultyOutput: "1" },
      { input: "0 0", expectedOutput: "0", faultyOutput: "0" },
    ],
    correctInput: "12 3",
    recoveryCue:
      "Compare the character positions the code reads with the number of characters in each input.",
    explanation:
      "The code reads fixed characters instead of splitting the two numbers. In 12 3, input[2] is the space, so the code adds 1 and 0 instead of 12 and 3.",
    takeaway:
      "Test the full input shape, not only the shortest example. Multi-digit and negative values often expose fixed-position parsing.",
  },
  {
    id: "negative-remainder",
    number: 2,
    title: "Challenge the condition",
    concept: "Negative values",
    problem: 'Return "Even" for an even integer and "Odd" otherwise.',
    faultyCode: `function solve(input) {
  const number = Number(input.trim());

  return number % 2 === 1 ? "Odd" : "Even";
}`,
    choices: [
      { input: "7", expectedOutput: "Odd", faultyOutput: "Odd" },
      { input: "-3", expectedOutput: "Odd", faultyOutput: "Even" },
      { input: "0", expectedOutput: "Even", faultyOutput: "Even" },
    ],
    correctInput: "-3",
    recoveryCue:
      "JavaScript keeps the sign on a negative remainder. Work out -3 % 2 before choosing.",
    explanation:
      "In JavaScript, -3 % 2 is -1, not 1. The condition rejects that negative odd remainder and incorrectly returns Even.",
    takeaway:
      "When the problem allows negative values, include one. A condition that works for positive examples may not cover their signed equivalents.",
  },
  {
    id: "negative-only-array",
    number: 3,
    title: "Question the starting value",
    concept: "Initialization",
    problem: "Return the largest integer in a list.",
    faultyCode: `function solve(input) {
  const values = input.trim().split(/\\s+/).map(Number);
  let largest = 0;

  for (const value of values.slice(1)) {
    if (value > largest) largest = value;
  }

  return String(largest);
}`,
    choices: [
      { input: "3\n4 9 2", expectedOutput: "9", faultyOutput: "9" },
      { input: "3\n0 0 0", expectedOutput: "0", faultyOutput: "0" },
      { input: "3\n-8 -3 -5", expectedOutput: "-3", faultyOutput: "0" },
    ],
    correctInput: "3\n-8 -3 -5",
    recoveryCue:
      "Look for an input where the initial largest value is greater than every real value.",
    explanation:
      "The list contains only negative numbers, but largest starts at 0. No list value can replace it, so the code returns a value that was never in the input.",
    takeaway:
      "Initialize from valid input when possible. Then test a set whose values all sit on the opposite side of zero.",
  },
  {
    id: "overlapping-conditions",
    number: 4,
    title: "Expose the branch order",
    concept: "Overlapping conditions",
    problem:
      'Return Fizz for multiples of 3, Buzz for multiples of 5, and FizzBuzz for multiples of both.',
    faultyCode: `function label(number) {
  if (number % 3 === 0) return "Fizz";
  if (number % 5 === 0) return "Buzz";
  if (number % 15 === 0) return "FizzBuzz";

  return String(number);
}`,
    choices: [
      { input: "3", expectedOutput: "Fizz", faultyOutput: "Fizz" },
      { input: "5", expectedOutput: "Buzz", faultyOutput: "Buzz" },
      { input: "15", expectedOutput: "FizzBuzz", faultyOutput: "Fizz" },
    ],
    correctInput: "15",
    recoveryCue:
      "Find the value that satisfies more than one condition. The first matching return ends the function.",
    explanation:
      "15 is divisible by both 3 and 5. The broad multiple-of-3 branch returns Fizz before the more specific FizzBuzz check can run.",
    takeaway:
      "Test where conditions overlap, then place the most specific branch before the broader ones.",
  },
];
