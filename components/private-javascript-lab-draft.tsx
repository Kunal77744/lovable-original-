"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JavaScriptCodeLabSlug } from "@/lib/javascript-lab-progress";

export const PRIVATE_LAB_DRAFT_MAX_LENGTH = 20_000;
const PRIVATE_LAB_DRAFT_DELAY_MS = 700;

export type PrivateLabDraftState =
  "starter" | "unsaved" | "saving" | "saved" | "error";

type PendingDraft = {
  exerciseId: string;
  source: string;
  revision: number;
};

async function saveDraft(
  labSlug: JavaScriptCodeLabSlug,
  draft: PendingDraft,
  keepalive = false,
) {
  return fetch(`/api/practice/labs/${labSlug}/draft`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      exerciseId: draft.exerciseId,
      source: draft.source,
    }),
    credentials: "same-origin",
    keepalive,
  }).catch(() => null);
}

export function usePrivateJavaScriptLabDraft({
  labSlug,
  exerciseId,
  starterCode,
  initialDrafts = {},
}: {
  labSlug: JavaScriptCodeLabSlug;
  exerciseId: string;
  starterCode: string;
  initialDrafts?: Record<string, string>;
}) {
  const [sources, setSources] = useState<Record<string, string>>(() => ({
    ...initialDrafts,
  }));
  const [states, setStates] = useState<Record<string, PrivateLabDraftState>>(
    () =>
      Object.fromEntries(
        Object.keys(initialDrafts).map((id) => [id, "saved" as const]),
      ),
  );
  const pendingRef = useRef(new Map<string, PendingDraft>());
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const revisionsRef = useRef(new Map<string, number>());
  const saveChainRef = useRef(Promise.resolve());

  const persist = useCallback(
    (draft: PendingDraft) => {
      setStates((current) => ({ ...current, [draft.exerciseId]: "saving" }));
      saveChainRef.current = saveChainRef.current.then(async () => {
        const response = await saveDraft(labSlug, draft);
        const latest = pendingRef.current.get(draft.exerciseId);
        const isLatest =
          latest?.revision === draft.revision && latest.source === draft.source;

        if (!isLatest) return;

        if (response?.ok) {
          pendingRef.current.delete(draft.exerciseId);
          setStates((current) => ({ ...current, [draft.exerciseId]: "saved" }));
          return;
        }

        setStates((current) => ({ ...current, [draft.exerciseId]: "error" }));
      });
    },
    [labSlug],
  );

  const scheduleSave = useCallback(
    (nextExerciseId: string, source: string) => {
      const revision = (revisionsRef.current.get(nextExerciseId) ?? 0) + 1;
      revisionsRef.current.set(nextExerciseId, revision);
      const draft = { exerciseId: nextExerciseId, source, revision };
      pendingRef.current.set(nextExerciseId, draft);

      const priorTimer = timersRef.current.get(nextExerciseId);
      if (priorTimer) clearTimeout(priorTimer);
      timersRef.current.set(
        nextExerciseId,
        setTimeout(() => {
          timersRef.current.delete(nextExerciseId);
          persist(draft);
        }, PRIVATE_LAB_DRAFT_DELAY_MS),
      );
    },
    [persist],
  );

  const updateSource = useCallback(
    (source: string) => {
      if (source.length > PRIVATE_LAB_DRAFT_MAX_LENGTH) return;
      setSources((current) => ({ ...current, [exerciseId]: source }));
      setStates((current) => ({ ...current, [exerciseId]: "unsaved" }));
      scheduleSave(exerciseId, source);
    },
    [exerciseId, scheduleSave],
  );

  const retrySave = useCallback(() => {
    const draft = pendingRef.current.get(exerciseId);
    if (draft) persist(draft);
  }, [exerciseId, persist]);

  useEffect(() => {
    const timers = timersRef.current;

    function flushPending() {
      for (const draft of pendingRef.current.values()) {
        void saveDraft(labSlug, draft, true);
      }
    }

    window.addEventListener("pagehide", flushPending);
    return () => {
      window.removeEventListener("pagehide", flushPending);
      for (const timer of timers.values()) clearTimeout(timer);
      flushPending();
    };
  }, [labSlug]);

  const source = sources[exerciseId] ?? starterCode;
  const state = states[exerciseId] ?? "starter";
  const savedSource = state === "saved" ? source : null;

  return useMemo(
    () => ({
      source,
      state,
      savedSource,
      updateSource,
      restoreStarter: () => updateSource(starterCode),
      retrySave,
    }),
    [retrySave, savedSource, source, starterCode, state, updateSource],
  );
}

export function savedJavaScriptLabSourceFileContents(source: string) {
  return source;
}

export function PrivateJavaScriptLabDraftStatus({
  state,
  onRetry,
  savedSource,
  fileName,
}: {
  state: PrivateLabDraftState;
  onRetry: () => void;
  savedSource: string | null;
  fileName: string;
}) {
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);
  const message = {
    starter: "Starter ready. Your edits will save privately.",
    unsaved: "Unsaved changes",
    saving: "Saving privately…",
    saved: "Saved privately to your account",
    error: "Couldn’t save this draft. Your code is still here.",
  }[state];

  function downloadSavedSource() {
    if (savedSource === null) return;

    const blob = new Blob([savedJavaScriptLabSourceFileContents(savedSource)], {
      type: "text/javascript;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.hidden = true;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setDownloadedFile(fileName);
  }

  return (
    <div
      className={`private-lab-draft-status is-${state}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span aria-hidden="true" />
      <p>{message}</p>
      {state === "error" ? (
        <button type="button" onClick={onRetry}>
          Retry save
        </button>
      ) : null}
      {state === "saved" && savedSource !== null ? (
        <div className="private-lab-draft-download">
          <button type="button" onClick={downloadSavedSource}>
            Download saved .js
          </button>
          <span aria-live="polite">
            {downloadedFile ? `${downloadedFile} downloaded.` : ""}
          </span>
        </div>
      ) : null}
    </div>
  );
}
