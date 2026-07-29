import { and, asc, desc, eq, inArray } from "drizzle-orm";
import {
  CODING_PROBLEMS,
  getCodingProblem,
  getNextUnfinishedCodingProblemSlug,
  gradeCodingOutputs,
} from "@/lib/coding-problems";
import type {
  PracticeFeedbackUsefulness,
  SavedPracticeFeedback,
} from "@/lib/practice-feedback";
import { getDatabase } from "./index";
import {
  codingProblemProgress,
  codingSubmission,
  practiceFeedback,
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

async function getFirstAcceptedProblemSlug(userId: string) {
  const [firstAccepted] = await getDatabase()
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
    )
    .orderBy(
      asc(codingProblemProgress.completedAt),
      asc(codingProblemProgress.createdAt),
    )
    .limit(1);

  return firstAccepted?.problemSlug ?? null;
}

export async function getPracticeFeedbackForStudent(
  userId: string,
  problemSlug: string,
) {
  if (!getCodingProblem(problemSlug)) {
    return null;
  }

  const firstAcceptedProblemSlug = await getFirstAcceptedProblemSlug(userId);

  if (firstAcceptedProblemSlug !== problemSlug) {
    return {
      isEligible: false,
      feedback: null as SavedPracticeFeedback | null,
    };
  }

  const [feedback] = await getDatabase()
    .select({
      problemSlug: practiceFeedback.problemSlug,
      usefulness: practiceFeedback.usefulness,
      comment: practiceFeedback.comment,
      updatedAt: practiceFeedback.updatedAt,
    })
    .from(practiceFeedback)
    .where(eq(practiceFeedback.userId, userId))
    .limit(1);

  return {
    isEligible: true,
    feedback: feedback
      ? {
          problemSlug: feedback.problemSlug,
          usefulness:
            feedback.usefulness as PracticeFeedbackUsefulness,
          comment: feedback.comment ?? "",
          updatedAt: feedback.updatedAt.toISOString(),
        }
      : null,
  };
}

export async function savePracticeFeedbackForStudent(
  userId: string,
  problemSlug: string,
  usefulness: PracticeFeedbackUsefulness,
  comment: string | null,
) {
  if (!getCodingProblem(problemSlug)) {
    return null;
  }

  const firstAcceptedProblemSlug = await getFirstAcceptedProblemSlug(userId);

  if (firstAcceptedProblemSlug !== problemSlug) {
    return null;
  }

  const now = new Date();
  await getDatabase()
    .insert(practiceFeedback)
    .values({
      id: crypto.randomUUID(),
      userId,
      problemSlug,
      usefulness,
      comment,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: practiceFeedback.userId,
      set: {
        problemSlug,
        usefulness,
        comment,
        updatedAt: now,
      },
    });

  return {
    problemSlug,
    usefulness,
    comment: comment ?? "",
    updatedAt: now.toISOString(),
  };
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
