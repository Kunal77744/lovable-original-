export type JavaScriptTreesGraphsExercise = {
  slug: string;
  number: number;
  concept:
    | "Depth-first traversal"
    | "Breadth-first traversal"
    | "Graph reachability"
    | "Choose a traversal";
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

export const JAVASCRIPT_TREES_GRAPHS_EXERCISES: JavaScriptTreesGraphsExercise[] = [
  {
    slug: "walk-a-tree-depth-first",
    number: 1,
    concept: "Depth-first traversal",
    title: "Visit a branch before its sibling",
    prompt:
      "Complete preorder so it records the current node, then explores the left subtree and the right subtree. Null children should stop that branch.",
    inputFormat:
      "Comma-separated values in level order. A dash marks a missing child.",
    outputFormat: "The preorder traversal, separated by spaces.",
    example: { input: "A,B,C,D,E", output: "A B D E C" },
    starterCode: `function preorder(node, visited) {
  if (node === null) return;

  // Record this node, then visit its left and right subtrees.
}

function buildTree(input) {
  const values = input.trim().split(",");
  const nodes = values.map((value) =>
    value === "-" ? null : { value, left: null, right: null }
  );

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node === null) continue;
    node.left = nodes[index * 2 + 1] ?? null;
    node.right = nodes[index * 2 + 2] ?? null;
  }

  return nodes[0] ?? null;
}

function solve(input) {
  const visited = [];
  preorder(buildTree(input), visited);
  return visited.join(" ");
}`,
    tests: [
      { input: "A,B,C,D,E", expectedOutput: "A B D E C" },
      { input: "1,2,3,-,4", expectedOutput: "1 2 4 3" },
      { input: "root", expectedOutput: "root" },
    ],
    recoveryCue:
      "Give each recursive call one smaller subtree. Add the current value before calling the same function for the left child and then the right child.",
    takeaway:
      "Depth-first traversal follows one branch as far as it can before returning to a sibling, which makes recursion a natural fit for trees.",
  },
  {
    slug: "walk-a-tree-by-level",
    number: 2,
    concept: "Breadth-first traversal",
    title: "Visit the tree one level at a time",
    prompt:
      "Complete levelOrder with a queue. Remove one node, record it, then add its existing children so earlier levels stay ahead of later levels.",
    inputFormat:
      "Comma-separated values in level order. A dash marks a missing child.",
    outputFormat: "The breadth-first traversal, separated by spaces.",
    example: { input: "A,B,C,D,E", output: "A B C D E" },
    starterCode: `function levelOrder(root) {
  if (root === null) return [];

  const visited = [];
  const queue = [root];
  let nextIndex = 0;

  // Read the queue from left to right and add each node's children.

  return visited;
}

function buildTree(input) {
  const values = input.trim().split(",");
  const nodes = values.map((value) =>
    value === "-" ? null : { value, left: null, right: null }
  );

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node === null) continue;
    node.left = nodes[index * 2 + 1] ?? null;
    node.right = nodes[index * 2 + 2] ?? null;
  }

  return nodes[0] ?? null;
}

function solve(input) {
  return levelOrder(buildTree(input)).join(" ");
}`,
    tests: [
      { input: "A,B,C,D,E", expectedOutput: "A B C D E" },
      { input: "1,2,3,-,4", expectedOutput: "1 2 3 4" },
      { input: "root", expectedOutput: "root" },
    ],
    recoveryCue:
      "Use an index to read each queued node exactly once. After recording that node, append its non-null left child and non-null right child.",
    takeaway:
      "Breadth-first traversal uses a queue so every node already waiting at the current level is visited before nodes from the next level.",
  },
  {
    slug: "find-a-path-through-a-graph",
    number: 3,
    concept: "Graph reachability",
    title: "Find whether one node can reach another",
    prompt:
      "Complete canReach so it explores connected neighbors without revisiting a node. Return true as soon as the target is found.",
    inputFormat:
      'A start and target followed by directed edges, such as "A D;A:B,C;B:D;C:E".',
    outputFormat: 'Exactly "reachable" or "not reachable".',
    example: { input: "A D;A:B,C;B:D;C:E", output: "reachable" },
    starterCode: `function canReach(graph, start, target) {
  const pending = [start];
  const visited = new Set();

  // Explore pending nodes, skipping any node already visited.
}

function solve(input) {
  const [search, ...edgeParts] = input.trim().split(";");
  const [start, target] = search.split(" ");
  const graph = {};

  for (const edgePart of edgeParts) {
    const [node, neighbors = ""] = edgePart.split(":");
    graph[node] = neighbors === "" ? [] : neighbors.split(",");
  }

  return canReach(graph, start, target) ? "reachable" : "not reachable";
}`,
    tests: [
      { input: "A D;A:B,C;B:D;C:E;D:;E:", expectedOutput: "reachable" },
      { input: "A Z;A:B;B:C;C:A;Z:", expectedOutput: "not reachable" },
      { input: "node node;node:", expectedOutput: "reachable" },
    ],
    recoveryCue:
      "Take one pending node at a time. Check it against the target, mark it visited, then add only neighbors that have not already been visited.",
    takeaway:
      "Graph search needs a visited set because cycles can lead back to an earlier node; recording visits keeps the search finite and avoids repeated work.",
  },
  {
    slug: "choose-the-traversal",
    number: 4,
    concept: "Choose a traversal",
    title: "Match the traversal to the goal",
    prompt:
      "Complete chooseTraversal: shortest paths in an unweighted graph and level-order visits need breadth-first search, while exploring one branch first needs depth-first search.",
    inputFormat:
      'Exactly "shortest-unweighted-path", "visit-by-level", or "explore-one-branch".',
    outputFormat: 'Exactly "breadth-first" or "depth-first".',
    example: {
      input: "shortest-unweighted-path",
      output: "breadth-first",
    },
    starterCode: `function chooseTraversal(goal) {
  // Match the goal to the order in which nodes should be visited.
}

function solve(input) {
  return chooseTraversal(input.trim());
}`,
    tests: [
      {
        input: "shortest-unweighted-path",
        expectedOutput: "breadth-first",
      },
      { input: "visit-by-level", expectedOutput: "breadth-first" },
      { input: "explore-one-branch", expectedOutput: "depth-first" },
    ],
    recoveryCue:
      "Ask which order matters. A queue preserves distance and levels, while a stack or recursion keeps following the current branch before its siblings.",
    takeaway:
      "Choose breadth-first search when distance or levels matter and depth-first search when the work naturally follows one branch before backtracking.",
  },
];
