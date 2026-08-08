import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GuidedProjectWorkspace } from "@/components/guided-project-workspace";
import {
  getGuidedProjectFeedbackForStudent,
  getGuidedProjectForStudent,
} from "@/db/guided-project";
import {
  GUIDED_PROJECT_SLUG,
  GUIDED_PROJECT_TITLE,
} from "@/lib/guided-project";
import { auth } from "@/lib/auth";
import { getSignInHref } from "@/lib/account-destination";
import { SiteFooter, SiteNav } from "../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private semantic HTML project | Lovable Original",
  description:
    "Build, save, review, and revise a private semantic HTML article project tied to Web Development Foundations.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SemanticHtmlProjectPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(getSignInHref("/projects/semantic-html-article"));
  }

  const [project, projectFeedback] = await Promise.all([
    getGuidedProjectForStudent(session.user.id, GUIDED_PROJECT_SLUG),
    getGuidedProjectFeedbackForStudent(
      session.user.id,
      GUIDED_PROJECT_SLUG,
    ),
  ]);

  if (!project) {
    redirect("/dashboard");
  }

  return (
    <main className="project-page">
      <SiteNav currentPage="project" />
      <section
        className="project-shell"
        id="main-content"
        tabIndex={-1}
        aria-labelledby="project-title"
      >
        <Link
          className="project-back-link"
          href="/learn/web-development-foundations/semantic-html#revision-pack"
        >
          <span aria-hidden="true">←</span>
          Web Development Foundations
        </Link>

        <header className="project-hero">
          <div className="project-hero-copy">
            <p className="project-private-cue">Private project</p>
            <p className="quiz-kicker">Project 01 · Semantic HTML</p>
            <h1 id="project-title">{GUIDED_PROJECT_TITLE}</h1>
            <p>
              Turn the lesson’s small article into a complete field guide.
              Saved drafts and review results belong only to your signed-in
              account.
            </p>
          </div>
          <aside className="project-brief" aria-label="Project brief">
            <span>Brief</span>
            <strong>Explain how a well-structured web page works.</strong>
            <p>
              Use landmarks, one article, two explained sections, and a useful
              supporting note.
            </p>
            <dl>
              <div>
                <dt>File</dt>
                <dd>1 HTML</dd>
              </div>
              <div>
                <dt>Review</dt>
                <dd>6 checks</dd>
              </div>
              <div>
                <dt>Result</dt>
                <dd>Saved</dd>
              </div>
            </dl>
          </aside>
        </header>

        <GuidedProjectWorkspace
          projectSlug={GUIDED_PROJECT_SLUG}
          initialProject={project}
          initialFeedback={projectFeedback?.feedback ?? null}
        />
      </section>
      <SiteFooter />
    </main>
  );
}
