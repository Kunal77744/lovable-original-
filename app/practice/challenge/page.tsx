import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TimedCodingChallengeView } from "@/components/timed-coding-challenge-view";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private timed JavaScript practice | Lovable Original",
  description:
    "Work through three existing JavaScript problems with a private browser-only 30-minute timer.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TimedCodingChallengePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin&next=/practice/challenge");
  }

  const progress = await getCodingCatalogProgress(session.user.id);

  return <TimedCodingChallengeView completedSlugs={progress.completedSlugs} />;
}
