import { and, desc, eq, inArray } from "drizzle-orm";
import {
  CODING_PROBLEMS,
  getCodingProblem,
  getNextUnfinishedCodingProblemSlug,
  gradeCodingOutputs,
} from "@/lib/coding-problems";
import { getDatabase } from "./index";
import {
  codingProblemBookmark,
  codingProblemProgress,
  codingSubmission,
} from "./schema";

export type CodingAttempt = {
  id: string;
  verdict: string;
  passedTests: number;
  totalTests: number;
  createdAt: string;
};

export type RecentCodingAttempt = CodingAttempt & {
  problemSlug: string;
  problemNumber: number;
  problemTitle: string;
};

export type SavedCodingProblem = {
  slug: string;
  number: number;
  title: string;
  skill: string;
};

export async function getCodingProblemBookmarksForStudent(
  userId: string,
): Promise<SavedCodingProblem[]> {
  const rows = await getDatabase()
    .select({ problemSlug: codingProblemBookmark.problemSlug })
    .from(codingProblemBookmark)
    .where(
      and(
        eq(codingProblemBookmark.userId, userId),
        inArray(
          codingProblemBookmark.problemSlug,
          CODING_PROBLEMS.map((problem) => problem.slug),
        ),
      ),
    );
  const savedSlugs = new Set(rows.map((row) => row.problemSlug));

  return CODING_PROBLEMS.filter((problem) => savedSlugs.has(problem.slug)).map(
    ({ slug, number, title, skill }) => ({ slug, number, title, skill }),
  );
}

export async function getCodingProblemBookmarkForStudent(
  userId: string,
  problemSlug: string,
) {
  if (!getCodingProblem(problemSlug)) return null;

  const [bookmark] = await getDatabase()
    .select({ id: codingProblemBookmark.id })
    .from(codingProblemBookmark)
    .where(
      and(
        eq(codingProblemBookmark.userId, userId),
        eq(codingProblemBookmark.problemSlug, problemSlug),
      ),
    )
    .limit(1);

  return Boolean(bookmark);
}

export async function saveCodingProblemBookmark(
  userId: string,
  problemSlug: string,
) {
  if (!getCodingProblem(problemSlug)) return null;

  const now = new Date();
  await getDatabase()
    .insert(codingProblemBookmark)
    .values({
      id: crypto.randomUUID(),
      userId,
      problemSlug,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        codingProblemBookmark.userId,
        codingProblemBookmark.problemSlug,
      ],
      set: { updatedAt: now },
    });

  return { bookmarked: true };
}

export async function removeCodingProblemBookmark(
  userId: string,
  problemSlug: string,
) {
  if (!getCodingProblem(problemSlug)) return null;

  await getDatabase()
    .delete(codingProblemBookmark)
    .where(
      and(
        eq(codingProblemBookmark.userId, userId),
        eq(codingProblemBookmark.problemSlug, problemSlug),
      ),
    );

  return { bookmarked: false };
}

export async function getCodingCatalogProgress(userId: string | null) {
  if (!userId) {
    return {
      completedCount: 0,
      totalCount: CODING_PROBLEMS.length,
      completedSlugs: [] as string[],
    };
  }

  const rows = await getDatabase()
    .select({ problemSlug: codingProblemProgress.problemSlug })
    .from(codingProblemProgress)
    .where(
      and(
        eq(codingProblemProgress.userId, userId),
        inArray(
          codingProblemProgress.problemSlug,
          CODING_PROBLEMS.map((problem) => problem.slug),
        ),
        eq(codingProblemProgress.bestVerdict, "Accepted"),
      ),
    );

  return {
    completedCount: rows.length,
    totalCount: CODING_PROBLEMS.length,
    completedSlugs: rows.map((row) => row.problemSlug),
  };
}

export async function getRecentCodingAttempts(
  userId: string,
  limit = 5,
): Promise<RecentCodingAttempt[]> {
  const attempts = await getDatabase()
    .select({
      id: codingSubmission.id,
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
        inArray(
          codingSubmission.problemSlug,
          CODING_PROBLEMS.map((problem) => problem.slug),
        ),
      ),
    )
    .orderBy(desc(codingSubmission.createdAt))
    .limit(Math.max(1, Math.min(limit, 8)));

  return attempts.flatMap((attempt) => {
    const problem = getCodingProblem(attempt.problemSlug);

    return problem
      ? [
          {
            ...attempt,
            problemNumber: problem.number,
            problemTitle: problem.title,
            createdAt: attempt.createdAt.toISOString(),
          },
        ]
      : [];
  });
}

export async function getCodingProblemForStudent(
  userId: string | null,
  problemSlug: string,
) {
  const problem = getCodingProblem(problemSlug);

  if (!problem) {
    return null;
  }

  if (!userId) {
    return {
      code: problem.starterCode,
      bestVerdict: null,
      attempts: [] as CodingAttempt[],
    };
  }

  const database = getDatabase();
  const [progress, attempts] = await Promise.all([
    database
      .select({
        code: codingProblemProgress.code,
        bestVerdict: codingProblemProgress.bestVerdict,
      })
      .from(codingProblemProgress)
      .where(
        and(
          eq(codingProblemProgress.userId, userId),
          eq(codingProblemProgress.problemSlug, problemSlug),
        ),
      )
      .limit(1),
    database
      .select({
        id: codingSubmission.id,
        verdict: codingSubmission.verdict,
        passedTests: codingSubmission.passedTests,
        totalTests: codingSubmission.totalTests,
        createdAt: codingSubmission.createdAt,
      })
      .from(codingSubmission)
      .where(
        and(
          eq(codingSubmission.userId, userId),
          eq(codingSubmission.problemSlug, problemSlug),
        ),
      )
      .orderBy(desc(codingSubmission.createdAt))
      .limit(8),
  ]);

  return {
    code: progress[0]?.code ?? problem.starterCode,
    bestVerdict: progress[0]?.bestVerdict ?? null,
    attempts: attempts.map((attempt) => ({
      ...attempt,
      createdAt: attempt.createdAt.toISOString(),
    })),
  };
}

export async function saveCodingDraft(
  userId: string,
  problemSlug: string,
  code: string,
) {
  const problem = getCodingProblem(problemSlug);

  if (!problem) return null;

  const now = new Date();
  await getDatabase()
    .insert(codingProblemProgress)
    .values({
      id: crypto.randomUUID(),
      userId,
      problemSlug,
      code,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        codingProblemProgress.userId,
        codingProblemProgress.problemSlug,
      ],
      set: {
        code,
        updatedAt: now,
      },
    });

  return { savedAt: now.toISOString() };
}

export async function saveCodingSubmission(
  userId: string,
  problemSlug: string,
  code: string,
  outputs: unknown,
) {
  const result = gradeCodingOutputs(problemSlug, outputs);

  if (!result) return null;

  const database = getDatabase();
  const now = new Date();

  return database.transaction(async (transaction) => {
    const [current] = await transaction
      .select({
        bestVerdict: codingProblemProgress.bestVerdict,
        completedAt: codingProblemProgress.completedAt,
      })
      .from(codingProblemProgress)
      .where(
        and(
          eq(codingProblemProgress.userId, userId),
          eq(codingProblemProgress.problemSlug, problemSlug),
        ),
      )
      .limit(1);
    const bestVerdict =
      current?.bestVerdict === "Accepted" || result.verdict === "Accepted"
        ? "Accepted"
        : "Wrong Answer";
    const isFirstAcceptedResult =
      result.verdict === "Accepted" && current?.bestVerdict !== "Accepted";

    await transaction
      .insert(codingProblemProgress)
      .values({
        id: crypto.randomUUID(),
        userId,
        problemSlug,
        code,
        bestVerdict,
        completedAt:
          bestVerdict === "Accepted" ? (current?.completedAt ?? now) : null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          codingProblemProgress.userId,
          codingProblemProgress.problemSlug,
        ],
        set: {
          code,
          bestVerdict,
          completedAt:
            bestVerdict === "Accepted" ? (current?.completedAt ?? now) : null,
          updatedAt: now,
        },
      });

    const submissionId = crypto.randomUUID();
    await transaction.insert(codingSubmission).values({
      id: submissionId,
      userId,
      problemSlug,
      verdict: result.verdict,
      passedTests: result.passedTests,
      totalTests: result.totalTests,
      createdAt: now,
    });

    const completed = await transaction
      .select({ problemSlug: codingProblemProgress.problemSlug })
      .from(codingProblemProgress)
      .where(
        and(
          eq(codingProblemProgress.userId, userId),
          eq(codingProblemProgress.bestVerdict, "Accepted"),
          inArray(
            codingProblemProgress.problemSlug,
            CODING_PROBLEMS.map((problem) => problem.slug),
          ),
        ),
      );

    return {
      id: submissionId,
      ...result,
      bestVerdict,
      isFirstAcceptedResult,
      completedCount: completed.length,
      totalCount: CODING_PROBLEMS.length,
      nextProblemSlug: getNextUnfinishedCodingProblemSlug(
        completed.map((row) => row.problemSlug),
      ),
      createdAt: now.toISOString(),
    };
  });
}
