"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";

type CssChallengeLocalFileImportProps = {
  maxLength: number;
  onImport: (source: string) => void;
  titleId: string;
};

type ImportState = {
  kind: "idle" | "reading" | "success" | "error";
  message: string;
};

export function CssChallengeLocalFileImport({
  maxLength,
  onImport,
  titleId,
}: CssChallengeLocalFileImportProps) {
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
        message: "No file selected. Your CSS editor was not changed.",
      });
      return;
    }

    if (files.length !== 1) {
      setState({ kind: "error", message: "Choose one CSS file at a time." });
      return;
    }

    const file = files[0];
    if (!file.name.toLowerCase().endsWith(".css")) {
      setState({ kind: "error", message: "Choose a file ending in .css." });
      return;
    }

    if (file.size > maxLength) {
      setState({
        kind: "error",
        message: `Keep imported CSS to ${maxLength.toLocaleString()} bytes or fewer.`,
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
          message: "That file is empty. Choose CSS source to import.",
        });
        return;
      }

      if (source.length > maxLength) {
        setState({
          kind: "error",
          message: `Keep imported CSS to ${maxLength.toLocaleString()} characters or fewer.`,
        });
        return;
      }

      setPendingImport({ fileName: file.name, source });
      setState({ kind: "idle", message: "" });
    } catch {
      if (importRevision.current !== revision) return;
      setState({
        kind: "error",
        message: "This file could not be read. Choose the .css file again.",
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
      message: `${fileName} imported as unsaved CSS. Normal private autosave applies.`,
    });
  }

  function cancelImport() {
    setPendingImport(null);
    setState({
      kind: "success",
      message: "Import cancelled. Your CSS editor was not changed.",
    });
  }

  return (
    <div className="css-challenge-local-import">
      <input
        ref={inputRef}
        type="file"
        accept=".css,text/css"
        aria-label="Choose CSS file to import"
        onChange={chooseFile}
        hidden
      />
      <button
        type="button"
        className="css-challenge-local-import-trigger"
        aria-describedby="css-challenge-local-import-help"
        onClick={() => inputRef.current?.click()}
      >
        Import .css
      </button>
      <span className="sr-only" id="css-challenge-local-import-help">
        Choose one CSS file up to {maxLength.toLocaleString()} bytes. The file is
        read in this browser and becomes normal unsaved editor work.
      </span>
      {state.kind !== "idle" ? (
        <p
          className={
            state.kind === "error"
              ? "css-challenge-local-import-message is-error"
              : "css-challenge-local-import-message"
          }
          role="status"
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}
      {pendingImport ? (
        <div
          className="css-challenge-local-import-confirmation"
          role="group"
          aria-labelledby={titleId}
        >
          <div>
            <strong id={titleId}>Import {pendingImport.fileName}?</strong>
            <p>
              This replaces the current editor text. Your saved attempt and
              progress stay unchanged. The imported source then follows normal
              private autosave.
            </p>
          </div>
          <div className="css-challenge-local-import-actions">
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
