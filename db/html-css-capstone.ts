import { and, eq, sql } from "drizzle-orm";
import {
  gradeHtmlCssCapstone,
  HTML_CSS_CAPSTONE_SLUG,
  HTML_CSS_CAPSTONE_STARTER_CSS,
  HTML_CSS_CAPSTONE_STARTER_HTML,
  parseHtmlCssCapstoneSource,
  serializeHtmlCssCapstoneSource,
  type HtmlCssCapstoneCheck,
  type HtmlCssCapstoneRecord,
  type HtmlCssCapstoneSubmission,
} from "@/lib/html-css-capstone";
import type { GuidedProjectCheck } from "@/lib/guided-project";
import { getDatabase } from "./index";
import { projectReviewAttemptValues } from "./project-review-history";
import { guidedProject, projectReviewAttempt } from "./schema";

type StoredCapstone = {
  source: string;
  reviewedSource: string | null;
  status: string;
  reviewChecks: unknown;
  submittedAt: Date | null;
  completionId: string | null;
  updatedAt: Date;
};

function capstoneResponse(capstone: StoredCapstone): HtmlCssCapstoneRecord {
  const source = parseHtmlCssCapstoneSource(capstone.source);
  const checks = Array.isArray(capstone.reviewChecks)
    ? (capstone.reviewChecks as HtmlCssCapstoneCheck[])
    : null;
  const status =
    capstone.status === "completed" || capstone.status === "needs-revision"
      ? capstone.status
      : null;
  const submission: HtmlCssCapstoneSubmission | null =
    checks && capstone.submittedAt && status
      ? {
          status,
          checks,
          passedChecks: checks.filter((check) => check.passed).length,
          totalChecks: checks.length,
          submittedAt: capstone.submittedAt.toISOString(),
        }
      : null;

  return {
    ...source,
    saved: true,
    updatedAt: capstone.updatedAt.toISOString(),
    hasUnreviewedChanges:
      Boolean(submission) && capstone.reviewedSource !== capstone.source,
    submission,
  };
}

async function findHtmlCssCapstone(userId: string) {
  const [capstone] = await getDatabase()
    .select({
      source: guidedProject.html,
      reviewedSource: guidedProject.reviewedHtml,
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
        eq(guidedProject.projectSlug, HTML_CSS_CAPSTONE_SLUG),
      ),
    )
    .limit(1);

  return capstone ?? null;
}

export async function getHtmlCssCapstoneForStudent(userId: string) {
  const capstone = await findHtmlCssCapstone(userId);

  return capstone
    ? capstoneResponse(capstone)
    : {
        html: HTML_CSS_CAPSTONE_STARTER_HTML,
        css: HTML_CSS_CAPSTONE_STARTER_CSS,
        saved: false,
        updatedAt: null,
        hasUnreviewedChanges: false,
        submission: null,
      } satisfies HtmlCssCapstoneRecord;
}

export async function getHtmlCssCapstoneSummary(userId: string) {
  const capstone = await findHtmlCssCapstone(userId);

  if (!capstone) return { state: "not-started" as const, passedChecks: 0 };

  const record = capstoneResponse(capstone);
  const completed =
    record.submission?.status === "completed" && !record.hasUnreviewedChanges;

  return {
    state: completed ? ("completed" as const) : ("in-progress" as const),
    passedChecks: record.submission?.passedChecks ?? 0,
  };
}

export async function saveHtmlCssCapstoneDraft(
  userId: string,
  html: string,
  css: string,
) {
  const now = new Date();
  const source = serializeHtmlCssCapstoneSource(html, css);

  await getDatabase()
    .insert(guidedProject)
    .values({
      id: crypto.randomUUID(),
      userId,
      projectSlug: HTML_CSS_CAPSTONE_SLUG,
      html: source,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [guidedProject.userId, guidedProject.projectSlug],
      set: { html: source, updatedAt: now },
    });

  const capstone = await findHtmlCssCapstone(userId);
  return capstone ? capstoneResponse(capstone) : null;
}

export async function submitHtmlCssCapstone(
  userId: string,
  html: string,
  css: string,
) {
  const checks = gradeHtmlCssCapstone(html, css);
  const storedChecks = checks as unknown as GuidedProjectCheck[];
  const completed = checks.every((check) => check.passed);
  const now = new Date();
  const completionId = completed ? crypto.randomUUID() : null;
  const source = serializeHtmlCssCapstoneSource(html, css);
  const [capstone] = await getDatabase().transaction(async (transaction) => {
    const [savedCapstone] = await transaction
      .insert(guidedProject)
      .values({
        id: crypto.randomUUID(),
        userId,
        projectSlug: HTML_CSS_CAPSTONE_SLUG,
        html: source,
        reviewedHtml: source,
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
          html: source,
          reviewedHtml: source,
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
        source: guidedProject.html,
        reviewedSource: guidedProject.reviewedHtml,
        status: guidedProject.status,
        reviewChecks: guidedProject.reviewChecks,
        submittedAt: guidedProject.submittedAt,
        completionId: guidedProject.completionId,
        updatedAt: guidedProject.updatedAt,
      });

    await transaction.insert(projectReviewAttempt).values(
      projectReviewAttemptValues({
        userId,
        projectSlug: HTML_CSS_CAPSTONE_SLUG,
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
    completedForFirstTime: completed && capstone.completionId === completionId,
  };
}
