import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav, SkipLink } from "@/app/site-chrome";
import { ProblemBookmarkCollection } from "@/components/problem-bookmark-collection";
import {
  getCodingCatalogProgress,
  getCodingProblemBookmarksForStudent,
} from "@/db/coding-practice";
import { getSignInHref } from "@/lib/account-destination";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private saved JavaScript problems | Lovable Original",
  description:
    "Review every JavaScript problem saved to your private account and reopen the exact exercise.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PracticeBookmarksPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(getSignInHref("/practice/bookmarks"));
  }

  const [bookmarks, progress] = await Promise.all([
    getCodingProblemBookmarksForStudent(session.user.id),
    getCodingCatalogProgress(session.user.id),
  ]);

  return (
    <>
      <SkipLink />
      <SiteNav currentPage="practice" studentSession />
      <main>
        <ProblemBookmarkCollection
          bookmarks={bookmarks}
          completedSlugs={progress.completedSlugs}
        />
      </main>
      <SiteFooter />
    </>
  );
}
