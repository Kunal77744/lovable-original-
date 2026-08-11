import Link from "next/link";
import type { ProjectReviewAttempt } from "@/lib/project-review-history";

function formatUtc(date: Date) {
  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date)} UTC`;
}

export function ProjectReviewHistory({
  attempts,
}: {
  attempts: ProjectReviewAttempt[];
}) {
  const newestAttempt = attempts[0] ?? null;
  const reviewedProjectCount = new Set(attempts.map((attempt) => attempt.slug))
    .size;

  return (
    <section
      className="project-review-history-shell"
      id="main-content"
      tabIndex={-1}
      aria-labelledby="project-review-history-title"
    >
      <header className="project-review-history-hero">
        <div>
          <p className="eyebrow">Private project review history</p>
          <h1 id="project-review-history-title">Compare every saved review.</h1>
          <p>
            Revisit the exact project behind each result without changing its
            current draft or creating another learning record.
          </p>
        </div>

        <aside className="project-review-history-summary">
          <p>Saved record</p>
          <strong>{attempts.length}</strong>
          <span>
            {attempts.length === 1 ? "review attempt" : "review attempts"}
          </span>
          <dl>
            <div>
              <dt>Projects reviewed</dt>
              <dd>{reviewedProjectCount} of 3</dd>
            </div>
            <div>
              <dt>Newest result</dt>
              <dd>
                {newestAttempt
                  ? `${newestAttempt.passedChecks}/${newestAttempt.totalChecks}`
                  : "Not yet saved"}
              </dd>
            </div>
          </dl>
        </aside>
      </header>

      <section
        className="project-review-history-ledger"
        aria-labelledby="project-review-history-ledger-title"
      >
        <div className="project-review-history-ledger-heading">
          <div>
            <p className="eyebrow">Newest 50</p>
            <h2 id="project-review-history-ledger-title">Review attempts</h2>
          </div>
          <Link href="/projects">Back to project portfolio</Link>
        </div>

        {attempts.length > 0 ? (
          <ol>
            {attempts.map((attempt, index) => (
              <li key={attempt.id}>
                <span
                  className="project-review-history-number"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="project-review-history-copy">
                  <p>{attempt.stack}</p>
                  <h3>{attempt.title}</h3>
                  <time dateTime={attempt.createdAt.toISOString()}>
                    {formatUtc(attempt.createdAt)}
                  </time>
                </div>
                <div className="project-review-history-result">
                  <span className={`is-${attempt.status}`}>
                    {attempt.status === "completed"
                      ? "Completed"
                      : "Needs revision"}
                  </span>
                  <strong>
                    {attempt.passedChecks}/{attempt.totalChecks} checks passed
                  </strong>
                  <Link href={attempt.href}>
                    Reopen this project <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="project-review-history-empty">
            <p>No saved reviews yet.</p>
            <h3>Your first project review will appear here.</h3>
            <p>
              Submit any private project for its six checks, then return to
              compare later revisions.
            </p>
            <Link href="/projects">Open your project portfolio</Link>
          </div>
        )}
      </section>

      <aside className="project-review-history-privacy">
        <span aria-hidden="true">●</span>
        <p>
          <strong>This record keeps only bounded review results.</strong>
          Your code, HTML, CSS, feedback, check details, and identity stay out
          of this history.
        </p>
      </aside>
    </section>
  );
}
