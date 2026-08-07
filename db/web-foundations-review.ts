import { eq } from "drizzle-orm";
import {
  getWebFoundationsReviewDueAt,
  isBoundedWebFoundationsReviewResult,
} from "@/lib/web-foundations-review";
import { getDatabase } from "./index";
import { webFoundationsReviewResult } from "./schema";

export type SavedWebFoundationsReviewResult = {
  correctCount: number;
  totalCount: number;
  completedAt: string;
  nextDueAt: string;
};

function toSavedResult(
  row: typeof webFoundationsReviewResult.$inferSelect | undefined,
): SavedWebFoundationsReviewResult | null {
  if (!row) return null;
  if (
    !isBoundedWebFoundationsReviewResult(row) ||
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

export async function getWebFoundationsReviewResultForStudent(userId: string) {
  const [row] = await getDatabase()
    .select()
    .from(webFoundationsReviewResult)
    .where(eq(webFoundationsReviewResult.userId, userId))
    .limit(1);

  return toSavedResult(row);
}

export async function saveWebFoundationsReviewResultForStudent(
  userId: string,
  result: { correctCount: number; totalCount: number },
) {
  if (!isBoundedWebFoundationsReviewResult(result)) return null;

  const now = new Date();
  const nextDueAt = getWebFoundationsReviewDueAt(result, now);
  const [row] = await getDatabase()
    .insert(webFoundationsReviewResult)
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
      target: webFoundationsReviewResult.userId,
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
