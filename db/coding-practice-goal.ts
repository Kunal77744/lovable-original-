import { eq } from "drizzle-orm";
import {
  isCodingPracticeGoalTarget,
  type CodingPracticeGoalTarget,
} from "@/lib/coding-practice-goal";
import { getDatabase } from "./index";
import { codingPracticeGoal } from "./schema";

export type SavedCodingPracticeGoal = {
  targetActiveDays: CodingPracticeGoalTarget;
  updatedAt: string;
};

function toSavedGoal(
  row: typeof codingPracticeGoal.$inferSelect | undefined,
): SavedCodingPracticeGoal | null {
  if (!row || !isCodingPracticeGoalTarget(row.targetActiveDays)) return null;

  return {
    targetActiveDays: row.targetActiveDays,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getCodingPracticeGoalForStudent(userId: string) {
  const [row] = await getDatabase()
    .select()
    .from(codingPracticeGoal)
    .where(eq(codingPracticeGoal.userId, userId))
    .limit(1);

  return toSavedGoal(row);
}

export async function saveCodingPracticeGoalForStudent(
  userId: string,
  targetActiveDays: number,
) {
  if (!isCodingPracticeGoalTarget(targetActiveDays)) return null;

  const now = new Date();
  const [row] = await getDatabase()
    .insert(codingPracticeGoal)
    .values({
      id: crypto.randomUUID(),
      userId,
      targetActiveDays,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: codingPracticeGoal.userId,
      set: { targetActiveDays, updatedAt: now },
    })
    .returning();

  return toSavedGoal(row);
}
