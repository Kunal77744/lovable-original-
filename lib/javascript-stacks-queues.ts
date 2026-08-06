export type JavaScriptStacksQueuesExercise = {
  slug: string;
  number: number;
  concept: "Stack operations" | "Balanced delimiters" | "Queue operations" | "Choose a structure";
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

export const JAVASCRIPT_STACKS_QUEUES_EXERCISES: JavaScriptStacksQueuesExercise[] = [
  {
    slug: "remove-the-newest-item",
    number: 1,
    concept: "Stack operations",
    title: "Remove the newest item first",
    prompt:
      "Complete applyStackOperations so each pop removes the value that was pushed most recently. Push commands already add values to the stack.",
    inputFormat: 'Comma-separated commands such as "push:blue" and "pop".',
    outputFormat: "The remaining stack from oldest to newest, separated by commas.",
    example: { input: "push:red,push:blue,pop", output: "red" },
    starterCode: `function applyStackOperations(operations) {
  const stack = [];

  for (const operation of operations) {
    if (operation.startsWith("push:")) {
      stack.push(operation.slice(5));
    } else if (operation === "pop") {
      // Remove the value added most recently.
    }
  }

  return stack.join(",");
}

function solve(input) {
  const operations = input.trim().split(",");
  return applyStackOperations(operations);
}`,
    tests: [
      { input: "push:red,push:blue,pop", expectedOutput: "red" },
      {
        input: "push:red,push:blue,push:green,pop,pop",
        expectedOutput: "red",
      },
      { input: "push:one,pop,push:two", expectedOutput: "two" },
    ],
    recoveryCue:
      "Treat one end of the array as the top of the stack. A removal should use that same end so the newest value leaves first.",
    takeaway:
      "A stack is last in, first out: adding and removing at one end makes the most recently added value the first one available.",
  },
  {
    slug: "balance-delimiter-pairs",
    number: 2,
    concept: "Balanced delimiters",
    title: "Close the latest open delimiter",
    prompt:
      "Complete isBalanced so every closing delimiter matches the most recent unmatched opener and no open delimiters remain at the end.",
    inputFormat: "A string containing only parentheses, brackets, and braces.",
    outputFormat: 'Exactly "true" when every pair is balanced, otherwise "false".',
    example: { input: "([]{})", output: "true" },
    starterCode: `function isBalanced(text) {
  const opening = "([{";
  const matchingOpen = { ")": "(", "]": "[", "}": "{" };
  const stack = [];

  for (const character of text) {
    if (opening.includes(character)) {
      stack.push(character);
      continue;
    }

    // Remove the latest opener and compare it with this closer.
  }

  return stack.length === 0;
}

function solve(input) {
  return String(isBalanced(input.trim()));
}`,
    tests: [
      { input: "([]{})", expectedOutput: "true" },
      { input: "([)]", expectedOutput: "false" },
      { input: "(([])", expectedOutput: "false" },
    ],
    recoveryCue:
      "Keep each opener until a closer arrives. The closer must match the newest unmatched opener, and an empty stack is required after the final character.",
    takeaway:
      "A stack fits nested delimiters because the latest opener must close first; one mismatch or leftover opener makes the whole sequence invalid.",
  },
  {
    slug: "serve-the-oldest-item",
    number: 3,
    concept: "Queue operations",
    title: "Serve arrivals in order",
    prompt:
      "Complete serveQueue so each service step removes the person who has waited longest. New arrivals are already ordered from oldest to newest.",
    inputFormat: 'A service count, then a "|", then comma-separated names.',
    outputFormat: "The remaining queue from oldest to newest, separated by commas.",
    example: { input: "2|Ada,Ben,Cleo", output: "Cleo" },
    starterCode: `function serveQueue(names, serviceCount) {
  const queue = [...names];

  for (let served = 0; served < serviceCount; served += 1) {
    // Remove the person who arrived first.
  }

  return queue.join(",");
}

function solve(input) {
  const [countText, list = ""] = input.trim().split("|");
  const names = list === "" ? [] : list.split(",");
  return serveQueue(names, Number(countText));
}`,
    tests: [
      { input: "2|Ada,Ben,Cleo", expectedOutput: "Cleo" },
      { input: "1|red,blue,green", expectedOutput: "blue,green" },
      { input: "3|one,two,three,four", expectedOutput: "four" },
    ],
    recoveryCue:
      "The front of the queue holds the oldest arrival. Each service step should remove from the front while new arrivals would join at the back.",
    takeaway:
      "A queue is first in, first out: removing from the front preserves arrival order while new values join at the back.",
  },
  {
    slug: "choose-stack-or-queue",
    number: 4,
    concept: "Choose a structure",
    title: "Choose the order the task needs",
    prompt:
      "Complete chooseStructure: undo and backtracking need the newest item first, while a checkout line needs the oldest item first.",
    inputFormat: 'Exactly "undo", "backtrack", or "checkout-line".',
    outputFormat: 'Exactly "stack" or "queue".',
    example: { input: "undo", output: "stack" },
    starterCode: `function chooseStructure(scenario) {
  // Use the scenario's required removal order to choose a structure.
}

function solve(input) {
  return chooseStructure(input.trim());
}`,
    tests: [
      { input: "undo", expectedOutput: "stack" },
      { input: "backtrack", expectedOutput: "stack" },
      { input: "checkout-line", expectedOutput: "queue" },
    ],
    recoveryCue:
      "Ask which item must come out first. Undo and backtracking revisit the newest step; a checkout line serves the oldest arrival.",
    takeaway:
      "Choose a stack for newest-first work and a queue for oldest-first work; the required removal order matters more than the item type.",
  },
];
