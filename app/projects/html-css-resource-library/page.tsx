import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HtmlCssCapstoneWorkspace } from "@/components/html-css-capstone-workspace";
import { getCssPracticeCatalogProgress } from "@/db/css-practice";
import { getHtmlCssCapstoneForStudent } from "@/db/html-css-capstone";
import { auth } from "@/lib/auth";
import { getSignInHref } from "@/lib/account-destination";
import {
  HTML_CSS_CAPSTONE_SLUG,
  HTML_CSS_CAPSTONE_TITLE,
} from "@/lib/html-css-capstone";
import { SiteFooter, SiteNav } from "../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private HTML and CSS capstone | Lovable Original",
  description:
    "Build, preview, save, and review a private two-file learning resource library with six deterministic outcomes.",
  robots: { index: false, follow: false },
};

export default async function HtmlCssResourceLibraryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(getSignInHref("/projects/html-css-resource-library"));
  }

  const progress = await getCssPracticeCatalogProgress(session.user.id);
  if (progress.completedCount !== progress.totalCount) redirect("/practice/css");

  const project = await getHtmlCssCapstoneForStudent(session.user.id);

  return (
    <main className="html-css-capstone-page">
      <SiteNav currentPage="project" studentSession />
      <section
        className="html-css-capstone-shell js-capstone-shell"
        id="main-content"
        tabIndex={-1}
        aria-labelledby="html-css-capstone-title"
      >
        <Link className="project-back-link" href="/practice/css">
          <span aria-hidden="true">←</span>
          CSS practice
        </Link>
        <header className="html-css-capstone-hero js-capstone-hero">
          <div className="html-css-capstone-hero-copy js-capstone-hero-copy">
            <p className="project-private-cue">Private HTML and CSS capstone</p>
            <p className="eyebrow">Project 03 · Front-end foundations</p>
            <h1 id="html-css-capstone-title">{HTML_CSS_CAPSTONE_TITLE}</h1>
            <p>
              Turn semantic structure, selectors, grid, spacing, and the box
              model into one finished resource library you can return to.
            </p>
          </div>
          <aside className="html-css-capstone-brief js-capstone-brief" aria-label="Project brief">
            <span>Brief</span>
            <strong>Build three resource cards that stay easy to change.</strong>
            <p>
              Give the page meaningful landmarks, connect three repeated card
              sections to scoped CSS, and make every link a clear target.
            </p>
            <dl>
              <div><dt>Files</dt><dd>HTML + CSS</dd></div>
              <div><dt>Review</dt><dd>6 outcomes</dd></div>
              <div><dt>Return</dt><dd>Saved</dd></div>
            </dl>
          </aside>
        </header>
        <HtmlCssCapstoneWorkspace
          projectSlug={HTML_CSS_CAPSTONE_SLUG}
          initialProject={project}
        />
      </section>
      <SiteFooter />
    </main>
  );
}
