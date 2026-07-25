import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/account-form";
import { auth } from "@/lib/auth";
import { SiteFooter, SiteNav } from "../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create your student account | Lovable Original",
  description:
    "Create your Lovable Original student account or sign in to reach your first learning path.",
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
          <p className="eyebrow">Your learning space</p>
          <h1 id="account-title">Start with one focused course.</h1>
          <p>
            Create your student account to keep your place as lessons, quizzes,
            and progress arrive.
          </p>
          <ul aria-label="What your account includes">
            <li>One clear first-course entry point</li>
            <li>A session that stays with you</li>
            <li>Progress-ready from the first lesson</li>
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
