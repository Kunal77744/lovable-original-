import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { JavaScriptRecursionLab } from "@/components/javascript-recursion-lab";
import {
  getCompletedJavaScriptLabExerciseIds,
  getJavaScriptLabExerciseDrafts,
} from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";
import { createBrowserRecoveryScope } from "@/lib/browser-recovery-scope";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript recursion fundamentals | Lovable Original",
  description:
    "Practice base cases, smaller recursive inputs, call-stack tracing, and termination in four private browser exercises.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptRecursionPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/account?mode=signin&next=/practice/recursion");
    return null;
  }
  const [completedExerciseIds, initialDrafts] = await Promise.all([
    getCompletedJavaScriptLabExerciseIds(session.user.id, "recursion"),
    getJavaScriptLabExerciseDrafts(session.user.id, "recursion"),
  ]);

  return (
    <main className="function-lab-page">
      <SiteNav currentPage="practice" studentSession />
      <div className="function-lab-shell" id="main-content" tabIndex={-1}>
        <nav
          className="problem-breadcrumbs"
          aria-label="Recursion lab navigation"
        >
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>Recursion fundamentals</span>
        </nav>

        <header className="function-lab-hero">
          <div>
            <p className="eyebrow">Four private coding exercises</p>
            <h1>Make every recursive call find its way back.</h1>
            <p>
              Build a base case, reduce the input, trace the call stack, and
              repair a recursive step that never reaches its stopping point.
            </p>
          </div>
          <aside aria-label="Recursion fundamentals lab format">
            <strong>4 recursion ideas</strong>
            <span>12 local checks</span>
            <p>Drafts and completed exercises save as private practice.</p>
          </aside>
        </header>

        <JavaScriptRecursionLab
          browserRecoveryScope={createBrowserRecoveryScope(session.user.id)}
          completedExerciseIds={completedExerciseIds}
          initialDrafts={initialDrafts}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
