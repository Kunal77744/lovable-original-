import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { JavaScriptCompletionRecord } from "@/components/javascript-completion-record";
import { getJavaScriptCompletionRecordForStudent } from "@/db/coding-skill-record";
import { getSignInHref } from "@/lib/account-destination";
import { auth } from "@/lib/auth";
import { SiteFooter, SiteNav } from "../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript completion record | Lovable Original",
  description:
    "Your private completion record for the 12-problem JavaScript practice path.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptCompletionRecordPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(getSignInHref("/practice/completion-record"));
  }

  const record = await getJavaScriptCompletionRecordForStudent(
    session.user.id,
    session.user.name,
  );

  return (
    <main className="certificate-page">
      <div className="certificate-screen-only">
        <SiteNav currentPage="practice-progress" studentSession />
      </div>
      <JavaScriptCompletionRecord record={record} />
      <div className="certificate-screen-only">
        <SiteFooter />
      </div>
    </main>
  );
}
