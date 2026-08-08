"use client";

import { useId, useRef, useState } from "react";
import {
  getGuidedProjectRepairDrill,
  type GuidedProjectRepairChoice,
} from "@/lib/guided-project-repair";
import type { GuidedProjectCheck } from "@/lib/guided-project";

type SemanticHtmlRepairDrillProps = {
  failedCheck: GuidedProjectCheck;
  editorId: string;
};

export function SemanticHtmlRepairDrill({
  failedCheck,
  editorId,
}: SemanticHtmlRepairDrillProps) {
  const drill = getGuidedProjectRepairDrill(failedCheck.id);
  const choiceGroupName = useId();
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [checkedChoice, setCheckedChoice] =
    useState<GuidedProjectRepairChoice | null>(null);
  const returnLinkRef = useRef<HTMLAnchorElement>(null);

  function checkRepair() {
    const choice =
      drill.choices.find((candidate) => candidate.id === selectedChoiceId) ??
      null;

    setCheckedChoice(choice);

    if (choice?.correct) {
      window.setTimeout(() => returnLinkRef.current?.focus(), 0);
    }
  }

  return (
    <section
      className="semantic-repair-drill"
      aria-labelledby="semantic-repair-title"
    >
      <header className="semantic-repair-heading">
        <div>
          <p className="quiz-kicker">Repair drill · {drill.concept}</p>
          <h3 id="semantic-repair-title">{drill.title}</h3>
        </div>
        <span>1 failed check</span>
      </header>

      <p className="semantic-repair-context">
        Your review flagged: <strong>{failedCheck.label}</strong>. Fix the small
        example first, then use the same pattern in your field guide.
      </p>

      <div className="semantic-repair-example">
        <span>Needs repair</span>
        <pre>
          <code>{drill.brokenCode}</code>
        </pre>
      </div>

      <fieldset>
        <legend>{drill.prompt}</legend>
        <div className="semantic-repair-choices">
          {drill.choices.map((choice, index) => (
            <label
              className={
                selectedChoiceId === choice.id
                  ? "semantic-repair-choice is-selected"
                  : "semantic-repair-choice"
              }
              key={choice.id}
            >
              <input
                type="radio"
                name={choiceGroupName}
                value={choice.id}
                checked={selectedChoiceId === choice.id}
                onChange={() => {
                  setSelectedChoiceId(choice.id);
                  setCheckedChoice(null);
                }}
              />
              <span>Repair {index + 1}</span>
              <code>{choice.code}</code>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="semantic-repair-result">
        <button
          type="button"
          onClick={checkRepair}
          disabled={!selectedChoiceId}
        >
          Check repair
        </button>
        <p
          className={
            checkedChoice?.correct
              ? "is-correct"
              : checkedChoice
                ? "is-incorrect"
                : ""
          }
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {checkedChoice
            ? checkedChoice.feedback
            : "Choose one repair. You can retry without changing your project."}
        </p>
      </div>

      {checkedChoice?.correct ? (
        <a
          href={`#${editorId}`}
          ref={returnLinkRef}
          onClick={() => {
            window.setTimeout(
              () => document.getElementById(editorId)?.focus(),
              0,
            );
          }}
        >
          Use this pattern in field-guide.html
          <span aria-hidden="true">↑</span>
        </a>
      ) : null}
    </section>
  );
}
