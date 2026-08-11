import Link from "next/link";
import type { JavaScriptCompletionRecord as CompletionRecord } from "@/db/coding-skill-record";
import { PrintCertificateButton } from "./print-certificate-button";

function formatCompletionDate(completedAt: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(completedAt));
}

export function JavaScriptCompletionRecord({
  record,
}: {
  record: CompletionRecord;
}) {
  if (!record.completedAt || record.completedCount !== record.totalCount) {
    const nextProblem = record.nextProblem;

    return (
      <section
        className="certificate-locked-shell"
        id="main-content"
        aria-labelledby="javascript-record-locked-title"
      >
        <div
          className="javascript-completion-lock-mark"
          aria-label={`${record.completedCount} of ${record.totalCount} problems Accepted`}
        >
          <strong>{record.completedCount}</strong>
          <span>/ {record.totalCount}</span>
        </div>
        <p className="eyebrow">Private JavaScript completion record</p>
        <h1 id="javascript-record-locked-title">
          Finish the judged path first.
        </h1>
        <p>
          Earn Accepted on all {record.totalCount} authored JavaScript problems.
          This page reads your existing saved results and creates no new
          learning record.
        </p>
        {nextProblem ? (
          <Link
            className="primary-action"
            href={`/practice/${nextProblem.slug}`}
          >
            Continue with problem {String(nextProblem.number).padStart(2, "0")}
            <span aria-hidden="true"> →</span>
          </Link>
        ) : (
          <Link className="primary-action" href="/practice">
            Return to practice <span aria-hidden="true">→</span>
          </Link>
        )}
        <Link className="text-link" href="/practice/progress">
          View private skill record
        </Link>
      </section>
    );
  }

  return (
    <section
      className="certificate-shell"
      id="main-content"
      aria-labelledby="javascript-record-title"
    >
      <div className="certificate-heading certificate-screen-only">
        <div>
          <p className="eyebrow">Private JavaScript completion record</p>
          <h1 id="javascript-record-title">Twelve problems, kept as proof.</h1>
          <p>
            A private record of your saved Accepted results, not an accredited
            certificate, hiring signal, or public verification.
          </p>
        </div>
        <span>Account only</span>
      </div>

      <article
        className="certificate-card javascript-completion-card"
        aria-label={`JavaScript completion record for ${record.displayName}`}
      >
        <div className="certificate-brand">
          <span className="certificate-brand-mark" aria-hidden="true">
            L
          </span>
          <span>Lovable Original</span>
        </div>
        <p className="certificate-kicker">Private completion record</p>
        <p className="certificate-intro">This account record confirms that</p>
        <h2>{record.displayName}</h2>
        <p className="certificate-copy">earned Accepted across</p>
        <h3>{record.totalCount} JavaScript problems</h3>
        <p className="certificate-detail">
          All authored checks passed across input handling, control flow, data
          structures, and search patterns. This records judged practice, not
          broader JavaScript mastery.
        </p>

        <div className="javascript-completion-evidence" aria-label="Saved result">
          <span>Saved result</span>
          <strong>
            {record.completedCount}/{record.totalCount} Accepted
          </strong>
        </div>

        <div className="certificate-rule" aria-hidden="true" />
        <div className="certificate-meta">
          <div>
            <span>Completed</span>
            <strong>{formatCompletionDate(record.completedAt)}</strong>
          </div>
          <div className="certificate-seal" aria-hidden="true">
            <span>12</span>
            <small>Accepted</small>
          </div>
          <div>
            <span>Record</span>
            <strong>JS · 12</strong>
          </div>
        </div>
      </article>

      <div className="certificate-actions certificate-screen-only">
        <PrintCertificateButton label="Print completion record" />
        <Link className="text-link" href="/settings">
          Edit display name
        </Link>
        <Link className="text-link" href="/practice/progress">
          Back to skill record
        </Link>
      </div>
    </section>
  );
}
