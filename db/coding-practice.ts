import { and, asc, desc, eq, gt, inArray, lt, or } from "drizzle-orm";
import {
  CODING_PROBLEMS,
  getCodingProblem,
  getNextUnfinishedCodingProblemSlug,
  gradeCodingOutputs,
} from "@/lib/coding-problems";
import {
  buildCodingMistakeReviewQueue,
  type CodingMistakeReviewItem,
} from "@/lib/coding-review-queue";
import type {
  PracticeFeedbackUsefulness,
  SavedPracticeFeedback,
} from "@/lib/practice-feedback";
import type { CodingTestCase } from "@/lib/coding-test-cases";
import { getDatabase } from "./index";
import {
  codingProblemBookmark,
  codingProblemNote,
  codingProblemProgress,
  codingProblemTestCaseSet,
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

export type CodingProblemAttempt = CodingAttempt & {
  hasSource: boolean;
};

export type RecentCodingAttempt = CodingAttempt & {
  problemSlug: string;
  problemNumber: number;
  problemTitle: string;
};

export type CodingSubmissionHistoryItem = RecentCodingAttempt & {
  hasSource: boolean;
};

export type AdjacentCodingSubmission = {
  id: string;
  verdict: string;
  passedTests: number;
  totalTests: number;
  createdAt: string;
};

export type CodingSubmissionHistoryDetail = CodingSubmissionHistoryItem & {
  code: string | null;
  previousSubmission: (AdjacentCodingSubmission & { code: string | null }) | null;
  nextSubmission: AdjacentCodingSubmission | null;
};

export type SavedCodingProblem = {
  slug: string;
  number: number;
  title: string;
  skill: string;
};

export async function getCodingMistakeReviewQueueForStudent(
  userId: string,
): Promise<CodingMistakeReviewItem[]> {
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
    .orderBy(desc(codingSubmission.createdAt), desc(codingSubmission.id));

  return buildCodingMistakeReviewQueue(attempts);
}

export async function saveCodingProblemTestCases(
  userId: string,
  problemSlug: string,
  cases: CodingTestCase[],
) {
  if (!getCodingProblem(problemSlug)) return null;

  const database = getDatabase();

  if (cases.length === 0) {
    await database
      .delete(codingProblemTestCaseSet)
      .where(
        and(
          eq(codingProblemTestCaseSet.userId, userId),
          eq(codingProblemTestCaseSet.problemSlug, problemSlug),
        ),
      );

    return { cases, updatedAt: new Date().toISOString() };
  }

  const inputs = cases.map((testCase) => testCase.input);
  const expectedOutputs = cases.map((testCase) => testCase.expectedOutput);
  const now = new Date();
  const [saved] = await database
    .insert(codingProblemTestCaseSet)
    .values({
      id: crypto.randomUUID(),
      userId,
      problemSlug,
      inputs,
      expectedOutputs,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        codingProblemTestCaseSet.userId,
        codingProblemTestCaseSet.problemSlug,
      ],
      set: { inputs, expectedOutputs, updatedAt: now },
    })
    .returning({
      inputs: codingProblemTestCaseSet.inputs,
      expectedOutputs: codingProblemTestCaseSet.expectedOutputs,
      updatedAt: codingProblemTestCaseSet.updatedAt,
    });

  return {
    cases: saved.inputs.map((input, index) => ({
      input,
      expectedOutput: saved.expectedOutputs[index] ?? null,
    })),
    updatedAt: saved.updatedAt.toISOString(),
  };
}

export async function saveCodingProblemNote(
  userId: string,
  problemSlug: string,
  content: string,
) {
  if (!getCodingProblem(problemSlug)) {
    return { status: "problem_not_found" as const };
  }

  const database = getDatabase();
  const now = new Date();
  const [saved] = await database
    .insert(codingProblemNote)
    .values({
      id: crypto.randomUUID(),
      userId,
      problemSlug,
      content,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [codingProblemNote.userId, codingProblemNote.problemSlug],
      set: { content, updatedAt: now },
    })
    .returning({
      content: codingProblemNote.content,
      updatedAt: codingProblemNote.updatedAt,
    });

  return {
    status: "saved" as const,
    note: {
      content: saved.content,
      updatedAt: saved.updatedAt.toISOString(),
    },
  };
}

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

export async function getCodingSubmissionHistoryForStudent(
  userId: string,
  limit = 50,
): Promise<CodingSubmissionHistoryItem[]> {
  const submissions = await getDatabase()
    .select({
      id: codingSubmission.id,
      problemSlug: codingSubmission.problemSlug,
      code: codingSubmission.code,
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
    .orderBy(desc(codingSubmission.createdAt), desc(codingSubmission.id))
    .limit(Math.max(1, Math.min(limit, 50)));

  return submissions.flatMap((submission) => {
    const problem = getCodingProblem(submission.problemSlug);

    return problem
      ? [
          {
            id: submission.id,
            problemSlug: submission.problemSlug,
            problemNumber: problem.number,
            problemTitle: problem.title,
            verdict: submission.verdict,
            passedTests: submission.passedTests,
            totalTests: submission.totalTests,
            createdAt: submission.createdAt.toISOString(),
            hasSource: submission.code !== null,
          },
        ]
      : [];
  });
}

export async function getCodingSubmissionForStudent(
  userId: string,
  submissionId: string,
): Promise<CodingSubmissionHistoryDetail | null> {
  const [submission] = await getDatabase()
    .select({
      id: codingSubmission.id,
      problemSlug: codingSubmission.problemSlug,
      code: codingSubmission.code,
      verdict: codingSubmission.verdict,
      passedTests: codingSubmission.passedTests,
      totalTests: codingSubmission.totalTests,
      createdAt: codingSubmission.createdAt,
    })
    .from(codingSubmission)
    .where(
      and(
        eq(codingSubmission.userId, userId),
        eq(codingSubmission.id, submissionId),
      ),
    )
    .limit(1);

  if (!submission) return null;

  const problem = getCodingProblem(submission.problemSlug);

  if (!problem) return null;

  const [[previousSubmission], [nextSubmission]] = await Promise.all([
    getDatabase()
      .select({
        id: codingSubmission.id,
        code: codingSubmission.code,
        verdict: codingSubmission.verdict,
        passedTests: codingSubmission.passedTests,
        totalTests: codingSubmission.totalTests,
        createdAt: codingSubmission.createdAt,
      })
      .from(codingSubmission)
      .where(
        and(
          eq(codingSubmission.userId, userId),
          eq(codingSubmission.problemSlug, submission.problemSlug),
          or(
            lt(codingSubmission.createdAt, submission.createdAt),
            and(
              eq(codingSubmission.createdAt, submission.createdAt),
              lt(codingSubmission.id, submission.id),
            ),
          ),
        ),
      )
      .orderBy(desc(codingSubmission.createdAt), desc(codingSubmission.id))
      .limit(1),
    getDatabase()
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
          eq(codingSubmission.problemSlug, submission.problemSlug),
          or(
            gt(codingSubmission.createdAt, submission.createdAt),
            and(
              eq(codingSubmission.createdAt, submission.createdAt),
              gt(codingSubmission.id, submission.id),
            ),
          ),
        ),
      )
      .orderBy(asc(codingSubmission.createdAt), asc(codingSubmission.id))
      .limit(1),
  ]);

  return {
    id: submission.id,
    problemSlug: submission.problemSlug,
    problemNumber: problem.number,
    problemTitle: problem.title,
    code: submission.code,
    verdict: submission.verdict,
    passedTests: submission.passedTests,
    totalTests: submission.totalTests,
    createdAt: submission.createdAt.toISOString(),
    hasSource: submission.code !== null,
    previousSubmission: previousSubmission
      ? {
          ...previousSubmission,
          createdAt: previousSubmission.createdAt.toISOString(),
        }
      : null,
    nextSubmission: nextSubmission
      ? {
          ...nextSubmission,
          createdAt: nextSubmission.createdAt.toISOString(),
        }
      : null,
  };
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
      attempts: [] as CodingProblemAttempt[],
      solutionNote: null,
      customTestCases: [] as CodingTestCase[],
    };
  }

  const database = getDatabase();
  const [progress, attempts, solutionNotes, testCaseSets] = await Promise.all([
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
        code: codingSubmission.code,
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
    database
      .select({
        content: codingProblemNote.content,
        updatedAt: codingProblemNote.updatedAt,
      })
      .from(codingProblemNote)
      .where(
        and(
          eq(codingProblemNote.userId, userId),
          eq(codingProblemNote.problemSlug, problemSlug),
        ),
      )
      .limit(1),
    database
      .select({
        inputs: codingProblemTestCaseSet.inputs,
        expectedOutputs: codingProblemTestCaseSet.expectedOutputs,
      })
      .from(codingProblemTestCaseSet)
      .where(
        and(
          eq(codingProblemTestCaseSet.userId, userId),
          eq(codingProblemTestCaseSet.problemSlug, problemSlug),
        ),
      )
      .limit(1),
  ]);

  return {
    code: progress[0]?.code ?? problem.starterCode,
    bestVerdict: progress[0]?.bestVerdict ?? null,
    attempts: attempts.map((attempt) => ({
      id: attempt.id,
      verdict: attempt.verdict,
      passedTests: attempt.passedTests,
      totalTests: attempt.totalTests,
      createdAt: attempt.createdAt.toISOString(),
      hasSource: attempt.code !== null,
    })),
    solutionNote: solutionNotes[0]
      ? {
          content: solutionNotes[0].content,
          updatedAt: solutionNotes[0].updatedAt.toISOString(),
        }
      : null,
    customTestCases:
      testCaseSets[0]?.inputs.map((input, index) => ({
        input,
        expectedOutput: testCaseSets[0]?.expectedOutputs[index] ?? null,
      })) ?? [],
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
      code,
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
      hasSource: true,
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
