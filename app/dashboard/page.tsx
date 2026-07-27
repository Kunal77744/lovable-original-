import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOrCreateFirstCourseAssignment } from "@/db/course";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { auth } from "@/lib/auth";
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

  const [firstCourse, practiceProgress] = await Promise.all([
    getOrCreateFirstCourseAssignment(session.user.id),
    getCodingCatalogProgress(session.user.id),
  ]);
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

        <p className="dashboard-note">
          You’re signed in as <strong>{session.user.email}</strong>.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
