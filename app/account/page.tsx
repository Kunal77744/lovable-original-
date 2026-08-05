import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/account-form";
import { auth } from "@/lib/auth";
import {
  FIRST_COURSE,
  FIRST_LESSON,
  FIRST_LESSON_PASS_PERCENT,
  SECOND_LESSON,
} from "@/lib/first-course-content";
import { SiteFooter, SiteNav } from "../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create your student account | Lovable Original",
  description:
    "Create your student account to complete the two-lesson Web Development Foundations course.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main>
      <SiteNav currentPage="account" />
      <section className="account-shell" aria-labelledby="account-title">
        <div className="account-intro">
          <p className="eyebrow">{FIRST_COURSE.title}</p>
          <h1 id="account-title">{FIRST_LESSON.title}.</h1>
          <p>
            Create your student account to complete this two-lesson course:{" "}
            {FIRST_LESSON.estimatedMinutes} minutes of semantic HTML and{" "}
            {SECOND_LESSON.estimatedMinutes} minutes of CSS selectors and the
            box model, with saved results.
          </p>
          <p>
            Sign back in anytime and your saved course work, JavaScript code,
            and CSS practice will return.
          </p>
          <ul aria-label={`What ${FIRST_COURSE.title} includes`}>
            <li>Turn a blank document into an accessible article page</li>
            <li>
              Pass the four-question recall check at{" "}
              {FIRST_LESSON_PASS_PERCENT}%
            </li>
            <li>Complete the course and keep your best quiz score saved</li>
          </ul>
        </div>
        <Suspense fallback={<div className="account-card account-card-loading" />}>
          <AccountForm />
        </Suspense>
      </section>
      <SiteFooter />
    </main>
  );
}
