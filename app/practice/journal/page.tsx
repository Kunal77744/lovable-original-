import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PracticeJournalIndex } from "@/components/practice-journal-index";
import {
  getCodingCatalogProgress,
  getCodingProblemJournalsForStudent,
} from "@/db/coding-practice";
import { getSignInHref } from "@/lib/account-destination";
import { auth } from "@/lib/auth";
import { buildPracticeJournalIndex } from "@/lib/practice-journal-index";
import { SiteFooter, SiteNav } from "../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your private JavaScript problem journals | Lovable Original",
  description:
    "Review the plans and reflections saved privately across your 12 judged JavaScript problems.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PracticeJournalPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(getSignInHref("/practice/journal"));
  }

  const [rows, progress] = await Promise.all([
    getCodingProblemJournalsForStudent(session.user.id),
    getCodingCatalogProgress(session.user.id),
  ]);
  const journal = buildPracticeJournalIndex(rows, progress.completedSlugs);

  return (
    <main className="practice-journal-page">
      <SiteNav currentPage="practice-progress" studentSession />
      <section
        className="practice-journal-shell"
        id="main-content"
        tabIndex={-1}
        aria-labelledby="practice-journal-title"
      >
        <PracticeJournalIndex journal={journal} />
      </section>
      <SiteFooter />
    </main>
  );
}
