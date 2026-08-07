"use client";

import Link from "next/link";
import { useState } from "react";
import { JAVASCRIPT_TEST_DESIGN_EXERCISES } from "@/lib/javascript-test-design";
import { getFirstIncompleteExerciseIndex, getNextIncompleteExerciseIndex, saveJavaScriptLabExercise } from "@/lib/javascript-lab-progress";

type ResultState = "idle" | "saving" | "save-error" | "wrong" | "correct";
const exerciseIds = JAVASCRIPT_TEST_DESIGN_EXERCISES.map((exercise) => exercise.id);

export function JavaScriptTestDesignLab({ completedExerciseIds = [] }: { completedExerciseIds?: string[] }) {
  const [exerciseIndex, setExerciseIndex] = useState(() => getFirstIncompleteExerciseIndex(exerciseIds, completedExerciseIds));
  const [selectedInput, setSelectedInput] = useState("");
  const [resultState, setResultState] = useState<ResultState>("idle");
  const [completedIds, setCompletedIds] = useState(() => new Set(completedExerciseIds));

  const exercise = JAVASCRIPT_TEST_DESIGN_EXERCISES[exerciseIndex] ?? null;

  async function checkTest() {
    if (!exercise || !selectedInput) return;

    if (selectedInput === exercise.correctInput) {
      setResultState("saving");
      const saveResponse = await saveJavaScriptLabExercise("test-design", exercise.id);
      if (!saveResponse?.ok) {
        setResultState("save-error");
        return;
      }

      setResultState("correct");
      setCompletedIds((current) => new Set(current).add(exercise.id));
      return;
    }

    setResultState("wrong");
  }

  function continueLab() {
    setExerciseIndex(getNextIncompleteExerciseIndex(exerciseIds, [...completedIds], exerciseIndex));
    setSelectedInput("");
    setResultState("idle");
  }

  if (!exercise) {
    return (
      <section
        className="test-design-complete"
        aria-labelledby="test-design-complete-title"
      >
        <div className="test-design-complete-mark" aria-hidden="true">
          4/4
        </div>
        <div>
          <p className="eyebrow">Test-design lab complete</p>
          <h2 id="test-design-complete-title">
            You found the cases the happy path missed.
          </h2>
          <p>
            You tested input shape, negative values, initialization, and
            overlapping conditions. Carry that checklist into every judged
            solution before you submit.
          </p>
          <Link className="primary-action" href="/practice/sum-two-numbers">
            Start judged practice <span aria-hidden="true">→</span>
          </Link>
          <Link className="test-design-return-link" href="/practice">
            Return to the practice arena
          </Link>
        </div>
      </section>
    );
  }

  const selectedChoice = exercise.choices.find(
    (choice) => choice.input === selectedInput,
  );
  const completedCount = completedIds.size;
  const progress =
    (completedCount / JAVASCRIPT_TEST_DESIGN_EXERCISES.length) * 100;

  return (
    <section
      className="test-design-workbench"
      aria-labelledby="test-design-exercise-title"
    >
      <header className="test-design-progress">
        <div>
          <span>
            Test {exercise.number} of {JAVASCRIPT_TEST_DESIGN_EXERCISES.length}
          </span>
          <strong>{exercise.concept}</strong>
        </div>
        <div
          className="test-design-progress-track"
          role="progressbar"
          aria-label="Test-design exercises completed"
          aria-valuemin={0}
          aria-valuemax={JAVASCRIPT_TEST_DESIGN_EXERCISES.length}
          aria-valuenow={completedCount}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="test-design-grid">
        <div className="test-design-code-panel">
          <div>
            <span>faulty-{String(exercise.number).padStart(2, "0")}.js</span>
            <small>Almost correct</small>
          </div>
          <pre aria-label={`Faulty JavaScript for ${exercise.title}`}>
            <code>{exercise.faultyCode}</code>
          </pre>
        </div>

        <div className="test-design-choice-panel">
          <p className="eyebrow">Find one breaking input</p>
          <h2 id="test-design-exercise-title">{exercise.title}</h2>
          <p className="test-design-problem">{exercise.problem}</p>

          <fieldset disabled={resultState === "correct" || resultState === "saving"}>
            <legend>Which test proves this solution is wrong?</legend>
            <div className="test-design-choices">
              {exercise.choices.map((choice) => (
                <label key={choice.input}>
                  <input
                    aria-label={`Input ${choice.input.replace(/\n/g, " ")}`}
                    checked={selectedInput === choice.input}
                    name="test-input"
                    onChange={() => {
                      setSelectedInput(choice.input);
                      if (resultState === "wrong" || resultState === "save-error") setResultState("idle");
                    }}
                    type="radio"
                    value={choice.input}
                  />
                  <span>
                    <small>Input</small>
                    <code>{choice.input}</code>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {resultState === "wrong" ? (
            <div className="test-design-feedback is-wrong" role="status">
              <strong>That case still passes.</strong>
              <p>{exercise.recoveryCue}</p>
            </div>
          ) : null}

          {resultState === "save-error" ? (
            <div className="test-design-feedback is-wrong" role="status">
              <strong>That test is correct, but completion could not be saved.</strong>
              <p>Check this test again to retry.</p>
            </div>
          ) : null}

          {resultState === "correct" && selectedChoice ? (
            <div className="test-design-feedback is-correct" role="status">
              <strong>This test exposes the defect.</strong>
              <div className="test-design-output-comparison">
                <p>
                  <span>Expected</span>
                  <code>{selectedChoice.expectedOutput}</code>
                </p>
                <p>
                  <span>Faulty result</span>
                  <code>{selectedChoice.faultyOutput}</code>
                </p>
              </div>
              <p>{exercise.explanation}</p>
              <p className="test-design-takeaway">
                <span>Keep this rule:</span> {exercise.takeaway}
              </p>
            </div>
          ) : null}

          <div className="test-design-action-row">
            {resultState === "correct" ? (
              <button onClick={continueLab} type="button">
                {exercise.number === JAVASCRIPT_TEST_DESIGN_EXERCISES.length
                  ? "Finish the lab"
                  : "Next test"}
                <span aria-hidden="true">→</span>
              </button>
            ) : (
              <button
                disabled={!selectedInput || resultState === "saving"}
                onClick={checkTest}
                type="button"
              >
                {resultState === "saving" ? "Saving completion…" : "Check this test"}
              </button>
            )}
            <span>Your answer stays local. Completion saves privately.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
