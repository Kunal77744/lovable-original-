import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav, SkipLink } from "@/app/site-chrome";
import { CodingActivity } from "@/components/coding-activity";
import { getCodingActivityDaysForStudent } from "@/db/coding-activity";
import { getCodingPracticeGoalForStudent } from "@/db/coding-practice-goal";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import { buildCodingActivity } from "@/lib/coding-activity";
import { buildWeeklyCodingPracticeGoal } from "@/lib/coding-practice-goal";

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

  const [activityDays, progress, savedGoal] = await Promise.all([
    getCodingActivityDaysForStudent(session.user.id),
    getCodingCatalogProgress(session.user.id),
    getCodingPracticeGoalForStudent(session.user.id),
  ]);
  const activity = buildCodingActivity({
    activityDays,
    completedSlugs: progress.completedSlugs,
  });
  const weeklyGoal = buildWeeklyCodingPracticeGoal({
    activityDays,
    targetActiveDays: savedGoal?.targetActiveDays ?? null,
  });

  return (
    <>
      <SkipLink />
      <SiteNav currentPage="practice" studentSession />
      <main id="main-content" className="coding-activity-shell">
        <CodingActivity activity={activity} weeklyGoal={weeklyGoal} />
      </main>
      <SiteFooter />
    </>
  );
}
