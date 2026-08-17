import type { SavedCodingWorkspace } from "@/db/coding-workspace-library";
import {
  CODING_PROBLEMS,
  getCodingProblem,
  getNextUnfinishedCodingProblemSlug,
} from "./coding-problems";

export type CodingWorkspaceLibraryItem = {
  slug: string;
  number: number;
  title: string;
  skill: string;
  status: "Accepted" | "In progress";
  lineCount: number;
  updatedAt: string;
  href: string;
};

export type CodingWorkspaceLibrary = {
  totalCount: number;
  acceptedCount: number;
  inProgressCount: number;
  items: CodingWorkspaceLibraryItem[];
  nextAction: {
    eyebrow: string;
    title: string;
    description: string;
    label: string;
    href: string;
  };
};

function countLines(code: string) {
  if (code.length === 0) return 0;
  return code.split(/\r?\n/).length;
}

export function buildCodingWorkspaceLibrary(
  workspaces: SavedCodingWorkspace[],
): CodingWorkspaceLibrary {
  const items = workspaces.map((workspace) => ({
    slug: workspace.slug,
    number: workspace.number,
    title: workspace.title,
    skill: workspace.skill,
    status:
      workspace.bestVerdict === "Accepted"
        ? ("Accepted" as const)
        : ("In progress" as const),
    lineCount: countLines(workspace.code),
    updatedAt: workspace.updatedAt,
    href: `/practice/${workspace.slug}`,
  }));
  const acceptedSlugs = items
    .filter((item) => item.status === "Accepted")
    .map((item) => item.slug);
  const acceptedCount = acceptedSlugs.length;
  const unfinished = items.find((item) => item.status === "In progress");

  if (unfinished) {
    return {
      totalCount: items.length,
      acceptedCount,
      inProgressCount: items.length - acceptedCount,
      items,
      nextAction: {
        eyebrow: "Newest unfinished workspace",
        title: unfinished.title,
        description: `Your latest saved source for problem ${String(unfinished.number).padStart(2, "0")} is ready exactly where you left it.`,
        label: `Continue ${unfinished.title}`,
        href: unfinished.href,
      },
    };
  }

  const nextSlug = getNextUnfinishedCodingProblemSlug(acceptedSlugs);
  const nextProblem = nextSlug ? getCodingProblem(nextSlug) : null;

  if (nextProblem) {
    return {
      totalCount: items.length,
      acceptedCount,
      inProgressCount: 0,
      items,
      nextAction: {
        eyebrow: items.length === 0 ? "First saved workspace" : "Next unsolved problem",
        title: nextProblem.title,
        description:
          items.length === 0
            ? "Open problem 01, run the starter, and sign in saves will appear here automatically."
            : `Your saved work is complete so far. Problem ${String(nextProblem.number).padStart(2, "0")} is the next unsolved step.`,
        label: `Start problem ${String(nextProblem.number).padStart(2, "0")}`,
        href: `/practice/${nextProblem.slug}`,
      },
    };
  }

  const mostRecent = items[0];
  const fallback = CODING_PROBLEMS[0];

  return {
    totalCount: items.length,
    acceptedCount,
    inProgressCount: 0,
    items,
    nextAction: {
      eyebrow: "All judged workspaces Accepted",
      title: "Revisit one saved solution",
      description:
        "Your 12 judged workspaces are complete. Reopen the latest one without changing its saved verdict.",
      label: mostRecent ? `Review ${mostRecent.title}` : "Review problem 01",
      href: mostRecent?.href ?? `/practice/${fallback.slug}`,
    },
  };
}
