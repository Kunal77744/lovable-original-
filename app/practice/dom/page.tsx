import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { JavaScriptDomLab } from "@/components/javascript-dom-lab";
import { auth } from "@/lib/auth";
import { createBrowserRecoveryScope } from "@/lib/browser-recovery-scope";
import {
  getCompletedJavaScriptLabExerciseIds,
  getJavaScriptLabExerciseDrafts,
} from "@/db/javascript-lab-progress";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript DOM fundamentals lab | Lovable Original",
  description:
    "Practice selecting elements, changing text, toggling classes, and responding to clicks in four private browser exercises.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptDomPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin&next=/practice/dom");
    return null;
  }
  const [completedExerciseIds, initialDrafts] = await Promise.all([
    getCompletedJavaScriptLabExerciseIds(session.user.id, "dom"),
    getJavaScriptLabExerciseDrafts(session.user.id, "dom"),
  ]);

  return (
    <main className="dom-lab-page">
      <SiteNav currentPage="practice" studentSession />
      <div className="dom-lab-shell" id="main-content" tabIndex={-1}>
        <nav className="problem-breadcrumbs" aria-label="DOM lab navigation">
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>DOM fundamentals</span>
        </nav>

        <header className="dom-lab-hero">
          <div>
            <p className="eyebrow">Four private browser exercises</p>
            <h1>Make JavaScript change the page.</h1>
            <p>
              Move from finding one element to responding to a click. Finish one
              small DOM function at a time, then prove it with three local
              checks.
            </p>
          </div>
          <aside aria-label="DOM lab format">
            <strong>4 DOM moves</strong>
            <span>12 local checks</span>
            <p>Drafts and completed exercises save privately.</p>
          </aside>
        </header>

        <JavaScriptDomLab
          browserRecoveryScope={createBrowserRecoveryScope(session.user.id)}
          completedExerciseIds={completedExerciseIds}
          initialDrafts={initialDrafts}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
