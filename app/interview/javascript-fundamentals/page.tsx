import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { InterviewDrill } from "@/components/interview-drill";
import { getInterviewDrillForStudent } from "@/db/interview-drill";
import { auth } from "@/lib/auth";
import { JAVASCRIPT_INTERVIEW_DRILL } from "@/lib/interview-drill";
import { SiteFooter, SiteNav, SkipLink } from "@/app/site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript interview practice | Lovable Original",
  description:
    "Your saved answers, self-ratings, and completion stay private in this five-question JavaScript fundamentals interview practice.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptInterviewDrillPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin");
  }

  const progress = await getInterviewDrillForStudent(
    session.user.id,
    JAVASCRIPT_INTERVIEW_DRILL.slug,
  );

  if (!progress) {
    throw new Error("The JavaScript interview drill could not be loaded.");
  }

  return (
    <>
      <SkipLink />
      <SiteNav currentPage="interview" />
      <main id="main-content">
        <section className="interview-shell" aria-labelledby="interview-title">
          <header className="interview-hero">
            <div>
              <p className="eyebrow">JavaScript interview drill</p>
              <h1 id="interview-title">Can you explain it without the editor?</h1>
              <p>{JAVASCRIPT_INTERVIEW_DRILL.description}</p>
            </div>
            <aside aria-label="Drill format">
              <span>Private practice</span>
              <strong>5 questions</strong>
              <p>About {JAVASCRIPT_INTERVIEW_DRILL.estimatedMinutes} minutes</p>
            </aside>
          </header>

          <InterviewDrill initialProgress={progress} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
