import { and, eq } from "drizzle-orm";
import {
  gradeGuidedProject,
  GUIDED_PROJECT_STARTER,
  type GuidedProjectCheck,
  type GuidedProjectRecord,
  type GuidedProjectSubmission,
  isGuidedProjectSlug,
} from "@/lib/guided-project";
import { getDatabase } from "./index";
import { guidedProject } from "./schema";

type StoredProject = {
  html: string;
  reviewedHtml: string | null;
  status: string;
  reviewChecks: GuidedProjectCheck[] | null;
  submittedAt: Date | null;
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

  await database
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
        updatedAt: now,
      },
    });

  const project = await findGuidedProject(userId, projectSlug);

  return project ? projectResponse(project) : null;
}
