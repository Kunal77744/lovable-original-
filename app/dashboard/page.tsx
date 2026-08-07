import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOrCreateFirstCourseAssignment } from "@/db/course";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { getCssPracticeCatalogProgress } from "@/db/css-practice";
import { getGuidedProjectForStudent } from "@/db/guided-project";
import { getHtmlCssCapstoneSummary } from "@/db/html-css-capstone";
import { getJavaScriptCapstoneSummary } from "@/db/javascript-capstone";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { getWebFoundationsReviewResultForStudent } from "@/db/web-foundations-review";
import { auth } from "@/lib/auth";
import {
  getCodingProblem,
  getNextUnfinishedCodingProblemSlug,
} from "@/lib/coding-problems";
import { getCssPracticeChallenge } from "@/lib/css-practice-challenges";
import { GUIDED_PROJECT_SLUG } from "@/lib/guided-project";
import {
  formatWebFoundationsReviewDueDate,
  isWebFoundationsReviewDue,
} from "@/lib/web-foundations-review";
import { LearnerMilestoneChecklist } from "@/components/learner-milestone-checklist";
import { SignOutButton } from "@/components/sign-out-button";
import { SiteFooter, SiteNav } from "../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student dashboard | Lovable Original",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin");
  }

  const [
    firstCourse,
    practiceProgress,
    cssPracticeProgress,
    guidedProject,
    htmlCssCapstone,
    javascriptLabProgress,
    javascriptCapstone,
    foundationsReview,
  ] = await Promise.all([
    getOrCreateFirstCourseAssignment(session.user.id),
    getCodingCatalogProgress(session.user.id),
    getCssPracticeCatalogProgress(session.user.id),
    getGuidedProjectForStudent(session.user.id, GUIDED_PROJECT_SLUG),
    getHtmlCssCapstoneSummary(session.user.id),
    getJavaScriptLabCatalogProgress(session.user.id),
    getJavaScriptCapstoneSummary(session.user.id),
    getWebFoundationsReviewResultForStudent(session.user.id),
  ]);
  const guidedProjectCompleted =
    guidedProject?.submission?.status === "completed";
  const guidedProjectStarted = Boolean(guidedProject?.saved);
  const nextLesson = firstCourse.nextLesson;
  const nextProblemSlug = getNextUnfinishedCodingProblemSlug(
    practiceProgress.completedSlugs,
  );
  const nextProblem = nextProblemSlug
    ? getCodingProblem(nextProblemSlug)
    : null;
  const nextCssChallenge = cssPracticeProgress.nextChallengeSlug
    ? getCssPracticeChallenge(cssPracticeProgress.nextChallengeSlug)
    : null;
  const firstName = session.user.name.trim().split(/\s+/)[0];

  if (!nextLesson) {
    throw new Error("The assigned course has no lessons.");
  }

  return (
    <main>
      <SiteNav currentPage="dashboard" />
      <section className="dashboard-shell" aria-labelledby="dashboard-title">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">Student dashboard</p>
            <h1 id="dashboard-title">Welcome, {firstName}.</h1>
            <p>
              {firstCourse.courseCompleted
                ? "You completed Web Development Foundations. Your result is saved."
                : `Your ${firstCourse.totalLessons}-lesson Web Development Foundations course is ready.`}
            </p>
          </div>
          <SignOutButton />
        </div>

        <LearnerMilestoneChecklist
          course={{
            completed: firstCourse.courseCompleted,
            completedLessons: firstCourse.completedLessons,
            totalLessons: firstCourse.totalLessons,
            totalEstimatedMinutes: firstCourse.lessons.reduce(
              (total, lesson) => total + lesson.estimatedMinutes,
              0,
            ),
            nextLessonTitle: nextLesson.title,
            href: `/learn/${firstCourse.slug}/${nextLesson.slug}`,
          }}
          project={{
            completed: guidedProjectCompleted,
            started: guidedProjectStarted,
            href: `/projects/${GUIDED_PROJECT_SLUG}`,
          }}
          practice={{
            completedCount: practiceProgress.completedCount,
            totalCount: practiceProgress.totalCount,
            nextProblem: nextProblem
              ? {
                  number: nextProblem.number,
                  title: nextProblem.title,
                  href: `/practice/${nextProblem.slug}`,
                }
              : null,
          }}
          cssPractice={{
            completedCount: cssPracticeProgress.completedCount,
            totalCount: cssPracticeProgress.totalCount,
            nextChallenge: nextCssChallenge
              ? {
                  number: nextCssChallenge.number,
                  title: nextCssChallenge.title,
                  href: `/practice/css/${nextCssChallenge.slug}`,
                }
              : null,
          }}
          htmlCssCapstone={htmlCssCapstone}
          javascriptPath={{
            labProgress: javascriptLabProgress,
            capstone: javascriptCapstone,
          }}
        />

        {firstCourse.courseCompleted ? (
          <section
            className="dashboard-foundations-review"
            aria-labelledby="dashboard-foundations-review-title"
          >
            <div>
              <p className="course-kicker">Spaced foundations review</p>
              <h2 id="dashboard-foundations-review-title">
                {foundationsReview &&
                !isWebFoundationsReviewDue(foundationsReview)
                  ? `Your next HTML and CSS review is set for ${formatWebFoundationsReviewDueDate(foundationsReview.nextDueAt)}.`
                  : "Bring four HTML and CSS decisions back before they fade."}
              </h2>
              <p>
                {foundationsReview &&
                !isWebFoundationsReviewDue(foundationsReview)
                  ? `Last recall ${foundationsReview.correctCount}/${foundationsReview.totalCount}. Your project remains the next milestone.`
                  : "Four authored prompts adapt the next due date without storing your choices or changing course completion."}
              </p>
            </div>
            <div>
              <span>About 4 minutes</span>
              <Link
                className="dashboard-foundations-review-action"
                href="/courses/web-development-foundations/review"
              >
                {foundationsReview &&
                !isWebFoundationsReviewDue(foundationsReview)
                  ? "View review schedule"
                  : "Review due concepts"}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
        ) : null}

        <section
          className="dashboard-account-tools"
          aria-labelledby="dashboard-account-tools-title"
        >
          <div>
            <p className="course-kicker">Private learner record</p>
            <h2 id="dashboard-account-tools-title">
              Keep the finish line attached to your account.
            </h2>
            <p>
              Choose your certificate name now. Your private course certificate
              becomes available after you pass all three saved recall checks at
              75% or higher.
            </p>
          </div>
          <div className="dashboard-account-actions">
            <Link href="/settings">
              Certificate settings <span aria-hidden="true">→</span>
            </Link>
            <Link
              className={firstCourse.courseCompleted ? "is-earned" : ""}
              href="/certificate"
            >
              {firstCourse.courseCompleted
                ? "View earned certificate"
                : "Certificate requirements"}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section
          className="dashboard-interview"
          aria-labelledby="dashboard-interview-title"
        >
          <div>
            <p className="course-kicker">Interview preparation</p>
            <h2 id="dashboard-interview-title">
              Explain JavaScript without the editor.
            </h2>
            <p>
              Five fundamentals questions, a concrete answer rubric, and one
              private readiness result you can return to.
            </p>
          </div>
          <div>
            <span>About 10 minutes</span>
            <Link
              className="dashboard-interview-action"
              href="/interview/javascript-fundamentals"
            >
              Open interview drill <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section
          className="dashboard-playground"
          aria-labelledby="dashboard-playground-title"
        >
          <div>
            <p className="course-kicker">Your JavaScript file</p>
            <h2 id="dashboard-playground-title">
              Take an idea outside the problem set.
            </h2>
            <p>Write, run, save, and return to one private JavaScript file.</p>
          </div>
          <Link className="dashboard-playground-action" href="/playground">
            Open playground <span aria-hidden="true">→</span>
          </Link>
        </section>

        <p className="dashboard-note">
          You’re signed in as <strong>{session.user.email}</strong>.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
