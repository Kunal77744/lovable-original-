import { and, eq, sql } from "drizzle-orm";
import {
  gradeGuidedProject,
  GUIDED_PROJECT_STARTER,
  type GuidedProjectCheck,
  type GuidedProjectRecord,
  type GuidedProjectSubmission,
  isGuidedProjectSlug,
} from "@/lib/guided-project";
import type { ProjectFeedbackConfidence } from "@/lib/project-feedback";
import { getDatabase } from "./index";
import { projectReviewAttemptValues } from "./project-review-history";
import {
  guidedProject,
  guidedProjectFeedback,
  projectReviewAttempt,
} from "./schema";

type StoredProject = {
  html: string;
  reviewedHtml: string | null;
  status: string;
  reviewChecks: GuidedProjectCheck[] | null;
  submittedAt: Date | null;
  completedAt: Date | null;
  completionId: string | null;
  updatedAt: Date;
};

function projectResponse(project: StoredProject): GuidedProjectRecord {
  const checks = project.reviewChecks;
  const submissionStatus =
    project.status === "completed" || project.status === "needs-revision"
      ? project.status
      : null;
  const submission: GuidedProjectSubmission | null =
    checks && project.submittedAt && submissionStatus
      ? {
          status: submissionStatus,
          checks,
          passedChecks: checks.filter((check) => check.passed).length,
          totalChecks: checks.length,
          submittedAt: project.submittedAt.toISOString(),
        }
      : null;

  return {
    html: project.html,
    saved: true,
    updatedAt: project.updatedAt.toISOString(),
    hasUnreviewedChanges:
      Boolean(submission) && project.reviewedHtml !== project.html,
    submission,
  };
}

async function findGuidedProject(userId: string, projectSlug: string) {
  const database = getDatabase();
  const [project] = await database
    .select({
      html: guidedProject.html,
      reviewedHtml: guidedProject.reviewedHtml,
      status: guidedProject.status,
      reviewChecks: guidedProject.reviewChecks,
      submittedAt: guidedProject.submittedAt,
      completedAt: guidedProject.completedAt,
      completionId: guidedProject.completionId,
      updatedAt: guidedProject.updatedAt,
    })
    .from(guidedProject)
    .where(
      and(
        eq(guidedProject.userId, userId),
        eq(guidedProject.projectSlug, projectSlug),
      ),
    )
    .limit(1);

  return project ?? null;
}

export async function getGuidedProjectForStudent(
  userId: string,
  projectSlug: string,
) {
  if (!isGuidedProjectSlug(projectSlug)) {
    return null;
  }

  const project = await findGuidedProject(userId, projectSlug);

  return project
    ? projectResponse(project)
    : {
        html: GUIDED_PROJECT_STARTER,
        saved: false,
        updatedAt: null,
        hasUnreviewedChanges: false,
        submission: null,
      };
}

export async function getGuidedProjectSummary(
  userId: string,
  projectSlug: string,
) {
  if (!isGuidedProjectSlug(projectSlug)) return null;

  const project = await findGuidedProject(userId, projectSlug);

  if (!project) {
    return { state: "not-started" as const, passedChecks: 0 };
  }

  const record = projectResponse(project);
  const completed =
    record.submission?.status === "completed" &&
    !record.hasUnreviewedChanges;

  return {
    state: completed ? ("completed" as const) : ("in-progress" as const),
    passedChecks: record.submission?.passedChecks ?? 0,
  };
}

export async function saveGuidedProjectDraft(
  userId: string,
  projectSlug: string,
  html: string,
) {
  if (!isGuidedProjectSlug(projectSlug)) {
    return null;
  }

  const database = getDatabase();
  const now = new Date();

  await database
    .insert(guidedProject)
    .values({
      id: crypto.randomUUID(),
      userId,
      projectSlug,
      html,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [guidedProject.userId, guidedProject.projectSlug],
      set: {
        html,
        updatedAt: now,
      },
    });

  const project = await findGuidedProject(userId, projectSlug);

  return project ? projectResponse(project) : null;
}

export async function submitGuidedProjectForReview(
  userId: string,
  projectSlug: string,
  html: string,
) {
  if (!isGuidedProjectSlug(projectSlug)) {
    return null;
  }

  const database = getDatabase();
  const checks = gradeGuidedProject(html);
  const completed = checks.every((check) => check.passed);
  const now = new Date();
  const completionId = completed ? crypto.randomUUID() : null;

  const [project] = await database.transaction(async (transaction) => {
    const [savedProject] = await transaction
      .insert(guidedProject)
      .values({
        id: crypto.randomUUID(),
        userId,
        projectSlug,
        html,
        reviewedHtml: html,
        status: completed ? "completed" : "needs-revision",
        reviewChecks: checks,
        submittedAt: now,
        completedAt: completed ? now : null,
        completionId,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [guidedProject.userId, guidedProject.projectSlug],
        set: {
          html,
          reviewedHtml: html,
          status: completed ? "completed" : "needs-revision",
          reviewChecks: checks,
          submittedAt: now,
          ...(completed
            ? {
                completedAt: sql`coalesce(${guidedProject.completedAt}, ${now.toISOString()}::timestamptz)`,
                completionId: sql`coalesce(${guidedProject.completionId}, ${completionId})`,
              }
            : {}),
          updatedAt: now,
        },
      })
      .returning({
        html: guidedProject.html,
        reviewedHtml: guidedProject.reviewedHtml,
        status: guidedProject.status,
        reviewChecks: guidedProject.reviewChecks,
        submittedAt: guidedProject.submittedAt,
        completedAt: guidedProject.completedAt,
        completionId: guidedProject.completionId,
        updatedAt: guidedProject.updatedAt,
      });

    await transaction.insert(projectReviewAttempt).values(
      projectReviewAttemptValues({
        userId,
        projectSlug,
        status: completed ? "completed" : "needs-revision",
        passedChecks: checks.filter((check) => check.passed).length,
        totalChecks: checks.length,
        createdAt: now,
      }),
    );

    return [savedProject];
  });

  if (!project) {
    return null;
  }

  return {
    project: projectResponse(project),
    completedForFirstTime:
      completed && project.completionId === completionId,
  };
}

export async function getGuidedProjectFeedbackForStudent(
  userId: string,
  projectSlug: string,
) {
  if (!isGuidedProjectSlug(projectSlug)) {
    return null;
  }

  const database = getDatabase();
  const [feedback] = await database
    .select({
      confidence: guidedProjectFeedback.confidence,
      comment: guidedProjectFeedback.comment,
      updatedAt: guidedProjectFeedback.updatedAt,
    })
    .from(guidedProjectFeedback)
    .where(
      and(
        eq(guidedProjectFeedback.userId, userId),
        eq(guidedProjectFeedback.projectSlug, projectSlug),
      ),
    )
    .limit(1);

  return {
    feedback: feedback
      ? {
          confidence: feedback.confidence as ProjectFeedbackConfidence,
          comment: feedback.comment ?? "",
          updatedAt: feedback.updatedAt.toISOString(),
        }
      : null,
  };
}

export async function saveGuidedProjectFeedbackForStudent(
  userId: string,
  projectSlug: string,
  confidence: string,
  comment: string | null,
) {
  if (!isGuidedProjectSlug(projectSlug)) {
    return null;
  }

  const database = getDatabase();
  const [completedProject] = await database
    .select({ id: guidedProject.id })
    .from(guidedProject)
    .where(
      and(
        eq(guidedProject.userId, userId),
        eq(guidedProject.projectSlug, projectSlug),
        eq(guidedProject.status, "completed"),
      ),
    )
    .limit(1);

  if (!completedProject) {
    return null;
  }

  const now = new Date();
  await database
    .insert(guidedProjectFeedback)
    .values({
      id: crypto.randomUUID(),
      userId,
      projectSlug,
      confidence,
      comment,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        guidedProjectFeedback.userId,
        guidedProjectFeedback.projectSlug,
      ],
      set: {
        confidence,
        comment,
        updatedAt: now,
      },
    });

  return {
    confidence,
    comment: comment ?? "",
    updatedAt: now.toISOString(),
  };
}
