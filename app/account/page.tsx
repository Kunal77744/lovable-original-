import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/account-form";
import { auth } from "@/lib/auth";
import { getSafeAccountDestination } from "@/lib/account-destination";
import {
  FIRST_COURSE,
  FIRST_COURSE_LESSONS,
  FIRST_LESSON,
  FIRST_LESSON_PASS_PERCENT,
} from "@/lib/first-course-content";
import { SiteFooter, SiteNav } from "../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create your student account | Lovable Original",
  description:
    `Create your student account to complete the ${FIRST_COURSE_LESSONS.length}-lesson Web Development Foundations course.`,
  robots: {
    index: false,
    follow: false,
  },
};

type AccountPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function AccountPage(
  { searchParams }: AccountPageProps = { searchParams: Promise.resolve({}) },
) {
  const requestedDestination = (await searchParams).next;
  const destination = getSafeAccountDestination(
    typeof requestedDestination === "string" ? requestedDestination : null,
  );
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect(destination);
  }

  return (
    <main>
      <SiteNav currentPage="account" />
      <section className="account-shell" aria-labelledby="account-title">
        <div className="account-intro">
          <p className="eyebrow">{FIRST_COURSE.title}</p>
          <h1 id="account-title">{FIRST_LESSON.title}.</h1>
          <p>
            Create your student account to complete this {FIRST_COURSE_LESSONS.length}-lesson course in{" "}
            {FIRST_COURSE_LESSONS.reduce(
              (total, lesson) => total + lesson.estimatedMinutes,
              0,
            )} minutes, from semantic HTML and CSS through responsive layouts
            and accessible forms, with saved results.
          </p>
          <p>
            Sign back in anytime and your saved course work, JavaScript code,
            and CSS practice will return.
          </p>
          <ul aria-label={`What ${FIRST_COURSE.title} includes`}>
            <li>Turn a blank document into an accessible article page</li>
            <li>
              Pass the four-question recall check at {FIRST_LESSON_PASS_PERCENT}
              %
            </li>
            <li>
              Build a responsive resource grid that adapts to available space
            </li>
            <li>Build a labelled form with connected instructions and choices</li>
            <li>Complete the course and keep your best quiz scores saved</li>
          </ul>
        </div>
        <Suspense
          fallback={<div className="account-card account-card-loading" />}
        >
          <AccountForm />
        </Suspense>
      </section>
      <SiteFooter />
    </main>
  );
}
