export type JavaScriptTraceExercise = {
  id: string;
  number: number;
  title: string;
  concept: string;
  prompt: string;
  code: string;
  choices: string[];
  correctOutput: string;
  recoveryCue: string;
  traceSteps: string[];
  takeaway: string;
};

export const JAVASCRIPT_TRACE_EXERCISES: JavaScriptTraceExercise[] = [
  {
    id: "assignment-order",
    number: 1,
    title: "Follow each assignment",
    concept: "Variables and operators",
    prompt: "What does the final console.log print?",
    code: `let total = 4;
total += 3;
total *= 2;
console.log(total);`,
    choices: ["8", "11", "14"],
    correctOutput: "14",
    recoveryCue:
      "Keep one current value for total. Update that value after each assignment before moving down a line.",
    traceSteps: [
      "total starts at 4.",
      "total += 3 replaces it with 7.",
      "total *= 2 replaces 7 with 14.",
    ],
    takeaway:
      "A compound assignment reads the current value, applies the operator, then stores the new value.",
  },
  {
    id: "conditional-branch",
    number: 2,
    title: "Choose the branch that runs",
    concept: "Conditions",
    prompt: "Which text reaches the console?",
    code: `const score = 7;
let message = "ready";

if (score >= 8) {
  message = "strong";
} else {
  message = "keep going";
}

console.log(message);`,
    choices: ["ready", "strong", "keep going"],
    correctOutput: "keep going",
    recoveryCue:
      "Evaluate score >= 8 first. Only one branch can replace the starting message.",
    traceSteps: [
      "score is 7 and message starts as ready.",
      "7 >= 8 is false, so the if block is skipped.",
      "The else block changes message to keep going.",
    ],
    takeaway:
      "An if/else runs exactly one branch, so trace the condition before reading either assignment as active.",
  },
  {
    id: "loop-accumulator",
    number: 3,
    title: "Track a loop accumulator",
    concept: "Loops",
    prompt: "What value is printed after the loop?",
    code: `let sum = 0;

for (let i = 1; i <= 3; i += 1) {
  sum += i;
}

console.log(sum);`,
    choices: ["3", "4", "6"],
    correctOutput: "6",
    recoveryCue:
      "Write down sum once for each loop value: i = 1, then 2, then 3.",
    traceSteps: [
      "sum starts at 0.",
      "The three iterations make sum 1, then 3, then 6.",
      "i becomes 4, the condition fails, and the loop stops.",
    ],
    takeaway:
      "For an accumulator, record its value after every iteration instead of trying to solve the whole loop at once.",
  },
  {
    id: "function-return",
    number: 4,
    title: "Replace a function call",
    concept: "Functions and return values",
    prompt: "What does this function call produce?",
    code: `function double(value) {
  return value * 2;
}

const result = double(3) + 1;
console.log(result);`,
    choices: ["6", "7", "8"],
    correctOutput: "7",
    recoveryCue:
      "Work inside double(3) first. Replace the call with its returned value before doing the final addition.",
    traceSteps: [
      "double receives 3 as value.",
      "The function returns 3 * 2, so double(3) becomes 6.",
      "The remaining expression is 6 + 1, which produces 7.",
    ],
    takeaway:
      "When tracing a function, evaluate its return value first, then substitute that value back into the calling expression.",
  },
];
