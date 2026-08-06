import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { JavaScriptStacksQueuesLab } from "@/components/javascript-stacks-queues-lab";
import { getCompletedJavaScriptLabExerciseIds } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript stacks and queues | Lovable Original",
  description:
    "Practice stack order, balanced delimiters, queue order, and structure selection in four private browser exercises.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptStacksQueuesPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/account?mode=signin&next=/practice/stacks-queues");
    return null;
  }
  const completedExerciseIds = await getCompletedJavaScriptLabExerciseIds(
    session.user.id,
    "stacks-queues",
  );

  return (
    <main className="function-lab-page">
      <SiteNav currentPage="practice" studentSession />
      <div className="function-lab-shell" id="main-content" tabIndex={-1}>
        <nav
          className="problem-breadcrumbs"
          aria-label="Stacks and queues lab navigation"
        >
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>Stacks and queues</span>
        </nav>

        <header className="function-lab-hero">
          <div>
            <p className="eyebrow">Four private coding exercises</p>
            <h1>Choose what leaves first.</h1>
            <p>
              Remove the newest stack item, match nested delimiters, serve the
              oldest queue item, and choose a structure from the order you need.
            </p>
          </div>
          <aside aria-label="Stacks and queues lab format">
            <strong>4 ordering ideas</strong>
            <span>12 local checks</span>
            <p>
              Code stays local. Completed exercises save as private practice.
            </p>
          </aside>
        </header>

        <JavaScriptStacksQueuesLab
          completedExerciseIds={completedExerciseIds}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
