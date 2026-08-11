import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { JavaScriptSearchSortLab } from "@/components/javascript-search-sort-lab";
import {
  getCompletedJavaScriptLabExerciseIds,
  getJavaScriptLabExerciseDrafts,
} from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript searching and sorting | Lovable Original",
  description:
    "Practice linear search, binary search, numeric comparators, and method selection in four private browser exercises.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptSearchSortPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/account?mode=signin&next=/practice/search-sort");
    return null;
  }
  const [completedExerciseIds, initialDrafts] = await Promise.all([
    getCompletedJavaScriptLabExerciseIds(session.user.id, "search-sort"),
    getJavaScriptLabExerciseDrafts(session.user.id, "search-sort"),
  ]);

  return (
    <main className="function-lab-page">
      <SiteNav currentPage="practice" studentSession />
      <div className="function-lab-shell" id="main-content" tabIndex={-1}>
        <nav
          className="problem-breadcrumbs"
          aria-label="Searching and sorting lab navigation"
        >
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>Searching and sorting</span>
        </nav>

        <header className="function-lab-hero">
          <div>
            <p className="eyebrow">Four private coding exercises</p>
            <h1>Find the right value with the right method.</h1>
            <p>
              Scan an unsorted list, halve a sorted search space, repair numeric
              sorting, and choose a method from the data you actually have.
            </p>
          </div>
          <aside aria-label="Searching and sorting lab format">
            <strong>4 search and sort ideas</strong>
            <span>12 local checks</span>
            <p>Drafts and completed exercises save as private practice.</p>
          </aside>
        </header>

        <JavaScriptSearchSortLab
          completedExerciseIds={completedExerciseIds}
          initialDrafts={initialDrafts}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
