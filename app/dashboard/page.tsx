import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOrCreateFirstCourseAssignment } from "@/db/course";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { getGuidedProjectForStudent } from "@/db/guided-project";
import { auth } from "@/lib/auth";
import { GUIDED_PROJECT_SLUG } from "@/lib/guided-project";
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

  const [firstCourse, practiceProgress, guidedProject] = await Promise.all([
    getOrCreateFirstCourseAssignment(session.user.id),
    getCodingCatalogProgress(session.user.id),
    getGuidedProjectForStudent(session.user.id, GUIDED_PROJECT_SLUG),
  ]);
  const guidedProjectCompleted =
    guidedProject?.submission?.status === "completed";
  const nextLesson = firstCourse.nextLesson;
  const firstName = session.user.name.trim().split(/\s+/)[0];
  const courseFormat =
    firstCourse.totalLessons === 1
      ? "One-lesson course"
      : `${firstCourse.totalLessons}-lesson course`;

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
                : "Your one-lesson Web Development Foundations course is ready."}
            </p>
          </div>
          <SignOutButton />
        </div>

        <article className="dashboard-course">
          <div className="dashboard-course-copy">
            <div className="course-status-row">
              <span className="course-status">
                {firstCourse.courseCompleted ? "Course completed" : "Course live"}
              </span>
              <span className="course-progress-value">
                {firstCourse.completedLessons}/{firstCourse.totalLessons} lessons
              </span>
            </div>
            <p className="course-kicker">{courseFormat}</p>
            <h2>{firstCourse.title}</h2>
            <p>{firstCourse.description}</p>
            <div
              className="course-progress-track"
              role="progressbar"
              aria-label="Course progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={firstCourse.progressPercent}
            >
              <span style={{ width: `${firstCourse.progressPercent}%` }} />
            </div>
            <Link className="dashboard-progress-action" href="/profile">
              View private progress <span aria-hidden="true">→</span>
            </Link>
            {firstCourse.courseCompleted && !guidedProjectCompleted ? (
              <div className="dashboard-project-ready">
                <span>Project ready</span>
                <p>
                  Apply the lesson in your private semantic HTML field guide.
                </p>
                <Link href={`/projects/${GUIDED_PROJECT_SLUG}`}>
                  Build the field guide <span aria-hidden="true">→</span>
                </Link>
              </div>
            ) : null}
          </div>
          <div className="course-next-step">
            <span>
              {nextLesson.completed
                ? `Quiz score · ${nextLesson.quizScore}%`
                : nextLesson.moduleTitle}
            </span>
            <strong>{nextLesson.title}</strong>
            <p>{nextLesson.description}</p>
            <Link
              className="course-lesson-action"
              href={`/learn/${firstCourse.slug}/${nextLesson.slug}${
                nextLesson.completed ? "#revision-pack" : ""
              }`}
            >
              {nextLesson.completed
                ? "Open revision pack"
                : firstCourse.completedLessons > 0
                  ? "Continue course"
                  : "Start lesson"}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>

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
              becomes available after you pass the saved quiz at 75% or higher.
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
          className="dashboard-practice"
          aria-labelledby="dashboard-practice-title"
        >
          <div>
            <p className="course-kicker">JavaScript practice arena</p>
            <h2 id="dashboard-practice-title">
              Turn the next 20 minutes into a solved problem.
            </h2>
            <p>
              Six beginner problems cover input, conditions, loops, arrays,
              strings, and FizzBuzz. Every accepted verdict and saved solution
              returns with your account.
            </p>
            <Link className="course-lesson-action" href="/practice">
              {practiceProgress.completedCount > 0
                ? "Continue practice"
                : "Start problem 01"}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="dashboard-practice-score">
            <span>Problems accepted</span>
            <strong>
              {practiceProgress.completedCount}/{practiceProgress.totalCount}
            </strong>
            <div
              className="practice-progress-track"
              role="progressbar"
              aria-label="JavaScript problems completed"
              aria-valuemin={0}
              aria-valuemax={practiceProgress.totalCount}
              aria-valuenow={practiceProgress.completedCount}
            >
              <span
                style={{
                  width: `${(practiceProgress.completedCount / practiceProgress.totalCount) * 100}%`,
                }}
              />
            </div>
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
            <p>
              Write, run, save, and return to one private JavaScript file.
            </p>
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
