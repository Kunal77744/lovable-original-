import type { Metadata } from "next";
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
            <p>Your first learning path is ready to take shape.</p>
          </div>
          <SignOutButton />
        </div>

        <article className="dashboard-course">
          <div className="dashboard-course-copy">
            <span className="course-status">Topic selection in progress</span>
            <p className="course-kicker">First course</p>
            <h2>{firstCourse.title}</h2>
            <p>{firstCourse.description}</p>
          </div>
          <div className="course-next-step">
            <span>Next</span>
            <strong>Course outline</strong>
            <p>The first complete lesson and quiz loop is being built now.</p>
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
