import { eq } from "drizzle-orm";
import {
  getCssSpacedReviewDueAt,
  isBoundedCssSpacedReviewResult,
} from "@/lib/css-spaced-review";
import { getDatabase } from "./index";
import { cssSpacedReviewResult } from "./schema";

export type SavedCssSpacedReviewResult = {
  correctCount: number;
  totalCount: number;
  completedAt: string;
  nextDueAt: string;
};

function toSavedResult(
  row: typeof cssSpacedReviewResult.$inferSelect | undefined,
): SavedCssSpacedReviewResult | null {
  if (!row) return null;
  if (
    !isBoundedCssSpacedReviewResult(row) ||
    row.nextDueAt.getTime() <= row.completedAt.getTime()
  ) {
    return null;
  }

  return {
    correctCount: row.correctCount,
    totalCount: row.totalCount,
    completedAt: row.completedAt.toISOString(),
    nextDueAt: row.nextDueAt.toISOString(),
  };
}

export async function getCssSpacedReviewResultForStudent(userId: string) {
  const [row] = await getDatabase()
    .select()
    .from(cssSpacedReviewResult)
    .where(eq(cssSpacedReviewResult.userId, userId))
    .limit(1);

  return toSavedResult(row);
}

export async function saveCssSpacedReviewResultForStudent(
  userId: string,
  result: { correctCount: number; totalCount: number },
) {
  if (!isBoundedCssSpacedReviewResult(result)) return null;

  const now = new Date();
  const nextDueAt = getCssSpacedReviewDueAt(result, now);
  const [row] = await getDatabase()
    .insert(cssSpacedReviewResult)
    .values({
      id: crypto.randomUUID(),
      userId,
      correctCount: result.correctCount,
      totalCount: result.totalCount,
      nextDueAt,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: cssSpacedReviewResult.userId,
      set: {
        correctCount: result.correctCount,
        totalCount: result.totalCount,
        nextDueAt,
        completedAt: now,
        updatedAt: now,
      },
    })
    .returning();

  return toSavedResult(row);
}
