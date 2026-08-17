import { and, desc, eq, inArray } from "drizzle-orm";
import {
  CSS_PRACTICE_CHALLENGES,
  getCssPracticeChallenge,
  gradeCssPracticeChallenge,
} from "@/lib/css-practice-challenges";
import {
  CSS_PATH_FEEDBACK_PATH_SLUG,
  type CssPathFeedbackUsefulness,
  type SavedCssPathFeedback,
} from "@/lib/css-path-feedback";
import {
  buildCssReviewSession,
  type CssReviewSessionItem,
} from "@/lib/css-review-session";
import type { SavedCssAttemptNote } from "@/lib/css-attempt-notes";
import { getDatabase } from "./index";
import {
  cssPracticeAttempt,
  cssPracticeFeedback,
  cssPracticeNote,
  cssPracticeProgress,
} from "./schema";

export type CssPracticeAttempt = {
  id: string;
  verdict: "Completed" | "Needs revision";
  passedChecks: number;
  totalChecks: number;
  createdAt: string;
};

export type CssPracticeHistoryItem = CssPracticeAttempt & {
  challengeSlug: string;
  challengeNumber: number;
  challengeTitle: string;
  skill: string;
};

const challengeSlugs = CSS_PRACTICE_CHALLENGES.map(
  (challenge) => challenge.slug,
);

export async function getCssReviewSessionForStudent(
  userId: string,
): Promise<CssReviewSessionItem[]> {
  const latestAttempts = await getDatabase()
    .selectDistinctOn([cssPracticeAttempt.challengeSlug], {
      id: cssPracticeAttempt.id,
      challengeSlug: cssPracticeAttempt.challengeSlug,
      verdict: cssPracticeAttempt.verdict,
      passedChecks: cssPracticeAttempt.passedChecks,
      totalChecks: cssPracticeAttempt.totalChecks,
      createdAt: cssPracticeAttempt.createdAt,
    })
    .from(cssPracticeAttempt)
    .where(
      and(
        eq(cssPracticeAttempt.userId, userId),
        inArray(cssPracticeAttempt.challengeSlug, challengeSlugs),
      ),
    )
    .orderBy(
      cssPracticeAttempt.challengeSlug,
      desc(cssPracticeAttempt.createdAt),
      desc(cssPracticeAttempt.id),
    );

  return buildCssReviewSession(latestAttempts);
}

export async function getCssPracticeHistoryForStudent(
  userId: string,
): Promise<CssPracticeHistoryItem[]> {
  const attempts = await getDatabase()
    .select({
      id: cssPracticeAttempt.id,
      challengeSlug: cssPracticeAttempt.challengeSlug,
      verdict: cssPracticeAttempt.verdict,
      passedChecks: cssPracticeAttempt.passedChecks,
      totalChecks: cssPracticeAttempt.totalChecks,
      createdAt: cssPracticeAttempt.createdAt,
    })
    .from(cssPracticeAttempt)
    .where(
      and(
        eq(cssPracticeAttempt.userId, userId),
        inArray(cssPracticeAttempt.challengeSlug, challengeSlugs),
      ),
    )
    .orderBy(desc(cssPracticeAttempt.createdAt), desc(cssPracticeAttempt.id))
    .limit(50);

  return attempts.flatMap((attempt) => {
    const challenge = getCssPracticeChallenge(attempt.challengeSlug);

    if (!challenge) return [];

    return [
      {
        id: attempt.id,
        challengeSlug: attempt.challengeSlug,
        challengeNumber: challenge.number,
        challengeTitle: challenge.title,
        skill: challenge.skill,
        verdict: attempt.verdict as CssPracticeAttempt["verdict"],
        passedChecks: attempt.passedChecks,
        totalChecks: attempt.totalChecks,
        createdAt: attempt.createdAt.toISOString(),
      },
    ];
  });
}

export async function getCssPracticeCatalogProgress(userId: string | null) {
  if (!userId) {
    return {
      completedCount: 0,
      totalCount: CSS_PRACTICE_CHALLENGES.length,
      completedSlugs: [] as string[],
      nextChallengeSlug: CSS_PRACTICE_CHALLENGES[0]?.slug ?? null,
    };
  }

  const rows = await getDatabase()
    .select({ challengeSlug: cssPracticeProgress.challengeSlug })
    .from(cssPracticeProgress)
    .where(
      and(
        eq(cssPracticeProgress.userId, userId),
        inArray(cssPracticeProgress.challengeSlug, challengeSlugs),
        eq(cssPracticeProgress.bestVerdict, "Completed"),
      ),
    );
  const completedSlugs = rows.map((row) => row.challengeSlug);
  const completedSet = new Set(completedSlugs);

  return {
    completedCount: completedSlugs.length,
    totalCount: CSS_PRACTICE_CHALLENGES.length,
    completedSlugs,
    nextChallengeSlug:
      CSS_PRACTICE_CHALLENGES.find(
        (challenge) => !completedSet.has(challenge.slug),
      )?.slug ?? null,
  };
}

export async function getCssPracticeChallengeForStudent(
  userId: string | null,
  challengeSlug: string,
) {
  const challenge = getCssPracticeChallenge(challengeSlug);

  if (!challenge) return null;

  if (!userId) {
    return {
      css: challenge.starterCss,
      hasSavedDraft: false,
      bestVerdict: null,
      attempts: [] as CssPracticeAttempt[],
    };
  }

  const database = getDatabase();
  const [progressRows, attemptRows] = await Promise.all([
    database
      .select({
        css: cssPracticeProgress.css,
        bestVerdict: cssPracticeProgress.bestVerdict,
      })
      .from(cssPracticeProgress)
      .where(
        and(
          eq(cssPracticeProgress.userId, userId),
          eq(cssPracticeProgress.challengeSlug, challengeSlug),
        ),
      )
      .limit(1),
    database
      .select({
        id: cssPracticeAttempt.id,
        verdict: cssPracticeAttempt.verdict,
        passedChecks: cssPracticeAttempt.passedChecks,
        totalChecks: cssPracticeAttempt.totalChecks,
        createdAt: cssPracticeAttempt.createdAt,
      })
      .from(cssPracticeAttempt)
      .where(
        and(
          eq(cssPracticeAttempt.userId, userId),
          eq(cssPracticeAttempt.challengeSlug, challengeSlug),
        ),
      )
      .orderBy(desc(cssPracticeAttempt.createdAt))
      .limit(8),
  ]);

  return {
    css: progressRows[0]?.css ?? challenge.starterCss,
    hasSavedDraft: progressRows.length > 0,
    bestVerdict: progressRows[0]?.bestVerdict ?? null,
    attempts: attemptRows.map((attempt) => ({
      ...attempt,
      verdict: attempt.verdict as CssPracticeAttempt["verdict"],
      createdAt: attempt.createdAt.toISOString(),
    })),
  };
}

export async function getCssPracticePathFeedbackForStudent(userId: string) {
  const catalogProgress = await getCssPracticeCatalogProgress(userId);

  if (catalogProgress.completedCount !== catalogProgress.totalCount) {
    return {
      isEligible: false,
      feedback: null as SavedCssPathFeedback | null,
    };
  }

  const [feedback] = await getDatabase()
    .select({
      pathSlug: cssPracticeFeedback.pathSlug,
      usefulness: cssPracticeFeedback.usefulness,
      comment: cssPracticeFeedback.comment,
      updatedAt: cssPracticeFeedback.updatedAt,
    })
    .from(cssPracticeFeedback)
    .where(
      and(
        eq(cssPracticeFeedback.userId, userId),
        eq(cssPracticeFeedback.pathSlug, CSS_PATH_FEEDBACK_PATH_SLUG),
      ),
    )
    .limit(1);

  return {
    isEligible: true,
    feedback: feedback
      ? {
          pathSlug: feedback.pathSlug,
          usefulness: feedback.usefulness as CssPathFeedbackUsefulness,
          comment: feedback.comment ?? "",
          updatedAt: feedback.updatedAt.toISOString(),
        }
      : null,
  };
}

export async function getCssPracticeAttemptNoteForStudent(
  userId: string,
  challengeSlug: string,
): Promise<SavedCssAttemptNote | null> {
  if (!getCssPracticeChallenge(challengeSlug)) return null;

  const [note] = await getDatabase()
    .select({
      content: cssPracticeNote.content,
      updatedAt: cssPracticeNote.updatedAt,
    })
    .from(cssPracticeNote)
    .where(
      and(
        eq(cssPracticeNote.userId, userId),
        eq(cssPracticeNote.challengeSlug, challengeSlug),
      ),
    )
    .limit(1);

  return note
    ? { content: note.content, updatedAt: note.updatedAt.toISOString() }
    : null;
}

export async function saveCssPracticeAttemptNote(
  userId: string,
  challengeSlug: string,
  content: string,
): Promise<SavedCssAttemptNote | null> {
  if (!getCssPracticeChallenge(challengeSlug)) return null;

  const now = new Date();
  await getDatabase()
    .insert(cssPracticeNote)
    .values({
      id: crypto.randomUUID(),
      userId,
      challengeSlug,
      content,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [cssPracticeNote.userId, cssPracticeNote.challengeSlug],
      set: { content, updatedAt: now },
    });

  return { content, updatedAt: now.toISOString() };
}

export async function saveCssPracticePathFeedbackForStudent(
  userId: string,
  usefulness: CssPathFeedbackUsefulness,
  comment: string | null,
) {
  const catalogProgress = await getCssPracticeCatalogProgress(userId);

  if (catalogProgress.completedCount !== catalogProgress.totalCount) {
    return null;
  }

  const now = new Date();
  await getDatabase()
    .insert(cssPracticeFeedback)
    .values({
      id: crypto.randomUUID(),
      userId,
      pathSlug: CSS_PATH_FEEDBACK_PATH_SLUG,
      usefulness,
      comment,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [cssPracticeFeedback.userId, cssPracticeFeedback.pathSlug],
      set: { usefulness, comment, updatedAt: now },
    });

  return {
    pathSlug: CSS_PATH_FEEDBACK_PATH_SLUG,
    usefulness,
    comment: comment ?? "",
    updatedAt: now.toISOString(),
  };
}

export async function saveCssPracticeDraft(
  userId: string,
  challengeSlug: string,
  css: string,
) {
  if (!getCssPracticeChallenge(challengeSlug)) return null;

  const now = new Date();
  await getDatabase()
    .insert(cssPracticeProgress)
    .values({
      id: crypto.randomUUID(),
      userId,
      challengeSlug,
      css,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [cssPracticeProgress.userId, cssPracticeProgress.challengeSlug],
      set: { css, updatedAt: now },
    });

  return { savedAt: now.toISOString() };
}

export async function saveCssPracticeAttempt(
  userId: string,
  challengeSlug: string,
  css: string,
) {
  const checks = gradeCssPracticeChallenge(challengeSlug, css);

  if (!checks) return null;

  const database = getDatabase();
  const now = new Date();
  const passedChecks = checks.filter((check) => check.passed).length;
  const totalChecks = checks.length;
  const verdict = passedChecks === totalChecks ? "Completed" : "Needs revision";

  return database.transaction(async (transaction) => {
    const [current] = await transaction
      .select({
        bestVerdict: cssPracticeProgress.bestVerdict,
        completedAt: cssPracticeProgress.completedAt,
      })
      .from(cssPracticeProgress)
      .where(
        and(
          eq(cssPracticeProgress.userId, userId),
          eq(cssPracticeProgress.challengeSlug, challengeSlug),
        ),
      )
      .limit(1);
    const bestVerdict =
      current?.bestVerdict === "Completed" || verdict === "Completed"
        ? "Completed"
        : "Needs revision";
    const isFirstCompletedResult =
      verdict === "Completed" && current?.bestVerdict !== "Completed";

    await transaction
      .insert(cssPracticeProgress)
      .values({
        id: crypto.randomUUID(),
        userId,
        challengeSlug,
        css,
        bestVerdict,
        completedAt:
          bestVerdict === "Completed" ? (current?.completedAt ?? now) : null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [cssPracticeProgress.userId, cssPracticeProgress.challengeSlug],
        set: {
          css,
          bestVerdict,
          completedAt:
            bestVerdict === "Completed" ? (current?.completedAt ?? now) : null,
          updatedAt: now,
        },
      });

    const [attempt] = await transaction
      .insert(cssPracticeAttempt)
      .values({
        id: crypto.randomUUID(),
        userId,
        challengeSlug,
        verdict,
        passedChecks,
        totalChecks,
        createdAt: now,
      })
      .returning({ id: cssPracticeAttempt.id });

    const completedRows = await transaction
      .select({ challengeSlug: cssPracticeProgress.challengeSlug })
      .from(cssPracticeProgress)
      .where(
        and(
          eq(cssPracticeProgress.userId, userId),
          inArray(cssPracticeProgress.challengeSlug, challengeSlugs),
          eq(cssPracticeProgress.bestVerdict, "Completed"),
        ),
      );
    const completedSet = new Set(completedRows.map((row) => row.challengeSlug));
    const nextChallengeSlug =
      CSS_PRACTICE_CHALLENGES.find(
        (challenge) => !completedSet.has(challenge.slug),
      )?.slug ?? null;

    return {
      id: attempt.id,
      verdict,
      bestVerdict,
      isFirstCompletedResult,
      checks,
      passedChecks,
      totalChecks,
      completedCount: completedRows.length,
      totalCount: CSS_PRACTICE_CHALLENGES.length,
      nextChallengeSlug,
      createdAt: now.toISOString(),
    };
  });
}
