import { and, desc, eq, inArray } from "drizzle-orm";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import type { CodingSkillAttempt } from "@/lib/coding-skill-record";
import { getDatabase } from "./index";
import { codingProblemProgress, codingSubmission } from "./schema";
import { getLearnerSettingsForStudent } from "./course";

export type JavaScriptCompletionRecord = {
  completedCount: number;
  totalCount: number;
  displayName: string;
  completedAt: string | null;
  nextProblem: {
    slug: string;
    number: number;
    title: string;
  } | null;
};

export async function getCodingSkillRecordForStudent(userId: string): Promise<{
  completedSlugs: string[];
  attempts: CodingSkillAttempt[];
}> {
  const authoredSlugs = CODING_PROBLEMS.map((problem) => problem.slug);
  const database = getDatabase();
  const [completed, attempts] = await Promise.all([
    database
      .select({ problemSlug: codingProblemProgress.problemSlug })
      .from(codingProblemProgress)
      .where(
        and(
          eq(codingProblemProgress.userId, userId),
          eq(codingProblemProgress.bestVerdict, "Accepted"),
          inArray(codingProblemProgress.problemSlug, authoredSlugs),
        ),
      ),
    database
      .select({
        problemSlug: codingSubmission.problemSlug,
        verdict: codingSubmission.verdict,
        passedTests: codingSubmission.passedTests,
        totalTests: codingSubmission.totalTests,
        createdAt: codingSubmission.createdAt,
      })
      .from(codingSubmission)
      .where(
        and(
          eq(codingSubmission.userId, userId),
          inArray(codingSubmission.problemSlug, authoredSlugs),
        ),
      )
      .orderBy(desc(codingSubmission.createdAt)),
  ]);

  return {
    completedSlugs: completed.map((row) => row.problemSlug),
    attempts: attempts.map((attempt) => ({
      ...attempt,
      createdAt: attempt.createdAt.toISOString(),
    })),
  };
}

export async function getJavaScriptCompletionRecordForStudent(
  userId: string,
  accountName: string,
): Promise<JavaScriptCompletionRecord> {
  const authoredSlugs = CODING_PROBLEMS.map((problem) => problem.slug);
  const [completedRows, settings] = await Promise.all([
    getDatabase()
      .select({
        problemSlug: codingProblemProgress.problemSlug,
        completedAt: codingProblemProgress.completedAt,
        createdAt: codingProblemProgress.createdAt,
      })
      .from(codingProblemProgress)
      .where(
        and(
          eq(codingProblemProgress.userId, userId),
          eq(codingProblemProgress.bestVerdict, "Accepted"),
          inArray(codingProblemProgress.problemSlug, authoredSlugs),
        ),
      ),
    getLearnerSettingsForStudent(userId, accountName),
  ]);
  const completedSlugs = new Set(
    completedRows.map((row) => row.problemSlug),
  );
  const nextProblem = CODING_PROBLEMS.find(
    (problem) => !completedSlugs.has(problem.slug),
  );
  const isComplete = completedRows.length === CODING_PROBLEMS.length;
  const completedAt = isComplete
    ? new Date(
        Math.max(
          ...completedRows.map((row) =>
            (row.completedAt ?? row.createdAt).getTime(),
          ),
        ),
      ).toISOString()
    : null;

  return {
    completedCount: completedRows.length,
    totalCount: CODING_PROBLEMS.length,
    displayName: settings.certificateDisplayName,
    completedAt,
    nextProblem: nextProblem
      ? {
          slug: nextProblem.slug,
          number: nextProblem.number,
          title: nextProblem.title,
        }
      : null,
  };
}
