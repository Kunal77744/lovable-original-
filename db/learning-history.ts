import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import { CSS_PRACTICE_CHALLENGES } from "@/lib/css-practice-challenges";
import { FIRST_COURSE_LESSONS } from "@/lib/first-course-content";
import { GUIDED_PROJECT_SLUG, type GuidedProjectCheck } from "@/lib/guided-project";
import { HTML_CSS_CAPSTONE_SLUG } from "@/lib/html-css-capstone";
import { JAVASCRIPT_LABS } from "@/lib/javascript-lab-progress";
import { JAVASCRIPT_CAPSTONE_SLUG } from "@/lib/javascript-capstone";
import {
  buildLearningHistory,
  type LearningHistoryItem,
} from "@/lib/learning-history";
import { getDatabase } from "./index";
import {
  codingLabExerciseProgress,
  codingSubmission,
  cssPracticeAttempt,
  guidedProject,
  interviewDrillProgress,
  javascriptMixedReviewResult,
  javascriptReadinessResult,
  lessonProgress,
  webFoundationsReviewResult,
} from "./schema";

const projectSlugs = [
  GUIDED_PROJECT_SLUG,
  JAVASCRIPT_CAPSTONE_SLUG,
  HTML_CSS_CAPSTONE_SLUG,
];

function countPassedChecks(checks: GuidedProjectCheck[] | null) {
  return checks?.filter((check) => check.passed).length ?? 0;
}

export async function getLearningHistoryForStudent(
  userId: string,
  limit = 30,
): Promise<LearningHistoryItem[]> {
  const database = getDatabase();
  const [
    lessons,
    codingSubmissions,
    cssAttempts,
    guidedJavaScript,
    projects,
    webReview,
    javascriptReview,
    readiness,
    interview,
  ] = await Promise.all([
    database
      .select({
        lessonId: lessonProgress.lessonId,
        quizScore: lessonProgress.quizScore,
        completedAt: lessonProgress.completedAt,
      })
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          inArray(
            lessonProgress.lessonId,
            FIRST_COURSE_LESSONS.map((lesson) => lesson.id),
          ),
          eq(lessonProgress.status, "completed"),
          isNotNull(lessonProgress.completedAt),
        ),
      )
      .orderBy(desc(lessonProgress.completedAt))
      .limit(8),
    database
      .select({
        id: codingSubmission.id,
        problemSlug: codingSubmission.problemSlug,
        verdict: codingSubmission.verdict,
        passedTests: codingSubmission.passedTests,
        totalTests: codingSubmission.totalTests,
        createdAt: codingSubmission.createdAt,
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
      .orderBy(desc(codingSubmission.createdAt))
      .limit(12),
    database
      .select({
        id: cssPracticeAttempt.id,
        challengeSlug: cssPracticeAttempt.challengeSlug,
        verdict: cssPracticeAttempt.verdict,
        passedChecks: cssPracticeAttempt.passedChecks,
        totalChecks: cssPracticeAttempt.totalChecks,
        createdAt: cssPracticeAttempt.createdAt,
      })
      .from(cssPracticeAttempt)
      .where(
        and(
          eq(cssPracticeAttempt.userId, userId),
          inArray(
            cssPracticeAttempt.challengeSlug,
            CSS_PRACTICE_CHALLENGES.map((challenge) => challenge.slug),
          ),
        ),
      )
      .orderBy(desc(cssPracticeAttempt.createdAt))
      .limit(10),
    database
      .select({
        id: codingLabExerciseProgress.id,
        labSlug: codingLabExerciseProgress.labSlug,
        exerciseId: codingLabExerciseProgress.exerciseId,
        completedAt: codingLabExerciseProgress.completedAt,
      })
      .from(codingLabExerciseProgress)
      .where(
        and(
          eq(codingLabExerciseProgress.userId, userId),
          inArray(
            codingLabExerciseProgress.labSlug,
            JAVASCRIPT_LABS.map((lab) => lab.slug),
          ),
        ),
      )
      .orderBy(desc(codingLabExerciseProgress.completedAt))
      .limit(12),
    database
      .select({
        id: guidedProject.id,
        projectSlug: guidedProject.projectSlug,
        status: guidedProject.status,
        reviewChecks: guidedProject.reviewChecks,
        submittedAt: guidedProject.submittedAt,
      })
      .from(guidedProject)
      .where(
        and(
          eq(guidedProject.userId, userId),
          inArray(guidedProject.projectSlug, projectSlugs),
          isNotNull(guidedProject.submittedAt),
        ),
      )
      .orderBy(desc(guidedProject.submittedAt))
      .limit(3),
    database
      .select({
        id: webFoundationsReviewResult.id,
        correctCount: webFoundationsReviewResult.correctCount,
        totalCount: webFoundationsReviewResult.totalCount,
        completedAt: webFoundationsReviewResult.completedAt,
      })
      .from(webFoundationsReviewResult)
      .where(eq(webFoundationsReviewResult.userId, userId))
      .limit(1),
    database
      .select({
        id: javascriptMixedReviewResult.id,
        correctCount: javascriptMixedReviewResult.correctCount,
        totalCount: javascriptMixedReviewResult.totalCount,
        completedAt: javascriptMixedReviewResult.completedAt,
      })
      .from(javascriptMixedReviewResult)
      .where(eq(javascriptMixedReviewResult.userId, userId))
      .limit(1),
    database
      .select({
        id: javascriptReadinessResult.id,
        correctCount: javascriptReadinessResult.correctCount,
        totalCount: javascriptReadinessResult.totalCount,
        completedAt: javascriptReadinessResult.completedAt,
      })
      .from(javascriptReadinessResult)
      .where(eq(javascriptReadinessResult.userId, userId))
      .limit(1),
    database
      .select({
        id: interviewDrillProgress.id,
        completedAt: interviewDrillProgress.completedAt,
      })
      .from(interviewDrillProgress)
      .where(
        and(
          eq(interviewDrillProgress.userId, userId),
          eq(interviewDrillProgress.status, "completed"),
          isNotNull(interviewDrillProgress.completedAt),
        ),
      )
      .limit(1),
  ]);

  return buildLearningHistory(
    {
      lessons: lessons.flatMap((row) =>
        row.completedAt ? [{ ...row, completedAt: row.completedAt }] : [],
      ),
      codingSubmissions,
      cssAttempts,
      guidedJavaScript,
      projectReviews: projects.flatMap((row) =>
        row.submittedAt
          ? [
              {
                id: row.id,
                projectSlug: row.projectSlug,
                status: row.status,
                passedChecks: countPassedChecks(row.reviewChecks),
                totalChecks: row.reviewChecks?.length ?? 0,
                submittedAt: row.submittedAt,
              },
            ]
          : [],
      ),
      reviews: [
        ...webReview.map((row) => ({
          id: `web-${row.id}`,
          title: "Web Foundations spaced review",
          result: `${row.correctCount}/${row.totalCount} prompts correct`,
          href: "/courses/web-development-foundations/review",
          completedAt: row.completedAt,
        })),
        ...javascriptReview.map((row) => ({
          id: `javascript-${row.id}`,
          title: "Mixed JavaScript review",
          result: `${row.correctCount}/${row.totalCount} prompts correct`,
          href: "/practice/mixed-review",
          completedAt: row.completedAt,
        })),
        ...readiness.map((row) => ({
          id: `readiness-${row.id}`,
          title: "JavaScript readiness check",
          result: `${row.correctCount}/${row.totalCount} answers correct`,
          href: "/practice/readiness",
          completedAt: row.completedAt,
        })),
        ...interview.flatMap((row) =>
          row.completedAt
            ? [
                {
                  id: `interview-${row.id}`,
                  title: "JavaScript fundamentals interview drill",
                  result: "5 answers saved",
                  href: "/interview/javascript-fundamentals",
                  completedAt: row.completedAt,
                },
              ]
            : [],
        ),
      ],
    },
    limit,
  );
}
