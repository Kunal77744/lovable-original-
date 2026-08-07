import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LearnerProfile } from "@/components/learner-profile";
import {
  getCodingCatalogProgress,
  getRecentCodingAttempts,
} from "@/db/coding-practice";
import { getCssPracticeCatalogProgress } from "@/db/css-practice";
import { getOrCreateFirstCourseAssignment } from "@/db/course";
import { getGuidedProjectForStudent } from "@/db/guided-project";
import { getHtmlCssCapstoneSummary } from "@/db/html-css-capstone";
import { auth } from "@/lib/auth";
import { GUIDED_PROJECT_SLUG } from "@/lib/guided-project";
import { buildLearnerProfile } from "@/lib/learner-profile";
import { SiteFooter, SiteNav } from "../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your private course and practice progress | Lovable Original",
  description:
    "Review your saved course progress, accepted JavaScript problems, completed CSS challenges, and recent attempts in one private account view.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin");
  }

  const [course, practice, cssPractice, attempts, project, htmlCssCapstone] = await Promise.all([
    getOrCreateFirstCourseAssignment(session.user.id),
    getCodingCatalogProgress(session.user.id),
    getCssPracticeCatalogProgress(session.user.id),
    getRecentCodingAttempts(session.user.id),
    getGuidedProjectForStudent(session.user.id, GUIDED_PROJECT_SLUG),
    getHtmlCssCapstoneSummary(session.user.id),
  ]);
  const profile = buildLearnerProfile({
    course,
    practice,
    cssPractice,
    attempts,
    projectCompleted: project?.submission?.status === "completed",
    htmlCssCapstone,
  });

  return (
    <main>
      <SiteNav currentPage="profile" studentSession />
      <section
        className="profile-shell"
        id="main-content"
        tabIndex={-1}
        aria-labelledby="profile-title"
      >
        <LearnerProfile profile={profile} />
      </section>
      <SiteFooter />
    </main>
  );
}
