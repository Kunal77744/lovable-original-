import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { InterviewDrill } from "@/components/interview-drill";
import { getInterviewDrillForStudent } from "@/db/interview-drill";
import { auth } from "@/lib/auth";
import { getSignInHref } from "@/lib/account-destination";
import { JAVASCRIPT_INTERVIEW_DRILL } from "@/lib/interview-drill";
import { SiteFooter, SiteNav, SkipLink } from "@/app/site-chrome";
import styles from "./interview-rehearsal.module.css";

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
    redirect(getSignInHref("/interview/javascript-fundamentals"));
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
            <aside aria-label="Private interview practice">
              <div className="interview-private-cue">
                <span>Private interview practice</span>
                <p>
                  Saved answers belong only to your signed-in account.
                </p>
              </div>
              <div className="interview-format">
                <strong>5 questions</strong>
                <p>
                  About {JAVASCRIPT_INTERVIEW_DRILL.estimatedMinutes} minutes
                </p>
              </div>
            </aside>
          </header>

          <InterviewDrill initialProgress={progress} />

          {progress.status === "completed" ? (
            <aside
              className={styles.entry}
              aria-labelledby="interview-rehearsal-entry-title"
            >
              <div>
                <p className="eyebrow">Reuse your completed round</p>
                <h2 id="interview-rehearsal-entry-title">
                  Practice the answers out loud.
                </h2>
                <p>
                  Open a private rehearsal sheet with your five saved answers,
                  the authored check points, and one follow-up for each topic.
                </p>
              </div>
              <Link href="/interview/javascript-fundamentals/rehearsal">
                Open rehearsal sheet <span aria-hidden="true">→</span>
              </Link>
            </aside>
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
