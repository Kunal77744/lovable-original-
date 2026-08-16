"use client";

import { useState } from "react";
import type { CodingRepairDrill as CodingRepairDrillModel } from "@/lib/coding-repair-drills";

type CodingRepairDrillProps = {
  drill: CodingRepairDrillModel;
  problemSlug: string;
  onReturnToEditor: () => void;
};

export function CodingRepairDrill({
  drill,
  problemSlug,
  onReturnToEditor,
}: CodingRepairDrillProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState("");
  const [checkedChoiceId, setCheckedChoiceId] = useState<string | null>(null);
  const isCorrect = checkedChoiceId === drill.correctChoiceId;
  const hasChecked = checkedChoiceId !== null;

  return (
    <section
      className="coding-repair-drill"
      aria-labelledby={`coding-repair-title-${problemSlug}`}
    >
      <div className="coding-repair-drill-heading">
        <span>One-minute repair check</span>
        <h3 id={`coding-repair-title-${problemSlug}`}>
          Choose the behavior before editing the syntax.
        </h3>
        <p>
          This check stays in your browser. It changes no saved attempt, score,
          progress, or code.
        </p>
      </div>

      <fieldset disabled={isCorrect}>
        <legend>{drill.prompt}</legend>
        <div className="coding-repair-drill-choices">
          {drill.choices.map((choice) => (
            <label
              className={
                selectedChoiceId === choice.id ? "is-selected" : undefined
              }
              key={choice.id}
            >
              <input
                checked={selectedChoiceId === choice.id}
                name={`coding-repair-${problemSlug}`}
                onChange={() => {
                  setSelectedChoiceId(choice.id);
                  setCheckedChoiceId(null);
                }}
                type="radio"
                value={choice.id}
              />
              <span>{choice.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="coding-repair-drill-actions">
        {!isCorrect ? (
          <button
            type="button"
            disabled={!selectedChoiceId}
            onClick={() => setCheckedChoiceId(selectedChoiceId)}
          >
            Check repair
          </button>
        ) : (
          <button type="button" onClick={onReturnToEditor}>
            Return to editor
          </button>
        )}
        <div
          className={`coding-repair-drill-result${
            hasChecked ? (isCorrect ? " is-correct" : " is-wrong") : ""
          }`}
          aria-live="polite"
        >
          {hasChecked ? (
            <>
              <strong>{isCorrect ? "Repair plan ready." : "Not yet."}</strong>
              <p>{isCorrect ? drill.explanation : drill.recoveryCue}</p>
            </>
          ) : (
            <p>Choose one behavior, then check it.</p>
          )}
        </div>
      </div>
    </section>
  );
}
