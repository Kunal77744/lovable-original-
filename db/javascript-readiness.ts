import { eq } from "drizzle-orm";
import type { JavaScriptLabSlug } from "@/lib/javascript-lab-progress";
import { getJavaScriptLab } from "@/lib/javascript-lab-progress";
import { JAVASCRIPT_READINESS_QUESTIONS } from "@/lib/javascript-readiness";
import { getDatabase } from "./index";
import { javascriptReadinessResult } from "./schema";

export type SavedJavaScriptReadinessResult = {
  correctCount: number;
  totalCount: number;
  recommendedLabSlug: JavaScriptLabSlug;
  completedAt: string;
};

function toSavedResult(
  row: typeof javascriptReadinessResult.$inferSelect | undefined,
): SavedJavaScriptReadinessResult | null {
  if (!row) return null;
  if (
    row.totalCount !== JAVASCRIPT_READINESS_QUESTIONS.length ||
    row.correctCount < 0 ||
    row.correctCount > row.totalCount ||
    !getJavaScriptLab(row.recommendedLabSlug)
  ) {
    return null;
  }

  return {
    correctCount: row.correctCount,
    totalCount: row.totalCount,
    recommendedLabSlug: row.recommendedLabSlug as JavaScriptLabSlug,
    completedAt: row.completedAt.toISOString(),
  };
}

export async function getJavaScriptReadinessResultForStudent(userId: string) {
  const [row] = await getDatabase()
    .select()
    .from(javascriptReadinessResult)
    .where(eq(javascriptReadinessResult.userId, userId))
    .limit(1);

  return toSavedResult(row);
}

export async function saveJavaScriptReadinessResultForStudent(
  userId: string,
  result: {
    correctCount: number;
    totalCount: number;
    recommendedLabSlug: JavaScriptLabSlug;
  },
) {
  const now = new Date();
  const [row] = await getDatabase()
    .insert(javascriptReadinessResult)
    .values({
      id: crypto.randomUUID(),
      userId,
      correctCount: result.correctCount,
      totalCount: result.totalCount,
      recommendedLabSlug: result.recommendedLabSlug,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: javascriptReadinessResult.userId,
      set: {
        correctCount: result.correctCount,
        totalCount: result.totalCount,
        recommendedLabSlug: result.recommendedLabSlug,
        completedAt: now,
        updatedAt: now,
      },
    })
    .returning();

  return toSavedResult(row);
}
