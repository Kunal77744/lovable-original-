import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOrCreateFirstCourseAssignment } from "@/db/course";
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

  const firstCourse = await getOrCreateFirstCourseAssignment(session.user.id);
  const firstName = session.user.name.trim().split(/\s+/)[0];

  return (
    <main>
      <SiteNav currentPage="dashboard" />
      <section className="dashboard-shell" aria-labelledby="dashboard-title">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">Student dashboard</p>
            <h1 id="dashboard-title">Welcome, {firstName}.</h1>
            <p>
              {firstCourse.lesson.completed
                ? "You finished your first lesson. Keep the foundation close."
                : "Your first job-ready learning path is ready."}
            </p>
          </div>
          <SignOutButton />
        </div>

        <article className="dashboard-course">
          <div className="dashboard-course-copy">
            <div className="course-status-row">
              <span className="course-status">
                {firstCourse.lesson.completed ? "Lesson completed" : "Course live"}
              </span>
              <span className="course-progress-value">
                {firstCourse.completedLessons}/{firstCourse.totalLessons} lessons
              </span>
            </div>
            <p className="course-kicker">First course</p>
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
              {firstCourse.lesson.completed
                ? `Quiz score · ${firstCourse.lesson.quizScore}%`
                : firstCourse.lesson.moduleTitle}
            </span>
            <strong>{firstCourse.lesson.title}</strong>
            <p>{firstCourse.lesson.description}</p>
            <Link
              className="course-lesson-action"
              href={`/learn/${firstCourse.slug}/${firstCourse.lesson.slug}`}
            >
              {firstCourse.lesson.completed ? "Review lesson" : "Start lesson"}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>

        <p className="dashboard-note">
          You’re signed in as <strong>{session.user.email}</strong>.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
