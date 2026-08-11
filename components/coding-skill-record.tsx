import Link from "next/link";
import type {
  CodingSkillRecord as CodingSkillRecordViewModel,
  CodingSkillState,
} from "@/lib/coding-skill-record";
import type { JavaScriptLabCatalogProgress } from "@/lib/javascript-lab-progress";

const stateLabels: Record<CodingSkillState, string> = {
  accepted: "Accepted",
  retry: "Retry",
  "not-started": "Not started",
};

const labStateLabels: Record<
  JavaScriptLabCatalogProgress["labs"][number]["state"],
  string
> = {
  complete: "Complete",
  "in-progress": "In progress",
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
  labProgress,
}: {
  record: CodingSkillRecordViewModel;
  labProgress: JavaScriptLabCatalogProgress;
}) {
  return (
    <div className="skill-record-layout">
      <header className="skill-record-hero">
        <div className="skill-record-heading">
          <p className="eyebrow">Private JavaScript record</p>
          <h1 id="skill-record-title">See the skill behind every verdict.</h1>
          <p>
            Track the 12 JavaScript concepts your saved results have proved, then
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
            <p className="eyebrow">12-problem evidence</p>
            <h2 id="skill-record-path-title">Your JavaScript skill path</h2>
          </div>
          <div className="skill-record-path-note">
            <p>
              Accepted means every authored check passed. It is a saved result,
              not a public score or ranking.
            </p>
            <Link href="/practice/journal">
              Review private problem journals <span aria-hidden="true">→</span>
            </Link>
          </div>
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

      <section
        className="skill-record-labs"
        aria-labelledby="skill-record-labs-title"
      >
        <div className="skill-record-labs-heading">
          <div>
            <p className="eyebrow">{labProgress.labs.length} private labs</p>
            <h2 id="skill-record-labs-title">Your saved practice record</h2>
          </div>
          <div className="skill-record-labs-summary">
            <strong>
              {labProgress.completedCount}/{labProgress.totalCount}
            </strong>
            <span>exercises complete</span>
          </div>
          <p>
            Lab completion records guided practice, not judged mastery. Open
            any lab to return to its first unfinished exercise.
          </p>
        </div>

        <ol className="skill-record-lab-list">
          {labProgress.labs.map((lab, index) => (
            <li className={`is-${lab.state}`} key={lab.slug}>
              <span className="skill-record-lab-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="skill-record-lab-name">
                <h3>{lab.title}</h3>
                <span>
                  {lab.completedCount}/{lab.totalCount} exercises
                </span>
              </div>
              <div className="skill-record-lab-state">
                <strong>{labStateLabels[lab.state]}</strong>
                <span>
                  {lab.nextExerciseNumber
                    ? `Next: exercise ${lab.nextExerciseNumber}`
                    : "All exercises saved"}
                </span>
              </div>
              <Link
                href={lab.href}
                aria-label={
                  lab.state === "complete"
                    ? `Review ${lab.title}`
                    : `Continue ${lab.title} at exercise ${lab.nextExerciseNumber}`
                }
              >
                {lab.state === "complete" ? "Review" : "Continue"}
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
