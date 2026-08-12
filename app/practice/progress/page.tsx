import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CodingSkillRecord } from "@/components/coding-skill-record";
import { getCodingSkillRecordForStudent } from "@/db/coding-skill-record";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";
import { buildCodingSkillRecord } from "@/lib/coding-skill-record";
import { SiteFooter, SiteNav } from "../../site-chrome";
import styles from "./saved-workspaces-entry.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your private JavaScript skill record | Lovable Original",
  description:
    "Review the concepts, judged attempts, and Accepted results saved privately to your Lovable Original account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PracticeProgressPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin");
  }

  const [snapshot, labProgress] = await Promise.all([
    getCodingSkillRecordForStudent(session.user.id),
    getJavaScriptLabCatalogProgress(session.user.id),
  ]);
  const record = buildCodingSkillRecord(snapshot);

  return (
    <main>
      <SiteNav currentPage="practice-progress" studentSession />
      <section
        className="skill-record-shell"
        id="main-content"
        tabIndex={-1}
        aria-labelledby="skill-record-title"
      >
        <CodingSkillRecord record={record} labProgress={labProgress} />
      </section>
      <aside className={styles.entry} aria-label="Saved JavaScript workspaces">
        <p>
          <strong>Return to saved source.</strong> Reopen every account-backed
          judged workspace, most recent first.
        </p>
        <Link href="/practice/workspaces">
          Open saved workspaces <span aria-hidden="true">→</span>
        </Link>
      </aside>
      <SiteFooter />
    </main>
  );
}
