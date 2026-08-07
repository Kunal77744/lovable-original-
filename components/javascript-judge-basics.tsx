"use client";

import Link from "next/link";
import { useState } from "react";
import {
  JAVASCRIPT_JUDGE_CONTRACT_EXERCISE_ID,
} from "@/lib/javascript-foundations";
import { saveJavaScriptLabExercise } from "@/lib/javascript-lab-progress";

const ANSWERS = [
  { value: "12", label: 'It returns "12"' },
  { value: "57", label: 'It returns "57"' },
  { value: "undefined", label: "It returns undefined" },
] as const;

type JavaScriptJudgeBasicsProps = {
  initialCompleted?: boolean;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function JavaScriptJudgeBasics({
  initialCompleted = false,
}: JavaScriptJudgeBasicsProps) {
  const [selectedAnswer, setSelectedAnswer] = useState(
    initialCompleted ? "57" : "",
  );
  const [checkedAnswer, setCheckedAnswer] = useState(
    initialCompleted ? "57" : "",
  );
  const [saveState, setSaveState] = useState<SaveState>(
    initialCompleted ? "saved" : "idle",
  );
  const isCorrect = checkedAnswer === "57";

  async function checkReasoning() {
    setCheckedAnswer(selectedAnswer);
    if (selectedAnswer !== "57") return;

    setSaveState("saving");
    const response = await saveJavaScriptLabExercise(
      "foundations",
      JAVASCRIPT_JUDGE_CONTRACT_EXERCISE_ID,
    );
    setSaveState(response?.ok ? "saved" : "error");
  }

  return (
    <>
      <section className="judge-trace" aria-labelledby="judge-trace-title">
        <div className="judge-trace-heading">
          <p className="eyebrow">One input, four moments</p>
          <h2 id="judge-trace-title">See what the judge sees.</h2>
        </div>

        <ol className="judge-trace-steps">
          <li>
            <span>01</span>
            <small>Input text</small>
            <code>&quot;5 7&quot;</code>
          </li>
          <li>
            <span>02</span>
            <small>Function call</small>
            <code>solve(&quot;5 7&quot;)</code>
          </li>
          <li>
            <span>03</span>
            <small>Parsed values</small>
            <code>[5, 7]</code>
          </li>
          <li>
            <span>04</span>
            <small>Exact return</small>
            <code>&quot;12&quot;</code>
          </li>
        </ol>

        <div className="judge-code-card">
          <div className="judge-code-bar">
            <span>solution.js</span>
            <span>Called once per test</span>
          </div>
          <pre>
            <code>{`function solve(input) {
  const [a, b] = input.trim().split(/\\s+/).map(Number);
  return String(a + b);
}`}</code>
          </pre>
        </div>

        <div className="judge-rules" aria-label="Judge rules">
          <article>
            <span>Input</span>
            <h3>Text arrives first.</h3>
            <p>Split and convert the pieces before you calculate with them.</p>
          </article>
          <article>
            <span>Output</span>
            <h3>The return is judged.</h3>
            <p>Return the exact answer. Console logs are useful for debugging, not grading.</p>
          </article>
          <article>
            <span>Tests</span>
            <h3>One function, many inputs.</h3>
            <p>The same <code>solve(input)</code> must work for every hidden test.</p>
          </article>
        </div>
      </section>

      <section className="judge-checkpoint" aria-labelledby="judge-checkpoint-title">
        <div className="judge-checkpoint-copy">
          <p className="eyebrow">Reasoning checkpoint</p>
          <h2 id="judge-checkpoint-title">Catch the quiet type mistake.</h2>
          <p>
            This version skips number conversion. With input <code>&quot;5 7&quot;</code>,
            what does it return?
          </p>
          <pre>
            <code>{`function solve(input) {
  const [a, b] = input.trim().split(" ");
  return a + b;
}`}</code>
          </pre>
        </div>

        <div className="judge-answer-panel">
          <fieldset>
            <legend>Choose one answer</legend>
            {ANSWERS.map((answer) => (
              <label key={answer.value}>
                <input
                  type="radio"
                  name="judge-answer"
                  value={answer.value}
                  checked={selectedAnswer === answer.value}
                  onChange={(event) => {
                    setSelectedAnswer(event.target.value);
                    setCheckedAnswer("");
                    setSaveState("idle");
                  }}
                  disabled={saveState === "saving"}
                />
                <span>{answer.label}</span>
              </label>
            ))}
          </fieldset>

          {!isCorrect ? (
            <button
              type="button"
              className="primary-action judge-check-button"
              disabled={!selectedAnswer}
              onClick={checkReasoning}
            >
              Check my reasoning
            </button>
          ) : null}

          <div className="judge-answer-status" aria-live="polite" aria-atomic="true">
            {checkedAnswer && !isCorrect ? (
              <div className="judge-answer-feedback is-retry">
                <strong>Look at the values before the plus sign.</strong>
                <p><code>split</code> produced two strings. Without conversion, <code>+</code> joins them.</p>
              </div>
            ) : null}
            {isCorrect ? (
              <div className="judge-answer-feedback is-correct">
                <span>Ready for the judge</span>
                <h3>Strings join. Numbers add.</h3>
                <p>
                  <code>map(Number)</code> converts both values before <code>+</code> runs.
                </p>
                {saveState === "saving" ? (
                  <p>Saving step 1 privately to your account…</p>
                ) : null}
                {saveState === "error" ? (
                  <>
                    <p>Step 1 could not be saved. Try again before continuing.</p>
                    <button
                      type="button"
                      className="primary-action judge-check-button"
                      onClick={checkReasoning}
                    >
                      Retry private save
                    </button>
                  </>
                ) : null}
                {saveState === "saved" ? (
                  <Link className="primary-action" href="/practice/foundations">
                    Continue to step 2 <span aria-hidden="true">→</span>
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <p className="judge-privacy-note">
        Your answer stays in this browser. Completed steps save privately to your
        account without creating a judged attempt.
      </p>
    </>
  );
}
