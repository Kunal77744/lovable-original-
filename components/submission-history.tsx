import Link from "next/link";
import type {
  CodingSubmissionHistoryDetail,
  CodingSubmissionHistoryItem,
} from "@/db/coding-practice";

export function formatSubmissionTime(createdAt: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(createdAt));
}

export function SubmissionHistory({
  submissions,
}: {
  submissions: CodingSubmissionHistoryItem[];
}) {
  return (
    <div className="submission-history-layout">
      <header className="submission-history-heading">
        <div>
          <p className="eyebrow">Private JavaScript record</p>
          <h1 id="submission-history-title">See the code behind every result.</h1>
          <p>
            Reopen the exact source you submitted alongside its verdict, checks,
            and time. Every snapshot is read-only, so reviewing an earlier idea
            never replaces the code you are working on now.
          </p>
        </div>
        <aside className="submission-history-privacy">
          <span aria-hidden="true">●</span>
          <p>
            <strong>Only your account.</strong>
            Source snapshots are never shown on public problem pages.
          </p>
        </aside>
      </header>

      <section className="submission-history-summary" aria-label="History summary">
        <div>
          <strong>{submissions.length}</strong>
          <span>{submissions.length === 1 ? "attempt shown" : "attempts shown"}</span>
        </div>
        <p>
          The newest 50 judged submissions stay in this view. Draft saves, local
          custom runs, notes, and test cases are not added here.
        </p>
        <Link className="submission-history-primary" href="/practice">
          Continue practice <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="submission-history-record" aria-labelledby="submission-record-title">
        <div className="submission-history-record-heading">
          <div>
            <p className="course-kicker">Judged submissions</p>
            <h2 id="submission-record-title">Your recent source snapshots</h2>
          </div>
          <span>Newest first</span>
        </div>

        {submissions.length === 0 ? (
          <div className="submission-history-empty">
            <span aria-hidden="true">01</span>
            <div>
              <h3>Your first judged solution will appear here.</h3>
              <p>
                Submit any JavaScript problem to keep its verdict, check count,
                time, and exact source together.
              </p>
            </div>
          </div>
        ) : (
          <ol>
            {submissions.map((submission) => (
              <li key={submission.id}>
                <span className="submission-history-number">
                  {String(submission.problemNumber).padStart(2, "0")}
                </span>
                <div className="submission-history-problem">
                  <Link href={`/submissions/${submission.id}`}>
                    {submission.problemTitle}
                  </Link>
                  <time dateTime={submission.createdAt}>
                    {formatSubmissionTime(submission.createdAt)}
                  </time>
                </div>
                <div className="submission-history-verdict">
                  <strong
                    className={
                      submission.verdict === "Accepted" ? "is-accepted" : ""
                    }
                  >
                    {submission.verdict}
                  </strong>
                  <span>
                    {submission.passedTests}/{submission.totalTests} checks
                  </span>
                </div>
                <span className="submission-history-source-state">
                  {submission.hasSource ? "Source saved" : "Result only"}
                </span>
                <Link
                  className="submission-history-open"
                  href={`/submissions/${submission.id}`}
                  aria-label={`Review ${submission.problemTitle} submission from ${formatSubmissionTime(submission.createdAt)}`}
                >
                  Review <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

export function SubmissionSnapshot({
  submission,
}: {
  submission: CodingSubmissionHistoryDetail;
}) {
  return (
    <div className="submission-snapshot-layout">
      <Link className="submission-snapshot-back" href="/submissions">
        <span aria-hidden="true">←</span> All submissions
      </Link>

      <header className="submission-snapshot-heading">
        <div>
          <p className="eyebrow">
            Private submission · Problem {String(submission.problemNumber).padStart(2, "0")}
          </p>
          <h1 id="submission-snapshot-title">{submission.problemTitle}</h1>
          <p>
            Submitted {formatSubmissionTime(submission.createdAt)}. This is a
            read-only record of that attempt, not your current saved editor.
          </p>
        </div>
        <div className="submission-snapshot-result">
          <span>Verdict</span>
          <strong
            className={submission.verdict === "Accepted" ? "is-accepted" : ""}
          >
            {submission.verdict}
          </strong>
          <p>
            {submission.passedTests}/{submission.totalTests} checks passed
          </p>
        </div>
      </header>

      <section className="submission-snapshot-code" aria-labelledby="submitted-source-title">
        <div className="submission-snapshot-code-heading">
          <div>
            <p>Submitted source</p>
            <h2 id="submitted-source-title">The code behind this verdict</h2>
          </div>
          <span>Read-only snapshot</span>
        </div>
        {submission.code === null ? (
          <div className="submission-snapshot-unavailable">
            <h3>This earlier result has no source snapshot.</h3>
            <p>
              Exact source is kept for submissions made after private history
              was added. The verdict, checks, and time remain available here.
            </p>
          </div>
        ) : (
          <pre tabIndex={0} aria-label="Submitted JavaScript source">
            <code>{submission.code}</code>
          </pre>
        )}
      </section>

      <aside className="submission-snapshot-boundary">
        <div>
          <span aria-hidden="true">●</span>
          <p>
            <strong>Your current work stays untouched.</strong>
            Opening this record does not change saved code, attempts, progress,
            notes, test cases, or analytics.
          </p>
        </div>
        <Link
          className="submission-history-primary"
          href={`/practice/${submission.problemSlug}`}
        >
          Open current problem <span aria-hidden="true">→</span>
        </Link>
      </aside>
    </div>
  );
}
