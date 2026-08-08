import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProjectPortfolio } from "@/components/project-portfolio";
import { getCssPracticeCatalogProgress } from "@/db/css-practice";
import { getFirstCourseProgressSummary } from "@/db/course";
import { getGuidedProjectSummary } from "@/db/guided-project";
import { getHtmlCssCapstoneSummary } from "@/db/html-css-capstone";
import { getJavaScriptCapstoneSummary } from "@/db/javascript-capstone";
import { auth } from "@/lib/auth";
import { GUIDED_PROJECT_SLUG } from "@/lib/guided-project";
import { buildProjectPortfolio } from "@/lib/project-portfolio";
import { SiteFooter, SiteNav } from "../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your private coding projects | Lovable Original",
  description:
    "Resume saved HTML, CSS, and JavaScript projects and revisit completed private project debriefs.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProjectsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin");
  }

  const [course, cssPractice, semanticHtml, javascript, htmlCss] =
    await Promise.all([
      getFirstCourseProgressSummary(session.user.id),
      getCssPracticeCatalogProgress(session.user.id),
      getGuidedProjectSummary(session.user.id, GUIDED_PROJECT_SLUG),
      getJavaScriptCapstoneSummary(session.user.id),
      getHtmlCssCapstoneSummary(session.user.id),
    ]);
  const courseNextHref = course.nextLesson
    ? `/learn/${course.slug}/${course.nextLesson.slug}`
    : "/dashboard";
  const cssNextHref = cssPractice.nextChallengeSlug
    ? `/practice/css/${cssPractice.nextChallengeSlug}`
    : "/practice/css";
  const portfolio = buildProjectPortfolio({
    courseCompleted: course.courseCompleted,
    courseNextHref,
    courseNextTitle: course.nextLesson?.title ?? "Web Development Foundations",
    cssCompletedCount: cssPractice.completedCount,
    cssTotalCount: cssPractice.totalCount,
    cssNextHref,
    semanticHtml: semanticHtml ?? {
      state: "not-started",
      passedChecks: 0,
    },
    javascript,
    htmlCss,
  });

  return (
    <main className="project-portfolio-page">
      <SiteNav currentPage="project" studentSession />
      <ProjectPortfolio portfolio={portfolio} />
      <SiteFooter />
    </main>
  );
}
