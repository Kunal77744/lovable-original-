import { and, eq } from "drizzle-orm";
import { isUtcDateKey } from "@/lib/daily-coding-challenge";
import { getDatabase } from "./index";
import { dailyCodingChallengeCompletion } from "./schema";

export type DailyCodingChallengeCompletion = {
  challengeDate: string;
  problemSlug: string;
  submissionId: string;
  completedAt: string;
};

export async function getDailyCodingChallengeCompletionForStudent(
  userId: string,
  challengeDate: string,
): Promise<DailyCodingChallengeCompletion | null> {
  if (!isUtcDateKey(challengeDate)) return null;

  const [completion] = await getDatabase()
    .select({
      challengeDate: dailyCodingChallengeCompletion.challengeDate,
      problemSlug: dailyCodingChallengeCompletion.problemSlug,
      submissionId: dailyCodingChallengeCompletion.submissionId,
      completedAt: dailyCodingChallengeCompletion.completedAt,
    })
    .from(dailyCodingChallengeCompletion)
    .where(
      and(
        eq(dailyCodingChallengeCompletion.userId, userId),
        eq(dailyCodingChallengeCompletion.challengeDate, challengeDate),
      ),
    )
    .limit(1);

  return completion
    ? {
        ...completion,
        completedAt: completion.completedAt.toISOString(),
      }
    : null;
}
