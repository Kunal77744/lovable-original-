import { desc, eq } from "drizzle-orm";
import {
  getProjectReviewDefinition,
  isProjectReviewStatus,
  type ProjectReviewAttempt,
} from "@/lib/project-review-history";
import { getDatabase } from "./index";
import { projectReviewAttempt } from "./schema";

export async function getProjectReviewHistory(
  userId: string,
  limit = 50,
): Promise<ProjectReviewAttempt[]> {
  const boundedLimit = Math.max(1, Math.min(limit, 50));
  const rows = await getDatabase()
    .select({
      id: projectReviewAttempt.id,
      projectSlug: projectReviewAttempt.projectSlug,
      status: projectReviewAttempt.status,
      passedChecks: projectReviewAttempt.passedChecks,
      totalChecks: projectReviewAttempt.totalChecks,
      createdAt: projectReviewAttempt.createdAt,
    })
    .from(projectReviewAttempt)
    .where(eq(projectReviewAttempt.userId, userId))
    .orderBy(desc(projectReviewAttempt.createdAt))
    .limit(boundedLimit);

  return rows.flatMap((row) => {
    const definition = getProjectReviewDefinition(row.projectSlug);
    if (!definition || !isProjectReviewStatus(row.status)) return [];

    return [{ ...definition, ...row, status: row.status }];
  });
}

export function projectReviewAttemptValues({
  userId,
  projectSlug,
  status,
  passedChecks,
  totalChecks,
  createdAt,
}: {
  userId: string;
  projectSlug: string;
  status: "completed" | "needs-revision";
  passedChecks: number;
  totalChecks: number;
  createdAt: Date;
}) {
  return {
    id: crypto.randomUUID(),
    userId,
    projectSlug,
    status,
    passedChecks,
    totalChecks,
    createdAt,
  };
}
