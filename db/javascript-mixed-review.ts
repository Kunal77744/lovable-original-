import { eq } from "drizzle-orm";
import {
  getJavaScriptMixedReviewDueAt,
  isBoundedJavaScriptMixedReviewResult,
} from "@/lib/javascript-mixed-review";
import { getDatabase } from "./index";
import { javascriptMixedReviewResult } from "./schema";

export type SavedJavaScriptMixedReviewResult = {
  correctCount: number;
  totalCount: number;
  completedAt: string;
  nextDueAt: string;
};

function toSavedResult(
  row: typeof javascriptMixedReviewResult.$inferSelect | undefined,
): SavedJavaScriptMixedReviewResult | null {
  if (!row) return null;
  if (
    !isBoundedJavaScriptMixedReviewResult(row) ||
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

export async function getJavaScriptMixedReviewResultForStudent(userId: string) {
  const [row] = await getDatabase()
    .select()
    .from(javascriptMixedReviewResult)
    .where(eq(javascriptMixedReviewResult.userId, userId))
    .limit(1);

  return toSavedResult(row);
}

export async function saveJavaScriptMixedReviewResultForStudent(
  userId: string,
  result: { correctCount: number; totalCount: number },
) {
  if (!isBoundedJavaScriptMixedReviewResult(result)) return null;

  const now = new Date();
  const nextDueAt = getJavaScriptMixedReviewDueAt(result, now);
  const [row] = await getDatabase()
    .insert(javascriptMixedReviewResult)
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
      target: javascriptMixedReviewResult.userId,
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
