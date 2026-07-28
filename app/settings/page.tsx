import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getFirstCourseCertificateForStudent,
  getLearnerSettingsForStudent,
} from "@/db/course";
import { auth } from "@/lib/auth";
import { LearnerSettingsForm } from "@/components/learner-settings-form";
import { SiteFooter, SiteNav } from "../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private learner settings | Lovable Original",
  description:
    "Choose the private display name used on your Web Development Foundations certificate.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin");
  }

  const [settings, certificateState] = await Promise.all([
    getLearnerSettingsForStudent(session.user.id, session.user.name),
    getFirstCourseCertificateForStudent(session.user.id, session.user.name),
  ]);

  return (
    <main>
      <SiteNav currentPage="settings" studentSession />
      <section
        className="settings-shell"
        id="main-content"
        aria-labelledby="settings-title"
      >
        <div className="settings-heading">
          <p className="eyebrow">Private learner settings</p>
          <h1 id="settings-title">Make the result yours.</h1>
          <p>
            Set the name that appears on your course certificate. This setting
            stays with your signed-in account.
          </p>
        </div>

        <article className="settings-panel">
          <div className="settings-panel-heading">
            <div>
              <p className="course-kicker">Certificate name</p>
              <h2>One private display name.</h2>
            </div>
            <span>Account only</span>
          </div>
          <LearnerSettingsForm initialSettings={settings} />
        </article>

        <div className="settings-footer-actions">
          {certificateState.certificate ? (
            <Link className="settings-certificate-link" href="/certificate">
              View earned certificate <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <p>
              Your certificate unlocks after you pass Web Development
              Foundations at 75%.
            </p>
          )}
          <Link className="text-link" href="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
