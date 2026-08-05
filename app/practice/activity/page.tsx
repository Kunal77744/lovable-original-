import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav, SkipLink } from "@/app/site-chrome";
import { CodingActivity } from "@/components/coding-activity";
import { getCodingActivityDaysForStudent } from "@/db/coding-activity";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import { buildCodingActivity } from "@/lib/coding-activity";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript activity | Lovable Original",
  description:
    "Review your private 28-day JavaScript practice activity and resume the exact next problem in your saved path.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CodingActivityPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin");
  }

  const [activityDays, progress] = await Promise.all([
    getCodingActivityDaysForStudent(session.user.id),
    getCodingCatalogProgress(session.user.id),
  ]);
  const activity = buildCodingActivity({
    activityDays,
    completedSlugs: progress.completedSlugs,
  });

  return (
    <>
      <SkipLink />
      <SiteNav currentPage="practice" studentSession />
      <main id="main-content" className="coding-activity-shell">
        <CodingActivity activity={activity} />
      </main>
      <SiteFooter />
    </>
  );
}
