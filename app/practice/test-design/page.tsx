import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { JavaScriptTestDesignLab } from "@/components/javascript-test-design-lab";
import { auth } from "@/lib/auth";
import { getCompletedJavaScriptLabExerciseIds } from "@/db/javascript-lab-progress";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript test-design lab | Lovable Original",
  description:
    "Find the input that exposes a faulty JavaScript solution and learn four reusable edge-case testing habits.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptTestDesignPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin&next=/practice/test-design");
    return null;
  }
  const completedExerciseIds = await getCompletedJavaScriptLabExerciseIds(session.user.id, "test-design");

  return (
    <main className="test-design-page">
      <SiteNav currentPage="practice" studentSession />
      <div className="test-design-shell" id="main-content" tabIndex={-1}>
        <nav className="problem-breadcrumbs" aria-label="Test-design navigation">
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>Test-design lab</span>
        </nav>

        <header className="test-design-hero">
          <div>
            <p className="eyebrow">Four private edge-case exercises</p>
            <h1>Break the solution before the judge does.</h1>
            <p>
              Read one almost-correct program, choose the input that proves it
              wrong, then keep the testing rule that found the defect.
            </p>
          </div>
          <aside aria-label="Test-design lab format">
            <strong>4 tests</strong>
            <span>About 10 minutes</span>
            <p>Answers stay local. Completed exercises save privately.</p>
          </aside>
        </header>

        <JavaScriptTestDesignLab completedExerciseIds={completedExerciseIds} />
      </div>
      <SiteFooter />
    </main>
  );
}
