"use client";

import { useId, useRef, useState } from "react";

export const MAX_GUIDED_JAVASCRIPT_IMPORT_BYTES = 24_000;
export const MAX_GUIDED_JAVASCRIPT_IMPORT_CHARACTERS = 12_000;

type PendingImport = {
  fileName: string;
  source: string;
};

type ImportState =
  | { kind: "idle"; message: string }
  | { kind: "reading"; message: string }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

type GuidedJavaScriptFileImportProps = {
  destinationName: string;
  disabled?: boolean;
  onImport: (source: string, fileName: string) => void;
};

export function GuidedJavaScriptFileImport({
  destinationName,
  disabled = false,
  onImport,
}: GuidedJavaScriptFileImportProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [importState, setImportState] = useState<ImportState>({
    kind: "idle",
    message: "",
  });

  async function readSelectedFile(files: FileList | null) {
    setPendingImport(null);

    if (!files || files.length === 0) {
      setImportState({ kind: "idle", message: "" });
      return;
    }

    if (files.length !== 1) {
      setImportState({
        kind: "error",
        message: "Choose one JavaScript file at a time.",
      });
      return;
    }

    const file = files[0];
    if (!file.name.toLowerCase().endsWith(".js")) {
      setImportState({
        kind: "error",
        message: "Choose a .js file.",
      });
      return;
    }

    if (file.size > MAX_GUIDED_JAVASCRIPT_IMPORT_BYTES) {
      setImportState({
        kind: "error",
        message: "That file is too large. Choose a .js file under 24 KB.",
      });
      return;
    }

    setImportState({ kind: "reading", message: `Reading ${file.name}…` });

    try {
      const source = await file.text();

      if (source.trim().length === 0) {
        setImportState({
          kind: "error",
          message: "That file is empty. Choose a .js file with code in it.",
        });
        return;
      }

      if (source.length > MAX_GUIDED_JAVASCRIPT_IMPORT_CHARACTERS) {
        setImportState({
          kind: "error",
          message: "That source is too long. Keep it under 12,000 characters.",
        });
        return;
      }

      setPendingImport({ fileName: file.name, source });
      setImportState({ kind: "idle", message: "" });
    } catch {
      setImportState({
        kind: "error",
        message: "That file could not be read. Your editor was not changed.",
      });
    }
  }

  function confirmImport() {
    if (!pendingImport) return;

    onImport(pendingImport.source, pendingImport.fileName);
    setImportState({
      kind: "success",
      message: `${pendingImport.fileName} is now unsaved work in ${destinationName}. Run the checks when ready.`,
    });
    setPendingImport(null);
  }

  function cancelImport() {
    setPendingImport(null);
    setImportState({
      kind: "idle",
      message: "Import cancelled. Your editor was not changed.",
    });
  }

  return (
    <div className="guided-js-import">
      <input
        accept=".js,text/javascript,application/javascript"
        aria-label={`Choose JavaScript file to import into ${destinationName}`}
        className="guided-js-import-input"
        disabled={disabled || importState.kind === "reading"}
        id={inputId}
        onChange={(event) => {
          void readSelectedFile(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
        ref={inputRef}
        type="file"
      />
      <button
        aria-controls={inputId}
        className="guided-js-import-trigger"
        disabled={disabled || importState.kind === "reading"}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        {importState.kind === "reading" ? "Reading file…" : "Import .js"}
      </button>

      {pendingImport ? (
        <div className="guided-js-import-confirmation" role="group" aria-label="Confirm JavaScript import">
          <div>
            <strong>
              Import {pendingImport.fileName} into {destinationName}?
            </strong>
            <span>
              This replaces the editor only. Completed steps and saved results stay unchanged.
            </span>
          </div>
          <div className="guided-js-import-confirmation-actions">
            <button onClick={cancelImport} type="button">
              Cancel
            </button>
            <button onClick={confirmImport} type="button">
              Import file
            </button>
          </div>
        </div>
      ) : null}

      {importState.message ? (
        <p
          className={`guided-js-import-status is-${importState.kind}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {importState.message}
        </p>
      ) : null}
    </div>
  );
}
