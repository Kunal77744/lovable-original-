import { desc, eq } from "drizzle-orm";
import {
  getTimedCodingChallengeSet,
  isTimedCodingChallengeElapsedSeconds,
  isTimedCodingChallengeSetId,
  type TimedCodingChallengeSetId,
} from "@/lib/timed-coding-challenge";
import { getDatabase } from "./index";
import { timedCodingChallengeResult } from "./schema";

export type SavedTimedCodingChallengeResult = {
  id: string;
  challengeSetId: TimedCodingChallengeSetId;
  solvedCount: number;
  elapsedSeconds: number;
  completedAt: string;
};

function toSavedResult(
  row: typeof timedCodingChallengeResult.$inferSelect | undefined,
): SavedTimedCodingChallengeResult | null {
  if (
    !row ||
    !isTimedCodingChallengeSetId(row.challengeSetId) ||
    !Number.isInteger(row.solvedCount) ||
    row.solvedCount < 0 ||
    row.solvedCount >
      (getTimedCodingChallengeSet(row.challengeSetId)?.problems.length ?? 0) ||
    !isTimedCodingChallengeElapsedSeconds(row.elapsedSeconds)
  ) {
    return null;
  }

  return {
    id: row.id,
    challengeSetId: row.challengeSetId,
    solvedCount: row.solvedCount,
    elapsedSeconds: row.elapsedSeconds,
    completedAt: row.completedAt.toISOString(),
  };
}

export async function getRecentTimedCodingChallengeResultsForStudent(
  userId: string,
  limit = 6,
) {
  const boundedLimit = Math.max(1, Math.min(12, Math.floor(limit)));
  const rows = await getDatabase()
    .select()
    .from(timedCodingChallengeResult)
    .where(eq(timedCodingChallengeResult.userId, userId))
    .orderBy(
      desc(timedCodingChallengeResult.completedAt),
      desc(timedCodingChallengeResult.id),
    )
    .limit(boundedLimit);

  return rows.flatMap((row) => {
    const saved = toSavedResult(row);
    return saved ? [saved] : [];
  });
}

export async function saveTimedCodingChallengeResultForStudent(
  userId: string,
  result: {
    challengeSetId: TimedCodingChallengeSetId;
    solvedCount: number;
    elapsedSeconds: number;
  },
) {
  const challengeSet = getTimedCodingChallengeSet(result.challengeSetId);
  if (
    !challengeSet ||
    !Number.isInteger(result.solvedCount) ||
    result.solvedCount < 0 ||
    result.solvedCount > challengeSet.problems.length ||
    !isTimedCodingChallengeElapsedSeconds(result.elapsedSeconds)
  ) {
    return null;
  }

  const [row] = await getDatabase()
    .insert(timedCodingChallengeResult)
    .values({
      id: crypto.randomUUID(),
      userId,
      challengeSetId: result.challengeSetId,
      solvedCount: result.solvedCount,
      elapsedSeconds: result.elapsedSeconds,
      completedAt: new Date(),
    })
    .returning();

  return toSavedResult(row);
}
