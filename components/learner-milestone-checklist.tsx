import Link from "next/link";

type LearnerMilestoneChecklistProps = {
  course: {
    completed: boolean;
    completedLessons: number;
    totalLessons: number;
    totalEstimatedMinutes: number;
    nextLessonTitle: string;
    href: string;
  };
  project: {
    completed: boolean;
    started: boolean;
    href: string;
  };
  practice: {
    completedCount: number;
    totalCount: number;
    nextProblem: {
      number: number;
      title: string;
      href: string;
    } | null;
  };
  cssPractice: {
    completedCount: number;
    totalCount: number;
    nextChallenge: {
      number: number;
      title: string;
      href: string;
    } | null;
  };
};

export function LearnerMilestoneChecklist({
  course,
  project,
  practice,
  cssPractice,
}: LearnerMilestoneChecklistProps) {
  const practicePathCompleted =
    practice.totalCount > 0 &&
    practice.completedCount === practice.totalCount;
  const completedMilestones =
    Number(course.completed) +
    Number(project.completed) +
    Number(practicePathCompleted) +
    Number(
      cssPractice.totalCount > 0 &&
        cssPractice.completedCount === cssPractice.totalCount,
    );
  const cssPathCompleted =
    cssPractice.totalCount > 0 &&
    cssPractice.completedCount === cssPractice.totalCount;
  const nextProblemNumber = practice.nextProblem
    ? String(practice.nextProblem.number).padStart(2, "0")
    : null;
  const nextCssChallengeNumber = cssPractice.nextChallenge
    ? String(cssPractice.nextChallenge.number).padStart(2, "0")
    : null;

  return (
    <section
      className="dashboard-learning-path"
      aria-labelledby="dashboard-learning-path-title"
    >
      <header className="dashboard-learning-path-heading">
        <div>
          <p className="course-kicker">Your learning path</p>
          <h2 id="dashboard-learning-path-title">
            Learn it. Build it. Prove it. Style it.
          </h2>
          <p>
            Follow one connected route from the semantic HTML lesson to a saved
            project, then into JavaScript and CSS practice.
          </p>
        </div>
        <div className="dashboard-path-summary">
          <span>Milestones complete</span>
          <strong>{completedMilestones}/4</strong>
          <Link href="/profile">
            View learning record <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      <ol className="dashboard-milestone-list">
        <li
          className={
            course.completed
              ? "dashboard-milestone is-complete"
              : "dashboard-milestone is-current"
          }
          aria-current={course.completed ? undefined : "step"}
        >
          <span className="dashboard-milestone-marker" aria-hidden="true">
            {course.completed ? "✓" : "01"}
          </span>
          <div className="dashboard-milestone-copy">
            <span>
              {course.completed
                ? `Completed · ${course.completedLessons}/${course.totalLessons} lessons`
                : course.completedLessons > 0
                  ? `${course.completedLessons}/${course.totalLessons} lessons complete`
                  : `Start here · ${course.totalEstimatedMinutes} minutes`}
            </span>
            <h3>
              {course.completed
                ? "HTML and CSS foundations complete"
                : `Next: ${course.nextLessonTitle}`}
            </h3>
            <p>
              Build semantic HTML, style it with predictable CSS, and pass both
              four-question recall checks.
            </p>
          </div>
          {!course.completed ? (
            <Link className="dashboard-path-action" href={course.href}>
              {course.completedLessons > 0
                ? `Continue to ${course.nextLessonTitle}`
                : "Start the first lesson"}{" "}
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </li>

        <li
          className={
            project.completed
              ? "dashboard-milestone is-complete"
              : course.completed
                ? "dashboard-milestone is-current"
                : "dashboard-milestone"
          }
          aria-current={
            course.completed && !project.completed ? "step" : undefined
          }
        >
          <span className="dashboard-milestone-marker" aria-hidden="true">
            {project.completed ? "✓" : "02"}
          </span>
          <div className="dashboard-milestone-copy">
            <span>
              {project.completed
                ? "Completed · 6/6 checks"
                : project.started
                  ? "Saved draft ready"
                  : course.completed
                    ? "Your next milestone"
                    : "After the lesson"}
            </span>
            <h3>Build your semantic HTML field guide</h3>
            <p>
              Turn the lesson into a private project that saves with your
              account.
            </p>
          </div>
          {course.completed && !project.completed ? (
            <Link className="dashboard-path-action" href={project.href}>
              {project.started
                ? "Continue the field guide"
                : "Build the field guide"}
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </li>

        <li
          className={
            practicePathCompleted
              ? "dashboard-milestone is-complete"
              : project.completed
                ? "dashboard-milestone is-current"
                : "dashboard-milestone"
          }
          aria-current={
            project.completed && !practicePathCompleted ? "step" : undefined
          }
        >
          <span className="dashboard-milestone-marker" aria-hidden="true">
            {practicePathCompleted ? "✓" : "03"}
          </span>
          <div className="dashboard-milestone-copy">
            <span>
              {practicePathCompleted
                ? "Completed · 6/6 Accepted"
                : project.completed
                  ? `${practice.completedCount}/${practice.totalCount} Accepted`
                  : "After the field guide"}
            </span>
            <h3>
              {practice.nextProblem
                ? `Solve problem ${nextProblemNumber}: ${practice.nextProblem.title}`
                : "JavaScript beginner path complete"}
            </h3>
            <p>
              {practice.nextProblem
                ? "Run your solution against fixed checks and save the Accepted result."
                : "Every solution and Accepted result is saved to your learner record."}
            </p>
          </div>
          {project.completed && practice.nextProblem ? (
            <Link
              className="dashboard-path-action"
              href={practice.nextProblem.href}
            >
              {practice.completedCount > 0
                ? `Continue at problem ${nextProblemNumber}`
                : "Start problem 01"}
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </li>

        <li
          className={
            cssPathCompleted
              ? "dashboard-milestone is-complete"
              : practicePathCompleted
                ? "dashboard-milestone is-current"
                : "dashboard-milestone"
          }
          aria-current={
            practicePathCompleted && !cssPathCompleted ? "step" : undefined
          }
        >
          <span className="dashboard-milestone-marker" aria-hidden="true">
            {cssPathCompleted ? "✓" : "04"}
          </span>
          <div className="dashboard-milestone-copy">
            <span>
              {cssPathCompleted
                ? "Completed · 6/6 challenges"
                : practicePathCompleted
                  ? `${cssPractice.completedCount}/${cssPractice.totalCount} completed`
                  : "After JavaScript practice"}
            </span>
            <h3>
              {cssPractice.nextChallenge
                ? `Complete CSS ${nextCssChallengeNumber}: ${cssPractice.nextChallenge.title}`
                : "CSS foundations path complete"}
            </h3>
            <p>
              {cssPractice.nextChallenge
                ? "Apply selectors and the box model, then save the completed result."
                : "Every CSS draft, attempt, and completed challenge is saved to your learner record."}
            </p>
          </div>
          {practicePathCompleted && cssPractice.nextChallenge ? (
            <Link
              className="dashboard-path-action"
              href={cssPractice.nextChallenge.href}
            >
              {cssPractice.completedCount > 0
                ? `Continue at CSS ${nextCssChallengeNumber}`
                : "Start CSS challenge 01"}
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </li>
      </ol>
    </section>
  );
}
