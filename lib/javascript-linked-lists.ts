export type JavaScriptLinkedListExercise = {
  slug: string;
  number: number;
  concept: "Node links" | "Traversal" | "Reverse links" | "Choose an operation";
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

export const JAVASCRIPT_LINKED_LIST_EXERCISES: JavaScriptLinkedListExercise[] = [
  {
    slug: "connect-the-next-node",
    number: 1,
    concept: "Node links",
    title: "Connect each node to the next",
    prompt:
      "Complete buildList so each new node becomes the current tail's next node. The first value should remain the head of the list.",
    inputFormat: "Comma-separated values in their intended list order.",
    outputFormat: "The linked values from head to tail, separated by arrows.",
    example: { input: "red,blue,green", output: "red->blue->green" },
    starterCode: `function buildList(values) {
  if (values.length === 0) return null;

  const head = { value: values[0], next: null };
  let tail = head;

  for (const value of values.slice(1)) {
    const node = { value, next: null };
    // Connect the tail to this node, then move the tail forward.
  }

  return head;
}

function solve(input) {
  const values = input.trim() === "" ? [] : input.trim().split(",");
  const linkedValues = [];
  let current = buildList(values);

  while (current !== null) {
    linkedValues.push(current.value);
    current = current.next;
  }

  return linkedValues.join("->");
}`,
    tests: [
      { input: "red,blue,green", expectedOutput: "red->blue->green" },
      { input: "one", expectedOutput: "one" },
      { input: "a,b,c,d", expectedOutput: "a->b->c->d" },
    ],
    recoveryCue:
      "Keep one reference to the head and another to the tail. Point the old tail at the new node before moving the tail reference forward.",
    takeaway:
      "A linked list keeps its order through next references: the head stays fixed while the tail moves as each new node is connected.",
  },
  {
    slug: "traverse-every-node",
    number: 2,
    concept: "Traversal",
    title: "Visit every node once",
    prompt:
      "Complete sumList so it follows next references from the head through the final node and adds every numeric value exactly once.",
    inputFormat: "Comma-separated integers already converted into a linked list.",
    outputFormat: "The sum of every node value.",
    example: { input: "4,7,2", output: "13" },
    starterCode: `function sumList(head) {
  let total = 0;
  let current = head;

  // Visit each node until there is no next node to follow.

  return total;
}

function solve(input) {
  const values = input.trim().split(",").map(Number);
  let head = null;

  for (let index = values.length - 1; index >= 0; index -= 1) {
    head = { value: values[index], next: head };
  }

  return String(sumList(head));
}`,
    tests: [
      { input: "4,7,2", expectedOutput: "13" },
      { input: "5", expectedOutput: "5" },
      { input: "-3,8,-2,6", expectedOutput: "9" },
    ],
    recoveryCue:
      "Start at the head. During each visit, use the current node's value and then replace current with its next reference until current is null.",
    takeaway:
      "Linked-list traversal follows one next reference at a time, so visiting every node takes work proportional to the list length.",
  },
  {
    slug: "reverse-the-links",
    number: 3,
    concept: "Reverse links",
    title: "Reverse the direction of every link",
    prompt:
      "Complete reverseList so each node points to its former previous node. Return the old tail as the new head without changing node values.",
    inputFormat: "Comma-separated values already converted into a linked list.",
    outputFormat: "The reversed linked values, separated by arrows.",
    example: { input: "red,blue,green", output: "green->blue->red" },
    starterCode: `function reverseList(head) {
  let previous = null;
  let current = head;

  while (current !== null) {
    // Save the next node before changing the current link.
  }

  return previous;
}

function solve(input) {
  const values = input.trim().split(",");
  let head = null;

  for (let index = values.length - 1; index >= 0; index -= 1) {
    head = { value: values[index], next: head };
  }

  const reversedValues = [];
  let current = reverseList(head);
  while (current !== null) {
    reversedValues.push(current.value);
    current = current.next;
  }

  return reversedValues.join("->");
}`,
    tests: [
      { input: "red,blue,green", expectedOutput: "green->blue->red" },
      { input: "solo", expectedOutput: "solo" },
      { input: "1,2,3,4", expectedOutput: "4->3->2->1" },
    ],
    recoveryCue:
      "Before changing current.next, save the original next node. Then reverse the link, advance previous, and continue from the saved node.",
    takeaway:
      "Reversing a linked list needs three references because changing a next link would otherwise lose the unvisited remainder of the list.",
  },
  {
    slug: "choose-the-list-operation",
    number: 4,
    concept: "Choose an operation",
    title: "Choose when links fit the operation",
    prompt:
      "Complete chooseStructure: repeated prepends and removal after a known node fit linked lists, while direct indexed reads fit arrays.",
    inputFormat:
      'Exactly "prepend-many", "remove-after-known-node", or "indexed-read".',
    outputFormat: 'Exactly "linked-list" or "array".',
    example: { input: "prepend-many", output: "linked-list" },
    starterCode: `function chooseStructure(operation) {
  // Match the operation to the structure that supports it directly.
}

function solve(input) {
  return chooseStructure(input.trim());
}`,
    tests: [
      { input: "prepend-many", expectedOutput: "linked-list" },
      {
        input: "remove-after-known-node",
        expectedOutput: "linked-list",
      },
      { input: "indexed-read", expectedOutput: "array" },
    ],
    recoveryCue:
      "Ask what reference is already available. Links make changes near a known node direct, while arrays make reading a numbered position direct.",
    takeaway:
      "Choose a linked list for direct changes around known nodes and an array for frequent indexed reads; access pattern determines the better fit.",
  },
];
