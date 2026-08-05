"use client";

import Link from "next/link";
import { useState } from "react";
import { ALGORITHM_EFFICIENCY_EXERCISES } from "@/lib/javascript-algorithm-efficiency";

type ResultState = "idle" | "wrong" | "correct";

export function JavaScriptAlgorithmEfficiencyLab() {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [selectedApproachId, setSelectedApproachId] = useState("");
  const [resultState, setResultState] = useState<ResultState>("idle");
  const [completedCount, setCompletedCount] = useState(0);
  const exercise = ALGORITHM_EFFICIENCY_EXERCISES[exerciseIndex] ?? null;

  function checkApproach() {
    if (!exercise || !selectedApproachId) return;

    if (selectedApproachId === exercise.correctApproachId) {
      setResultState("correct");
      setCompletedCount((count) => Math.max(count, exercise.number));
      return;
    }

    setResultState("wrong");
  }

  function continueLab() {
    setExerciseIndex((index) => index + 1);
    setSelectedApproachId("");
    setResultState("idle");
  }

  if (!exercise) {
    return (
      <section
        className="efficiency-complete"
        aria-labelledby="efficiency-complete-title"
      >
        <span className="efficiency-complete-mark" aria-hidden="true">
          4/4
        </span>
        <div>
          <p className="eyebrow">Algorithm efficiency lab complete</p>
          <h2 id="efficiency-complete-title">
            You can compare approaches before the input gets large.
          </h2>
          <p>
            You practiced constant, linear, and quadratic growth, then used a
            Set to trade a little memory for much less repeated work.
          </p>
          <Link className="primary-action" href="/practice/sum-two-numbers">
            Start judged practice <span aria-hidden="true">→</span>
          </Link>
          <Link className="efficiency-return-link" href="/practice">
            Return to the practice arena
          </Link>
        </div>
      </section>
    );
  }

  const selectedApproach = exercise.approaches.find(
    (approach) => approach.id === selectedApproachId,
  );
  const progress =
    (completedCount / ALGORITHM_EFFICIENCY_EXERCISES.length) * 100;

  return (
    <section
      className="efficiency-workbench"
      aria-labelledby="efficiency-exercise-title"
    >
      <header className="efficiency-progress">
        <div>
          <span>
            Decision {exercise.number} of {ALGORITHM_EFFICIENCY_EXERCISES.length}
          </span>
          <strong>{exercise.concept}</strong>
        </div>
        <div
          className="efficiency-progress-track"
          role="progressbar"
          aria-label="Efficiency decisions completed"
          aria-valuemin={0}
          aria-valuemax={ALGORITHM_EFFICIENCY_EXERCISES.length}
          aria-valuenow={completedCount}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="efficiency-body">
        <div className="efficiency-prompt">
          <div>
            <p className="eyebrow">Choose the approach that scales</p>
            <h2 id="efficiency-exercise-title">{exercise.title}</h2>
          </div>
          <div>
            <p>{exercise.scenario}</p>
            <span>{exercise.scale}</span>
          </div>
        </div>

        <fieldset disabled={resultState === "correct"}>
          <legend>Which approach keeps the work lower as the input grows?</legend>
          <div className="efficiency-approaches">
            {exercise.approaches.map((approach, index) => (
              <label key={approach.id}>
                <input
                  checked={selectedApproachId === approach.id}
                  name="efficiency-approach"
                  onChange={() => {
                    setSelectedApproachId(approach.id);
                    if (resultState === "wrong") setResultState("idle");
                  }}
                  type="radio"
                  value={approach.id}
                />
                <span className="efficiency-approach-card">
                  <span className="efficiency-approach-heading">
                    <small>Approach {String(index + 1).padStart(2, "0")}</small>
                    <strong>{approach.title}</strong>
                  </span>
                  <pre>
                    <code>{approach.code}</code>
                  </pre>
                  <span className="efficiency-cost">
                    <span>{approach.workAtScale}</span>
                    <strong>{approach.growth}</strong>
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {resultState === "wrong" ? (
          <div className="efficiency-feedback is-wrong" role="status">
            <strong>That approach repeats more work.</strong>
            <p>{exercise.recoveryCue}</p>
          </div>
        ) : null}

        {resultState === "correct" && selectedApproach ? (
          <div className="efficiency-feedback is-correct" role="status">
            <div>
              <span>Better growth</span>
              <strong>{selectedApproach.growth}</strong>
            </div>
            <p>{exercise.explanation}</p>
            <p className="efficiency-takeaway">
              <span>Keep this:</span> {exercise.takeaway}
            </p>
          </div>
        ) : null}

        <div className="efficiency-action-row">
          {resultState === "correct" ? (
            <button onClick={continueLab} type="button">
              {exercise.number === ALGORITHM_EFFICIENCY_EXERCISES.length
                ? "Finish the lab"
                : "Next decision"}
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              disabled={!selectedApproachId}
              onClick={checkApproach}
              type="button"
            >
              Check this approach
            </button>
          )}
          <span>No answer, score, or learner record is saved.</span>
        </div>
      </div>
    </section>
  );
}
