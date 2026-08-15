import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { JavaScriptReadinessCheck } from "@/components/javascript-readiness-check";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import {
  getJavaScriptReadinessResultForStudent,
  type SavedJavaScriptReadinessResult,
} from "@/db/javascript-readiness";
import { auth } from "@/lib/auth";
import type { JavaScriptLabCatalogProgress } from "@/lib/javascript-lab-progress";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript readiness check | Lovable Original",
  description:
    "Check six JavaScript fundamentals privately and continue into the exact guided lab that fits your first weak concept.",
  robots: {
    index: false,
    follow: false,
  },
};

function ReadinessContent({
  initialResult,
  recommendationLabs,
  studentScope,
}: {
  initialResult: SavedJavaScriptReadinessResult | null;
  recommendationLabs: JavaScriptLabCatalogProgress["labs"];
  studentScope: string;
}) {
  return (
    <main>
      <SiteNav currentPage="practice" studentSession />
      <div className="readiness-shell" id="main-content" tabIndex={-1}>
        <nav className="problem-breadcrumbs" aria-label="Readiness navigation">
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>Readiness check</span>
        </nav>

        <header className="readiness-hero">
          <div>
            <p className="eyebrow">Private JavaScript readiness · 6 checks</p>
            <h1>Find the right lab before you practice.</h1>
            <p>
              Check input handling, tracing, debugging, edge cases, data
              structures, and scope. Your first weak concept chooses one exact
              guided lab.
            </p>
          </div>
          <aside aria-label="Readiness check boundaries">
            <strong>About 5 minutes</strong>
            <span>No code editor needed</span>
            <p>Only the final score and lab recommendation are saved privately.</p>
          </aside>
        </header>

        <JavaScriptReadinessCheck
          initialResult={initialResult}
          recommendationLabs={recommendationLabs}
          studentScope={studentScope}
        />
      </div>
      <SiteFooter />
    </main>
  );
}

export default async function JavaScriptReadinessPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/account?mode=signin&next=/practice/readiness");
    return null;
  }

  const [initialResult, labProgress] = await Promise.all([
    getJavaScriptReadinessResultForStudent(session.user.id),
    getJavaScriptLabCatalogProgress(session.user.id),
  ]);

  return (
    <ReadinessContent
      initialResult={initialResult}
      recommendationLabs={labProgress.labs}
      studentScope={session.user.id}
    />
  );
}
