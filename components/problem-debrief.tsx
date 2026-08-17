import Link from "next/link";
import { PrintProjectDebriefButton } from "@/components/print-project-debrief-button";
import type { CodingProblem } from "@/lib/coding-problems";
import { getCodingSolutionReview } from "@/lib/coding-solution-review";
import {
  parsePracticeJournal,
  type SavedPracticeSolutionNote,
} from "@/lib/practice-solution-note";

type ProblemDebriefProps = {
  problem: CodingProblem;
  acceptedCode: string;
  solutionNote: SavedPracticeSolutionNote | null;
};

export function ProblemDebrief({
  problem,
  acceptedCode,
  solutionNote,
}: ProblemDebriefProps) {
  const review = getCodingSolutionReview(problem.slug, acceptedCode);
  const journal = parsePracticeJournal(solutionNote?.content ?? "");
  const reviewPoints = review?.points ?? [];
  const interviewPrompts = [
    {
      question: "How did you turn the input into the required output?",
      cue: `Start with “${problem.inputFormat}” and finish with “${problem.outputFormat}”`,
    },
    {
      question: `Why does “${problem.acceptedExplanation.concept}” fit here?`,
      cue: problem.acceptedExplanation.whyItWorks,
    },
    {
      question: "Which edge case would you test first after a change?",
      cue:
        reviewPoints.find((point) => point.label === "Keep testing")?.text ??
        problem.acceptedExplanation.commonMistake,
    },
  ];
  const journalSummary = [
    ["Input shape", journal.inputShape],
    ["Edge case", journal.edgeCase],
    ["Ordered approach", journal.steps],
    ["What worked", journal.reflection],
  ]
    .filter(([, value]) => value.trim().length > 0)
    .map(([label, value]) => `${label.toUpperCase()}\n${value}`)
    .join("\n\n");

  return (
    <section
      className="project-debrief-shell problem-debrief-shell"
      id="main-content"
      tabIndex={-1}
      aria-labelledby="problem-debrief-title"
    >
      <Link
        className="project-back-link project-debrief-screen-only"
        href={`/practice/${problem.slug}`}
      >
        <span aria-hidden="true">←</span>
        {problem.title}
      </Link>

      <header className="project-debrief-hero problem-debrief-hero">
        <div>
          <p className="project-private-cue">Private problem debrief</p>
          <p className="eyebrow">
            Problem {String(problem.number).padStart(2, "0")} · Accepted evidence
          </p>
          <h1 id="problem-debrief-title">Explain why your solution works.</h1>
          <p>
            Turn one saved Accepted result into a clear walkthrough you can
            rehearse, revise, and defend in your own words.
          </p>
        </div>
        <aside aria-label="Saved problem result">
          <span>Saved verdict</span>
          <strong>Accepted</strong>
          <p>{problem.title}</p>
          <dl>
            <div>
              <dt>Judge</dt>
              <dd>{problem.tests.length}/{problem.tests.length} checks</dd>
            </div>
            <div>
              <dt>Visibility</dt>
              <dd>Account only</dd>
            </div>
          </dl>
        </aside>
      </header>

      <div className="project-debrief-grid">
        <section
          className="project-debrief-evidence"
          aria-labelledby="problem-debrief-evidence-title"
        >
          <div className="project-debrief-section-heading">
            <div>
              <p className="eyebrow">Saved solution evidence</p>
              <h2 id="problem-debrief-evidence-title">
                Separate what the source shows from what the judge proved.
              </h2>
            </div>
            <span>{problem.tests.length} checks passed</span>
          </div>
          <div className="project-debrief-checks problem-debrief-checks">
            {reviewPoints.map((point) => (
              <article key={point.label}>
                <span aria-hidden="true">
                  {point.kind === "strength" ? "✓" : "↗"}
                </span>
                <div>
                  <strong>{point.label}</strong>
                  <p>{point.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside
          className="project-debrief-portfolio"
          aria-labelledby="problem-debrief-wording-title"
        >
          <p className="eyebrow">Truthful interview wording</p>
          <h2 id="problem-debrief-wording-title">
            Describe the result without overstating it.
          </h2>
          <blockquote>
            Solved “{problem.title}” in JavaScript and passed {problem.tests.length}{" "}
            deterministic checks covering {problem.skill.toLowerCase()}.
          </blockquote>
          <p>
            This private debrief reflects one saved Accepted result. It is not
            a public credential, hiring assessment, or broader mastery claim.
          </p>
        </aside>
      </div>

      <section
        className="project-debrief-architecture"
        aria-labelledby="problem-debrief-walkthrough-title"
      >
        <div className="project-debrief-section-heading">
          <div>
            <p className="eyebrow">Three-part walkthrough</p>
            <h2 id="problem-debrief-walkthrough-title">
              Rebuild the explanation from the contract.
            </h2>
            <p>
              The judge proves outputs. Use this sequence to explain your own
              implementation choices without claiming the checker inspected
              more than it did.
            </p>
          </div>
        </div>
        <ol>
          <li>
            <span>01</span>
            <div>
              <strong>Read the input boundary</strong>
              <p>{problem.inputFormat}</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Name the core idea</strong>
              <p>{problem.acceptedExplanation.whyItWorks}</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Return the exact contract</strong>
              <p>{problem.outputFormat}</p>
            </div>
          </li>
        </ol>
      </section>

      <div className="project-debrief-grid project-debrief-prep-grid">
        <section
          className="project-debrief-interview"
          aria-labelledby="problem-debrief-interview-title"
        >
          <p className="eyebrow">Interview rehearsal</p>
          <h2 id="problem-debrief-interview-title">Answer aloud, then tighten.</h2>
          <ol>
            {interviewPrompts.map((prompt, index) => (
              <li key={prompt.question}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{prompt.question}</strong>
                  <p>{prompt.cue}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="project-debrief-readme"
          aria-labelledby="problem-debrief-journal-title"
        >
          <p className="eyebrow">Your private reasoning</p>
          <h2 id="problem-debrief-journal-title">Rehearse from your own notes.</h2>
          {journalSummary ? (
            <pre>{journalSummary}</pre>
          ) : (
            <div className="problem-debrief-empty-journal">
              <strong>No journal saved for this problem yet.</strong>
              <p>
                Return to the problem to record the input shape, edge case,
                ordered approach, or what worked.
              </p>
            </div>
          )}
        </section>
      </div>

      <details className="project-debrief-source">
        <summary>Review the exact Accepted source</summary>
        <div>
          <p>
            This is the learner-owned source attached to the latest Accepted
            submission for this problem.
          </p>
          <pre>{acceptedCode}</pre>
        </div>
      </details>

      <div className="project-debrief-actions project-debrief-screen-only">
        <PrintProjectDebriefButton label="Print problem debrief" />
        <Link className="text-link" href={`/practice/${problem.slug}`}>
          Return to the problem
        </Link>
        <Link className="text-link" href="/practice/progress">
          View JavaScript skill record
        </Link>
      </div>
    </section>
  );
}
