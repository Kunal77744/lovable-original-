import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getFirstCourseCertificateForStudent } from "@/db/course";
import { auth } from "@/lib/auth";
import { PrintCertificateButton } from "@/components/print-certificate-button";
import { SiteFooter, SiteNav } from "../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private course certificate | Lovable Original",
  description:
    "Your private completion certificate for Web Development Foundations.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CertificatePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin");
  }

  const certificateState = await getFirstCourseCertificateForStudent(
    session.user.id,
    session.user.name,
  );

  if (!certificateState.certificate) {
    return (
      <main>
        <SiteNav currentPage="certificate" studentSession />
        <section
          className="certificate-locked-shell"
          id="main-content"
          aria-labelledby="certificate-locked-title"
        >
          <div className="certificate-lock-mark" aria-hidden="true">
            75
          </div>
          <p className="eyebrow">Private course certificate</p>
          <h1 id="certificate-locked-title">Finish the recall check first.</h1>
          <p>
            Pass Web Development Foundations at 75% or higher. Your private
            certificate will be created from that saved course result.
          </p>
          <Link
            className="primary-action"
            href="/learn/web-development-foundations/semantic-html"
          >
            Continue the course <span aria-hidden="true">→</span>
          </Link>
          <Link className="text-link" href="/settings">
            Check certificate settings
          </Link>
        </section>
        <SiteFooter />
      </main>
    );
  }

  const awardedDate = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(certificateState.certificate.awardedAt));

  return (
    <main className="certificate-page">
      <div className="certificate-screen-only">
        <SiteNav currentPage="certificate" studentSession />
      </div>
      <section
        className="certificate-shell"
        id="main-content"
        aria-labelledby="certificate-title"
      >
        <div className="certificate-heading certificate-screen-only">
          <div>
            <p className="eyebrow">Private course certificate</p>
            <h1 id="certificate-title">Your saved finish line.</h1>
            <p>
              This is a private record of course completion, not an accredited
              credential or public verification.
            </p>
          </div>
          <span>Account only</span>
        </div>

        <article
          className="certificate-card"
          aria-label={`Certificate of completion for ${certificateState.certificate.displayName}`}
        >
          <div className="certificate-brand">
            <span className="certificate-brand-mark" aria-hidden="true">
              L
            </span>
            <span>Lovable Original</span>
          </div>
          <p className="certificate-kicker">Certificate of completion</p>
          <p className="certificate-intro">This private record confirms that</p>
          <h2>{certificateState.certificate.displayName}</h2>
          <p className="certificate-copy">completed</p>
          <h3>{certificateState.certificate.courseTitle}</h3>
          <p className="certificate-detail">
            One 18-minute semantic HTML lesson, a saved article assignment, and
            a four-question recall check passed at 75% or higher.
          </p>
          <div className="certificate-rule" aria-hidden="true" />
          <div className="certificate-meta">
            <div>
              <span>Awarded</span>
              <strong>{awardedDate}</strong>
            </div>
            <div className="certificate-seal" aria-hidden="true">
              <span>LO</span>
              <small>Completed</small>
            </div>
            <div>
              <span>Course</span>
              <strong>WDF · 01</strong>
            </div>
          </div>
        </article>

        <div className="certificate-actions certificate-screen-only">
          <PrintCertificateButton />
          <Link className="text-link" href="/settings">
            Edit certificate name
          </Link>
          <Link className="text-link" href="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </section>
      <div className="certificate-screen-only">
        <SiteFooter />
      </div>
    </main>
  );
}
