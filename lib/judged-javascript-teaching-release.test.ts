import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getCodingInputAnatomy } from "@/components/coding-input-inspector";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import {
  getCodingRepairDrill,
  getCodingRepairDrillSlugs,
} from "@/lib/coding-repair-drills";

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("judged JavaScript teaching release", () => {
  it("keeps input teaching and Wrong Answer repair available across all problems without adding persistence", () => {
    expect(CODING_PROBLEMS).toHaveLength(12);
    expect(getCodingRepairDrillSlugs().sort()).toEqual(
      CODING_PROBLEMS.map((problem) => problem.slug).sort(),
    );

    for (const problem of CODING_PROBLEMS) {
      expect(
        getCodingInputAnatomy(problem.examples[0].input).tokens.length,
      ).toBeGreaterThan(0);
      expect(getCodingRepairDrill(problem.slug)).not.toBeNull();
    }

    const problemPageSource = readSource("app/practice/[problemSlug]/page.tsx");
    const workspaceSource = readSource("components/coding-workspace.tsx");

    expect(problemPageSource).toContain(
      "<CodingInputInspector input={problem.examples[0].input} />",
    );
    expect(problemPageSource).toContain("repairDrill,");
    expect(workspaceSource).toContain(
      "revealedRecoveryHintCount < problem.recoveryHints.length",
    );
    expect(workspaceSource).toContain("<CodingRepairDrill");

    for (const componentPath of [
      "components/coding-input-inspector.tsx",
      "components/coding-repair-drill.tsx",
    ]) {
      const source = readSource(componentPath);

      expect(source, componentPath).not.toContain("fetch(");
      expect(source, componentPath).not.toContain("product-analytics");
      expect(source, componentPath).not.toContain("localStorage");
      expect(source, componentPath).not.toContain("sessionStorage");
    }
  });
});
