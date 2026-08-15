import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { LearnerReviewHub } from "@/components/learner-review-hub";
import {
  getCodingCatalogProgress,
  getCodingMistakeReviewQueueForStudent,
  getCodingProblemBookmarksForStudent,
  getRecentCodingAttempts,
} from "@/db/coding-practice";
import {
  getCssPracticeCatalogProgress,
  getCssReviewSessionForStudent,
} from "@/db/css-practice";
import { getOrCreateFirstCourseAssignment } from "@/db/course";
import { getGuidedProjectForStudent } from "@/db/guided-project";
import { getHtmlCssCapstoneSummary } from "@/db/html-css-capstone";
import { getJavaScriptCapstoneSummary } from "@/db/javascript-capstone";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { getJavaScriptMixedReviewResultForStudent } from "@/db/javascript-mixed-review";
import { getWebFoundationsReviewResultForStudent } from "@/db/web-foundations-review";
import { getSignInHref } from "@/lib/account-destination";
import { auth } from "@/lib/auth";
import { buildCodingReviewSession } from "@/lib/coding-review-session";
import { GUIDED_PROJECT_SLUG } from "@/lib/guided-project";
import { buildJavaScriptMixedReviewSession } from "@/lib/javascript-mixed-review";
import { buildLearnerProfile } from "@/lib/learner-profile";
import { buildLearnerReviewHub } from "@/lib/learner-review-hub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your private review | Lovable Original",
  description:
    "Open due recall and unresolved saved work across Web Foundations, JavaScript, and CSS from one private learner view.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ReviewPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(getSignInHref("/review"));
  }

  const [
    course,
    practice,
    cssPractice,
    labPractice,
    attempts,
    project,
    htmlCssCapstone,
    javascriptCapstone,
    codingMistakes,
    codingBookmarks,
    cssReview,
    webFoundationsResult,
    javascriptMixedResult,
  ] = await Promise.all([
    getOrCreateFirstCourseAssignment(session.user.id),
    getCodingCatalogProgress(session.user.id),
    getCssPracticeCatalogProgress(session.user.id),
    getJavaScriptLabCatalogProgress(session.user.id),
    getRecentCodingAttempts(session.user.id),
    getGuidedProjectForStudent(session.user.id, GUIDED_PROJECT_SLUG),
    getHtmlCssCapstoneSummary(session.user.id),
    getJavaScriptCapstoneSummary(session.user.id),
    getCodingMistakeReviewQueueForStudent(session.user.id),
    getCodingProblemBookmarksForStudent(session.user.id),
    getCssReviewSessionForStudent(session.user.id),
    getWebFoundationsReviewResultForStudent(session.user.id),
    getJavaScriptMixedReviewResultForStudent(session.user.id),
  ]);

  const profile = buildLearnerProfile({
    course,
    practice,
    cssPractice,
    labPractice,
    attempts,
    projectCompleted: project?.submission?.status === "completed",
    htmlCssCapstone,
    javascriptCapstone,
  });
  const codingReview = buildCodingReviewSession({
    mistakes: codingMistakes,
    bookmarks: codingBookmarks,
    completedSlugs: practice.completedSlugs,
  });
  const javascriptReview = buildJavaScriptMixedReviewSession(labPractice.labs);
  const review = buildLearnerReviewHub({
    courseCompleted: course.courseCompleted,
    webFoundationsResult,
    javascriptReviewItemCount: javascriptReview.length,
    javascriptMixedResult,
    javascriptRepairCount: codingReview.length,
    cssRepairCount: cssReview.length,
    continuation: profile.nextAction,
  });

  return (
    <main>
      <SiteNav currentPage="profile" studentSession />
      <section
        className="learner-review-shell"
        id="main-content"
        tabIndex={-1}
        aria-labelledby="review-title"
      >
        <LearnerReviewHub review={review} />
      </section>
      <SiteFooter />
    </main>
  );
}
