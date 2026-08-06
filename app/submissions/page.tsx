import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SubmissionHistory } from "@/components/submission-history";
import { getCodingSubmissionHistoryForStudent } from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import { SiteFooter, SiteNav } from "../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript submission history | Lovable Original",
  description:
    "Review the verdict, checks, time, and read-only source snapshot for your private JavaScript submissions.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SubmissionsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin");
  }

  const submissions = await getCodingSubmissionHistoryForStudent(
    session.user.id,
  );

  return (
    <main>
      <SiteNav currentPage="profile" studentSession />
      <section
        className="submission-history-shell"
        id="main-content"
        tabIndex={-1}
        aria-labelledby="submission-history-title"
      >
        <SubmissionHistory submissions={submissions} />
      </section>
      <SiteFooter />
    </main>
  );
}
