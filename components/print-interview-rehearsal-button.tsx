"use client";

export function PrintInterviewRehearsalButton({
  className,
}: {
  className?: string;
}) {
  return (
    <button className={className} type="button" onClick={() => window.print()}>
      Print or save as PDF
    </button>
  );
}
