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

type SubmissionHistorySearchParams = {
  problem?: string | string[];
  verdict?: string | string[];
};

function readSingleSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams?: Promise<SubmissionHistorySearchParams>;
} = {}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin");
  }

  const submissions = await getCodingSubmissionHistoryForStudent(
    session.user.id,
  );
  const filters = searchParams ? await searchParams : {};

  return (
    <main>
      <SiteNav currentPage="profile" studentSession />
      <section
        className="submission-history-shell"
        id="main-content"
        tabIndex={-1}
        aria-labelledby="submission-history-title"
      >
        <SubmissionHistory
          submissions={submissions}
          problemFilter={readSingleSearchParam(filters.problem)}
          verdictFilter={readSingleSearchParam(filters.verdict)}
        />
      </section>
      <SiteFooter />
    </main>
  );
}
