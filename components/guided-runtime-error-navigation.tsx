"use client";

import { getCodeEditorLocation } from "@/lib/code-editor-location";

export function GuidedRuntimeErrorNavigation({
  currentSource,
  editorId,
  failedSource,
  message,
}: {
  currentSource: string;
  editorId: string;
  failedSource?: string;
  message: string;
}) {
  if (!failedSource || failedSource !== currentSource) return null;

  const location = getCodeEditorLocation(failedSource, message);
  if (!location) return null;
  const { column, cursorOffset, line } = location;

  function openLocation() {
    const editor = document.getElementById(editorId);
    if (!(editor instanceof HTMLTextAreaElement)) return;

    editor.focus();
    editor.setSelectionRange(cursorOffset, cursorOffset);
  }

  return (
    <button
      aria-label={`Open line ${line}, column ${column} in the editor`}
      className="guided-runtime-location-action"
      onClick={openLocation}
      type="button"
    >
      Open line {line}
    </button>
  );
}
