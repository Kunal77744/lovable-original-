import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { JavaScriptTreesGraphsLab } from "@/components/javascript-trees-graphs-lab";
import { getCompletedJavaScriptLabExerciseIds } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript trees and graphs practice | Lovable Original",
  description:
    "Practice depth-first traversal, breadth-first traversal, graph reachability, and traversal choice in four private browser exercises.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptTreesGraphsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/account?mode=signin&next=/practice/trees-graphs");
    return null;
  }
  const completedExerciseIds = await getCompletedJavaScriptLabExerciseIds(
    session.user.id,
    "trees-graphs",
  );

  return (
    <main className="function-lab-page">
      <SiteNav currentPage="practice" studentSession />
      <div className="function-lab-shell" id="main-content" tabIndex={-1}>
        <nav
          className="problem-breadcrumbs"
          aria-label="Trees and graphs lab navigation"
        >
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>Trees and graphs</span>
        </nav>

        <header className="function-lab-hero">
          <div>
            <p className="eyebrow">Four private coding exercises</p>
            <h1>Choose which node comes next.</h1>
            <p>
              Traverse trees by branch and by level, search a graph without
              looping forever, and match each goal to the right visit order.
            </p>
          </div>
          <aside aria-label="Trees and graphs lab format">
            <strong>4 traversal decisions</strong>
            <span>12 local checks</span>
            <p>
              Code stays local. Completed exercises save as private practice.
            </p>
          </aside>
        </header>

        <JavaScriptTreesGraphsLab
          completedExerciseIds={completedExerciseIds}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
