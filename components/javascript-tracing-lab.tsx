"use client";

import Link from "next/link";
import { useState } from "react";
import { JAVASCRIPT_TRACE_EXERCISES } from "@/lib/javascript-tracing";
import {
  getFirstIncompleteExerciseIndex,
  getNextIncompleteExerciseIndex,
  saveJavaScriptLabExercise,
} from "@/lib/javascript-lab-progress";

type ResultState = "idle" | "wrong" | "correct";
const exerciseIds = JAVASCRIPT_TRACE_EXERCISES.map((exercise) => exercise.id);

export function JavaScriptTracingLab({ completedExerciseIds = [] }: { completedExerciseIds?: string[] }) {
  const [exerciseIndex, setExerciseIndex] = useState(() => getFirstIncompleteExerciseIndex(exerciseIds, completedExerciseIds));
  const [selectedOutput, setSelectedOutput] = useState("");
  const [resultState, setResultState] = useState<ResultState>("idle");
  const [completedIds, setCompletedIds] = useState(() => new Set(completedExerciseIds));

  const exercise = JAVASCRIPT_TRACE_EXERCISES[exerciseIndex] ?? null;
  const complete = exercise === null;

  function checkPrediction() {
    if (!exercise || !selectedOutput) return;

    if (selectedOutput === exercise.correctOutput) {
      setResultState("correct");
      setCompletedIds((current) => new Set(current).add(exercise.id));
      void saveJavaScriptLabExercise("tracing", exercise.id);
      return;
    }

    setResultState("wrong");
  }

  function continueTracing() {
    setExerciseIndex(getNextIncompleteExerciseIndex(exerciseIds, [...completedIds], exerciseIndex));
    setSelectedOutput("");
    setResultState("idle");
  }

  if (complete) {
    return (
      <section className="tracing-complete" aria-labelledby="tracing-complete-title">
        <div className="tracing-complete-mark" aria-hidden="true">
          4/4
        </div>
        <div>
          <p className="eyebrow">Tracing lab complete</p>
          <h2 id="tracing-complete-title">You followed the code, line by line.</h2>
          <p>
            You traced assignments, a conditional, a loop, and a function return.
            Use the same habit when a judged solution behaves differently than you
            expected.
          </p>
          <Link className="primary-action" href="/practice/sum-two-numbers">
            Start judged practice <span aria-hidden="true">→</span>
          </Link>
          <Link className="tracing-return-link" href="/practice">
            Return to the practice arena
          </Link>
        </div>
      </section>
    );
  }

  const completedCount = completedIds.size;
  const progress = (completedCount / JAVASCRIPT_TRACE_EXERCISES.length) * 100;

  return (
    <section className="tracing-workbench" aria-labelledby="trace-exercise-title">
      <header className="tracing-progress">
        <div>
          <span>
            Trace {exercise.number} of {JAVASCRIPT_TRACE_EXERCISES.length}
          </span>
          <strong>{exercise.concept}</strong>
        </div>
        <div
          className="tracing-progress-track"
          role="progressbar"
          aria-label="Tracing exercises completed"
          aria-valuemin={0}
          aria-valuemax={JAVASCRIPT_TRACE_EXERCISES.length}
          aria-valuenow={completedCount}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="tracing-grid">
        <div className="tracing-code-panel">
          <span>trace-{String(exercise.number).padStart(2, "0")}.js</span>
          <pre aria-label={`JavaScript for ${exercise.title}`}>
            <code>{exercise.code}</code>
          </pre>
        </div>

        <div className="tracing-prediction-panel">
          <p className="eyebrow">Predict before checking</p>
          <h2 id="trace-exercise-title">{exercise.title}</h2>
          <p>{exercise.prompt}</p>

          <fieldset disabled={resultState === "correct"}>
            <legend>Choose the console output</legend>
            <div className="tracing-choices">
              {exercise.choices.map((choice) => (
                <label key={choice}>
                  <input
                    checked={selectedOutput === choice}
                    name="trace-output"
                    onChange={() => {
                      setSelectedOutput(choice);
                      if (resultState === "wrong") setResultState("idle");
                    }}
                    type="radio"
                    value={choice}
                  />
                  <span>{choice}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {resultState === "wrong" ? (
            <div className="tracing-feedback is-wrong" role="status">
              <strong>Not yet. Trace one value at a time.</strong>
              <p>{exercise.recoveryCue}</p>
            </div>
          ) : null}

          {resultState === "correct" ? (
            <div className="tracing-feedback is-correct" role="status">
              <strong>Correct. Here is the exact trace.</strong>
              <ol>
                {exercise.traceSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p>
                <span>Keep this rule:</span> {exercise.takeaway}
              </p>
            </div>
          ) : null}

          <div className="tracing-action-row">
            {resultState === "correct" ? (
              <button onClick={continueTracing} type="button">
                {exercise.number === JAVASCRIPT_TRACE_EXERCISES.length
                  ? "Finish the lab"
                  : "Next trace"}
                <span aria-hidden="true">→</span>
              </button>
            ) : (
              <button
                disabled={!selectedOutput}
                onClick={checkPrediction}
                type="button"
              >
                Check prediction
              </button>
            )}
            <span>Your answer stays local. Completion saves privately.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
