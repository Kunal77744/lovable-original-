import { and, desc, eq, inArray } from "drizzle-orm";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import type { CodingSkillAttempt } from "@/lib/coding-skill-record";
import { getDatabase } from "./index";
import { codingProblemProgress, codingSubmission } from "./schema";

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
