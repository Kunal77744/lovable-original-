import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DebuggingLab } from "@/components/debugging-lab";
import { auth } from "@/lib/auth";
import { createBrowserRecoveryScope } from "@/lib/browser-recovery-scope";
import {
  getCompletedJavaScriptLabExerciseIds,
  getJavaScriptLabExerciseDrafts,
} from "@/db/javascript-lab-progress";
import { getSignInHref } from "@/lib/account-destination";
import { SiteFooter, SiteNav, SkipLink } from "@/app/site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript debugging lab | Lovable Original",
  description:
    "Repair three broken JavaScript programs with private browser-only checks.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptDebuggingLabPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(getSignInHref("/practice/debugging"));
    return null;
  }
  const [completedExerciseIds, initialDrafts] = await Promise.all([
    getCompletedJavaScriptLabExerciseIds(session.user.id, "debugging"),
    getJavaScriptLabExerciseDrafts(session.user.id, "debugging"),
  ]);

  return (
    <>
      <SkipLink />
      <SiteNav currentPage="practice" studentSession />
      <main id="main-content">
        <section className="debugging-shell" aria-labelledby="debugging-title">
          <header className="debugging-hero">
            <div>
              <p className="eyebrow">Private JavaScript debugging lab</p>
              <h1 id="debugging-title">Find the defect. Prove the repair.</h1>
              <p>
                Repair three small programs that are almost correct. Each drill
                isolates one beginner bug and checks the behavior in your
                browser.
              </p>
            </div>
            <aside aria-label="Debugging lab boundaries">
              <span>3 defects · about 12 minutes</span>
              <p>
                Drafts and completed repairs save privately to your account.
              </p>
            </aside>
          </header>
          <DebuggingLab
            browserRecoveryScope={createBrowserRecoveryScope(session.user.id)}
            completedExerciseIds={completedExerciseIds}
            initialDrafts={initialDrafts}
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
