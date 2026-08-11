"use client";

type PrintProjectDebriefButtonProps = {
  label?: string;
};

export function PrintProjectDebriefButton({
  label = "Print project debrief",
}: PrintProjectDebriefButtonProps = {}) {
  return (
    <button
      className="project-debrief-print-button"
      type="button"
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}
