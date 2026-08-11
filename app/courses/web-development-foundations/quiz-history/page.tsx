import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav, SkipLink } from "@/app/site-chrome";
import { CourseQuizHistory } from "@/components/course-quiz-history";
import { getFirstCourseQuizHistoryForStudent } from "@/db/course";
import { getSignInHref } from "@/lib/account-destination";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const QUIZ_HISTORY_PATH =
  "/courses/web-development-foundations/quiz-history";

export const metadata: Metadata = {
  title: "Private Web Foundations quiz history | Lovable Original",
  description:
    "Review your account-scoped Web Foundations quiz scores and reopen the exact lesson for another attempt.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CourseQuizHistoryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(getSignInHref(QUIZ_HISTORY_PATH));
  }

  const attempts = await getFirstCourseQuizHistoryForStudent(session.user.id);

  return (
    <>
      <SkipLink />
      <SiteNav currentPage="course" studentSession />
      <main id="main-content" className="course-quiz-history-shell" tabIndex={-1}>
        <CourseQuizHistory attempts={attempts} />
      </main>
      <SiteFooter />
    </>
  );
}
