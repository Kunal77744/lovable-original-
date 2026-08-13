"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getJavaScriptLabDraftRecoveryKey,
  parseJavaScriptLabDraftRecovery,
  serializeJavaScriptLabDraftRecovery,
  type JavaScriptLabDraftRecovery,
} from "@/lib/javascript-lab-draft-recovery";
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
  browserRecoveryScope = null,
}: {
  labSlug: JavaScriptCodeLabSlug;
  exerciseId: string;
  starterCode: string;
  initialDrafts?: Record<string, string>;
  browserRecoveryScope?: string | null;
}) {
  const [sources, setSources] = useState<Record<string, string>>(() => ({
    ...initialDrafts,
  }));
  const sourcesRef = useRef<Record<string, string>>({ ...initialDrafts });
  const [states, setStates] = useState<Record<string, PrivateLabDraftState>>(
    () =>
      Object.fromEntries(
        Object.keys(initialDrafts).map((id) => [id, "saved" as const]),
      ),
  );
  const [recoverableBrowserDrafts, setRecoverableBrowserDrafts] = useState<
    Record<string, JavaScriptLabDraftRecovery | null>
  >({});
  const pendingRef = useRef(new Map<string, PendingDraft>());
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const revisionsRef = useRef(new Map<string, number>());
  const saveChainRef = useRef(Promise.resolve());

  const getBrowserRecoveryKey = useCallback(
    (nextExerciseId: string) =>
      browserRecoveryScope
        ? getJavaScriptLabDraftRecoveryKey(
            browserRecoveryScope,
            labSlug,
            nextExerciseId,
          )
        : null,
    [browserRecoveryScope, labSlug],
  );

  const clearBrowserRecoveryIfMatches = useCallback(
    (nextExerciseId: string, savedSource: string) => {
      const key = getBrowserRecoveryKey(nextExerciseId);
      if (!key) return;

      try {
        const browserDraft = parseJavaScriptLabDraftRecovery(
          window.localStorage.getItem(key),
          PRIVATE_LAB_DRAFT_MAX_LENGTH,
        );
        if (browserDraft?.source === savedSource) {
          window.localStorage.removeItem(key);
        }
      } catch {
        // A blocked cleanup does not change the truth of the private save.
      }
    },
    [getBrowserRecoveryKey],
  );

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
          clearBrowserRecoveryIfMatches(draft.exerciseId, draft.source);
          setStates((current) => ({ ...current, [draft.exerciseId]: "saved" }));
          return;
        }

        setStates((current) => ({ ...current, [draft.exerciseId]: "error" }));
      });
    },
    [clearBrowserRecoveryIfMatches, labSlug],
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
      const recoveryKey = getBrowserRecoveryKey(exerciseId);
      if (recoveryKey) {
        try {
          window.localStorage.setItem(
            recoveryKey,
            serializeJavaScriptLabDraftRecovery(source),
          );
        } catch {
          // Private server autosave remains available when storage is blocked.
        }
      }
      setRecoverableBrowserDrafts((current) => ({
        ...current,
        [exerciseId]: null,
      }));
      setSources((current) => ({ ...current, [exerciseId]: source }));
      sourcesRef.current[exerciseId] = source;
      setStates((current) => ({ ...current, [exerciseId]: "unsaved" }));
      scheduleSave(exerciseId, source);
    },
    [exerciseId, getBrowserRecoveryKey, scheduleSave],
  );

  useEffect(() => {
    const recoveryKey = getBrowserRecoveryKey(exerciseId);
    if (!recoveryKey) return;

    let recoveryTimer: number | null = null;

    try {
      const storedValue = window.localStorage.getItem(recoveryKey);
      const browserDraft = parseJavaScriptLabDraftRecovery(
        storedValue,
        PRIVATE_LAB_DRAFT_MAX_LENGTH,
      );
      const loadedSource = sourcesRef.current[exerciseId] ?? starterCode;
      if (!browserDraft || browserDraft.source === loadedSource) {
        if (storedValue) window.localStorage.removeItem(recoveryKey);
        return;
      }

      recoveryTimer = window.setTimeout(() => {
        setRecoverableBrowserDrafts((current) => ({
          ...current,
          [exerciseId]: browserDraft,
        }));
      }, 0);
    } catch {
      // Private server recovery remains available when storage is blocked.
    }

    return () => {
      if (recoveryTimer !== null) window.clearTimeout(recoveryTimer);
    };
  }, [exerciseId, getBrowserRecoveryKey, starterCode]);

  const keepPrivateSavedDraft = useCallback(() => {
    const recoveryKey = getBrowserRecoveryKey(exerciseId);
    if (recoveryKey) {
      try {
        window.localStorage.removeItem(recoveryKey);
      } catch {
        // Hiding the offer is safe when browser cleanup is blocked.
      }
    }
    setRecoverableBrowserDrafts((current) => ({
      ...current,
      [exerciseId]: null,
    }));
  }, [exerciseId, getBrowserRecoveryKey]);

  const restoreBrowserDraft = useCallback(() => {
    const browserDraft = recoverableBrowserDrafts[exerciseId];
    if (!browserDraft) return;
    updateSource(browserDraft.source);
  }, [exerciseId, recoverableBrowserDrafts, updateSource]);

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
  const hasRecoverableBrowserDraft = Boolean(
    recoverableBrowserDrafts[exerciseId],
  );

  return useMemo(
    () => ({
      source,
      state,
      updateSource,
      restoreStarter: () => updateSource(starterCode),
      retrySave,
      browserRecovery: hasRecoverableBrowserDraft
        ? {
            onKeepSaved: keepPrivateSavedDraft,
            onRestore: restoreBrowserDraft,
          }
        : null,
    }),
    [
      hasRecoverableBrowserDraft,
      keepPrivateSavedDraft,
      restoreBrowserDraft,
      retrySave,
      source,
      starterCode,
      state,
      updateSource,
    ],
  );
}

export function PrivateJavaScriptLabDraftRecovery({
  titleId,
  onKeepSaved,
  onRestore,
}: {
  titleId: string;
  onKeepSaved: () => void;
  onRestore: () => void;
}) {
  return (
    <aside
      className="browser-draft-recovery project-browser-draft-recovery"
      aria-labelledby={titleId}
    >
      <div>
        <span>Browser recovery</span>
        <strong id={titleId}>Newer exercise code is available.</strong>
      </div>
      <p>
        Your private saved exercise is still loaded. Restore this browser copy
        as unsaved work, or keep the account-backed version.
      </p>
      <div className="browser-draft-recovery-actions">
        <button type="button" onClick={onKeepSaved}>
          Keep saved exercise
        </button>
        <button type="button" onClick={onRestore}>
          Restore browser draft
        </button>
      </div>
    </aside>
  );
}

export function PrivateJavaScriptLabDraftStatus({
  state,
  onRetry,
  browserRecovery = null,
}: {
  state: PrivateLabDraftState;
  onRetry: () => void;
  browserRecovery?: {
    onKeepSaved: () => void;
    onRestore: () => void;
  } | null;
}) {
  const recoveryTitleId = useId();
  const message = {
    starter: "Starter ready. Your edits will save privately.",
    unsaved: "Unsaved changes",
    saving: "Saving privately…",
    saved: "Saved privately to your account",
    error: "Couldn’t save this draft. Your code is still here.",
  }[state];

  return (
    <>
      {browserRecovery ? (
        <PrivateJavaScriptLabDraftRecovery
          titleId={recoveryTitleId}
          onKeepSaved={browserRecovery.onKeepSaved}
          onRestore={browserRecovery.onRestore}
        />
      ) : null}
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
      </div>
    </>
  );
}
