import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { JavaScriptTracingLab } from "@/components/javascript-tracing-lab";
import { auth } from "@/lib/auth";
import { getCompletedJavaScriptLabExerciseIds } from "@/db/javascript-lab-progress";
import { SiteFooter, SiteNav } from "@/app/site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript code tracing lab | Lovable Original",
  description:
    "Predict JavaScript output, trace each line, and learn a reusable debugging habit in four private exercises.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptTracingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin&next=/practice/tracing");
    return null;
  }
  const completedExerciseIds = await getCompletedJavaScriptLabExerciseIds(session.user.id, "tracing");

  return (
    <main className="tracing-page">
      <SiteNav currentPage="practice" studentSession />
      <div className="tracing-shell" id="main-content" tabIndex={-1}>
        <nav className="problem-breadcrumbs" aria-label="Tracing navigation">
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>Code tracing lab</span>
        </nav>

        <header className="tracing-hero">
          <div>
            <p className="eyebrow">Four private code-reading exercises</p>
            <h1>Read the code before you run it.</h1>
            <p>
              Predict one output, follow the values line by line, then compare
              your reasoning with the exact trace. No editor and no guess-and-run
              loop.
            </p>
          </div>
          <aside aria-label="Tracing lab format">
            <strong>4 traces</strong>
            <span>About 8 minutes</span>
            <p>Answers stay local. Completed exercises save privately.</p>
          </aside>
        </header>

        <JavaScriptTracingLab completedExerciseIds={completedExerciseIds} />
      </div>
      <SiteFooter />
    </main>
  );
}
