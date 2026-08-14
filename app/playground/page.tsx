import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { JavaScriptPlayground } from "@/components/javascript-playground";
import { getCodingProblemForStudent } from "@/db/coding-practice";
import { getPlaygroundWorkspace } from "@/db/javascript-playground";
import { auth } from "@/lib/auth";
import { getSignInHref } from "@/lib/account-destination";
import { getCodingProblem } from "@/lib/coding-problems";
import { SiteFooter, SiteNav } from "../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private saved JavaScript playground | Lovable Original",
  description:
    "Write, run, check, save, and restore up to six private JavaScript files in your account-only workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

type PlaygroundPageProps = {
  searchParams?: Promise<{ accepted_from?: string | string[] }>;
};

export default async function PlaygroundPage({ searchParams }: PlaygroundPageProps = {}) {
  const requestedProblemSlug = (await searchParams)?.accepted_from;
  const problemSlug =
    typeof requestedProblemSlug === "string" ? requestedProblemSlug : null;
  const requestedProblem = problemSlug ? getCodingProblem(problemSlug) : null;
  const returnDestination = requestedProblem
    ? `/playground?accepted_from=${encodeURIComponent(requestedProblem.slug)}`
    : "/playground";
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(getSignInHref(returnDestination));
  }

  const [workspace, studentState] = await Promise.all([
    getPlaygroundWorkspace(session.user.id),
    requestedProblem
      ? getCodingProblemForStudent(session.user.id, requestedProblem.slug)
      : Promise.resolve(null),
  ]);
  const acceptedTransfer =
    requestedProblem && studentState?.latestAcceptedCode
      ? {
          problemSlug: requestedProblem.slug,
          problemTitle: requestedProblem.title,
          source: studentState.latestAcceptedCode,
        }
      : null;

  return (
    <main className="playground-page">
      <SiteNav currentPage="playground" studentSession />
      <div className="playground-shell" id="main-content" tabIndex={-1}>
        <header className="playground-intro">
          <div>
            <p className="eyebrow">Private JavaScript workspace</p>
            <div className="playground-title-row">
              <h1>Keep your JavaScript ideas together.</h1>
              <span className="playground-private-badge">
                <span aria-hidden="true">Private playground</span>
                <span className="sr-only">
                  Private playground. Saved code belongs only to your signed-in
                  account.
                </span>
              </span>
            </div>
          </div>
          <div className="playground-intro-copy">
            <p>
              Create up to six focused files, test the behavior you expect
              without leaving the page, and return to the exact saved work.
            </p>
            <Link href="/practice">Prefer a guided problem? Open practice →</Link>
          </div>
        </header>

        <JavaScriptPlayground
          initialFiles={workspace.files}
          initialActiveFileId={workspace.activeFileId}
          acceptedTransfer={acceptedTransfer}
        />

        <aside className="playground-boundary" aria-label="Playground boundaries">
          <div>
            <span>01</span>
            <strong>Six focused files</strong>
            <p>Create, rename, switch, and remove private JavaScript files.</p>
          </div>
          <div>
            <span>02</span>
            <strong>Browser isolated</strong>
            <p>Network APIs are blocked and each run stops after 1,000 ms.</p>
          </div>
          <div>
            <span>03</span>
            <strong>Private recovery</strong>
            <p>Only your signed-in account can restore or replace these files.</p>
          </div>
        </aside>
      </div>
      <SiteFooter />
    </main>
  );
}
