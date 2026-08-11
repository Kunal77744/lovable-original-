import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProjectReviewHistory } from "@/components/project-review-history";
import { getProjectReviewHistory } from "@/db/project-review-history";
import { auth } from "@/lib/auth";
import { SiteFooter, SiteNav } from "../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private project review history | Lovable Original",
  description:
    "Compare saved review results across your private HTML, CSS, and JavaScript projects.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProjectReviewHistoryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin&next=%2Fprojects%2Fhistory");
  }

  const attempts = await getProjectReviewHistory(session.user.id);

  return (
    <main className="project-review-history-page">
      <SiteNav currentPage="project" studentSession />
      <ProjectReviewHistory attempts={attempts} />
      <SiteFooter />
    </main>
  );
}
