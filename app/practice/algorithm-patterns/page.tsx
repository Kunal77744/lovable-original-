import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { JavaScriptAlgorithmPatternsLab } from "@/components/javascript-algorithm-patterns-lab";
import { getCompletedJavaScriptLabExerciseIds } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript algorithm patterns | Lovable Original",
  description:
    "Practice frequency maps, two pointers, sliding windows, and prefix sums in four private browser exercises.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptAlgorithmPatternsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/account?mode=signin&next=/practice/algorithm-patterns");
    return null;
  }
  const completedExerciseIds = await getCompletedJavaScriptLabExerciseIds(
    session.user.id,
    "algorithm-patterns",
  );

  return (
    <main className="function-lab-page">
      <SiteNav currentPage="practice" studentSession />
      <div className="function-lab-shell" id="main-content" tabIndex={-1}>
        <nav
          className="problem-breadcrumbs"
          aria-label="Algorithm patterns lab navigation"
        >
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>Algorithm patterns</span>
        </nav>

        <header className="function-lab-hero">
          <div>
            <p className="eyebrow">Four private coding exercises</p>
            <h1>Recognize the pattern before writing the loop.</h1>
            <p>
              Count repeated values, narrow a sorted search, reuse a fixed
              window, and answer ranges from prepared totals.
            </p>
            <p>
              You will implement each pattern here. The separate efficiency
              lab asks you to compare how approaches scale.
            </p>
          </div>
          <aside aria-label="Algorithm patterns lab format">
            <strong>4 reusable patterns</strong>
            <span>12 local checks</span>
            <p>
              Code stays local. Completed exercises save as private practice.
            </p>
          </aside>
        </header>

        <JavaScriptAlgorithmPatternsLab
          completedExerciseIds={completedExerciseIds}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
