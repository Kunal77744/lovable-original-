import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { JavaScriptJudgeBasics } from "@/components/javascript-judge-basics";
import { auth } from "@/lib/auth";
import { SiteFooter, SiteNav } from "../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript judge basics | Lovable Original",
  description:
    "Follow one input through solve(input), number parsing, and exact returned output before judged JavaScript practice.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptJudgeBasicsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin&next=/practice/judge-basics");
    return null;
  }

  return (
    <main>
      <SiteNav currentPage="practice" studentSession />
      <div className="judge-basics-shell" id="main-content" tabIndex={-1}>
        <nav className="problem-breadcrumbs" aria-label="Judge lesson navigation">
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>How the judge works</span>
        </nav>

        <header className="judge-basics-hero">
          <div>
            <p className="eyebrow">Private JavaScript lesson · 5 minutes</p>
            <h1>Follow one value through the judge.</h1>
          </div>
          <p>
            The judge does not run a complete script. It calls one function with
            text, then compares the returned text with the expected answer.
          </p>
        </header>

        <JavaScriptJudgeBasics />
      </div>
      <SiteFooter />
    </main>
  );
}
