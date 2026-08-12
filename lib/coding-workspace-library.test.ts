import { describe, expect, it } from "vitest";
import type { SavedCodingWorkspace } from "@/db/coding-workspace-library";
import { CODING_PROBLEMS } from "./coding-problems";
import { buildCodingWorkspaceLibrary } from "./coding-workspace-library";

function workspace(
  slug: string,
  bestVerdict: string | null,
  updatedAt: string,
): SavedCodingWorkspace {
  const problem = CODING_PROBLEMS.find((candidate) => candidate.slug === slug)!;

  return {
    slug,
    number: problem.number,
    title: problem.title,
    skill: problem.skill,
    code: "function solve(input) {\n  return input;\n}",
    bestVerdict,
    updatedAt,
  };
}

describe("buildCodingWorkspaceLibrary", () => {
  it("starts a fresh learner at problem 01", () => {
    const library = buildCodingWorkspaceLibrary([]);

    expect(library).toMatchObject({
      totalCount: 0,
      acceptedCount: 0,
      inProgressCount: 0,
      nextAction: {
        label: "Start problem 01",
        href: "/practice/sum-two-numbers",
      },
    });
  });

  it("continues the most recently saved unfinished workspace", () => {
    const library = buildCodingWorkspaceLibrary([
      workspace("even-or-odd", null, "2026-08-12T10:00:00.000Z"),
      workspace("sum-two-numbers", "Accepted", "2026-08-11T10:00:00.000Z"),
    ]);

    expect(library).toMatchObject({
      totalCount: 2,
      acceptedCount: 1,
      inProgressCount: 1,
      nextAction: {
        label: "Continue Even or odd",
        href: "/practice/even-or-odd",
      },
    });
    expect(library.items[0]).toMatchObject({
      status: "In progress",
      lineCount: 3,
    });
  });

  it("opens the next unsolved problem after every saved workspace is Accepted", () => {
    const library = buildCodingWorkspaceLibrary([
      workspace("sum-two-numbers", "Accepted", "2026-08-12T10:00:00.000Z"),
    ]);

    expect(library.nextAction).toMatchObject({
      label: "Start problem 02",
      href: "/practice/even-or-odd",
    });
  });

  it("reviews the most recent workspace after all 12 problems are Accepted", () => {
    const workspaces = CODING_PROBLEMS.map((problem, index) =>
      workspace(
        problem.slug,
        "Accepted",
        new Date(Date.UTC(2026, 7, 12, 12, index)).toISOString(),
      ),
    ).reverse();
    const library = buildCodingWorkspaceLibrary(workspaces);

    expect(library.acceptedCount).toBe(CODING_PROBLEMS.length);
    expect(library.nextAction).toMatchObject({
      label: `Review ${workspaces[0].title}`,
      href: `/practice/${workspaces[0].slug}`,
    });
  });
});
