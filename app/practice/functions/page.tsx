import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { JavaScriptFunctionsScopeLab } from "@/components/javascript-functions-scope-lab";
import { auth } from "@/lib/auth";
import {
  getCompletedJavaScriptLabExerciseIds,
  getJavaScriptLabExerciseDrafts,
} from "@/db/javascript-lab-progress";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript functions and scope lab | Lovable Original",
  description:
    "Practice parameters, return values, local scope, and closures in four private browser exercises.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptFunctionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/account?mode=signin&next=/practice/functions");
    return null;
  }
  const [completedExerciseIds, initialDrafts] = await Promise.all([
    getCompletedJavaScriptLabExerciseIds(session.user.id, "functions"),
    getJavaScriptLabExerciseDrafts(session.user.id, "functions"),
  ]);

  return (
    <main className="function-lab-page">
      <SiteNav currentPage="practice" studentSession />
      <div className="function-lab-shell" id="main-content" tabIndex={-1}>
        <nav
          className="problem-breadcrumbs"
          aria-label="Functions lab navigation"
        >
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>Functions and scope</span>
        </nav>

        <header className="function-lab-hero">
          <div>
            <p className="eyebrow">Four private coding exercises</p>
            <h1>Make functions small, useful, and reusable.</h1>
            <p>
              Work through parameters, return values, local scope, and closures.
              Complete one function idea at a time, then prove it with three
              browser checks.
            </p>
          </div>
          <aside aria-label="Functions and scope lab format">
            <strong>4 function ideas</strong>
            <span>12 local checks</span>
            <p>Drafts and completed exercises save privately.</p>
          </aside>
        </header>

        <JavaScriptFunctionsScopeLab
          completedExerciseIds={completedExerciseIds}
          initialDrafts={initialDrafts}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
