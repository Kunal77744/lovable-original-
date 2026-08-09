import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { JavaScriptAlgorithmEfficiencyLab } from "@/components/javascript-algorithm-efficiency-lab";
import { auth } from "@/lib/auth";
import { getCompletedJavaScriptLabExerciseIds } from "@/db/javascript-lab-progress";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private algorithm efficiency lab | Lovable Original",
  description:
    "Compare JavaScript approaches and learn constant, linear, quadratic, and space-time complexity in four private exercises.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AlgorithmEfficiencyPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/account?mode=signin&next=/practice/efficiency");
    return null;
  }
  const completedExerciseIds = await getCompletedJavaScriptLabExerciseIds(session.user.id, "efficiency");

  return (
    <main className="efficiency-page">
      <SiteNav currentPage="practice" studentSession />
      <div className="efficiency-shell" id="main-content" tabIndex={-1}>
        <nav className="problem-breadcrumbs" aria-label="Efficiency lab navigation">
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>Algorithm efficiency</span>
        </nav>

        <header className="efficiency-hero">
          <div>
            <p className="eyebrow">Four private algorithm decisions</p>
            <h1>Choose the approach that still works at 10,000 inputs.</h1>
            <p>
              Compare two correct-looking JavaScript approaches, estimate how
              their work grows, and keep one practical complexity rule.
            </p>
          </div>
          <aside aria-label="Algorithm efficiency lab format">
            <strong>4 decisions</strong>
            <span>About 12 minutes</span>
            <p>Answers stay local. Completed exercises save privately.</p>
          </aside>
        </header>

        <JavaScriptAlgorithmEfficiencyLab completedExerciseIds={completedExerciseIds} />
      </div>
      <SiteFooter />
    </main>
  );
}
