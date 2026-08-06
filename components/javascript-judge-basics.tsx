"use client";

import Link from "next/link";
import { useState } from "react";

const ANSWERS = [
  { value: "12", label: 'It returns "12"' },
  { value: "57", label: 'It returns "57"' },
  { value: "undefined", label: "It returns undefined" },
] as const;

export function JavaScriptJudgeBasics() {
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [checkedAnswer, setCheckedAnswer] = useState("");
  const isCorrect = checkedAnswer === "57";

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
                  }}
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
              onClick={() => setCheckedAnswer(selectedAnswer)}
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
                <p><code>map(Number)</code> converts both values before <code>+</code> runs.</p>
                <Link className="primary-action" href="/practice/sum-two-numbers">
                  Start problem 01 <span aria-hidden="true">→</span>
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <p className="judge-privacy-note">
        Your answer stays in this browser. This lesson creates no judged attempt or progress record.
      </p>
    </>
  );
}
