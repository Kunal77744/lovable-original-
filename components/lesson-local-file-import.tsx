"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";

type LessonLocalFileImportProps = {
  accept: string;
  extension: ".html" | ".css";
  fileLabel: string;
  maxLength: number;
  onImport: (source: string) => void;
  titleId: string;
};

type ImportState = {
  kind: "idle" | "reading" | "success" | "error";
  message: string;
};

export function LessonLocalFileImport({
  accept,
  extension,
  fileLabel,
  maxLength,
  onImport,
  titleId,
}: LessonLocalFileImportProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const importRevision = useRef(0);
  const [state, setState] = useState<ImportState>({
    kind: "idle",
    message: "",
  });
  const [pendingImport, setPendingImport] = useState<{
    fileName: string;
    source: string;
  } | null>(null);

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    const revision = importRevision.current + 1;
    importRevision.current = revision;
    setPendingImport(null);

    if (files.length === 0) {
      setState({
        kind: "success",
        message: "No file selected. Your editor was not changed.",
      });
      return;
    }

    if (files.length !== 1) {
      setState({
        kind: "error",
        message: `Choose one ${fileLabel} file at a time.`,
      });
      return;
    }

    const file = files[0];
    if (!file.name.toLowerCase().endsWith(extension)) {
      setState({
        kind: "error",
        message: `Choose a file ending in ${extension}.`,
      });
      return;
    }

    if (file.size > maxLength) {
      setState({
        kind: "error",
        message: `Keep imported ${fileLabel} to ${maxLength.toLocaleString()} bytes or fewer.`,
      });
      return;
    }

    setState({
      kind: "reading",
      message: `Reading ${file.name} in this browser…`,
    });

    try {
      const source = await file.text();
      if (importRevision.current !== revision) return;

      if (source.length === 0) {
        setState({
          kind: "error",
          message: `That file is empty. Choose ${extension} source to import.`,
        });
        return;
      }

      if (source.length > maxLength) {
        setState({
          kind: "error",
          message: `Keep imported ${fileLabel} to ${maxLength.toLocaleString()} characters or fewer.`,
        });
        return;
      }

      setPendingImport({ fileName: file.name, source });
      setState({ kind: "idle", message: "" });
    } catch {
      if (importRevision.current !== revision) return;
      setState({
        kind: "error",
        message: `This file could not be read. Choose the ${extension} file again.`,
      });
    }
  }

  function confirmImport() {
    if (!pendingImport) return;
    const { fileName, source } = pendingImport;
    setPendingImport(null);
    onImport(source);
    setState({
      kind: "success",
      message: `${fileName} imported as unsaved lesson work.`,
    });
  }

  function cancelImport() {
    setPendingImport(null);
    setState({
      kind: "success",
      message: "Import cancelled. Your editor was not changed.",
    });
  }

  return (
    <div className="lesson-local-import">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        aria-label={`Choose ${fileLabel} file to import`}
        onChange={chooseFile}
        hidden
      />
      <button
        type="button"
        className="lesson-local-import-trigger"
        onClick={() => inputRef.current?.click()}
      >
        Import {extension}
      </button>
      {state.kind !== "idle" ? (
        <p
          className={
            state.kind === "error"
              ? "lesson-local-import-message is-error"
              : "lesson-local-import-message"
          }
          role="status"
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}
      {pendingImport ? (
        <div
          className="lesson-local-import-confirmation"
          role="group"
          aria-labelledby={titleId}
        >
          <div>
            <strong id={titleId}>Import {pendingImport.fileName}?</strong>
            <p>
              This replaces the current editor text. Your saved result and
              progress stay unchanged until you save this source.
            </p>
          </div>
          <div className="lesson-local-import-actions">
            <button type="button" onClick={cancelImport}>
              Keep editor
            </button>
            <button type="button" onClick={confirmImport}>
              Import file
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
