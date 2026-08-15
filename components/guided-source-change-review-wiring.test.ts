import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const guidedLabComponents = [
  ["debugging-lab.tsx", "currentSource={source}", "starterSource={drill.starterCode}"],
  ["javascript-foundations-warmup.tsx", "currentSource={code}", "starterSource={exercise.starterCode}"],
  ["javascript-data-structures-lab.tsx", "currentSource={code}", "starterSource={exercise.starterCode}"],
  ["javascript-dom-lab.tsx", "currentSource={code}", "starterSource={exercise.starterCode}"],
  ["javascript-functions-scope-lab.tsx", "currentSource={code}", "starterSource={exercise.starterCode}"],
  ["javascript-linked-list-lab.tsx", "currentSource={code}", "starterSource={exercise.starterCode}"],
  ["javascript-recursion-lab.tsx", "currentSource={code}", "starterSource={exercise.starterCode}"],
  ["javascript-search-sort-lab.tsx", "currentSource={code}", "starterSource={exercise.starterCode}"],
  ["javascript-stacks-queues-lab.tsx", "currentSource={code}", "starterSource={exercise.starterCode}"],
  ["javascript-algorithm-patterns-lab.tsx", "currentSource={code}", "starterSource={exercise.starterCode}"],
  ["javascript-trees-graphs-lab.tsx", "currentSource={code}", "starterSource={exercise.starterCode}"],
] as const;

describe("guided workspace review and editor wiring", () => {
  it.each(guidedLabComponents)(
    "connects %s to the numbered editor and active authored starter",
    (fileName, currentSource, starterSource) => {
      const source = readFileSync(join(process.cwd(), "components", fileName), "utf8");

      expect(source).toContain(
        'import { GuidedSourceChangeReview } from "./guided-source-change-review";',
      );
      expect(source).toContain(
        'import { GuidedCodeEditor } from "@/components/guided-code-editor";',
      );
      expect(source).toContain("<GuidedCodeEditor");
      expect(source).toContain("<GuidedSourceChangeReview");
      expect(source).toContain(currentSource);
      expect(source).toContain(starterSource);
    },
  );
});
