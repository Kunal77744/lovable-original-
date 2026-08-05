import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { JavaScriptFoundationsWarmup } from "@/components/javascript-foundations-warmup";
import { auth } from "@/lib/auth";
import { SiteFooter, SiteNav } from "../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript foundations warm-up | Lovable Original",
  description:
    "Practice JavaScript input parsing, conditions, and loops in three guided browser exercises before judged problems.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptFoundationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin&next=/practice/foundations");
  }

  return (
    <main>
      <SiteNav currentPage="practice" studentSession />
      <div className="foundations-shell" id="main-content" tabIndex={-1}>
        <nav className="problem-breadcrumbs" aria-label="Warm-up navigation">
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>JavaScript foundations</span>
        </nav>

        <header className="foundations-hero">
          <div>
            <p className="eyebrow">Private guided warm-up · 10 minutes</p>
            <h1>Understand the code before you chase Accepted.</h1>
          </div>
          <p>
            Complete three small programs that teach the exact moves behind the
            beginner problem path: parse input, choose a branch, and build output.
            Runs stay in your browser and create no judged attempt.
          </p>
        </header>

        <JavaScriptFoundationsWarmup />

        <aside className="foundations-boundary" aria-label="Warm-up boundaries">
          <div>
            <span>01</span>
            <strong>Guided, not graded</strong>
            <p>Three checks help you reason before the six judged problems.</p>
          </div>
          <div>
            <span>02</span>
            <strong>Browser isolated</strong>
            <p>Network APIs are blocked and each run stops after 1,000 ms.</p>
          </div>
          <div>
            <span>03</span>
            <strong>No new record</strong>
            <p>Opening or running the warm-up saves no code, attempt, or progress.</p>
          </div>
        </aside>
      </div>
      <SiteFooter />
    </main>
  );
}
