import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { SubmissionSnapshot } from "@/components/submission-history";
import { SubmissionSourceDownload } from "@/components/submission-source-download";
import { getCodingSubmissionForStudent } from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import { SiteFooter, SiteNav } from "../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript submission | Lovable Original",
  description:
    "Review one private JavaScript submission with its verdict, checks, time, and read-only source snapshot.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin");
  }

  const { submissionId } = await params;
  const submission = await getCodingSubmissionForStudent(
    session.user.id,
    submissionId,
  );

  if (!submission) {
    notFound();
  }

  return (
    <main>
      <SiteNav currentPage="profile" studentSession />
      <section
        className="submission-snapshot-shell"
        id="main-content"
        tabIndex={-1}
        aria-labelledby="submission-snapshot-title"
      >
        <SubmissionSnapshot submission={submission} />
        {submission.code === null ? null : (
          <SubmissionSourceDownload
            createdAt={submission.createdAt}
            problemSlug={submission.problemSlug}
            problemTitle={submission.problemTitle}
            source={submission.code}
          />
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
