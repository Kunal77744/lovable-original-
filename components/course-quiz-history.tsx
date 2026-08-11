import Link from "next/link";
import type { CourseQuizAttempt } from "@/db/course";

type LessonAttemptGroup = {
  lessonSlug: string;
  lessonTitle: string;
  lessonModuleTitle: string;
  lessonPosition: number;
  attempts: CourseQuizAttempt[];
};

function formatAttemptTime(createdAt: string) {
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

function groupAttempts(attempts: CourseQuizAttempt[]) {
  const groups = new Map<string, LessonAttemptGroup>();

  for (const attempt of attempts) {
    const group = groups.get(attempt.lessonSlug);

    if (group) {
      group.attempts.push(attempt);
      continue;
    }

    groups.set(attempt.lessonSlug, {
      lessonSlug: attempt.lessonSlug,
      lessonTitle: attempt.lessonTitle,
      lessonModuleTitle: attempt.lessonModuleTitle,
      lessonPosition: attempt.lessonPosition,
      attempts: [attempt],
    });
  }

  return [...groups.values()].sort(
    (first, second) => first.lessonPosition - second.lessonPosition,
  );
}

export function CourseQuizHistory({
  attempts,
}: {
  attempts: CourseQuizAttempt[];
}) {
  const lessonGroups = groupAttempts(attempts);
  const passedAttempts = attempts.filter((attempt) => attempt.passed).length;

  return (
    <div className="course-quiz-history-layout">
      <header className="course-quiz-history-hero">
        <div>
          <p className="eyebrow">Private quiz history</p>
          <h1 id="course-quiz-history-title">
            See the work behind your best score.
          </h1>
          <p>
            Compare your newest saved Web Foundations quiz attempts, then
            reopen the exact lesson that needs another pass.
          </p>
        </div>
        <aside className="course-quiz-history-privacy">
          <span aria-hidden="true">●</span>
          <div>
            <strong>Scores, not answers.</strong>
            <p>
              This record keeps the result, check count, and UTC time. Your
              choices and answer key aren’t stored here.
            </p>
            <Link href="/profile">Back to private progress</Link>
          </div>
        </aside>
      </header>

      <section
        className="course-quiz-history-summary"
        aria-label="Quiz history summary"
      >
        <div>
          <strong>{attempts.length}</strong>
          <span>{attempts.length === 1 ? "Saved attempt" : "Saved attempts"}</span>
        </div>
        <div>
          <strong>{passedAttempts}</strong>
          <span>{passedAttempts === 1 ? "Passing result" : "Passing results"}</span>
        </div>
        <div>
          <strong>
            {lessonGroups.length}
            <small>/3</small>
          </strong>
          <span>Lessons attempted</span>
        </div>
      </section>

      {lessonGroups.length === 0 ? (
        <section className="course-quiz-history-empty">
          <span aria-hidden="true">01</span>
          <div>
            <p className="course-kicker">No saved attempts yet</p>
            <h2>Your first result will build this record.</h2>
            <p>
              Read the semantic HTML lesson, answer four questions from memory,
              and your score will return here after sign-out and sign-in.
            </p>
            <Link
              className="course-quiz-history-primary-action"
              href="/learn/web-development-foundations/semantic-html#knowledge-check"
            >
              Start the first quiz <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      ) : (
        <section
          className="course-quiz-history-lessons"
          aria-label="Attempts by lesson"
        >
          <div className="course-quiz-history-list-heading">
            <div>
              <p className="course-kicker">Newest 50 results</p>
              <h2>Attempts by lesson</h2>
            </div>
            <p>Each result is saved only to this account.</p>
          </div>

          <div className="course-quiz-history-grid">
            {lessonGroups.map((group) => {
              const bestScore = Math.max(
                ...group.attempts.map((attempt) => attempt.score),
              );

              return (
                <article
                  className="course-quiz-history-card"
                  key={group.lessonSlug}
                >
                  <header>
                    <div>
                      <p>{group.lessonModuleTitle}</p>
                      <h3>{group.lessonTitle}</h3>
                    </div>
                    <div className="course-quiz-history-best">
                      <span>Best</span>
                      <strong>{bestScore}%</strong>
                    </div>
                  </header>
                  <ol>
                    {group.attempts.map((attempt, index) => (
                      <li key={attempt.id}>
                        <span
                          aria-hidden="true"
                          className="course-quiz-history-attempt-number"
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <strong>{attempt.score}%</strong>
                          <time dateTime={attempt.createdAt}>
                            {formatAttemptTime(attempt.createdAt)}
                          </time>
                        </div>
                        <div className="course-quiz-history-result">
                          <span className={attempt.passed ? "is-passed" : ""}>
                            {attempt.passed ? "Passed" : "Keep practicing"}
                          </span>
                          <small>
                            {attempt.correctCount}/{attempt.totalCount} checks
                          </small>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <Link
                    href={`/learn/web-development-foundations/${group.lessonSlug}#knowledge-check`}
                  >
                    Reopen this lesson <span aria-hidden="true">→</span>
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
