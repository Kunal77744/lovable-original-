import { and, eq, sql } from "drizzle-orm";
import {
  gradeJavaScriptCapstoneOutputs,
  JAVASCRIPT_CAPSTONE_SLUG,
  JAVASCRIPT_CAPSTONE_STARTER,
  type JavaScriptCapstoneCheck,
  type JavaScriptCapstoneRecord,
  type JavaScriptCapstoneSubmission,
} from "@/lib/javascript-capstone";
import type { GuidedProjectCheck } from "@/lib/guided-project";
import { getDatabase } from "./index";
import { projectReviewAttemptValues } from "./project-review-history";
import { guidedProject, projectReviewAttempt } from "./schema";

type StoredCapstone = {
  code: string;
  reviewedCode: string | null;
  status: string;
  reviewChecks: unknown;
  submittedAt: Date | null;
  completionId: string | null;
  updatedAt: Date;
};

function capstoneResponse(capstone: StoredCapstone): JavaScriptCapstoneRecord {
  const checks = Array.isArray(capstone.reviewChecks)
    ? (capstone.reviewChecks as JavaScriptCapstoneCheck[])
    : null;
  const submissionStatus =
    capstone.status === "completed" || capstone.status === "needs-revision"
      ? capstone.status
      : null;
  const submission: JavaScriptCapstoneSubmission | null =
    checks && capstone.submittedAt && submissionStatus
      ? {
          status: submissionStatus,
          checks,
          passedChecks: checks.filter((check) => check.passed).length,
          totalChecks: checks.length,
          submittedAt: capstone.submittedAt.toISOString(),
        }
      : null;

  return {
    code: capstone.code,
    saved: true,
    updatedAt: capstone.updatedAt.toISOString(),
    hasUnreviewedChanges:
      Boolean(submission) && capstone.reviewedCode !== capstone.code,
    submission,
  };
}

async function findJavaScriptCapstone(userId: string) {
  const [capstone] = await getDatabase()
    .select({
      code: guidedProject.html,
      reviewedCode: guidedProject.reviewedHtml,
      status: guidedProject.status,
      reviewChecks: guidedProject.reviewChecks,
      submittedAt: guidedProject.submittedAt,
      completionId: guidedProject.completionId,
      updatedAt: guidedProject.updatedAt,
    })
    .from(guidedProject)
    .where(
      and(
        eq(guidedProject.userId, userId),
        eq(guidedProject.projectSlug, JAVASCRIPT_CAPSTONE_SLUG),
      ),
    )
    .limit(1);

  return capstone ?? null;
}

export async function getJavaScriptCapstoneForStudent(userId: string) {
  const capstone = await findJavaScriptCapstone(userId);

  return capstone
    ? capstoneResponse(capstone)
    : {
        code: JAVASCRIPT_CAPSTONE_STARTER,
        saved: false,
        updatedAt: null,
        hasUnreviewedChanges: false,
        submission: null,
      } satisfies JavaScriptCapstoneRecord;
}

export async function getJavaScriptCapstoneSummary(userId: string) {
  const capstone = await findJavaScriptCapstone(userId);

  if (!capstone) {
    return { state: "not-started" as const, passedChecks: 0 };
  }

  const record = capstoneResponse(capstone);
  const completed =
    record.submission?.status === "completed" &&
    !record.hasUnreviewedChanges;

  return {
    state: completed ? ("completed" as const) : ("in-progress" as const),
    passedChecks: record.submission?.passedChecks ?? 0,
  };
}

export async function saveJavaScriptCapstoneDraft(
  userId: string,
  code: string,
) {
  const now = new Date();

  await getDatabase()
    .insert(guidedProject)
    .values({
      id: crypto.randomUUID(),
      userId,
      projectSlug: JAVASCRIPT_CAPSTONE_SLUG,
      html: code,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [guidedProject.userId, guidedProject.projectSlug],
      set: {
        html: code,
        updatedAt: now,
      },
    });

  const capstone = await findJavaScriptCapstone(userId);
  return capstone ? capstoneResponse(capstone) : null;
}

export async function submitJavaScriptCapstone(
  userId: string,
  code: string,
  outputs: unknown,
) {
  const checks = gradeJavaScriptCapstoneOutputs(outputs);

  if (!checks) return null;

  // The shared project table stores rubric JSON for both HTML and JavaScript projects.
  const storedChecks = checks as unknown as GuidedProjectCheck[];
  const completed = checks.every((check) => check.passed);
  const now = new Date();
  const completionId = completed ? crypto.randomUUID() : null;
  const [capstone] = await getDatabase().transaction(async (transaction) => {
    const [savedCapstone] = await transaction
      .insert(guidedProject)
      .values({
        id: crypto.randomUUID(),
        userId,
        projectSlug: JAVASCRIPT_CAPSTONE_SLUG,
        html: code,
        reviewedHtml: code,
        status: completed ? "completed" : "needs-revision",
        reviewChecks: storedChecks,
        submittedAt: now,
        completedAt: completed ? now : null,
        completionId,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [guidedProject.userId, guidedProject.projectSlug],
        set: {
          html: code,
          reviewedHtml: code,
          status: completed ? "completed" : "needs-revision",
          reviewChecks: storedChecks,
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
        code: guidedProject.html,
        reviewedCode: guidedProject.reviewedHtml,
        status: guidedProject.status,
        reviewChecks: guidedProject.reviewChecks,
        submittedAt: guidedProject.submittedAt,
        completionId: guidedProject.completionId,
        updatedAt: guidedProject.updatedAt,
      });

    await transaction.insert(projectReviewAttempt).values(
      projectReviewAttemptValues({
        userId,
        projectSlug: JAVASCRIPT_CAPSTONE_SLUG,
        status: completed ? "completed" : "needs-revision",
        passedChecks: checks.filter((check) => check.passed).length,
        totalChecks: checks.length,
        createdAt: now,
      }),
    );

    return [savedCapstone];
  });

  if (!capstone) return null;

  return {
    project: capstoneResponse(capstone),
    completedForFirstTime:
      completed && capstone.completionId === completionId,
  };
}
