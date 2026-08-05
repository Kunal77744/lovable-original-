import Link from "next/link";
import type {
  CodingSkillRecord as CodingSkillRecordViewModel,
  CodingSkillState,
} from "@/lib/coding-skill-record";

const stateLabels: Record<CodingSkillState, string> = {
  accepted: "Accepted",
  retry: "Retry",
  "not-started": "Not started",
};

function formatPracticeDate(createdAt: string | null) {
  if (!createdAt) return "No saved activity";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(createdAt));
}

export function CodingSkillRecord({
  record,
}: {
  record: CodingSkillRecordViewModel;
}) {
  return (
    <div className="skill-record-layout">
      <header className="skill-record-hero">
        <div className="skill-record-heading">
          <p className="eyebrow">Private JavaScript record</p>
          <h1 id="skill-record-title">See the skill behind every verdict.</h1>
          <p>
            Track the six beginner concepts your saved results have proved, then
            reopen the exact problem that needs another attempt.
          </p>
          <Link
            className="skill-record-primary-action"
            href={record.nextAction.href}
          >
            {record.nextAction.label} <span aria-hidden="true">→</span>
          </Link>
        </div>

        <aside className="skill-record-summary" aria-label="JavaScript summary">
          <div className="skill-record-summary-topline">
            <span>Your accepted skills</span>
            <strong>
              {record.acceptedCount}/{record.totalCount}
            </strong>
          </div>
          <div
            className="skill-record-progress"
            role="progressbar"
            aria-label="JavaScript skills accepted"
            aria-valuemin={0}
            aria-valuemax={record.totalCount}
            aria-valuenow={record.acceptedCount}
          >
            <span
              style={{
                width: `${(record.acceptedCount / record.totalCount) * 100}%`,
              }}
            />
          </div>
          <dl>
            <div>
              <dt>Judged attempts</dt>
              <dd>{record.attemptCount}</dd>
            </div>
            <div>
              <dt>Practice days</dt>
              <dd>{record.practiceDays}</dd>
            </div>
          </dl>
          <p>
            <span aria-hidden="true">●</span>
            <strong>Private to your account.</strong> Last activity:{" "}
            {formatPracticeDate(record.lastPracticedAt)}.
          </p>
        </aside>
      </header>

      <section
        className="skill-record-next"
        aria-labelledby="skill-record-next-title"
      >
        <div>
          <p>{record.nextAction.kicker}</p>
          <h2 id="skill-record-next-title">{record.nextAction.title}</h2>
        </div>
        <p>{record.nextAction.description}</p>
      </section>

      <section
        className="skill-record-path"
        aria-labelledby="skill-record-path-title"
      >
        <div className="skill-record-path-heading">
          <div>
            <p className="eyebrow">Six-step evidence</p>
            <h2 id="skill-record-path-title">Your JavaScript skill path</h2>
          </div>
          <p>
            Accepted means every authored check passed. It is a saved result,
            not a public score or ranking.
          </p>
        </div>

        <ol className="skill-record-list">
          {record.skills.map((skill) => (
            <li className={`is-${skill.state}`} key={skill.slug}>
              <span className="skill-record-number">
                {String(skill.number).padStart(2, "0")}
              </span>
              <div className="skill-record-name">
                <span>{skill.skill}</span>
                <h3>{skill.title}</h3>
              </div>
              <div className="skill-record-result">
                <strong>{stateLabels[skill.state]}</strong>
                <span>{skill.resultLabel}</span>
              </div>
              <Link
                href={`/practice/${skill.slug}`}
                aria-label={`${
                  skill.state === "retry"
                    ? "Retry"
                    : skill.state === "accepted"
                      ? "Review"
                      : "Start"
                } ${skill.title}`}
              >
                {skill.state === "retry"
                  ? "Retry"
                  : skill.state === "accepted"
                    ? "Review"
                    : "Start"}
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
