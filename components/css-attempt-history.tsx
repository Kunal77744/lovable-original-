import Link from "next/link";
import type { CssPracticeHistoryItem } from "@/db/css-practice";

export function formatCssAttemptTime(createdAt: string) {
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

export function CssAttemptHistory({
  attempts,
}: {
  attempts: CssPracticeHistoryItem[];
}) {
  return (
    <div className="submission-history-layout">
      <header className="submission-history-heading">
        <div>
          <p className="eyebrow">Private CSS attempt record</p>
          <h1 id="css-attempt-history-title">
            See recent saved results in one place.
          </h1>
          <p>
            Compare recent challenge outcomes, then reopen the exact CSS skill
            that needs another pass. This record never changes your saved draft.
          </p>
        </div>
        <aside className="submission-history-privacy">
          <span aria-hidden="true">●</span>
          <p>
            <strong>Only your account.</strong>
            Your CSS and saved results never appear on a public profile.
          </p>
        </aside>
      </header>

      <section className="submission-history-summary" aria-label="History summary">
        <div>
          <strong>{attempts.length}</strong>
          <span>{attempts.length === 1 ? "attempt shown" : "attempts shown"}</span>
        </div>
        <p>
          The newest 50 saved challenge attempts stay here. Draft-only edits and
          preview refreshes do not create a result.
        </p>
        <Link className="submission-history-primary" href="/practice/css">
          Continue CSS practice <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section
        className="submission-history-record"
        aria-labelledby="css-attempt-record-title"
      >
        <div className="submission-history-record-heading">
          <div>
            <p className="course-kicker">Saved challenge outcomes</p>
            <h2 id="css-attempt-record-title">Your recent CSS attempts</h2>
          </div>
          <span>Newest first</span>
        </div>

        {attempts.length === 0 ? (
          <div className="submission-history-empty">
            <span aria-hidden="true">01</span>
            <div>
              <h3>Your first saved CSS result will appear here.</h3>
              <p>
                Submit any CSS challenge to keep its result, check count, and
                time in your private record.
              </p>
            </div>
          </div>
        ) : (
          <ol>
            {attempts.map((attempt) => (
              <li key={attempt.id}>
                <span className="submission-history-number">
                  {String(attempt.challengeNumber).padStart(2, "0")}
                </span>
                <div className="submission-history-problem">
                  <Link href={`/practice/css/${attempt.challengeSlug}`}>
                    {attempt.challengeTitle}
                  </Link>
                  <time dateTime={attempt.createdAt}>
                    {formatCssAttemptTime(attempt.createdAt)}
                  </time>
                </div>
                <div className="submission-history-verdict">
                  <strong
                    className={
                      attempt.verdict === "Completed" ? "is-accepted" : ""
                    }
                  >
                    {attempt.verdict}
                  </strong>
                  <span>
                    {attempt.passedChecks}/{attempt.totalChecks} checks
                  </span>
                </div>
                <span className="submission-history-source-state">
                  {attempt.skill}
                </span>
                <Link
                  className="submission-history-open"
                  href={`/practice/css/${attempt.challengeSlug}`}
                  aria-label={`Reopen ${attempt.challengeTitle} from ${formatCssAttemptTime(attempt.createdAt)}`}
                >
                  Reopen <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
