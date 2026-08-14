import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { WebFoundationsReview } from "@/components/web-foundations-review";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { getOrCreateFirstCourseAssignment } from "@/db/course";
import { getCssPracticeCatalogProgress } from "@/db/css-practice";
import { getGuidedProjectSummary } from "@/db/guided-project";
import { getHtmlCssCapstoneSummary } from "@/db/html-css-capstone";
import { getJavaScriptCapstoneSummary } from "@/db/javascript-capstone";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { getWebFoundationsReviewResultForStudent } from "@/db/web-foundations-review";
import { auth } from "@/lib/auth";
import { GUIDED_PROJECT_SLUG } from "@/lib/guided-project";
import { buildLearnerProfile } from "@/lib/learner-profile";
import {
  formatWebFoundationsReviewDueDate,
  isWebFoundationsReviewDue,
  WEB_FOUNDATIONS_REVIEW_ITEMS,
} from "@/lib/web-foundations-review";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private Web Foundations review | Lovable Original",
  description:
    "Recall semantic HTML, CSS selectors, and the box model in one private spaced-review session.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function WebFoundationsReviewPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(
      "/account?mode=signin&next=/courses/web-development-foundations/review",
    );
    return null;
  }

  const [course, savedResult] = await Promise.all([
    getOrCreateFirstCourseAssignment(session.user.id),
    getWebFoundationsReviewResultForStudent(session.user.id),
  ]);
  const reviewDue = isWebFoundationsReviewDue(savedResult);
  const nextLessonHref = course.nextLesson
    ? `/learn/${course.slug}/${course.nextLesson.slug}`
    : "/courses/web-development-foundations";
  const nextLessonLabel = course.nextLesson
    ? `Continue ${course.nextLesson.title}`
    : "Return to the course";
  const continuation = course.courseCompleted
    ? await getReviewContinuation(session.user.id, course)
    : null;

  return (
    <main>
      <SiteNav currentPage="course" studentSession />
      <div
        className="mixed-review-shell foundations-review-shell"
        id="main-content"
        tabIndex={-1}
      >
        <nav
          className="problem-breadcrumbs"
          aria-label="Foundations review navigation"
        >
          <Link href="/courses/web-development-foundations">
            Web Development Foundations
          </Link>
          <span aria-hidden="true">/</span>
          <span>Spaced review</span>
        </nav>

        <header className="mixed-review-hero foundations-review-hero">
          <div>
            <p className="eyebrow">Private spaced review · completed lessons</p>
            <h1>Bring HTML and CSS foundations back before you build.</h1>
            <p>
              Recall four decisions from your completed course. Each answer
              returns one authored explanation, then your next review date
              adapts to the result.
            </p>
          </div>
          <aside aria-label="Foundations review boundaries">
            <strong>
              {WEB_FOUNDATIONS_REVIEW_ITEMS.length} lesson concepts
            </strong>
            <span>
              {savedResult && !reviewDue
                ? `Next review ${formatWebFoundationsReviewDueDate(savedResult.nextDueAt)}`
                : "About 4 minutes"}
            </span>
            <p>
              {savedResult && !reviewDue
                ? `Last recall ${savedResult.correctCount}/${savedResult.totalCount}. Only the result and due date are saved.`
                : "Choices stay browser-local. Only the result and next due date save."}
            </p>
          </aside>
        </header>

        {course.courseCompleted && continuation ? (
          <WebFoundationsReview
            continuation={continuation}
            initialResult={reviewDue ? null : savedResult}
          />
        ) : (
          <section
            className="mixed-review-locked"
            aria-labelledby="foundations-review-locked-title"
          >
            <p className="eyebrow">Finish the lesson path first</p>
            <h2 id="foundations-review-locked-title">
              Complete all three lessons to build your review set.
            </h2>
            <p>
              This session recalls only concepts you have already completed.
              Your exact next lesson is ready below.
            </p>
            <Link className="primary-action" href={nextLessonHref}>
              {nextLessonLabel} <span aria-hidden="true">→</span>
            </Link>
          </section>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}

async function getReviewContinuation(
  userId: string,
  course: Awaited<ReturnType<typeof getOrCreateFirstCourseAssignment>>,
) {
  const [
    practice,
    cssPractice,
    labPractice,
    project,
    htmlCssCapstone,
    javascriptCapstone,
  ] = await Promise.all([
    getCodingCatalogProgress(userId),
    getCssPracticeCatalogProgress(userId),
    getJavaScriptLabCatalogProgress(userId),
    getGuidedProjectSummary(userId, GUIDED_PROJECT_SLUG),
    getHtmlCssCapstoneSummary(userId),
    getJavaScriptCapstoneSummary(userId),
  ]);

  return buildLearnerProfile({
    course,
    practice,
    cssPractice,
    labPractice,
    attempts: [],
    projectCompleted: project?.state === "completed",
    htmlCssCapstone,
    javascriptCapstone,
  }).nextAction;
}
