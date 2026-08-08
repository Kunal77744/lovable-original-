"use client";

export function PrintProjectDebriefButton() {
  return (
    <button
      className="project-debrief-print-button"
      type="button"
      onClick={() => window.print()}
    >
      Print project debrief
    </button>
  );
}
