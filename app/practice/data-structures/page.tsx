import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { JavaScriptDataStructuresLab } from "@/components/javascript-data-structures-lab";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript data-structures lab | Lovable Original",
  description:
    "Practice arrays, strings, objects, and sets in four private browser exercises with deterministic checks.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptDataStructuresPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin&next=/practice/data-structures");
  }

  return (
    <main className="data-lab-page">
      <SiteNav currentPage="practice" studentSession />
      <div className="data-lab-shell" id="main-content" tabIndex={-1}>
        <nav className="problem-breadcrumbs" aria-label="Data-structures navigation">
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>Data-structures lab</span>
        </nav>

        <header className="data-lab-hero">
          <div>
            <p className="eyebrow">Four private coding exercises</p>
            <h1>Pick the structure that fits the problem.</h1>
            <p>
              Work through arrays, strings, objects, and sets. Complete one
              small function at a time, then prove it with three browser checks.
            </p>
          </div>
          <aside aria-label="Data-structures lab format">
            <strong>4 structures</strong>
            <span>12 local checks</span>
            <p>Browser-only practice. No code, answer, or progress is saved.</p>
          </aside>
        </header>

        <JavaScriptDataStructuresLab />
      </div>
      <SiteFooter />
    </main>
  );
}
