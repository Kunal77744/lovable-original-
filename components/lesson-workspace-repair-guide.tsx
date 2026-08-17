"use client";

import { useId } from "react";
import {
  getLessonWorkspaceRepairGuidance,
  type LessonWorkspaceCheckId,
} from "@/lib/lesson-workspace-repair-guidance";

type LessonWorkspaceRepairGuideProps = {
  checkId: LessonWorkspaceCheckId;
  checkLabel: string;
  editorId: string;
  editorLabel: string;
};

export function LessonWorkspaceRepairGuide({
  checkId,
  checkLabel,
  editorId,
  editorLabel,
}: LessonWorkspaceRepairGuideProps) {
  const titleId = useId();
  const guidance = getLessonWorkspaceRepairGuidance(checkId);

  return (
    <section
      className="lesson-workspace-repair"
      aria-labelledby={titleId}
    >
      <header>
        <div>
          <p className="quiz-kicker">First check to repair</p>
          <h3 id={titleId}>{checkLabel}</h3>
        </div>
        <span>1 open check</span>
      </header>

      <dl>
        <div>
          <dt>Concept to revisit</dt>
          <dd>{guidance.concept}</dd>
        </div>
        <div>
          <dt>Inspect first</dt>
          <dd>{guidance.inspect}</dd>
        </div>
      </dl>

      <p>
        <strong>Next attempt</strong>
        {guidance.nextAttempt}
      </p>
      <a
        href={`#${editorId}`}
        onClick={() => {
          window.setTimeout(() => document.getElementById(editorId)?.focus(), 0);
        }}
      >
        Return to {editorLabel}
        <span aria-hidden="true">↑</span>
      </a>
    </section>
  );
}
