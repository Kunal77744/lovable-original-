import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav, SkipLink } from "@/app/site-chrome";
import { CodingActivity } from "@/components/coding-activity";
import { getCodingActivityDaysForStudent } from "@/db/coding-activity";
import { getCodingPracticeGoalForStudent } from "@/db/coding-practice-goal";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { getJavaScriptLabActivityForStudent } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";
import { getSignInHref } from "@/lib/account-destination";
import { buildCodingActivity } from "@/lib/coding-activity";
import { buildWeeklyCodingPracticeGoal } from "@/lib/coding-practice-goal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript activity | Lovable Original",
  description:
    "Review private judged activity and guided JavaScript completions, then resume the exact next step in your saved path.",
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
    redirect(getSignInHref("/practice/activity"));
  }

  const [activityDays, progress, savedGoal, labActivity] = await Promise.all([
    getCodingActivityDaysForStudent(session.user.id),
    getCodingCatalogProgress(session.user.id),
    getCodingPracticeGoalForStudent(session.user.id),
    getJavaScriptLabActivityForStudent(session.user.id),
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
        <CodingActivity
          activity={activity}
          labActivity={labActivity}
          weeklyGoal={weeklyGoal}
        />
      </main>
      <SiteFooter />
    </>
  );
}
