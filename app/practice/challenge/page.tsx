import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TimedCodingChallengeView } from "@/components/timed-coding-challenge-view";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { getRecentTimedCodingChallengeResultsForStudent } from "@/db/timed-coding-challenge";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private timed JavaScript practice | Lovable Original",
  description:
    "Work through four timed JavaScript sets with private 30-minute timers, saved Accepted progress, and recent account-backed results.",
  robots: {
    index: false,
    follow: false,
  },
};

type TimedCodingChallengePageProps = {
  searchParams?: Promise<{ set?: string | string[] }>;
};

export default async function TimedCodingChallengePage({
  searchParams,
}: TimedCodingChallengePageProps) {
  const setParam = (await searchParams)?.set;
  const selectedSetId = typeof setParam === "string" ? setParam : null;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    const destination = selectedSetId
      ? `/practice/challenge?set=${encodeURIComponent(selectedSetId)}`
      : "/practice/challenge";
    redirect(`/account?mode=signin&next=${encodeURIComponent(destination)}`);
  }

  const [progress, recentResults] = await Promise.all([
    getCodingCatalogProgress(session.user.id),
    getRecentTimedCodingChallengeResultsForStudent(session.user.id),
  ]);

  return (
    <TimedCodingChallengeView
      completedSlugs={progress.completedSlugs}
      recentResults={recentResults}
      selectedSetId={selectedSetId}
    />
  );
}
