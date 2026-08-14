import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav, SkipLink } from "@/app/site-chrome";
import { PrintInterviewRehearsalButton } from "@/components/print-interview-rehearsal-button";
import { getInterviewDrillForStudent } from "@/db/interview-drill";
import { getSignInHref } from "@/lib/account-destination";
import { auth } from "@/lib/auth";
import {
  INTERVIEW_SELF_RATINGS,
  JAVASCRIPT_INTERVIEW_DRILL,
} from "@/lib/interview-drill";
import styles from "../interview-rehearsal.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript interview rehearsal | Lovable Original",
  description:
    "Rehearse your five saved JavaScript fundamentals answers with authored check points and follow-up prompts.",
  robots: {
    index: false,
    follow: false,
  },
};

const REHEARSAL_PROMPTS = {
  "const-let-var": {
    spokenCue:
      "Start with the default you use, then explain the one reason you would choose each alternative.",
    followUp:
      "If const blocks reassignment, why can an object declared with const still change?",
  },
  "strict-equality": {
    spokenCue:
      "Give the safe default first, then use one small comparison to explain coercion.",
    followUp:
      "When could deliberate coercion be clearer than converting the value yourself?",
  },
  closures: {
    spokenCue:
      "Describe what the inner function remembers before naming one place you have used that behavior.",
    followUp:
      "What can go wrong when a closure keeps more state alive than the program still needs?",
  },
  "async-order": {
    spokenCue:
      "Walk through synchronous work, microtasks, and the next task in that exact order.",
    followUp:
      "Would a long synchronous loop change which callback is queued first, or only when callbacks can run?",
  },
  "array-transformations": {
    spokenCue:
      "Name the shape of each result, then explain when the most flexible method becomes the least readable.",
    followUp:
      "How would you choose between chaining filter and map versus writing one reduce?",
  },
} as const;

function formatCompletedDate(value: string | null) {
  if (!value) {
    return "Saved round";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function JavaScriptInterviewRehearsalPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(
      getSignInHref("/interview/javascript-fundamentals/rehearsal"),
    );
  }

  const progress = await getInterviewDrillForStudent(
    session.user.id,
    JAVASCRIPT_INTERVIEW_DRILL.slug,
  );
  const answerByQuestion = new Map(
    progress?.answers.map((answer) => [answer.questionSlug, answer]),
  );
  const hasCompleteRound =
    progress?.status === "completed" &&
    JAVASCRIPT_INTERVIEW_DRILL.questions.every((question) =>
      answerByQuestion.has(question.slug),
    );

  if (!progress || !hasCompleteRound) {
    return (
      <>
        <SkipLink />
        <SiteNav currentPage="interview" />
        <main id="main-content" className={styles.locked}>
          <div className={styles.lockMark} aria-hidden="true">
            5/5
          </div>
          <p className="eyebrow">Private interview rehearsal</p>
          <h1>Finish the five-question round first.</h1>
          <p>
            Save one answer and self-rating for every JavaScript fundamentals
            prompt. Your private rehearsal sheet will then reuse that exact
            round without creating another score.
          </p>
          <Link
            className="primary-action"
            href="/interview/javascript-fundamentals"
          >
            Continue the interview drill <span aria-hidden="true">→</span>
          </Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  const readyCount = progress.answers.filter(
    (answer) => answer.rating === "ready",
  ).length;
  const completedDate = formatCompletedDate(progress.completedAt);

  return (
    <div className={styles.page}>
      <div className={styles.screenOnly}>
        <SkipLink />
        <SiteNav currentPage="interview" />
      </div>
      <main
        id="main-content"
        className={styles.shell}
        aria-labelledby="interview-rehearsal-title"
      >
        <Link
          className={`${styles.backLink} ${styles.screenOnly}`}
          href="/interview/javascript-fundamentals"
        >
          <span aria-hidden="true">←</span> JavaScript interview drill
        </Link>

        <header className={styles.hero}>
          <div>
            <p className={styles.privateCue}>Private interview rehearsal</p>
            <p className="eyebrow">Completed round · 5 saved answers</p>
            <h1 id="interview-rehearsal-title">
              Turn saved answers into a spoken round.
            </h1>
            <p>
              Explain each answer in about 60 seconds, check the three authored
              points, then handle one follow-up without opening the editor.
            </p>
            <a className={styles.primaryAction} href="#question-1">
              Start with question 1 <span aria-hidden="true">↓</span>
            </a>
          </div>
          <aside aria-label="Saved interview round">
            <span>Saved round</span>
            <strong>5/5</strong>
            <p>JavaScript fundamentals</p>
            <dl>
              <div>
                <dt>Ready to explain</dt>
                <dd>{readyCount}/5</dd>
              </div>
              <div>
                <dt>Completed</dt>
                <dd>{completedDate}</dd>
              </div>
              <div>
                <dt>Visibility</dt>
                <dd>Account only</dd>
              </div>
            </dl>
          </aside>
        </header>

        <section className={styles.loop} aria-labelledby="rehearsal-loop-title">
          <div>
            <p className="eyebrow">One repeatable loop</p>
            <h2 id="rehearsal-loop-title">Answer, check, follow up.</h2>
          </div>
          <ol>
            <li>
              <span>01</span>
              <strong>Say it in 60 seconds</strong>
              <p>Use your saved answer as a starting point, not a script.</p>
            </li>
            <li>
              <span>02</span>
              <strong>Check three points</strong>
              <p>Notice what you covered and what still needs one sentence.</p>
            </li>
            <li>
              <span>03</span>
              <strong>Handle the follow-up</strong>
              <p>Answer once without notes, then tighten the explanation.</p>
            </li>
          </ol>
        </section>

        <section className={styles.round} aria-labelledby="saved-round-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className="eyebrow">Your saved round</p>
              <h2 id="saved-round-title">Five answers to rehearse aloud.</h2>
            </div>
            <span>{readyCount} marked ready</span>
          </div>

          <ol className={styles.questionList}>
            {JAVASCRIPT_INTERVIEW_DRILL.questions.map((question, index) => {
              const answer = answerByQuestion.get(question.slug)!;
              const rating = INTERVIEW_SELF_RATINGS.find(
                (item) => item.value === answer.rating,
              );
              const prompt = REHEARSAL_PROMPTS[question.slug];

              return (
                <li
                  className={styles.question}
                  id={`question-${index + 1}`}
                  key={question.slug}
                >
                  <header>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <p>{question.eyebrow}</p>
                      <h3>{question.prompt}</h3>
                    </div>
                    <strong data-rating={answer.rating}>
                      {rating?.shortLabel ?? "Saved"}
                    </strong>
                  </header>
                  <div className={styles.answerGrid}>
                    <section aria-labelledby={`saved-answer-${question.slug}`}>
                      <p
                        className="eyebrow"
                        id={`saved-answer-${question.slug}`}
                      >
                        Your saved answer
                      </p>
                      <blockquote>{answer.answer}</blockquote>
                      <p className={styles.spokenCue}>
                        <strong>Say it aloud:</strong> {prompt.spokenCue}
                      </p>
                    </section>
                    <aside aria-label={`Check points for question ${index + 1}`}>
                      <p className="eyebrow">Check after speaking</p>
                      <ul>
                        {question.rubric.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <div className={styles.followUp}>
                        <span>Follow-up</span>
                        <p>{prompt.followUp}</p>
                      </div>
                    </aside>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className={styles.actions} aria-labelledby="rehearsal-next-title">
          <div>
            <p className="eyebrow">Keep the record honest</p>
            <h2 id="rehearsal-next-title">
              Change the answer in the drill, not on this sheet.
            </h2>
            <p>
              This page reflects your current saved round. It is private
              practice, not a hiring assessment, public credential, or claim
              that your explanation was independently reviewed.
            </p>
          </div>
          <div className={styles.actionButtons}>
            <Link href="/interview/javascript-fundamentals">
              {readyCount < 5
                ? `Improve ${5 - readyCount} saved ${5 - readyCount === 1 ? "answer" : "answers"}`
                : "Review saved answers"}
            </Link>
            <PrintInterviewRehearsalButton className={styles.printButton} />
          </div>
        </section>
      </main>
      <div className={styles.screenOnly}>
        <SiteFooter />
      </div>
    </div>
  );
}
