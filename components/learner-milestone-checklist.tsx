import Link from "next/link";
import {
  getJavaScriptFoundationsEntry,
  type JavaScriptLabCatalogProgress,
} from "@/lib/javascript-lab-progress";

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
  htmlCssCapstone: {
    state: "not-started" | "in-progress" | "completed";
    passedChecks: number;
  };
  javascriptPath: {
    labProgress: JavaScriptLabCatalogProgress;
    capstone: {
      state: "not-started" | "in-progress" | "completed";
      passedChecks: number;
    };
  };
};

export function LearnerMilestoneChecklist({
  course,
  project,
  practice,
  cssPractice,
  htmlCssCapstone,
  javascriptPath,
}: LearnerMilestoneChecklistProps) {
  const practicePathCompleted =
    practice.totalCount > 0 &&
    practice.completedCount === practice.totalCount;
  const cssPathCompleted =
    cssPractice.totalCount > 0 &&
    cssPractice.completedCount === cssPractice.totalCount;
  const nextProblemNumber = practice.nextProblem
    ? String(practice.nextProblem.number).padStart(2, "0")
    : null;
  const nextCssChallengeNumber = cssPractice.nextChallenge
    ? String(cssPractice.nextChallenge.number).padStart(2, "0")
    : null;
  const foundationsEntry = getJavaScriptFoundationsEntry(
    javascriptPath.labProgress,
    practice.completedCount,
  );
  const activeFoundationsEntry = project.completed ? foundationsEntry : null;
  const foundationsStarted =
    (activeFoundationsEntry?.completedCount ?? 0) > 0;
  const guidedJavaScriptCompleted =
    javascriptPath.labProgress.totalCount > 0 &&
    javascriptPath.labProgress.completedCount ===
      javascriptPath.labProgress.totalCount;
  const javascriptPathCompleted =
    guidedJavaScriptCompleted &&
    javascriptPath.capstone.state === "completed";
  const completedMilestones =
    Number(course.completed) +
    Number(project.completed) +
    Number(practicePathCompleted) +
    Number(cssPathCompleted) +
    Number(htmlCssCapstone.state === "completed") +
    Number(javascriptPathCompleted);
  const javascriptPathReady = htmlCssCapstone.state === "completed";
  const javascriptPathAction = !guidedJavaScriptCompleted
    ? {
        href: javascriptPath.labProgress.nextHref,
        label:
          javascriptPath.labProgress.completedCount > 0
            ? `Continue exercise ${javascriptPath.labProgress.nextExerciseNumber ?? 1}`
            : "Start guided JavaScript",
      }
    : javascriptPath.capstone.state !== "completed"
      ? {
          href: "/projects/javascript-expense-report",
          label:
            javascriptPath.capstone.state === "in-progress"
              ? "Resume the JavaScript capstone"
              : "Build the JavaScript capstone",
        }
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
          <strong>{completedMilestones}/6</strong>
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
                : activeFoundationsEntry
                  ? `${activeFoundationsEntry.completedCount}/${activeFoundationsEntry.totalCount} foundations steps saved`
                : project.completed
                  ? `${practice.completedCount}/${practice.totalCount} Accepted`
                  : "After the field guide"}
            </span>
            <h3>
              {activeFoundationsEntry
                ? "JavaScript foundations"
                : practice.nextProblem
                  ? `Solve problem ${nextProblemNumber}: ${practice.nextProblem.title}`
                  : "JavaScript beginner path complete"}
            </h3>
            <p>
              {activeFoundationsEntry
                ? "Learn the judge contract, parsing, branching, and loops before problem 01."
                : practice.nextProblem
                  ? "Run your solution against fixed checks and save the Accepted result."
                  : "Every solution and Accepted result is saved to your learner record."}
            </p>
          </div>
          {activeFoundationsEntry ? (
            <Link
              className="dashboard-path-action"
              href={activeFoundationsEntry.href}
            >
              {foundationsStarted
                ? `Continue foundations · step ${activeFoundationsEntry.nextExerciseNumber} of ${activeFoundationsEntry.totalCount}`
                : "Start JavaScript foundations"}
              <span aria-hidden="true">→</span>
            </Link>
          ) : project.completed && practice.nextProblem ? (
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
        <li
          className={
            htmlCssCapstone.state === "completed"
              ? "dashboard-milestone is-complete"
              : cssPathCompleted
                ? "dashboard-milestone is-current"
                : "dashboard-milestone"
          }
          aria-current={
            cssPathCompleted && htmlCssCapstone.state !== "completed"
              ? "step"
              : undefined
          }
        >
          <span className="dashboard-milestone-marker" aria-hidden="true">
            {htmlCssCapstone.state === "completed" ? "✓" : "05"}
          </span>
          <div className="dashboard-milestone-copy">
            <span>
              {htmlCssCapstone.state === "completed"
                ? "Completed · 6/6 outcomes"
                : htmlCssCapstone.state === "in-progress"
                  ? `Saved project · ${htmlCssCapstone.passedChecks}/6 passing`
                  : cssPathCompleted
                    ? "Your next milestone"
                    : "After CSS practice"}
            </span>
            <h3>Build a learning resource library</h3>
            <p>
              Combine semantic HTML, grid, selectors, and the box model in one
              private two-file capstone.
            </p>
          </div>
          {cssPathCompleted && htmlCssCapstone.state !== "completed" ? (
            <Link
              className="dashboard-path-action"
              href="/projects/html-css-resource-library"
            >
              {htmlCssCapstone.state === "in-progress"
                ? "Resume the capstone"
                : "Build the capstone"}
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </li>
        <li
          className={
            javascriptPathCompleted
              ? "dashboard-milestone is-complete"
              : javascriptPathReady
                ? "dashboard-milestone is-current"
                : "dashboard-milestone"
          }
          aria-current={
            javascriptPathReady && !javascriptPathCompleted ? "step" : undefined
          }
        >
          <span className="dashboard-milestone-marker" aria-hidden="true">
            {javascriptPathCompleted ? "✓" : "06"}
          </span>
          <div className="dashboard-milestone-copy">
            <span>
              {javascriptPathCompleted
                ? `Completed · ${javascriptPath.labProgress.totalCount} guided steps + 6/6 capstone`
                : !javascriptPathReady
                  ? "After the front-end capstone"
                  : !guidedJavaScriptCompleted
                    ? `${javascriptPath.labProgress.completedCount}/${javascriptPath.labProgress.totalCount} guided steps saved`
                    : javascriptPath.capstone.state === "in-progress"
                      ? `Guided practice saved · ${javascriptPath.capstone.passedChecks}/6 capstone outcomes passing`
                      : `${javascriptPath.labProgress.totalCount}/${javascriptPath.labProgress.totalCount} guided steps saved`}
            </span>
            <h3>
              {javascriptPathCompleted
                ? "JavaScript practice and capstone complete"
                : !guidedJavaScriptCompleted
                  ? javascriptPath.labProgress.nextLabTitle ??
                    "Continue guided JavaScript"
                  : "Build a JavaScript expense report"}
            </h3>
            <p>
              {javascriptPathCompleted
                ? "Your guided practice and integrated project are saved without replacing the six judged Accepted results."
                : !guidedJavaScriptCompleted
                  ? "Build fluency through guided exercises, then prove the combined skills in one private capstone."
                  : "Combine parsing, arrays, objects, sorting, totals, and exact formatting in one private project."}
            </p>
          </div>
          {javascriptPathReady && javascriptPathAction ? (
            <Link
              className="dashboard-path-action"
              href={javascriptPathAction.href}
            >
              {javascriptPathAction.label} <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </li>
      </ol>
    </section>
  );
}
