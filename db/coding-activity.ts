import { and, eq, inArray, sql } from "drizzle-orm";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import type { CodingActivityDayInput } from "@/lib/coding-activity";
import { getDatabase } from "./index";
import { codingSubmission } from "./schema";

export async function getCodingActivityDaysForStudent(
  userId: string,
): Promise<CodingActivityDayInput[]> {
  const dateExpression = sql<string>`to_char(${codingSubmission.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;
  const rows = await getDatabase()
    .select({
      date: dateExpression,
      attemptCount: sql<number>`count(*)::integer`,
      acceptedCount: sql<number>`count(*) filter (where ${codingSubmission.verdict} = 'Accepted')::integer`,
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
    .groupBy(dateExpression)
    .orderBy(dateExpression);

  return rows;
}
