import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LearningHistory } from "@/components/learning-history";
import { getLearningHistoryForStudent } from "@/db/learning-history";
import { getSignInHref } from "@/lib/account-destination";
import { auth } from "@/lib/auth";
import { SiteFooter, SiteNav, SkipLink } from "../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your private learning history | Lovable Original",
  description:
    "Review recent course, CSS, JavaScript, project, and revision results saved privately to your Lovable Original account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LearningHistoryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(getSignInHref("/learning-history"));
  }

  const items = await getLearningHistoryForStudent(session.user.id);

  return (
    <>
      <SkipLink />
      <SiteNav currentPage="profile" studentSession />
      <main
        className="learning-history-shell"
        id="main-content"
        tabIndex={-1}
        aria-labelledby="learning-history-title"
      >
        <LearningHistory items={items} />
      </main>
      <SiteFooter />
    </>
  );
}
