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
  pointerWalkthrough: {
    title: string;
    steps: {
      action: string;
      explanation: string;
      nodes: {
        id: string;
        value: string;
        next: string | null;
        state?: "changed" | "detached";
      }[];
      pointers: {
        name: string;
        target: string | null;
      }[];
      facts: string[];
    }[];
  };
};

export const JAVASCRIPT_LINKED_LIST_EXERCISES: JavaScriptLinkedListExercise[] =
  [
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
      pointerWalkthrough: {
        title: "Watch the head stay while the tail moves",
        steps: [
          {
            action: "Create the head node",
            explanation:
              'The first value becomes the head. The tail starts at that same "red" node.',
            nodes: [{ id: "red", value: "red", next: null }],
            pointers: [
              { name: "head", target: "red" },
              { name: "tail", target: "red" },
            ],
            facts: ["head stays at red", "tail starts at red"],
          },
          {
            action: "Create the next node",
            explanation:
              'The new "blue" node exists, but it is not in the list until the old tail points to it.',
            nodes: [
              { id: "red", value: "red", next: null },
              { id: "blue", value: "blue", next: null, state: "detached" },
            ],
            pointers: [
              { name: "head", target: "red" },
              { name: "tail", target: "red" },
              { name: "node", target: "blue" },
            ],
            facts: ["red.next is null", "blue is detached"],
          },
          {
            action: "Set tail.next to the new node",
            explanation:
              'Changing red.next connects "blue" without moving the head or tail references yet.',
            nodes: [
              { id: "red", value: "red", next: "blue", state: "changed" },
              { id: "blue", value: "blue", next: null },
            ],
            pointers: [
              { name: "head", target: "red" },
              { name: "tail", target: "red" },
              { name: "node", target: "blue" },
            ],
            facts: ["red.next now reaches blue", "head still reaches red"],
          },
          {
            action: "Move tail forward",
            explanation:
              'The tail reference advances to "blue" so the next node can be connected there.',
            nodes: [
              { id: "red", value: "red", next: "blue" },
              { id: "blue", value: "blue", next: null },
            ],
            pointers: [
              { name: "head", target: "red" },
              { name: "tail", target: "blue" },
            ],
            facts: ["head stays at red", "tail now reaches blue"],
          },
          {
            action: "Repeat for the final node",
            explanation:
              'Connecting "green" at the tail produces one chain from head to tail.',
            nodes: [
              { id: "red", value: "red", next: "blue" },
              { id: "blue", value: "blue", next: "green", state: "changed" },
              { id: "green", value: "green", next: null },
            ],
            pointers: [
              { name: "head", target: "red" },
              { name: "tail", target: "green" },
            ],
            facts: ["head reaches the full chain", "tail ends at green"],
          },
        ],
      },
    },
    {
      slug: "traverse-every-node",
      number: 2,
      concept: "Traversal",
      title: "Visit every node once",
      prompt:
        "Complete sumList so it follows next references from the head through the final node and adds every numeric value exactly once.",
      inputFormat:
        "Comma-separated integers already converted into a linked list.",
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
      pointerWalkthrough: {
        title: "Follow current through every node",
        steps: [
          {
            action: "Start current at the head",
            explanation:
              "Traversal begins at the only reference guaranteed to reach the full list.",
            nodes: [
              { id: "four", value: "4", next: "seven" },
              { id: "seven", value: "7", next: "two" },
              { id: "two", value: "2", next: null },
            ],
            pointers: [
              { name: "head", target: "four" },
              { name: "current", target: "four" },
            ],
            facts: ["total = 0", "current.value = 4"],
          },
          {
            action: "Use 4, then follow next",
            explanation:
              "After adding the current value, current moves along the link to 7.",
            nodes: [
              { id: "four", value: "4", next: "seven" },
              { id: "seven", value: "7", next: "two", state: "changed" },
              { id: "two", value: "2", next: null },
            ],
            pointers: [
              { name: "head", target: "four" },
              { name: "current", target: "seven" },
            ],
            facts: ["total = 4", "current.value = 7"],
          },
          {
            action: "Use 7, then follow next",
            explanation:
              "The same two actions repeat: add the value, then replace current with current.next.",
            nodes: [
              { id: "four", value: "4", next: "seven" },
              { id: "seven", value: "7", next: "two" },
              { id: "two", value: "2", next: null, state: "changed" },
            ],
            pointers: [
              { name: "head", target: "four" },
              { name: "current", target: "two" },
            ],
            facts: ["total = 11", "current.value = 2"],
          },
          {
            action: "Use 2 and reach null",
            explanation:
              "Following the final next reference reaches null, so every node has been visited once.",
            nodes: [
              { id: "four", value: "4", next: "seven" },
              { id: "seven", value: "7", next: "two" },
              { id: "two", value: "2", next: null },
            ],
            pointers: [
              { name: "head", target: "four" },
              { name: "current", target: null },
            ],
            facts: ["total = 13", "current is null"],
          },
        ],
      },
    },
    {
      slug: "reverse-the-links",
      number: 3,
      concept: "Reverse links",
      title: "Reverse the direction of every link",
      prompt:
        "Complete reverseList so each node points to its former previous node. Return the old tail as the new head without changing node values.",
      inputFormat:
        "Comma-separated values already converted into a linked list.",
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
      pointerWalkthrough: {
        title: "Reverse each link without losing the rest",
        steps: [
          {
            action: "Hold previous and current",
            explanation:
              "Previous starts at null while current starts at the old head, red.",
            nodes: [
              { id: "red", value: "red", next: "blue" },
              { id: "blue", value: "blue", next: "green" },
              { id: "green", value: "green", next: null },
            ],
            pointers: [
              { name: "previous", target: null },
              { name: "current", target: "red" },
            ],
            facts: ["previous is null", "current is red"],
          },
          {
            action: "Save current.next",
            explanation:
              "Next keeps a reference to blue before red.next is changed.",
            nodes: [
              { id: "red", value: "red", next: "blue" },
              { id: "blue", value: "blue", next: "green" },
              { id: "green", value: "green", next: null },
            ],
            pointers: [
              { name: "previous", target: null },
              { name: "current", target: "red" },
              { name: "next", target: "blue" },
            ],
            facts: ["the unvisited chain is still reachable", "next is blue"],
          },
          {
            action: "Reverse red.next, then advance",
            explanation:
              "Red points back to null. Previous moves to red and current moves to the saved blue node.",
            nodes: [
              { id: "red", value: "red", next: null, state: "changed" },
              { id: "blue", value: "blue", next: "green" },
              { id: "green", value: "green", next: null },
            ],
            pointers: [
              { name: "previous", target: "red" },
              { name: "current", target: "blue" },
            ],
            facts: ["red is the reversed prefix", "blue still reaches green"],
          },
          {
            action: "Reverse blue.next, then advance",
            explanation:
              "Blue now points to red while current advances to green.",
            nodes: [
              { id: "red", value: "red", next: null },
              { id: "blue", value: "blue", next: "red", state: "changed" },
              { id: "green", value: "green", next: null },
            ],
            pointers: [
              { name: "previous", target: "blue" },
              { name: "current", target: "green" },
            ],
            facts: ["blue reaches red", "green is the final unvisited node"],
          },
          {
            action: "Reverse green.next and finish",
            explanation:
              "Green points to blue. Current reaches null, and previous is the new head.",
            nodes: [
              { id: "red", value: "red", next: null },
              { id: "blue", value: "blue", next: "red" },
              { id: "green", value: "green", next: "blue", state: "changed" },
            ],
            pointers: [
              { name: "previous", target: "green" },
              { name: "current", target: null },
            ],
            facts: ["new head is green", "green → blue → red → null"],
          },
        ],
      },
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
      pointerWalkthrough: {
        title: "Remove after a known node directly",
        steps: [
          {
            action: "Keep a reference to the known node",
            explanation:
              "Because the code already holds node B, it does not need an indexed search to change the next link.",
            nodes: [
              { id: "a", value: "A", next: "b" },
              { id: "b", value: "B", next: "c" },
              { id: "c", value: "C", next: null },
            ],
            pointers: [{ name: "known", target: "b" }],
            facts: ["known.value = B", "B.next reaches C"],
          },
          {
            action: "Read the node after B",
            explanation:
              "B.next identifies C directly, and C.next identifies what should follow B afterward.",
            nodes: [
              { id: "a", value: "A", next: "b" },
              { id: "b", value: "B", next: "c" },
              { id: "c", value: "C", next: null, state: "changed" },
            ],
            pointers: [
              { name: "known", target: "b" },
              { name: "removed", target: "c" },
            ],
            facts: ["removed is C", "removed.next is null"],
          },
          {
            action: "Point B around C",
            explanation:
              "Setting B.next to C.next removes C from the chain with one link change.",
            nodes: [
              { id: "a", value: "A", next: "b" },
              { id: "b", value: "B", next: null, state: "changed" },
              { id: "c", value: "C", next: null, state: "detached" },
            ],
            pointers: [
              { name: "known", target: "b" },
              { name: "removed", target: "c" },
            ],
            facts: ["A → B → null", "C is detached"],
          },
        ],
      },
    },
  ];
