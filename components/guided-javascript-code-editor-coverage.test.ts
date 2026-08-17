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
  [
    "javascript-foundations-warmup.tsx",
    JAVASCRIPT_FOUNDATION_EXERCISES,
    "source: code",
    "foundations-code",
  ],
  [
    "debugging-lab.tsx",
    JAVASCRIPT_DEBUGGING_DRILLS,
    "message: result.message, source",
    "debugging-source",
  ],
  [
    "javascript-data-structures-lab.tsx",
    JAVASCRIPT_DATA_STRUCTURE_EXERCISES,
    "source: code",
    "data-lab-code",
  ],
  [
    "javascript-dom-lab.tsx",
    JAVASCRIPT_DOM_EXERCISES,
    "source: code",
    "dom-lab-code",
  ],
  [
    "javascript-functions-scope-lab.tsx",
    JAVASCRIPT_FUNCTION_EXERCISES,
    "source: code",
    "function-lab-code",
  ],
  [
    "javascript-recursion-lab.tsx",
    JAVASCRIPT_RECURSION_EXERCISES,
    "source: code",
    "recursion-lab-code",
  ],
  [
    "javascript-search-sort-lab.tsx",
    JAVASCRIPT_SEARCH_SORT_EXERCISES,
    "source: code",
    "search-sort-lab-code",
  ],
  [
    "javascript-stacks-queues-lab.tsx",
    JAVASCRIPT_STACKS_QUEUES_EXERCISES,
    "source: code",
    "stacks-queues-lab-code",
  ],
  [
    "javascript-linked-list-lab.tsx",
    JAVASCRIPT_LINKED_LIST_EXERCISES,
    "source: code",
    "linked-list-lab-code",
  ],
  [
    "javascript-algorithm-patterns-lab.tsx",
    JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES,
    "source: code",
    "algorithm-patterns-code",
  ],
  [
    "javascript-trees-graphs-lab.tsx",
    JAVASCRIPT_TREES_GRAPHS_EXERCISES,
    "source: code",
    "trees-graphs-lab-code",
  ],
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

describe("guided JavaScript browser recovery coverage", () => {
  it("keeps browser recovery on all 42 code-writing exercises", () => {
    expect(codeLabs).toHaveLength(11);
    expect(
      codeLabs.reduce((total, [, exercises]) => total + exercises.length, 0),
    ).toBe(42);

    for (const [fileName] of codeLabs) {
      const source = readFileSync(
        join(process.cwd(), "components", fileName),
        "utf8",
      );

      expect(source).toContain("browserRecoveryScope");
      expect(source).toContain("browserRecovery={browserRecovery}");
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

  it("keeps keyboard execution on all 42 code-writing exercises", () => {
    expect(codeLabs).toHaveLength(11);
    expect(
      codeLabs.reduce((total, [, exercises]) => total + exercises.length, 0),
    ).toBe(42);

    for (const [fileName] of codeLabs) {
      const source = readFileSync(
        join(process.cwd(), "components", fileName),
        "utf8",
      );

      expect(source).toContain("useGuidedLabExecutionShortcut");
      expect(source).toContain("GUIDED_LAB_EXECUTION_HINT_ID");
      expect(source).toContain("<GuidedLabExecutionHint />");
    }
  });

  it("connects current runtime failures to every guided editor", () => {
    expect(
      codeLabs.reduce((total, [, exercises]) => total + exercises.length, 0),
    ).toBe(42);

    for (const [fileName, , runtimeSource, editorId] of codeLabs) {
      const source = readFileSync(
        join(process.cwd(), "components", fileName),
        "utf8",
      );

      expect(source).toContain(
        'import { GuidedRuntimeErrorNavigation } from "@/components/guided-runtime-error-navigation";',
      );
      expect(source).toContain(runtimeSource);
      expect(source).toContain("<GuidedRuntimeErrorNavigation");
      expect(source).toContain(`editorId="${editorId}"`);
      expect(source).toMatch(/(?:checkState|labState)\.kind === "error"/);
    }
  });
});
