import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { CssAttemptHistory } from "@/components/css-attempt-history";
import { getCssPracticeHistoryForStudent } from "@/db/css-practice";
import { auth } from "@/lib/auth";
import { getSignInHref } from "@/lib/account-destination";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private CSS attempt history | Lovable Original",
  description:
    "Review the newest 50 private CSS challenge results and reopen the exact selector or box-model skill that needs another pass.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CssAttemptHistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(getSignInHref("/practice/css/history"));
  }

  const attempts = await getCssPracticeHistoryForStudent(session.user.id);

  return (
    <main>
      <SiteNav currentPage="practice" studentSession />
      <section
        className="submission-history-shell"
        id="main-content"
        tabIndex={-1}
        aria-labelledby="css-attempt-history-title"
      >
        <CssAttemptHistory attempts={attempts} />
      </section>
      <SiteFooter />
    </main>
  );
}
