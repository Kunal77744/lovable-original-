import { and, desc, eq, inArray } from "drizzle-orm";
import { CODING_PROBLEMS, getCodingProblem } from "@/lib/coding-problems";
import { getDatabase } from "./index";
import { codingProblemProgress } from "./schema";

export type SavedCodingWorkspace = {
  slug: string;
  number: number;
  title: string;
  skill: string;
  code: string;
  bestVerdict: string | null;
  updatedAt: string;
};

export async function getCodingWorkspacesForStudent(
  userId: string,
): Promise<SavedCodingWorkspace[]> {
  const rows = await getDatabase()
    .select({
      problemSlug: codingProblemProgress.problemSlug,
      code: codingProblemProgress.code,
      bestVerdict: codingProblemProgress.bestVerdict,
      updatedAt: codingProblemProgress.updatedAt,
    })
    .from(codingProblemProgress)
    .where(
      and(
        eq(codingProblemProgress.userId, userId),
        inArray(
          codingProblemProgress.problemSlug,
          CODING_PROBLEMS.map((problem) => problem.slug),
        ),
      ),
    )
    .orderBy(
      desc(codingProblemProgress.updatedAt),
      desc(codingProblemProgress.id),
    );

  return rows.flatMap((row) => {
    const problem = getCodingProblem(row.problemSlug);

    if (!problem) return [];

    return [
      {
        slug: problem.slug,
        number: problem.number,
        title: problem.title,
        skill: problem.skill,
        code: row.code,
        bestVerdict: row.bestVerdict,
        updatedAt: row.updatedAt.toISOString(),
      },
    ];
  });
}
