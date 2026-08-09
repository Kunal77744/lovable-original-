import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JavaScriptCapstoneWorkspace } from "@/components/javascript-capstone-workspace";
import {
  getJavaScriptCapstoneForStudent,
  getJavaScriptCapstoneSummary,
} from "@/db/javascript-capstone";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";
import {
  getJavaScriptCapstoneAccess,
  JAVASCRIPT_CAPSTONE_SLUG,
  JAVASCRIPT_CAPSTONE_TITLE,
} from "@/lib/javascript-capstone";
import { SiteFooter, SiteNav } from "../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript capstone | Lovable Original",
  description:
    "Build, save, review, and revise a private JavaScript expense report project with six deterministic outcomes.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptExpenseReportPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin");
  }

  const [summary, labProgress] = await Promise.all([
    getJavaScriptCapstoneSummary(session.user.id),
    getJavaScriptLabCatalogProgress(session.user.id),
  ]);
  const access = getJavaScriptCapstoneAccess(summary, labProgress);

  if (!access.available) {
    redirect(access.continuationHref);
  }

  const project = await getJavaScriptCapstoneForStudent(session.user.id);

  return (
    <main className="js-capstone-page">
      <SiteNav currentPage="project" studentSession />
      <section
        className="js-capstone-shell"
        id="main-content"
        tabIndex={-1}
        aria-labelledby="js-capstone-title"
      >
        <Link className="project-back-link" href="/practice">
          <span aria-hidden="true">←</span>
          JavaScript practice
        </Link>

        <header className="js-capstone-hero">
          <div className="js-capstone-hero-copy">
            <p className="project-private-cue">Private JavaScript capstone</p>
            <p className="eyebrow">Project 02 · Data transformation</p>
            <h1 id="js-capstone-title">{JAVASCRIPT_CAPSTONE_TITLE}</h1>
            <p>
              Turn raw expense rows into a precise, readable report. Combine
              parsing, arrays, objects, sorting, totals, and output formatting
              in one saved result.
            </p>
          </div>
          <aside className="js-capstone-brief" aria-label="Project brief">
            <span>Brief</span>
            <strong>Build a report that another person can trust.</strong>
            <p>
              Read category, description, and amount rows. Return a total, the
              largest expense, and alphabetized category totals.
            </p>
            <dl>
              <div>
                <dt>File</dt>
                <dd>1 JavaScript</dd>
              </div>
              <div>
                <dt>Review</dt>
                <dd>6 outcomes</dd>
              </div>
              <div>
                <dt>Result</dt>
                <dd>Saved</dd>
              </div>
            </dl>
          </aside>
        </header>

        <JavaScriptCapstoneWorkspace
          projectSlug={JAVASCRIPT_CAPSTONE_SLUG}
          initialProject={project}
        />
      </section>
      <SiteFooter />
    </main>
  );
}
