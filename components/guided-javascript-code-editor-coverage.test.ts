import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES } from "@/lib/javascript-algorithm-patterns";
import { JAVASCRIPT_DATA_STRUCTURE_EXERCISES } from "@/lib/javascript-data-structures";
import { JAVASCRIPT_DEBUGGING_DRILLS } from "@/lib/debugging-lab";
import { JAVASCRIPT_DOM_EXERCISES } from "@/lib/javascript-dom-exercises";
import { JAVASCRIPT_FOUNDATION_EXERCISES } from "@/lib/javascript-foundations";
import { JAVASCRIPT_FUNCTION_EXERCISES } from "@/lib/javascript-functions-scope";
import { JAVASCRIPT_LINKED_LIST_EXERCISES } from "@/lib/javascript-linked-lists";
import { JAVASCRIPT_RECURSION_EXERCISES } from "@/lib/javascript-recursion";
import { JAVASCRIPT_SEARCH_SORT_EXERCISES } from "@/lib/javascript-search-sort";
import { JAVASCRIPT_STACKS_QUEUES_EXERCISES } from "@/lib/javascript-stacks-queues";
import { JAVASCRIPT_TREES_GRAPHS_EXERCISES } from "@/lib/javascript-trees-graphs";

const codeLabs = [
  ["javascript-foundations-warmup.tsx", JAVASCRIPT_FOUNDATION_EXERCISES],
  ["debugging-lab.tsx", JAVASCRIPT_DEBUGGING_DRILLS],
  ["javascript-data-structures-lab.tsx", JAVASCRIPT_DATA_STRUCTURE_EXERCISES],
  ["javascript-dom-lab.tsx", JAVASCRIPT_DOM_EXERCISES],
  ["javascript-functions-scope-lab.tsx", JAVASCRIPT_FUNCTION_EXERCISES],
  ["javascript-recursion-lab.tsx", JAVASCRIPT_RECURSION_EXERCISES],
  ["javascript-search-sort-lab.tsx", JAVASCRIPT_SEARCH_SORT_EXERCISES],
  ["javascript-stacks-queues-lab.tsx", JAVASCRIPT_STACKS_QUEUES_EXERCISES],
  ["javascript-linked-list-lab.tsx", JAVASCRIPT_LINKED_LIST_EXERCISES],
  ["javascript-algorithm-patterns-lab.tsx", JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES],
  ["javascript-trees-graphs-lab.tsx", JAVASCRIPT_TREES_GRAPHS_EXERCISES],
] as const;

const labRoutes = [
  "foundations",
  "debugging",
  "data-structures",
  "dom",
  "functions",
  "recursion",
  "search-sort",
  "stacks-queues",
  "linked-lists",
  "algorithm-patterns",
  "trees-graphs",
] as const;

describe("guided JavaScript code editor coverage", () => {
  it("keeps all 42 code-writing exercises on the shared keyboard model", () => {
    expect(codeLabs).toHaveLength(11);
    expect(
      codeLabs.reduce((total, [, exercises]) => total + exercises.length, 0),
    ).toBe(42);

    for (const [fileName] of codeLabs) {
      const source = readFileSync(
        join(process.cwd(), "components", fileName),
        "utf8",
      );

      expect(source).toContain("<GuidedJavaScriptCodeEditor");
      expect(source).toContain("browserRecoveryScope");
      expect(source).toContain("browserRecovery={browserRecovery}");
      expect(source).not.toContain("<textarea");
    }
  });

  it("scopes browser recovery on all 11 private lab routes", () => {
    expect(labRoutes).toHaveLength(11);

    for (const route of labRoutes) {
      const source = readFileSync(
        join(process.cwd(), "app", "practice", route, "page.tsx"),
        "utf8",
      );

      expect(source).toContain("createBrowserRecoveryScope(session.user.id)");
    }
  });
});
