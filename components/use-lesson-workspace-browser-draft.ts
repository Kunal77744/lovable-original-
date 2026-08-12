"use client";

import { useState, useSyncExternalStore } from "react";

const DRAFT_KEY_PREFIX = "lovable-original:lesson-workspace-draft:v1:";
const DRAFT_CHANGE_EVENT = "lovable-original:lesson-workspace-draft-changed";

function getDraftKey(lessonSlug: string) {
  return `${DRAFT_KEY_PREFIX}${lessonSlug}`;
}

function readDraft(lessonSlug: string) {
  try {
    return window.localStorage.getItem(getDraftKey(lessonSlug));
  } catch {
    return null;
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(DRAFT_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(DRAFT_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function announceChange() {
  window.dispatchEvent(new Event(DRAFT_CHANGE_EVENT));
}

type LessonWorkspaceBrowserDraftOptions = {
  lessonSlug: string;
  initialSource: string;
  initiallySaved: boolean;
  maxLength: number;
};

export function useLessonWorkspaceBrowserDraft({
  lessonSlug,
  initialSource,
  initiallySaved,
  maxLength,
}: LessonWorkspaceBrowserDraftOptions) {
  const [recoveredDraftDismissed, setRecoveredDraftDismissed] = useState(false);
  const browserDraft = useSyncExternalStore(
    subscribe,
    () => readDraft(lessonSlug),
    () => null,
  );
  const validBrowserDraft =
    browserDraft !== null && browserDraft.length <= maxLength
      ? browserDraft
      : null;
  const recoveredSource =
    !recoveredDraftDismissed &&
    !initiallySaved &&
    validBrowserDraft !== null &&
    validBrowserDraft !== initialSource
      ? validBrowserDraft
      : null;

  function clearDraft() {
    try {
      window.localStorage.removeItem(getDraftKey(lessonSlug));
      announceChange();
    } catch {
      // A blocked cleanup must not interrupt a successful account save.
    }
  }

  function preserveDraft(source: string) {
    if (source.length > maxLength) return;

    try {
      window.localStorage.setItem(getDraftKey(lessonSlug), source);
      announceChange();
    } catch {
      // The editor still works when browser storage is unavailable.
    }
  }

  return {
    recoveredSource,
    dismissRecoveredDraft: () => setRecoveredDraftDismissed(true),
    preserveDraft,
    clearDraft,
  };
}
