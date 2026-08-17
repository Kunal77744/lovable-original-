import { CODING_PROBLEMS } from "@/lib/coding-problems";
import { parsePracticeJournal } from "@/lib/practice-solution-note";

export type SavedPracticeJournalRow = {
  problemSlug: string;
  content: string;
  updatedAt: string;
};

export type PracticeJournalIndexItem = {
  slug: string;
  number: number;
  title: string;
  skill: string;
  inputShape: string;
  edgeCase: string;
  steps: string;
  reflection: string;
  planCompletedCount: number;
  hasReflection: boolean;
  statusLabel: string;
  actionLabel: string;
  updatedAt: string;
};

export type PracticeJournalIndex = {
  journalCount: number;
  plannedCount: number;
  reflectedCount: number;
  items: PracticeJournalIndexItem[];
  primaryAction: {
    kicker: string;
    title: string;
    description: string;
    label: string;
    href: string;
  };
};

function countCompletedPlanFields(item: ReturnType<typeof parsePracticeJournal>) {
  return [item.inputShape, item.edgeCase, item.steps].filter(
    (value) => value.trim().length > 0,
  ).length;
}

export function buildPracticeJournalIndex(
  rows: SavedPracticeJournalRow[],
  completedSlugs: string[],
): PracticeJournalIndex {
  const completed = new Set(completedSlugs);
  const problemBySlug = new Map(
    CODING_PROBLEMS.map((problem) => [problem.slug, problem]),
  );

  const items = rows
    .flatMap((row) => {
      const problem = problemBySlug.get(row.problemSlug);
      if (!problem) return [];

      const journal = parsePracticeJournal(row.content);
      const planCompletedCount = countCompletedPlanFields(journal);
      const hasReflection = journal.reflection.trim().length > 0;
      const planComplete = planCompletedCount === 3;

      return [
        {
          slug: problem.slug,
          number: problem.number,
          title: problem.title,
          skill: problem.skill,
          ...journal,
          planCompletedCount,
          hasReflection,
          statusLabel:
            planComplete && hasReflection
              ? "Plan + reflection"
              : planComplete
                ? "Plan ready"
                : hasReflection
                  ? "Reflection saved"
                  : `Plan ${planCompletedCount}/3`,
          actionLabel:
            planComplete && hasReflection
              ? "Review in problem"
              : planComplete && completed.has(problem.slug)
                ? "Add reflection"
                : planComplete
                  ? "Continue problem"
                  : "Finish plan",
          updatedAt: row.updatedAt,
        },
      ];
    })
    .sort((left, right) => left.number - right.number);

  const unfinishedPlan = items.find((item) => item.planCompletedCount < 3);
  const readyReflection = items.find(
    (item) =>
      item.planCompletedCount === 3 &&
      !item.hasReflection &&
      completed.has(item.slug),
  );
  const plannedProblem = items.find(
    (item) =>
      item.planCompletedCount === 3 &&
      !item.hasReflection &&
      !completed.has(item.slug),
  );
  const nextProblem = CODING_PROBLEMS.find(
    (problem) => !completed.has(problem.slug),
  );

  let primaryAction: PracticeJournalIndex["primaryAction"];

  if (unfinishedPlan) {
    primaryAction = {
      kicker: "First unfinished journal",
      title: `Finish your ${unfinishedPlan.title} plan.`,
      description: `${unfinishedPlan.planCompletedCount} of 3 planning prompts are saved. Reopen the exact problem without changing your current code.`,
      label: `Finish problem ${String(unfinishedPlan.number).padStart(2, "0")} plan`,
      href: `/practice/${unfinishedPlan.slug}`,
    };
  } else if (readyReflection) {
    primaryAction = {
      kicker: "Ready to reflect",
      title: `Close the loop on ${readyReflection.title}.`,
      description:
        "Your plan and Accepted result are saved. Add why the approach worked and one mistake to avoid next time.",
      label: `Reflect on problem ${String(readyReflection.number).padStart(2, "0")}`,
      href: `/practice/${readyReflection.slug}`,
    };
  } else if (plannedProblem) {
    primaryAction = {
      kicker: "Plan saved",
      title: `Continue ${plannedProblem.title}.`,
      description:
        "Your three-part plan is ready beside the editor. Continue from the exact problem and keep the reflection for after Accepted.",
      label: `Continue problem ${String(plannedProblem.number).padStart(2, "0")}`,
      href: `/practice/${plannedProblem.slug}`,
    };
  } else if (nextProblem) {
    primaryAction = {
      kicker: items.length === 0 ? "Start with a plan" : "Your next problem",
      title: `Plan before you code ${nextProblem.title}.`,
      description:
        "Capture the input shape, one edge case, and your ordered approach beside the editor before you submit.",
      label: `Open problem ${String(nextProblem.number).padStart(2, "0")}`,
      href: `/practice/${nextProblem.slug}`,
    };
  } else {
    const firstProblem = CODING_PROBLEMS[0];
    primaryAction = {
      kicker: "All 12 Accepted",
      title: "Keep your reasoning reusable.",
      description:
        "Every judged problem is Accepted. Reopen a journal to rehearse the plan and reflection behind the result.",
      label: "Review problem 01 journal",
      href: `/practice/${firstProblem.slug}`,
    };
  }

  return {
    journalCount: items.length,
    plannedCount: items.filter((item) => item.planCompletedCount === 3).length,
    reflectedCount: items.filter((item) => item.hasReflection).length,
    items,
    primaryAction,
  };
}
