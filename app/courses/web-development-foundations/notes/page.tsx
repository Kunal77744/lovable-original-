import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CourseNotes } from "@/components/course-notes";
import { getFirstCourseNotesForStudent } from "@/db/course";
import { getSignInHref } from "@/lib/account-destination";
import { auth } from "@/lib/auth";
import { SiteFooter, SiteNav, SkipLink } from "../../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your private Web Foundations notes | Lovable Original",
  description:
    "Review the private notes saved across your Web Development Foundations lessons and reopen the exact lesson to revise them.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CourseNotesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(getSignInHref("/courses/web-development-foundations/notes"));
  }

  const course = await getFirstCourseNotesForStudent(session.user.id);

  if (!course) {
    redirect("/dashboard");
  }

  return (
    <>
      <SkipLink />
      <SiteNav currentPage="course" studentSession />
      <main id="main-content" tabIndex={-1}>
        <CourseNotes course={course} />
      </main>
      <SiteFooter />
    </>
  );
}
