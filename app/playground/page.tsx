import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { JavaScriptPlayground } from "@/components/javascript-playground";
import { getPlaygroundFile } from "@/db/javascript-playground";
import { auth } from "@/lib/auth";
import { getSignInHref } from "@/lib/account-destination";
import { SiteFooter, SiteNav } from "../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private saved JavaScript playground | Lovable Original",
  description:
    "Write, run, save, and restore one private JavaScript file in your account-only workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PlaygroundPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(getSignInHref("/playground"));
  }

  const file = await getPlaygroundFile(session.user.id);

  return (
    <main className="playground-page">
      <SiteNav currentPage="playground" studentSession />
      <div className="playground-shell" id="main-content" tabIndex={-1}>
        <header className="playground-intro">
          <div>
            <p className="eyebrow">One-file JavaScript workspace</p>
            <div className="playground-title-row">
              <h1>Try one idea. Keep the file.</h1>
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
              Write ordinary JavaScript, run it without leaving the page, and
              save the exact file to your account.
            </p>
            <Link href="/practice">Prefer a guided problem? Open practice →</Link>
          </div>
        </header>

        <JavaScriptPlayground
          initialCode={file.code}
          initialUpdatedAt={file.updatedAt}
        />

        <aside className="playground-boundary" aria-label="Playground boundaries">
          <div>
            <span>01</span>
            <strong>One file</strong>
            <p>A focused playground.js, without packages or project setup.</p>
          </div>
          <div>
            <span>02</span>
            <strong>Browser isolated</strong>
            <p>Network APIs are blocked and each run stops after 1,000 ms.</p>
          </div>
          <div>
            <span>03</span>
            <strong>Private recovery</strong>
            <p>Only your signed-in account can restore or replace the file.</p>
          </div>
        </aside>
      </div>
      <SiteFooter />
    </main>
  );
}
