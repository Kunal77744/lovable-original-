import Link from "next/link";
import type { LearnerProfileViewModel } from "@/lib/learner-profile";

function formatAttemptTime(createdAt: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(createdAt));
}

export function LearnerProfile({
  profile,
}: {
  profile: LearnerProfileViewModel;
}) {
  return (
    <div className="profile-layout">
      <header className="profile-heading">
        <div>
          <p className="eyebrow">Private learner profile</p>
          <h1 id="profile-title">
            {profile.isFreshLearner
              ? "Your learning record starts here."
              : "One record of what you’ve finished."}
          </h1>
          <p>
            {profile.isFreshLearner
              ? "Nothing is completed yet. Start with one focused lesson, and your course and JavaScript practice progress will build here."
              : "Course results and accepted JavaScript problems stay together here, attached only to your account."}
          </p>
        </div>
        <div className="profile-privacy-note">
          <span aria-hidden="true">●</span>
          <p>
            <strong>Private by default.</strong>
            Only you can open this learning record.
          </p>
        </div>
      </header>

      <section className="profile-progress" aria-label="Learning progress">
        <article className="profile-course-progress">
          <div className="profile-section-heading">
            <div>
              <p>Course progress</p>
              <h2>{profile.course.title}</h2>
            </div>
            <strong>{profile.course.progressPercent}%</strong>
          </div>
          <div
            className="profile-progress-track"
            role="progressbar"
            aria-label="Course completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={profile.course.progressPercent}
          >
            <span style={{ width: `${profile.course.progressPercent}%` }} />
          </div>
          <dl>
            <div>
              <dt>Lessons</dt>
              <dd>
                {profile.course.completedLessons}/{profile.course.totalLessons}
              </dd>
            </div>
            <div>
              <dt>Best quiz</dt>
              <dd>
                {profile.quizScore === null
                  ? "Not attempted"
                  : `${profile.quizScore}%`}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                {profile.course.courseCompleted
                  ? "Completed"
                  : profile.course.completedLessons === 0 &&
                      profile.quizScore === null
                    ? "Not started"
                    : "In progress"}
              </dd>
            </div>
          </dl>
        </article>

        <article className="profile-practice-progress">
          <p>JavaScript practice</p>
          <strong>
            {profile.practice.completedCount}
            <span>/{profile.practice.totalCount}</span>
          </strong>
          <h2>problems accepted</h2>
          <p>
            Accepted results stay here after reload, sign-out, and your next
            sign-in.
          </p>
        </article>
      </section>

      <section className="profile-lower-grid">
        <div className="profile-attempts">
          <div className="profile-attempts-heading">
            <div>
              <p className="course-kicker">Recent attempts</p>
              <h2>Practice history</h2>
            </div>
            <span>{profile.attempts.length} shown</span>
          </div>

          {profile.attempts.length === 0 ? (
            <div className="profile-empty-attempts">
              <span aria-hidden="true">01</span>
              <p>
                Your first submitted problem will appear here with its verdict
                and passed-check count.
              </p>
            </div>
          ) : (
            <ol>
              {profile.attempts.map((attempt) => (
                <li key={attempt.id}>
                  <span className="profile-attempt-number">
                    {String(attempt.problemNumber).padStart(2, "0")}
                  </span>
                  <div>
                    <Link href={`/practice/${attempt.problemSlug}`}>
                      {attempt.problemTitle}
                    </Link>
                    <time dateTime={attempt.createdAt}>
                      {formatAttemptTime(attempt.createdAt)}
                    </time>
                  </div>
                  <div className="profile-attempt-result">
                    <strong
                      className={
                        attempt.verdict === "Accepted" ? "is-accepted" : ""
                      }
                    >
                      {attempt.verdict}
                    </strong>
                    <span>
                      {attempt.passedTests}/{attempt.totalTests} checks
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <aside className="profile-next-action" aria-labelledby="next-action-title">
          <p>{profile.nextAction.kicker}</p>
          <h2 id="next-action-title">{profile.nextAction.title}</h2>
          <p>{profile.nextAction.description}</p>
          <Link className="profile-primary-action" href={profile.nextAction.href}>
            {profile.nextAction.label}
            <span aria-hidden="true">→</span>
          </Link>
        </aside>
      </section>
    </div>
  );
}
