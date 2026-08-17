import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { JavaScriptLinkedListLab } from "@/components/javascript-linked-list-lab";
import {
  getCompletedJavaScriptLabExerciseIds,
  getJavaScriptLabExerciseDrafts,
} from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";
import { createBrowserRecoveryScope } from "@/lib/browser-recovery-scope";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript linked-list fundamentals | Lovable Original",
  description:
    "Practice node links, traversal, reversal, and operation choice in four private browser exercises.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptLinkedListsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/account?mode=signin&next=/practice/linked-lists");
    return null;
  }
  const [completedExerciseIds, initialDrafts] = await Promise.all([
    getCompletedJavaScriptLabExerciseIds(session.user.id, "linked-lists"),
    getJavaScriptLabExerciseDrafts(session.user.id, "linked-lists"),
  ]);

  return (
    <main className="function-lab-page">
      <SiteNav currentPage="practice" studentSession />
      <div className="function-lab-shell" id="main-content" tabIndex={-1}>
        <nav
          className="problem-breadcrumbs"
          aria-label="Linked-list lab navigation"
        >
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>Linked lists</span>
        </nav>

        <header className="function-lab-hero">
          <div>
            <p className="eyebrow">Four private coding exercises</p>
            <h1>Follow the links without losing the list.</h1>
            <p>
              Connect nodes, traverse every value, reverse each next reference,
              and choose when linked access fits the operation.
            </p>
          </div>
          <aside aria-label="Linked-list lab format">
            <strong>4 linked-list ideas</strong>
            <span>12 local checks</span>
            <p>Drafts and completed exercises save as private practice.</p>
          </aside>
        </header>

        <JavaScriptLinkedListLab
          browserRecoveryScope={createBrowserRecoveryScope(session.user.id)}
          completedExerciseIds={completedExerciseIds}
          initialDrafts={initialDrafts}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
