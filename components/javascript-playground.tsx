"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  type PlaygroundCheckResult,
  runPlaygroundChecks,
  runPlaygroundCode,
} from "@/lib/coding-runner";
import {
  MAX_PLAYGROUND_FILES,
  MAX_PLAYGROUND_CHECKS,
  MAX_PLAYGROUND_CODE_LENGTH,
  validatePlaygroundChecks,
} from "@/lib/javascript-playground";
import type { PlaygroundWorkspaceFile } from "@/db/javascript-playground";
import {
  GUIDED_PLAYGROUND_TRANSFER_STORAGE_KEY,
  parseGuidedPlaygroundTransfer,
  type GuidedPlaygroundTransfer,
} from "@/lib/guided-playground-transfer";

type JavaScriptPlaygroundProps = {
  initialFiles: PlaygroundWorkspaceFile[];
  initialActiveFileId: string | null;
  acceptedTransfer?: {
    problemSlug: string;
    problemTitle: string;
    source: string;
  } | null;
  guidedCopyRequested?: boolean;
};

type RunState =
  | { kind: "ready"; output: string[]; message: string }
  | { kind: "running"; output: string[]; message: string }
  | { kind: "finished"; output: string[]; message: string }
  | { kind: "error"; output: string[]; message: string };

type CheckState =
  | { kind: "ready"; checks: PlaygroundCheckResult[]; message: string }
  | { kind: "running"; checks: PlaygroundCheckResult[]; message: string }
  | { kind: "finished"; checks: PlaygroundCheckResult[]; message: string }
  | { kind: "error"; checks: PlaygroundCheckResult[]; message: string };

export function JavaScriptPlayground({
  initialFiles,
  initialActiveFileId,
  acceptedTransfer = null,
  guidedCopyRequested = false,
}: JavaScriptPlaygroundProps) {
  const initialActiveFile =
    initialFiles.find((file) => file.id === initialActiveFileId) ?? initialFiles[0];
  const [files, setFiles] = useState(initialFiles);
  const [activeFileId, setActiveFileId] = useState(initialActiveFile.id);
  const [code, setCode] = useState(initialActiveFile.code);
  const latestDraft = useRef({
    code: initialActiveFile.code,
    quickChecks: initialActiveFile.quickChecks,
  });
  const saveRequestPending = useRef(false);
  const [saveState, setSaveState] = useState<
    "saved" | "unsaved" | "saving" | "error"
  >(initialActiveFile.updatedAt ? "saved" : "unsaved");
  const [isSaving, setIsSaving] = useState(false);
  const [isManagingFiles, setIsManagingFiles] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [renameValue, setRenameValue] = useState(initialActiveFile.name);
  const [fileMessage, setFileMessage] = useState(
    `${initialFiles.length} of ${MAX_PLAYGROUND_FILES} private files.`,
  );
  const [runState, setRunState] = useState<RunState>({
    kind: "ready",
    output: [],
    message: `Run ${initialActiveFile.name} to see console output here.`,
  });
  const [checkSource, setCheckSource] = useState(initialActiveFile.quickChecks);
  const [checkState, setCheckState] = useState<CheckState>({
    kind: "ready",
    checks: [],
    message: "Add one expression per line. Each check should return true.",
  });
  const [transferState, setTransferState] = useState<
    "offered" | "loaded" | "dismissed"
  >(acceptedTransfer ? "offered" : "dismissed");
  const [guidedTransfer, setGuidedTransfer] =
    useState<GuidedPlaygroundTransfer | null>(null);
  const [guidedTransferState, setGuidedTransferState] = useState<
    "offered" | "loaded" | "dismissed" | "unavailable"
  >(guidedCopyRequested ? "offered" : "dismissed");

  async function runCode() {
    setRunState({
      kind: "running",
      output: [],
      message: "Running in an isolated browser worker…",
    });
    const result = await runPlaygroundCode(code);

    if (result.status === "finished") {
      setRunState({
        kind: "finished",
        output: result.output,
        message:
          result.output.length > 0
            ? "Finished without an uncaught error."
            : "Finished. Add console.log() to print a result.",
      });
      return;
    }

    setRunState({
      kind: "error",
      output: result.output,
      message: result.message,
    });
  }

  async function saveFile() {
    if (saveRequestPending.current) return;

    const submittedDraft = latestDraft.current;
    saveRequestPending.current = true;
    setIsSaving(true);
    setSaveState("saving");

    try {
      const response = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: activeFileId,
          code: submittedDraft.code,
          quickChecks: submittedDraft.quickChecks,
        }),
      });

      if (!response.ok) {
        setSaveState(
          latestDraft.current.code === submittedDraft.code &&
            latestDraft.current.quickChecks === submittedDraft.quickChecks
            ? "error"
            : "unsaved",
        );
        return;
      }

      const { file } = (await response.json()) as {
        file: PlaygroundWorkspaceFile;
      };
      setActiveFileId(file.id);
      setFiles((currentFiles) => {
        const hasFile = currentFiles.some((candidate) => candidate.id === file.id);
        return hasFile
          ? currentFiles.map((candidate) =>
              candidate.id === file.id ? file : candidate,
            )
          : [file];
      });
      setSaveState(
        latestDraft.current.code === submittedDraft.code &&
          latestDraft.current.quickChecks === submittedDraft.quickChecks
          ? "saved"
          : "unsaved",
      );
    } catch {
      setSaveState(
        latestDraft.current.code === submittedDraft.code &&
          latestDraft.current.quickChecks === submittedDraft.quickChecks
          ? "error"
          : "unsaved",
      );
    } finally {
      saveRequestPending.current = false;
      setIsSaving(false);
    }
  }

  function showFile(file: PlaygroundWorkspaceFile) {
    setActiveFileId(file.id);
    setCode(file.code);
    setCheckSource(file.quickChecks);
    latestDraft.current = {
      code: file.code,
      quickChecks: file.quickChecks,
    };
    setRenameValue(file.name);
    setSaveState(file.updatedAt ? "saved" : "unsaved");
    setRunState({
      kind: "ready",
      output: [],
      message: `Run ${file.name} to see console output here.`,
    });
    setCheckState({
      kind: "ready",
      checks: [],
      message: "Add one expression per line. Each check should return true.",
    });
    setTransferState(acceptedTransfer ? "offered" : "dismissed");
    setGuidedTransferState("dismissed");
  }

  function confirmDiscard(action: string) {
    return (
      (saveState !== "unsaved" && saveState !== "error") ||
      window.confirm(`Discard the unsaved editor changes before you ${action}?`)
    );
  }

  async function switchFile(file: PlaygroundWorkspaceFile) {
    if (file.id === activeFileId || !file.id || isManagingFiles) return;
    if (!confirmDiscard(`open ${file.name}`)) return;

    setIsManagingFiles(true);
    setFileMessage(`Opening ${file.name}…`);

    try {
      const response = await fetch("/api/playground", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate", fileId: file.id }),
      });
      const payload = (await response.json()) as {
        file?: PlaygroundWorkspaceFile;
        error?: string;
      };

      if (!response.ok || !payload.file) {
        setFileMessage(payload.error ?? "Couldn’t open that private file.");
        return;
      }

      setFiles((currentFiles) =>
        currentFiles.map((candidate) => ({
          ...(candidate.id === payload.file!.id ? payload.file! : candidate),
          isActive: candidate.id === payload.file!.id,
        })),
      );
      showFile(payload.file);
      setFileMessage(`${payload.file.name} is open.`);
    } catch {
      setFileMessage("Couldn’t open that private file. Try again.");
    } finally {
      setIsManagingFiles(false);
    }
  }

  async function createFile() {
    if (isManagingFiles || files.length >= MAX_PLAYGROUND_FILES) return;
    if (!confirmDiscard("create a new file")) return;

    setIsManagingFiles(true);
    setFileMessage("Creating a private file…");

    try {
      const response = await fetch("/api/playground", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: newFileName }),
      });
      const payload = (await response.json()) as {
        file?: PlaygroundWorkspaceFile;
        error?: string;
      };

      if (!response.ok || !payload.file) {
        setFileMessage(payload.error ?? "Couldn’t create that private file.");
        return;
      }

      setFiles((currentFiles) =>
        currentFiles.every((file) => file.id === null)
          ? [payload.file!]
          : [
              ...currentFiles.map((file) => ({ ...file, isActive: false })),
              payload.file!,
            ],
      );
      showFile(payload.file);
      setNewFileName("");
      setFileMessage(`${payload.file.name} was created and saved privately.`);
    } catch {
      setFileMessage("Couldn’t create that private file. Try again.");
    } finally {
      setIsManagingFiles(false);
    }
  }

  async function renameFile() {
    if (!activeFileId || isManagingFiles) return;
    setIsManagingFiles(true);
    setFileMessage("Renaming the private file…");

    try {
      const response = await fetch("/api/playground", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rename",
          fileId: activeFileId,
          name: renameValue,
        }),
      });
      const payload = (await response.json()) as {
        file?: PlaygroundWorkspaceFile;
        error?: string;
      };

      if (!response.ok || !payload.file) {
        setFileMessage(payload.error ?? "Couldn’t rename that private file.");
        return;
      }

      setFiles((currentFiles) =>
        currentFiles.map((file) =>
          file.id === payload.file!.id ? { ...file, name: payload.file!.name } : file,
        ),
      );
      setRenameValue(payload.file.name);
      setFileMessage(`Renamed to ${payload.file.name}.`);
    } catch {
      setFileMessage("Couldn’t rename that private file. Try again.");
    } finally {
      setIsManagingFiles(false);
    }
  }

  async function deleteFile() {
    const activeFile = files.find((file) => file.id === activeFileId);
    if (!activeFile?.id || files.length === 1 || isManagingFiles) return;
    if (
      !window.confirm(
        `Delete ${activeFile.name}? Its saved code and quick checks cannot be recovered.`,
      )
    ) {
      return;
    }

    setIsManagingFiles(true);
    setFileMessage(`Deleting ${activeFile.name}…`);

    try {
      const response = await fetch("/api/playground", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: activeFile.id }),
      });
      const payload = (await response.json()) as {
        deletedFileId?: string;
        activeFile?: PlaygroundWorkspaceFile;
        error?: string;
      };

      if (!response.ok || !payload.deletedFileId || !payload.activeFile) {
        setFileMessage(payload.error ?? "Couldn’t delete that private file.");
        return;
      }

      setFiles((currentFiles) =>
        currentFiles
          .filter((file) => file.id !== payload.deletedFileId)
          .map((file) => ({
            ...(file.id === payload.activeFile!.id ? payload.activeFile! : file),
            isActive: file.id === payload.activeFile!.id,
          })),
      );
      showFile(payload.activeFile);
      setFileMessage(`${activeFile.name} was deleted.`);
    } catch {
      setFileMessage("Couldn’t delete that private file. Try again.");
    } finally {
      setIsManagingFiles(false);
    }
  }

  async function runChecks() {
    const validation = validatePlaygroundChecks(checkSource);

    if (!validation.valid) {
      setCheckState({ kind: "error", checks: [], message: validation.error });
      return;
    }

    setCheckState({
      kind: "running",
      checks: [],
      message: "Running quick checks in an isolated browser worker…",
    });
    const result = await runPlaygroundChecks(code, validation.checks);

    if (result.status === "finished") {
      const passed = result.checks.filter((check) => check.passed).length;
      setCheckState({
        kind: "finished",
        checks: result.checks,
        message: `${passed} of ${result.checks.length} checks passed.`,
      });
      return;
    }

    setCheckState({
      kind: "error",
      checks: result.checks,
      message: result.message,
    });
  }

  function updateCode(nextCode: string) {
    latestDraft.current = { ...latestDraft.current, code: nextCode };
    setCode(nextCode);
    setSaveState("unsaved");
  }

  function updateCheckSource(nextSource: string) {
    latestDraft.current = {
      ...latestDraft.current,
      quickChecks: nextSource,
    };
    setCheckSource(nextSource);
    setSaveState("unsaved");
  }

  function loadAcceptedCopy() {
    if (!acceptedTransfer) return;
    if (!confirmDiscard("load the Accepted copy")) return;

    latestDraft.current = { code: acceptedTransfer.source, quickChecks: "" };
    setCode(acceptedTransfer.source);
    setCheckSource("");
    setSaveState("unsaved");
    setRunState({
      kind: "ready",
      output: [],
      message: "Run the Accepted copy to see console output here.",
    });
    setCheckState({
      kind: "ready",
      checks: [],
      message: "Add one expression per line. Each check should return true.",
    });
    setTransferState("loaded");
  }

  function clearGuidedTransfer() {
    try {
      window.sessionStorage.removeItem(
        GUIDED_PLAYGROUND_TRANSFER_STORAGE_KEY,
      );
    } catch {
      // The one-time query keeps stale browser data from appearing later.
    }
  }

  function keepCurrentFileFromGuidedTransfer() {
    clearGuidedTransfer();
    setGuidedTransferState("dismissed");
  }

  function loadGuidedCopy() {
    let transfer: GuidedPlaygroundTransfer | null = null;

    try {
      transfer = parseGuidedPlaygroundTransfer(
        window.sessionStorage.getItem(
          GUIDED_PLAYGROUND_TRANSFER_STORAGE_KEY,
        ),
      );
    } catch {
      // The saved playground remains available when browser storage is blocked.
    }

    if (!transfer) {
      clearGuidedTransfer();
      setGuidedTransferState("unavailable");
      return;
    }
    if (!confirmDiscard("load the guided exercise copy")) return;

    latestDraft.current = { code: transfer.source, quickChecks: "" };
    setCode(transfer.source);
    setCheckSource("");
    setSaveState("unsaved");
    setRunState({
      kind: "ready",
      output: [],
      message: "Run the guided copy to see console output here.",
    });
    setCheckState({
      kind: "ready",
      checks: [],
      message: "Add one expression per line. Each check should return true.",
    });
    setGuidedTransfer(transfer);
    clearGuidedTransfer();
    setGuidedTransferState("loaded");
  }

  return (
    <section className="playground-workbench" aria-labelledby="playground-editor-title">
      <section className="playground-files" aria-labelledby="playground-files-title">
        <div className="playground-files-heading">
          <div>
            <span>Private files</span>
            <strong id="playground-files-title">
              {files.length} of {MAX_PLAYGROUND_FILES}
            </strong>
          </div>
          <p role="status" aria-live="polite" aria-atomic="true">
            {fileMessage}
          </p>
        </div>
        <div className="playground-file-tabs" role="tablist" aria-label="JavaScript files">
          {files.map((file) => {
            const isActive = file.id === activeFileId;

            return (
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                className={isActive ? "is-active" : undefined}
                onClick={() => void switchFile(file)}
                disabled={isManagingFiles}
                key={file.id ?? "new-playground"}
              >
                <span aria-hidden="true" />
                {file.name}
              </button>
            );
          })}
        </div>
        <div className="playground-file-tools">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void createFile();
            }}
          >
            <label htmlFor="playground-new-file">New file</label>
            <div>
              <input
                id="playground-new-file"
                value={newFileName}
                onChange={(event) => setNewFileName(event.target.value)}
                placeholder="arrays.js"
                disabled={isManagingFiles || files.length >= MAX_PLAYGROUND_FILES}
              />
              <button
                type="submit"
                disabled={
                  isManagingFiles ||
                  files.length >= MAX_PLAYGROUND_FILES ||
                  newFileName.trim().length === 0
                }
              >
                Create file
              </button>
            </div>
          </form>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void renameFile();
            }}
          >
            <label htmlFor="playground-rename-file">Current filename</label>
            <div>
              <input
                id="playground-rename-file"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                disabled={isManagingFiles || !activeFileId}
              />
              <button
                type="submit"
                disabled={isManagingFiles || !activeFileId || renameValue.trim().length === 0}
              >
                Rename
              </button>
            </div>
          </form>
          <button
            className="playground-delete-file"
            type="button"
            onClick={() => void deleteFile()}
            disabled={isManagingFiles || !activeFileId || files.length === 1}
          >
            Delete current file
          </button>
        </div>
      </section>
      {acceptedTransfer && transferState === "offered" ? (
        <aside className="playground-transfer" aria-label="Accepted solution copy">
          <div>
            <span>Accepted solution</span>
            <strong>Experiment beyond the judge</strong>
          </div>
          <p>
            Replace the open editor with a copy of your saved{" "}
            {acceptedTransfer.problemTitle} solution. Your judged source,
            Accepted result, and other playground files stay unchanged. This
            copy stays unsaved until you choose Save file.
          </p>
          <div className="playground-transfer-actions">
            <button type="button" onClick={() => setTransferState("dismissed")}>
              Keep current file
            </button>
            <button type="button" onClick={loadAcceptedCopy}>
              Replace editor with copy
            </button>
          </div>
        </aside>
      ) : null}
      {acceptedTransfer && transferState === "loaded" ? (
        <div className="playground-transfer-loaded" role="status">
          <span>Unsaved copy</span>
          <p>
            Loaded from {acceptedTransfer.problemTitle}. Your judged solution is
            still untouched.
          </p>
          <Link href={`/practice/${acceptedTransfer.problemSlug}`}>
            Return to problem
          </Link>
        </div>
      ) : null}
      {guidedTransferState === "offered" ? (
        <aside className="playground-transfer" aria-label="Guided exercise copy">
          <div>
            <span>Passed guided exercise</span>
            <strong>Experiment beyond the lesson</strong>
          </div>
          <p>
            Replace the open editor with the passed guided exercise copy from
            this tab. Your guided draft, saved completion, and other playground
            files stay unchanged. This copy stays unsaved until you choose Save
            file.
          </p>
          <div className="playground-transfer-actions">
            <button type="button" onClick={keepCurrentFileFromGuidedTransfer}>
              Keep current file
            </button>
            <button type="button" onClick={loadGuidedCopy}>
              Replace editor with copy
            </button>
          </div>
        </aside>
      ) : null}
      {guidedTransferState === "unavailable" ? (
        <div className="playground-transfer-loaded" role="status">
          <span>Guided copy unavailable</span>
          <p>Return to the passed exercise and open a new playground copy.</p>
        </div>
      ) : null}
      {guidedTransfer && guidedTransferState === "loaded" ? (
        <div className="playground-transfer-loaded" role="status">
          <span>Unsaved guided copy</span>
          <p>
            Loaded from {guidedTransfer.labTitle}: {guidedTransfer.exerciseTitle}.
            Your saved guided work is still untouched.
          </p>
          <Link href={guidedTransfer.returnHref}>Return to guided lab</Link>
        </div>
      ) : null}
      <header className="playground-filebar">
        <div>
          <span className="playground-file-dot" aria-hidden="true" />
          <strong id="playground-editor-title">
            {files.find((file) => file.id === activeFileId)?.name ?? "playground.js"}
          </strong>
        </div>
        <span
          className={
            saveState === "saved"
              ? "playground-save-state is-saved"
              : saveState === "error"
                ? "playground-save-state is-error"
                : "playground-save-state"
          }
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {saveState === "saving"
            ? "Saving…"
            : saveState === "saved"
              ? "Saved to your account"
              : saveState === "error"
                ? "Save failed"
                : "Unsaved changes"}
        </span>
      </header>

      <div className="playground-editor">
        <label htmlFor="playground-code">JavaScript file</label>
        <textarea
          id="playground-code"
          aria-label="JavaScript file"
          value={code}
          onChange={(event) => updateCode(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              void runCode();
            }
          }}
          maxLength={MAX_PLAYGROUND_CODE_LENGTH}
          spellCheck={false}
        />
        <div className="playground-editor-meta">
          <span>
            {code.length.toLocaleString()}/{MAX_PLAYGROUND_CODE_LENGTH.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="playground-actions">
        <button
          className="playground-run"
          type="button"
          onClick={runCode}
          disabled={runState.kind === "running"}
        >
          <span aria-hidden="true">▶</span>
          {runState.kind === "running" ? "Running…" : "Run code"}
        </button>
        <span className="playground-run-hint">
          Keyboard: Ctrl/⌘ + Enter
        </span>
        <button
          className="playground-save"
          type="button"
          onClick={saveFile}
          disabled={isSaving || code.length === 0}
        >
          {isSaving ? "Saving file…" : "Save file"}
        </button>
      </div>

      <section className="playground-console" aria-labelledby="playground-console-title">
        <header>
          <div>
            <span className="console-status-dot" aria-hidden="true" />
            <strong id="playground-console-title">Console</strong>
          </div>
          <span>
            {runState.kind === "running"
              ? "Running"
              : runState.kind === "finished"
                ? "Finished"
                : runState.kind === "error"
                  ? "Stopped"
                  : "Ready"}
          </span>
        </header>
        <div
          className={
            runState.kind === "error"
              ? "playground-console-output is-error"
              : "playground-console-output"
          }
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {runState.output.length > 0 ? (
            <ol>
              {runState.output.map((line, index) => (
                <li key={`${line}-${index}`}>
                  <span aria-hidden="true">›</span>
                  <code>{line}</code>
                </li>
              ))}
            </ol>
          ) : null}
          <p>{runState.message}</p>
        </div>
      </section>

      <details className="playground-checks" open>
        <summary>
          <span>
            <strong>Quick checks</strong>
            <small>Test the behavior you expect before you save.</small>
          </span>
          <span>Up to {MAX_PLAYGROUND_CHECKS}</span>
        </summary>
        <div className="playground-checks-body">
          <div className="playground-checks-input">
            <label htmlFor="playground-check-source">Quick check expressions</label>
            <textarea
              id="playground-check-source"
              value={checkSource}
              onChange={(event) => updateCheckSource(event.target.value)}
              placeholder={'double(4) === 8\nformatName("ada") === "Ada"'}
              spellCheck={false}
            />
            <p>
              One true-or-false JavaScript expression per line. Runs stay
              local; Save file keeps these checks private with your code.
            </p>
            <button
              className="playground-checks-run"
              type="button"
              onClick={runChecks}
              disabled={checkState.kind === "running"}
            >
              {checkState.kind === "running"
                ? "Running checks…"
                : "Run quick checks"}
            </button>
          </div>
          <div
            className={
              checkState.kind === "error"
                ? "playground-check-results is-error"
                : "playground-check-results"
            }
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <strong>Check results</strong>
            <p>{checkState.message}</p>
            {checkState.checks.length > 0 ? (
              <ol>
                {checkState.checks.map((check, index) => (
                  <li
                    className={check.passed ? "is-passed" : "is-failed"}
                    key={`${check.expression}-${index}`}
                  >
                    <span>{check.passed ? "Passed" : "Needs work"}</span>
                    <code>{check.expression}</code>
                    {check.message ? <small>{check.message}</small> : null}
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        </div>
      </details>
    </section>
  );
}
