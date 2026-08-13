"use client";

import Link from "next/link";
import type { ChangeEvent, FocusEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AcceptedSolutionDownload } from "@/components/accepted-solution-download";
import { PracticeFeedback } from "@/components/practice-feedback";
import { PracticeSolutionNote } from "@/components/practice-solution-note";
import {
  getCodingDraftRecoveryKey,
  parseCodingDraftRecovery,
  serializeCodingDraftRecovery,
  type CodingDraftRecovery,
} from "@/lib/coding-draft-recovery";
import { runCodingSolution } from "@/lib/coding-runner";
import {
  MAX_CODING_TEST_CASES,
  type CodingTestCase,
  validateCodingTestCases,
} from "@/lib/coding-test-cases";
import {
  MAX_CODING_SOLUTION_LENGTH,
  normalizeCodingOutput,
} from "@/lib/coding-problems";
import { toggleEditorLineComments } from "@/lib/code-editor-comments";
import { applyEditorIndentation } from "@/lib/code-editor-indentation";
import { getCodeEditorLocation } from "@/lib/code-editor-location";
import { applyEditorSmartEditing } from "@/lib/code-editor-smart-editing";
import { getCodingSolutionReview } from "@/lib/coding-solution-review";
import { getSignInHref } from "@/lib/account-destination";
import {
  captureJavaScriptPracticeCompleted,
  capturePracticeProblemAccepted,
} from "@/lib/product-analytics";
import type { CodingProblemAttempt } from "@/db/coding-practice";
import type { SavedPracticeFeedback } from "@/lib/practice-feedback";
import type { SavedPracticeSolutionNote } from "@/lib/practice-solution-note";

type CodingWorkspaceProps = {
  attempts: CodingProblemAttempt[];
  bestVerdict: string | null;
  browserRecoveryScope?: string | null;
  initialCode: string;
  initialAcceptedCode?: string | null;
  initialCustomTestCases?: CodingTestCase[];
  initialPracticeFeedback: SavedPracticeFeedback | null;
  initialSolutionNote?: SavedPracticeSolutionNote | null;
  isSignedIn: boolean;
  hasSavedCode?: boolean;
  isPracticeFeedbackEligible: boolean;
  isReviewSession?: boolean;
  isCleanPractice?: boolean;
  dailyChallengeDate?: string | null;
  loadedSubmission?: {
    createdAt: string;
    verdict: string;
    passedTests: number;
    totalTests: number;
  } | null;
  problem: {
    slug: string;
    title: string;
    recoveryHint: string;
    recoveryHints: [string, string];
    acceptedExplanation: {
      concept: string;
      whyItWorks: string;
      commonMistake: string;
      efficiency: {
        time: string;
        space: string;
        explanation: string;
      };
    };
    workedTrace: {
      steps: [string, string, string];
    };
    starterCode: string;
    tests: { label: string; input: string }[];
    examples: {
      input: string;
      expectedOutput: string;
    }[];
  };
};

type SubmissionResponse = {
  id: string;
  verdict: "Accepted" | "Wrong Answer";
  bestVerdict: "Accepted" | "Wrong Answer";
  passedTests: number;
  totalTests: number;
  completedCount: number;
  totalCount: number;
  nextProblemSlug: string | null;
  createdAt: string;
  hasSource: boolean;
  isFirstAcceptedResult: boolean;
  dailyChallengeCompleted: boolean;
  dailyChallengeDate: string | null;
  checks?: { label: string; passed: boolean }[];
  error?: string;
};

type RunState =
  | { kind: "idle"; message: string }
  | { kind: "running"; message: string }
  | {
      kind: "examples";
      message: string;
      results: {
        input: string;
        output: string;
        expectedOutput: string;
        passed: boolean;
      }[];
      debugOutput: string[];
    }
  | {
      kind: "custom";
      message: string;
      output: string;
      debugOutput: string[];
    }
  | {
      kind: "test-suite";
      message: string;
      results: {
        input: string;
        output: string;
        expectedOutput: string | null;
        passed: boolean | null;
      }[];
      debugOutput: string[];
    }
  | {
      kind: "verdict";
      message: string;
      verdict: "Accepted" | "Wrong Answer";
      passedTests: number;
      totalTests: number;
      completedCount: number;
      totalCount: number;
      nextProblemSlug: string | null;
      dailyChallengeCompleted: boolean;
      checks: { label: string; passed: boolean }[];
    }
  | { kind: "timeout"; message: string }
  | {
      kind: "error";
      message: string;
      debugOutput?: string[];
      source?: string;
    };

type RunnerRecovery = {
  label: string;
  guidance: string;
};

function codingTestCasesMatch(
  left: CodingTestCase[],
  right: CodingTestCase[],
) {
  return (
    left.length === right.length &&
    left.every(
      (testCase, index) =>
        testCase.input === right[index]?.input &&
        testCase.expectedOutput === right[index]?.expectedOutput,
    )
  );
}

const ANONYMOUS_DRAFT_KEY_PREFIX = "lovable-original:practice-draft:v1:";
const ANONYMOUS_DRAFT_EVENT = "lovable-original:practice-draft-changed";

function getAnonymousDraftKey(problemSlug: string) {
  return `${ANONYMOUS_DRAFT_KEY_PREFIX}${problemSlug}`;
}

function readAnonymousDraft(problemSlug: string) {
  try {
    return window.localStorage.getItem(getAnonymousDraftKey(problemSlug));
  } catch {
    return null;
  }
}

function subscribeToAnonymousDrafts(onStoreChange: () => void) {
  window.addEventListener(ANONYMOUS_DRAFT_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(ANONYMOUS_DRAFT_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function announceAnonymousDraftChange() {
  window.dispatchEvent(new Event(ANONYMOUS_DRAFT_EVENT));
}

function writeAnonymousDraft(problemSlug: string, code: string) {
  try {
    window.localStorage.setItem(getAnonymousDraftKey(problemSlug), code);
    announceAnonymousDraftChange();
  } catch {
    // The editor still works when browser storage is unavailable.
  }
}

function clearAnonymousDraft(problemSlug: string) {
  try {
    window.localStorage.removeItem(getAnonymousDraftKey(problemSlug));
    announceAnonymousDraftChange();
  } catch {
    // A blocked storage cleanup must not interrupt saving or submission.
  }
}

const EDITOR_VIEW_STORAGE_KEY = "lovable-original:judged-editor-view";
const EDITOR_FONT_SIZES = [13, 15, 17] as const;
const MAX_JAVASCRIPT_IMPORT_BYTES = MAX_CODING_SOLUTION_LENGTH;
type EditorFontSize = (typeof EDITOR_FONT_SIZES)[number];

function readEditorViewPreference() {
  try {
    const storedPreference = window.localStorage.getItem(
      EDITOR_VIEW_STORAGE_KEY,
    );
    if (!storedPreference) return null;

    const parsedPreference = JSON.parse(storedPreference) as {
      fontSize?: unknown;
      wrapLines?: unknown;
    };
    if (
      !EDITOR_FONT_SIZES.includes(parsedPreference.fontSize as EditorFontSize) ||
      typeof parsedPreference.wrapLines !== "boolean"
    ) {
      return null;
    }

    return {
      fontSize: parsedPreference.fontSize as EditorFontSize,
      wrapLines: parsedPreference.wrapLines,
    };
  } catch {
    return null;
  }
}

function saveEditorViewPreference(
  fontSize: EditorFontSize,
  wrapLines: boolean,
) {
  try {
    window.localStorage.setItem(
      EDITOR_VIEW_STORAGE_KEY,
      JSON.stringify({ fontSize, wrapLines }),
    );
  } catch {
    // Editor view preferences are optional when browser storage is unavailable.
  }
}

type CodeSearchMatch = {
  start: number;
  end: number;
};

function findCodeMatches(code: string, query: string): CodeSearchMatch[] {
  if (!query) return [];

  const matches: CodeSearchMatch[] = [];
  const searchableCode = code.toLowerCase();
  const searchableQuery = query.toLowerCase();
  let searchFrom = 0;

  while (searchFrom <= searchableCode.length - searchableQuery.length) {
    const start = searchableCode.indexOf(searchableQuery, searchFrom);
    if (start === -1) break;

    matches.push({ start, end: start + query.length });
    searchFrom = start + query.length;
  }

  return matches;
}

function getJudgeChecks(
  checks: SubmissionResponse["checks"],
  tests: CodingWorkspaceProps["problem"]["tests"],
) {
  if (
    !Array.isArray(checks) ||
    checks.length !== tests.length ||
    checks.some(
      (check, index) =>
        check.label !== tests[index]?.label || typeof check.passed !== "boolean",
    )
  ) {
    return [];
  }

  return checks;
}

const MAX_VISIBLE_DEBUG_LINES = 80;
const MAX_VISIBLE_DEBUG_LINE_LENGTH = 500;

function boundVisibleDebugOutput(debugOutput: string[]) {
  return debugOutput.slice(0, MAX_VISIBLE_DEBUG_LINES).map((line) =>
    line.length > MAX_VISIBLE_DEBUG_LINE_LENGTH
      ? `${line.slice(0, MAX_VISIBLE_DEBUG_LINE_LENGTH)}…`
      : line,
  );
}

function getRunnerRecovery(runState: RunState): RunnerRecovery | null {
  if (runState.kind === "timeout") {
    return {
      label: "Check the stopping condition",
      guidance:
        "Try the smallest input first. Make sure every loop changes the value that eventually stops it.",
    };
  }

  if (runState.kind !== "error") return null;

  if (/function named solve|solve\(input\)/i.test(runState.message)) {
    return {
      label: "Check the required function",
      guidance:
        "Keep solve(input) at the top level and return the final answer from it. Then run the example again.",
    };
  }

  if (/unexpected token|unexpected end|unterminated|missing[ )\]}]/i.test(runState.message)) {
    return {
      label: "Check the syntax",
      guidance:
        "Inspect the line before the reported token for an unmatched quote, bracket, parenthesis, or comma.",
    };
  }

  if (/not defined|cannot access|cannot read|is not a function/i.test(runState.message)) {
    return {
      label: "Trace the first missing value",
      guidance:
        "Find the first named value in the message, then check where it should be created before it is used.",
    };
  }

  return {
    label: "Reduce the failing step",
    guidance:
      "Run the example again after checking one operation at a time, starting where the message first points.",
  };
}

export function CodingWorkspace({
  attempts: initialAttempts,
  bestVerdict: initialBestVerdict,
  browserRecoveryScope = null,
  initialCode,
  initialAcceptedCode = null,
  initialCustomTestCases = [],
  initialPracticeFeedback,
  initialSolutionNote = null,
  isSignedIn,
  hasSavedCode = false,
  isPracticeFeedbackEligible,
  isReviewSession = false,
  isCleanPractice = false,
  dailyChallengeDate = null,
  loadedSubmission = null,
  problem,
}: CodingWorkspaceProps) {
  const lineNumberGutterRef = useRef<HTMLDivElement>(null);
  const [code, setCode] = useState(initialCode);
  const [acceptedCode, setAcceptedCode] = useState(initialAcceptedCode);
  const [recoverableBrowserDraft, setRecoverableBrowserDraft] =
    useState<CodingDraftRecovery | null>(null);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [bestVerdict, setBestVerdict] = useState(initialBestVerdict);
  const [showPracticeFeedback, setShowPracticeFeedback] = useState(
    isPracticeFeedbackEligible,
  );
  const [anonymousDraftDismissed, setAnonymousDraftDismissed] = useState(false);
  const [isRestoreConfirmationOpen, setIsRestoreConfirmationOpen] =
    useState(false);
  const [customInput, setCustomInput] = useState(problem.examples[0]?.input ?? "");
  const [customTestCases, setCustomTestCases] = useState(
    initialCustomTestCases,
  );
  const latestCustomTestCases = useRef(initialCustomTestCases);
  const testCaseSavePending = useRef(false);
  const [isTestCaseSaving, setIsTestCaseSaving] = useState(false);
  const [testCaseSaveState, setTestCaseSaveState] = useState<
    "saved" | "unsaved" | "saving" | "error"
  >("saved");
  const [testCaseMessage, setTestCaseMessage] = useState(
    initialCustomTestCases.length > 0
      ? `${initialCustomTestCases.length} private test ${initialCustomTestCases.length === 1 ? "case" : "cases"} restored.`
      : "Save up to six inputs privately for your next session.",
  );
  const [saveState, setSaveState] = useState<
    "saved" | "unsaved" | "saving" | "error"
  >(
    loadedSubmission
      ? "unsaved"
      : isSignedIn && hasSavedCode
        ? "saved"
        : "unsaved",
  );
  const [hasEditableDraft, setHasEditableDraft] = useState(false);
  const [runState, setRunState] = useState<RunState>({
    kind: "idle",
    message: isCleanPractice
      ? "Clean starter loaded. Run freely; your saved solution stays untouched until you submit."
      : loadedSubmission
      ? "A past submission is loaded as an unsaved copy. Loading it did not change your saved work."
      : isSignedIn
        ? initialBestVerdict === "Accepted"
          ? "Accepted solution restored from your account."
          : "Run the example, then submit against all four checks."
        : "You can run the example now. Sign in to submit and save progress.",
  });
  const [revealedRecoveryHintCount, setRevealedRecoveryHintCount] =
    useState(0);
  const [editorFontSize, setEditorFontSize] =
    useState<EditorFontSize>(13);
  const [wrapEditorLines, setWrapEditorLines] = useState(true);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [isEditorSearchOpen, setIsEditorSearchOpen] = useState(false);
  const [editorSearchQuery, setEditorSearchQuery] = useState("");
  const [editorReplacement, setEditorReplacement] = useState("");
  const [editorSearchIndex, setEditorSearchIndex] = useState(0);
  const [editorImportState, setEditorImportState] = useState<{
    kind: "idle" | "reading" | "success" | "error";
    message: string;
  }>({ kind: "idle", message: "" });
  const [pendingEditorImport, setPendingEditorImport] = useState<{
    fileName: string;
    code: string;
  } | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorTextarea = useRef<HTMLTextAreaElement | null>(null);
  const editorFocusButton = useRef<HTMLButtonElement | null>(null);
  const editorImportInput = useRef<HTMLInputElement | null>(null);
  const editorImportRevision = useRef(0);
  const editorSearchInput = useRef<HTMLInputElement | null>(null);
  const pendingEditorSelection = useRef<{
    start: number;
    end: number;
  } | null>(null);
  const allowNextEditorTabToExit = useRef(false);
  const latestCode = useRef(initialCode);
  const hasPendingDraft = useRef(false);
  const draftRevision = useRef(0);
  const lastQueuedDraftRevision = useRef(-1);
  const draftSaveChain = useRef<Promise<void>>(Promise.resolve());
  const showAcceptedExplanation =
    (runState.kind === "verdict" && runState.verdict === "Accepted") ||
    (!isCleanPractice &&
      runState.kind === "idle" &&
      initialBestVerdict === "Accepted");
  const acceptedReview =
    isSignedIn &&
    acceptedCode &&
    (!isCleanPractice ||
      (runState.kind === "verdict" && runState.verdict === "Accepted"))
      ? getCodingSolutionReview(problem.slug, acceptedCode)
      : null;
  const cleanPracticeCompleted =
    isCleanPractice &&
    runState.kind === "verdict" &&
    runState.verdict === "Accepted";
  const cleanPracticeSubmitted =
    isCleanPractice && runState.kind === "verdict";
  const runnerRecovery = getRunnerRecovery(runState);
  const anonymousDraft = useSyncExternalStore(
    subscribeToAnonymousDrafts,
    () => readAnonymousDraft(problem.slug),
    () => null,
  );
  const canUseAnonymousDraft =
    !anonymousDraftDismissed &&
    !isCleanPractice &&
    !loadedSubmission &&
    (!isSignedIn || !hasSavedCode) &&
    anonymousDraft !== null &&
    anonymousDraft !== initialCode;
  const recoveredAnonymousDraft = isSignedIn && canUseAnonymousDraft;
  const editorCode = canUseAnonymousDraft ? anonymousDraft : code;
  const runtimeErrorLocation =
    runState.kind === "error" && runState.source === editorCode
      ? getCodeEditorLocation(editorCode, runState.message)
      : null;
  const editorSearchMatches = findCodeMatches(
    editorCode,
    editorSearchQuery,
  );
  const currentEditorSearchIndex = Math.min(
    editorSearchIndex,
    Math.max(0, editorSearchMatches.length - 1),
  );

  useEffect(() => {
    latestCode.current = editorCode;
  }, [editorCode]);

  useEffect(() => {
    if (isEditorSearchOpen) editorSearchInput.current?.focus();
  }, [isEditorSearchOpen]);

  useEffect(() => {
    if (!isEditorFocused) return;

    document.body.classList.add("editor-focus-active");

    function exitEditorFocus(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;

      setIsEditorFocused(false);
      editorFocusButton.current?.focus();
    }

    window.addEventListener("keydown", exitEditorFocus);

    return () => {
      document.body.classList.remove("editor-focus-active");
      window.removeEventListener("keydown", exitEditorFocus);
    };
  }, [isEditorFocused]);

  useEffect(() => {
    const preferenceTimer = window.setTimeout(() => {
      const storedPreference = readEditorViewPreference();
      if (!storedPreference) return;

      setEditorFontSize(storedPreference.fontSize);
      setWrapEditorLines(storedPreference.wrapLines);
    }, 0);

    return () => window.clearTimeout(preferenceTimer);
  }, []);
  const browserRecoveryKey =
    isSignedIn && browserRecoveryScope && !loadedSubmission && !isCleanPractice
      ? getCodingDraftRecoveryKey(browserRecoveryScope, problem.slug)
      : null;

  useEffect(() => {
    if (!browserRecoveryKey) return;

    let recoveryTimer: number | null = null;

    try {
      const storedValue = window.localStorage.getItem(browserRecoveryKey);
      const browserDraft = parseCodingDraftRecovery(storedValue);

      if (!browserDraft || browserDraft.code === initialCode) {
        if (storedValue) window.localStorage.removeItem(browserRecoveryKey);
        return;
      }

      recoveryTimer = window.setTimeout(() => {
        setRecoverableBrowserDraft(browserDraft);
      }, 0);
    } catch {
      // Private server saving remains available when browser storage is blocked.
    }

    return () => {
      if (recoveryTimer !== null) window.clearTimeout(recoveryTimer);
    };
  }, [browserRecoveryKey, initialCode]);

  useEffect(() => {
    function savePendingDraftBeforeLeave() {
      if (!isSignedIn || isCleanPractice || !hasPendingDraft.current) return;

      if (draftTimer.current) {
        clearTimeout(draftTimer.current);
        draftTimer.current = null;
      }

      if (typeof navigator.sendBeacon !== "function") return;

      const queued = navigator.sendBeacon(
        `/api/practice/${problem.slug}`,
        new Blob(
          [JSON.stringify({ mode: "draft", code: latestCode.current })],
          { type: "application/json" },
        ),
      );

      if (queued) hasPendingDraft.current = false;
    }

    window.addEventListener("pagehide", savePendingDraftBeforeLeave);

    return () => {
      window.removeEventListener("pagehide", savePendingDraftBeforeLeave);
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [isCleanPractice, isSignedIn, problem.slug]);

  function saveDraft(nextCode: string, revision: number) {
    if (!isSignedIn || isCleanPractice) return Promise.resolve();

    setSaveState("saving");
    lastQueuedDraftRevision.current = revision;
    const request = draftSaveChain.current.then(async () => {
      try {
        const response = await fetch(`/api/practice/${problem.slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "draft", code: nextCode }),
        });

        if (!response.ok) {
          if (draftRevision.current === revision) {
            lastQueuedDraftRevision.current = -1;
            setSaveState("error");
          }
          return;
        }

        if (
          latestCode.current === nextCode &&
          draftRevision.current === revision
        ) {
          hasPendingDraft.current = false;
          setHasEditableDraft(false);
          setCode(nextCode);
          setAnonymousDraftDismissed(true);
          clearAnonymousDraft(problem.slug);
          setSaveState("saved");
        }
        clearBrowserRecoveryIfMatches(nextCode);
      } catch {
        if (draftRevision.current === revision) {
          lastQueuedDraftRevision.current = -1;
          setSaveState("error");
        }
      }
    });
    draftSaveChain.current = request;
    return request;
  }

  async function flushLatestDraft() {
    if (!isSignedIn || !hasPendingDraft.current) {
      await draftSaveChain.current;
      return;
    }

    if (draftTimer.current) {
      clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }

    const revision = draftRevision.current;
    if (lastQueuedDraftRevision.current !== revision) {
      await saveDraft(latestCode.current, revision);
      return;
    }

    await draftSaveChain.current;
  }

  function persistBrowserRecovery(nextCode: string) {
    if (!browserRecoveryKey) return;

    try {
      window.localStorage.setItem(
        browserRecoveryKey,
        serializeCodingDraftRecovery(nextCode),
      );
      setRecoverableBrowserDraft(null);
    } catch {
      // The existing private autosave remains the fallback when storage is blocked.
    }
  }

  function clearBrowserRecoveryIfMatches(savedCode: string) {
    if (!browserRecoveryKey) return;

    try {
      const browserDraft = parseCodingDraftRecovery(
        window.localStorage.getItem(browserRecoveryKey),
      );

      if (browserDraft?.code === savedCode) {
        window.localStorage.removeItem(browserRecoveryKey);
      }
    } catch {
      // A blocked cleanup does not change the truth of the private save.
    }
  }

  function updateCode(nextCode: string) {
    setCode(nextCode);
    setSaveState("unsaved");
    latestCode.current = nextCode;

    if (isCleanPractice) return;

    hasPendingDraft.current = true;
    setHasEditableDraft(true);
    draftRevision.current += 1;
    const revision = draftRevision.current;

    if (!isSignedIn) {
      writeAnonymousDraft(problem.slug, nextCode);
    } else {
      if (recoveredAnonymousDraft) setAnonymousDraftDismissed(true);
      persistBrowserRecovery(nextCode);
    }

    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      draftTimer.current = null;
      void saveDraft(nextCode, revision);
    }, 700);
  }

  useEffect(() => {
    const selection = pendingEditorSelection.current;
    if (!selection || !editorTextarea.current) return;

    pendingEditorSelection.current = null;
    editorTextarea.current.focus();
    editorTextarea.current.setSelectionRange(selection.start, selection.end);
  }, [editorCode]);

  function restoreStarter() {
    if (draftTimer.current) {
      clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }

    setCode(problem.starterCode);
    latestCode.current = problem.starterCode;
    hasPendingDraft.current = false;
    setHasEditableDraft(false);
    draftRevision.current += 1;
    setSaveState("unsaved");
    persistBrowserRecovery(problem.starterCode);
    setIsRestoreConfirmationOpen(false);
    setAnonymousDraftDismissed(true);
    clearAnonymousDraft(problem.slug);
    setRunState({
      kind: "idle",
      message:
        "Clean starter restored in the editor. Your saved code and attempts have not changed.",
    });
  }

  function restoreBrowserDraft() {
    if (!recoverableBrowserDraft) return;

    const recoveredCode = recoverableBrowserDraft.code;
    updateCode(recoveredCode);
    setRunState({
      kind: "idle",
      message:
        "Browser draft restored as unsaved work. Your private saved solution stays unchanged until this exact code saves.",
    });
  }

  function keepPrivateSavedDraft() {
    if (!browserRecoveryKey) return;

    try {
      window.localStorage.removeItem(browserRecoveryKey);
    } catch {
      // Hiding the offer is still safe when browser storage cleanup is blocked.
    }
    setRecoverableBrowserDraft(null);
  }

  function saveDraftNow() {
    if (!isSignedIn || isCleanPractice || !hasPendingDraft.current) return;
    void flushLatestDraft();
  }

  function saveDraftOnBlur(event: FocusEvent<HTMLTextAreaElement>) {
    if (
      event.relatedTarget instanceof HTMLElement &&
      event.relatedTarget.dataset.draftSaveAction === "true"
    ) {
      return;
    }

    saveDraftNow();
  }

  function openEditorSearch() {
    if (isEditorSearchOpen) {
      editorSearchInput.current?.focus();
      return;
    }

    setIsEditorSearchOpen(true);
  }

  function closeEditorSearch() {
    setIsEditorSearchOpen(false);
    editorTextarea.current?.focus();
  }

  function openRuntimeErrorLocation() {
    if (!runtimeErrorLocation || !editorTextarea.current) return;

    editorTextarea.current.focus();
    editorTextarea.current.setSelectionRange(
      runtimeErrorLocation.cursorOffset,
      runtimeErrorLocation.cursorOffset,
    );
  }

  function selectEditorSearchMatch(index: number) {
    if (editorSearchMatches.length === 0 || !editorTextarea.current) return;

    const nextIndex =
      (index + editorSearchMatches.length) % editorSearchMatches.length;
    const match = editorSearchMatches[nextIndex];
    setEditorSearchIndex(nextIndex);
    editorTextarea.current.focus();
    editorTextarea.current.setSelectionRange(match.start, match.end);
  }

  function previewFirstEditorSearchMatch(query: string) {
    const firstMatch = findCodeMatches(editorCode, query)[0];
    if (!firstMatch || !editorTextarea.current) return;

    editorTextarea.current.setSelectionRange(firstMatch.start, firstMatch.end);
  }

  function replaceCurrentEditorSearchMatch() {
    const match = editorSearchMatches[currentEditorSearchIndex];
    if (!match) return;

    const nextCode =
      editorCode.slice(0, match.start) +
      editorReplacement +
      editorCode.slice(match.end);
    pendingEditorSelection.current = {
      start: match.start,
      end: match.start + editorReplacement.length,
    };
    setEditorSearchIndex(
      Math.min(
        currentEditorSearchIndex,
        Math.max(0, findCodeMatches(nextCode, editorSearchQuery).length - 1),
      ),
    );
    updateCode(nextCode);
  }

  async function importJavaScriptFile(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = event.currentTarget.files;
    event.currentTarget.value = "";
    const importRevision = editorImportRevision.current + 1;
    editorImportRevision.current = importRevision;
    setPendingEditorImport(null);

    if (!files || files.length !== 1) {
      setEditorImportState({
        kind: "error",
        message: "Choose one JavaScript file at a time.",
      });
      return;
    }

    const file = files[0];

    if (!/\.js$/i.test(file.name)) {
      setEditorImportState({
        kind: "error",
        message: "Choose a file ending in .js.",
      });
      return;
    }

    if (file.size > MAX_JAVASCRIPT_IMPORT_BYTES) {
      setEditorImportState({
        kind: "error",
        message: `Keep imported files to ${MAX_JAVASCRIPT_IMPORT_BYTES.toLocaleString()} bytes or fewer.`,
      });
      return;
    }

    setEditorImportState({
      kind: "reading",
      message: `Reading ${file.name} in this browser…`,
    });

    try {
      const importedCode = await file.text();
      if (editorImportRevision.current !== importRevision) return;

      if (importedCode.length === 0) {
        setEditorImportState({
          kind: "error",
          message: "That file is empty. Choose a .js file with source code.",
        });
        return;
      }

      if (importedCode.length > MAX_CODING_SOLUTION_LENGTH) {
        setEditorImportState({
          kind: "error",
          message: `Keep imported JavaScript to ${MAX_CODING_SOLUTION_LENGTH.toLocaleString()} characters or fewer.`,
        });
        return;
      }

      setPendingEditorImport({ fileName: file.name, code: importedCode });
      setEditorImportState({ kind: "idle", message: "" });
    } catch {
      if (editorImportRevision.current !== importRevision) return;

      setEditorImportState({
        kind: "error",
        message: "This file could not be read. Choose the .js file again.",
      });
    }
  }

  function confirmJavaScriptImport() {
    if (!pendingEditorImport) return;

    const { fileName, code: importedCode } = pendingEditorImport;
    setPendingEditorImport(null);
    pendingEditorSelection.current = { start: 0, end: 0 };
    updateCode(importedCode);
    setEditorImportState({
      kind: "success",
      message: isCleanPractice
        ? `${fileName} imported as unsaved work. It stays local until you submit.`
        : `${fileName} imported locally as editor work. Normal private autosave applies.`,
    });
  }

  function cancelJavaScriptImport() {
    setPendingEditorImport(null);
    setEditorImportState({
      kind: "success",
      message: "Import cancelled. Your editor was not changed.",
    });
  }

  async function runExamples() {
    setRunState({
      kind: "running",
      message: `Running ${problem.examples.length} ${problem.examples.length === 1 ? "example" : "examples"} in your browser…`,
    });
    const result = await runCodingSolution(
      editorCode,
      problem.examples.map((example) => example.input),
    );

    if (result.status === "timeout") {
      setRunState({ kind: "timeout", message: result.message });
      return;
    }

    if (result.status !== "finished") {
      setRunState({
        kind: "error",
        message: result.message,
        debugOutput: result.debugOutput,
        source: editorCode,
      });
      return;
    }

    const results = problem.examples.map((example, index) => {
      const output = result.outputs[index] ?? "";

      return {
        ...example,
        output,
        passed:
          normalizeCodingOutput(output) ===
          normalizeCodingOutput(example.expectedOutput),
      };
    });
    const passedCount = results.filter((example) => example.passed).length;
    const allPassed = passedCount === results.length;

    setRunState({
      kind: "examples",
      results,
      debugOutput: result.debugOutput,
      message: allPassed
        ? `${passedCount} of ${results.length} visible ${results.length === 1 ? "example" : "examples"} passed. Submit when you’re ready for all four checks.`
        : `${passedCount} of ${results.length} visible ${results.length === 1 ? "example" : "examples"} passed. Compare the differing output before you submit.`,
    });
  }

  async function runCustomInput() {
    setRunState({
      kind: "running",
      message: "Running your custom input in the browser…",
    });
    const result = await runCodingSolution(editorCode, [customInput]);

    if (result.status === "timeout") {
      setRunState({ kind: "timeout", message: result.message });
      return;
    }

    if (result.status !== "finished") {
      setRunState({
        kind: "error",
        message: result.message,
        debugOutput: boundVisibleDebugOutput(result.debugOutput),
        source: editorCode,
      });
      return;
    }

    setRunState({
      kind: "custom",
      output: result.outputs[0] ?? "",
      debugOutput: boundVisibleDebugOutput(result.debugOutput),
      message: "Custom input finished. Review the output before you submit.",
    });
  }

  async function runPrivateTestSuite() {
    if (customTestCases.length === 0) return;

    setRunState({
      kind: "running",
      message: `Running ${customTestCases.length} private test ${customTestCases.length === 1 ? "case" : "cases"} in your browser…`,
    });
    const result = await runCodingSolution(
      editorCode,
      customTestCases.map((testCase) => testCase.input),
    );

    if (result.status === "timeout") {
      setRunState({ kind: "timeout", message: result.message });
      return;
    }

    if (result.status !== "finished") {
      setRunState({
        kind: "error",
        message: result.message,
        debugOutput: result.debugOutput,
        source: editorCode,
      });
      return;
    }

    const results = customTestCases.map((testCase, index) => {
      const output = result.outputs[index] ?? "";
      return {
        ...testCase,
        output,
        passed:
          testCase.expectedOutput === null
            ? null
            : normalizeCodingOutput(output) ===
              normalizeCodingOutput(testCase.expectedOutput),
      };
    });
    const checkedResults = results.filter((testCase) => testCase.passed !== null);
    const passedResults = checkedResults.filter((testCase) => testCase.passed);
    const uncheckedCount = results.length - checkedResults.length;

    setRunState({
      kind: "test-suite",
      results,
      debugOutput: result.debugOutput,
      message:
        checkedResults.length === 0
          ? `${customTestCases.length} private test ${customTestCases.length === 1 ? "case" : "cases"} finished locally. Add expected outputs to check them automatically.`
          : `${passedResults.length} of ${checkedResults.length} expected ${checkedResults.length === 1 ? "output" : "outputs"} matched.${uncheckedCount > 0 ? ` ${uncheckedCount} ${uncheckedCount === 1 ? "case ran" : "cases ran"} without an expectation.` : ""}`,
    });
  }

  async function persistCustomTestCases(nextCases: CodingTestCase[]) {
    if (!isSignedIn || testCaseSavePending.current) return false;

    const validation = validateCodingTestCases(nextCases);

    if (!validation.valid) {
      setTestCaseSaveState("error");
      setTestCaseMessage(validation.error);
      return false;
    }

    const submittedCases = validation.cases;
    const casesWhenSaveStarted = latestCustomTestCases.current.map((testCase) => ({
      ...testCase,
    }));
    testCaseSavePending.current = true;
    setIsTestCaseSaving(true);
    setTestCaseSaveState("saving");
    setTestCaseMessage("Saving private test cases…");

    try {
      const response = await fetch(
        `/api/practice/${problem.slug}/test-cases`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cases: submittedCases }),
        },
      );
      const payload = (await response.json()) as {
        testCases?: { cases: CodingTestCase[] };
        error?: string;
      };

      if (!response.ok || !payload.testCases) {
        setTestCaseSaveState("error");
        setTestCaseMessage(
          payload.error ?? "Your test cases could not be saved. Try again.",
        );
        return false;
      }

      if (
        !codingTestCasesMatch(
          latestCustomTestCases.current,
          casesWhenSaveStarted,
        )
      ) {
        setTestCaseSaveState("unsaved");
        setTestCaseMessage(
          "Your earlier test cases are saved. Your newer changes are still unsaved.",
        );
        return true;
      }

      latestCustomTestCases.current = payload.testCases.cases;
      setCustomTestCases(payload.testCases.cases);
      setTestCaseSaveState("saved");
      setTestCaseMessage(
        payload.testCases.cases.length === 0
          ? "All private test cases removed."
          : `${payload.testCases.cases.length} private test ${payload.testCases.cases.length === 1 ? "case" : "cases"} saved.`,
      );
      return true;
    } catch {
      setTestCaseSaveState("error");
      setTestCaseMessage(
        "Your test cases could not be saved. Check your connection and try again.",
      );
      return false;
    } finally {
      testCaseSavePending.current = false;
      setIsTestCaseSaving(false);
    }
  }

  async function saveCurrentCustomInput() {
    if (
      latestCustomTestCases.current.some(
        (testCase) => testCase.input === customInput,
      )
    ) {
      setTestCaseSaveState("error");
      setTestCaseMessage("That exact input is already saved.");
      return;
    }

    await persistCustomTestCases([
      ...latestCustomTestCases.current,
      { input: customInput, expectedOutput: null },
    ]);
  }

  function updateCustomTestCase(index: number, input: string) {
    setCustomTestCases((current) => {
      const nextCases = current.map((testCase, savedIndex) =>
        savedIndex === index ? { ...testCase, input } : testCase,
      );
      latestCustomTestCases.current = nextCases;
      return nextCases;
    });
    setTestCaseSaveState("unsaved");
    setTestCaseMessage(
      isTestCaseSaving
        ? "Saving your earlier test cases. Your newer changes are still unsaved."
        : "Test case changes are not saved yet.",
    );
  }

  function updateExpectedOutput(index: number, expectedOutput: string | null) {
    setCustomTestCases((current) => {
      const nextCases = current.map((testCase, savedIndex) =>
        savedIndex === index ? { ...testCase, expectedOutput } : testCase,
      );
      latestCustomTestCases.current = nextCases;
      return nextCases;
    });
    setTestCaseSaveState("unsaved");
    setTestCaseMessage(
      isTestCaseSaving
        ? "Saving your earlier test cases. Your newer changes are still unsaved."
        : "Test case changes are not saved yet.",
    );
  }

  async function removeCustomTestCase(index: number) {
    await persistCustomTestCases(
      latestCustomTestCases.current.filter(
        (_, savedIndex) => savedIndex !== index,
      ),
    );
  }

  async function submitSolution() {
    if (!isSignedIn) return;

    const submittedCode = editorCode;
    setRevealedRecoveryHintCount(0);
    setRunState({
      kind: "running",
      message: `Running ${problem.tests.length} deterministic checks in your browser…`,
    });
    await flushLatestDraft();
    const result = await runCodingSolution(
      submittedCode,
      problem.tests.map((test) => test.input),
    );

    if (result.status === "timeout") {
      setRunState({ kind: "timeout", message: result.message });
      return;
    }

    if (result.status !== "finished") {
      setRunState({
        kind: "error",
        message: result.message,
        source: submittedCode,
      });
      return;
    }

    try {
      const response = await fetch(`/api/practice/${problem.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "submit",
          code: submittedCode,
          outputs: result.outputs,
          dailyChallengeDate,
        }),
      });
      const payload = (await response.json()) as SubmissionResponse;

      if (!response.ok) {
        setRunState({
          kind: "error",
          message: payload.error ?? "The result could not be saved. Try again.",
        });
        return;
      }

      setBestVerdict(payload.bestVerdict);
      if (payload.verdict === "Accepted") setAcceptedCode(submittedCode);
      hasPendingDraft.current = false;
      setCode(submittedCode);
      setAnonymousDraftDismissed(true);
      clearAnonymousDraft(problem.slug);
      setSaveState("saved");
      clearBrowserRecoveryIfMatches(submittedCode);
      setAttempts((current) => [
        {
          id: payload.id,
          verdict: payload.verdict,
          passedTests: payload.passedTests,
          totalTests: payload.totalTests,
          createdAt: payload.createdAt,
          hasSource: payload.hasSource,
        },
        ...current,
      ].slice(0, 8));
      setRunState({
        kind: "verdict",
        verdict: payload.verdict,
        passedTests: payload.passedTests,
        totalTests: payload.totalTests,
        completedCount: payload.completedCount,
        totalCount: payload.totalCount,
        nextProblemSlug: payload.nextProblemSlug,
        dailyChallengeCompleted: payload.dailyChallengeCompleted,
        checks: getJudgeChecks(payload.checks, problem.tests),
        message:
          payload.verdict === "Accepted"
            ? payload.dailyChallengeCompleted
              ? `${problem.title} is complete. Today’s daily challenge is saved.`
              : `${problem.title} is complete. Your code and result are saved.`
            : `${payload.passedTests} of ${payload.totalTests} checks passed. Your attempt is saved.`,
      });

      if (
        payload.verdict === "Accepted" &&
        payload.isFirstAcceptedResult
      ) {
        capturePracticeProblemAccepted({
          problemSlug: problem.slug,
          passedCheckCount: payload.passedTests,
        });
      }

      if (
        payload.verdict === "Accepted" &&
        payload.isFirstAcceptedResult &&
        payload.completedCount === payload.totalCount
      ) {
        captureJavaScriptPracticeCompleted({
          pathSlug: "beginner-javascript",
          completionState: "completed",
        });
      }

      if (
        payload.verdict === "Accepted" &&
        payload.isFirstAcceptedResult &&
        payload.completedCount === 1
      ) {
        setShowPracticeFeedback(true);
      }
    } catch {
      setRunState({
        kind: "error",
        message: "The result could not be saved. Check your connection and try again.",
      });
    }
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key.toLowerCase() === "f" &&
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      openEditorSearch();
      return;
    }

    if (
      event.key === "/" &&
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      !event.shiftKey &&
      !event.repeat &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      const result = toggleEditorLineComments(
        editorCode,
        event.currentTarget.selectionStart,
        event.currentTarget.selectionEnd,
      );

      if (result.value === editorCode) return;

      pendingEditorSelection.current = {
        start: result.selectionStart,
        end: result.selectionEnd,
      };
      updateCode(result.value);
      return;
    }

    if (event.key === "Escape") {
      allowNextEditorTabToExit.current = true;
      return;
    }

    if (event.key === "Tab") {
      if (allowNextEditorTabToExit.current) {
        allowNextEditorTabToExit.current = false;
        return;
      }

      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.nativeEvent.isComposing
      ) {
        return;
      }

      event.preventDefault();
      const result = applyEditorIndentation(
        editorCode,
        event.currentTarget.selectionStart,
        event.currentTarget.selectionEnd,
        event.shiftKey,
      );

      if (result.value === editorCode) return;

      pendingEditorSelection.current = {
        start: result.selectionStart,
        end: result.selectionEnd,
      };
      updateCode(result.value);
      return;
    }

    allowNextEditorTabToExit.current = false;

    if (
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.repeat &&
      !event.nativeEvent.isComposing
    ) {
      const result = applyEditorSmartEditing(
        editorCode,
        event.currentTarget.selectionStart,
        event.currentTarget.selectionEnd,
        event.key,
      );

      if (result) {
        event.preventDefault();

        if (result.value === editorCode) {
          event.currentTarget.setSelectionRange(
            result.selectionStart,
            result.selectionEnd,
          );
          return;
        }

        pendingEditorSelection.current = {
          start: result.selectionStart,
          end: result.selectionEnd,
        };
        updateCode(result.value);
        return;
      }
    }

    const usesPrimaryModifier = event.ctrlKey || event.metaKey;

    if (
      event.key !== "Enter" ||
      !usesPrimaryModifier ||
      event.altKey ||
      event.repeat ||
      event.nativeEvent.isComposing ||
      (event.shiftKey && !isSignedIn)
    ) {
      return;
    }

    event.preventDefault();
    if (runState.kind === "running") return;

    if (event.shiftKey) {
      void submitSolution();
      return;
    }

    void runExamples();
  }

  const visibleDebugOutput =
    runState.kind === "examples" ||
    runState.kind === "custom" ||
    runState.kind === "test-suite" ||
    runState.kind === "error"
      ? (runState.debugOutput ?? [])
      : [];

  return (
    <section className="coding-workspace" aria-labelledby="workspace-title">
      <header className="coding-workspace-heading">
        <div>
          <p className="quiz-kicker">Browser-isolated runner</p>
          <h2 id="workspace-title">Write your solution.</h2>
          <p>
            Define <code>solve(input)</code> and return the exact output. Network
            access is blocked and the runner stops after 1,000 ms. Run the
            visible examples together to inspect local <code>console.log</code> output.
          </p>
        </div>
        <div className={bestVerdict === "Accepted" ? "best-verdict is-accepted" : "best-verdict"}>
          <span>Best verdict</span>
          <strong>{bestVerdict ?? "Not submitted"}</strong>
        </div>
      </header>

      <div className={isEditorFocused ? "code-editor is-focused" : "code-editor"}>
        <div className="code-editor-bar">
          <div className="code-editor-file">
            <span>solution.js</span>
            {isSignedIn ? (
              <>
                <input
                  ref={editorImportInput}
                  type="file"
                  accept=".js,text/javascript,application/javascript"
                  aria-label="Choose JavaScript file to import"
                  onChange={importJavaScriptFile}
                  hidden
                />
                <button
                  type="button"
                  className="editor-import-trigger"
                  aria-describedby="coding-editor-import-help"
                  data-draft-save-action="true"
                  onClick={() => editorImportInput.current?.click()}
                  disabled={runState.kind === "running"}
                >
                  Import .js
                </button>
                <span className="sr-only" id="coding-editor-import-help">
                  Choose one JavaScript file up to 12,000 bytes. The file is
                  read in this browser and becomes normal unsaved editor work.
                </span>
              </>
            ) : null}
          </div>
          <div
            className="editor-view-controls"
            aria-label="Editor tools and view preferences"
          >
            <label>
              <span>Text size</span>
              <select
                aria-label="Editor text size"
                value={editorFontSize}
                onChange={(event) => {
                  const nextFontSize = Number(
                    event.target.value,
                  ) as EditorFontSize;
                  setEditorFontSize(nextFontSize);
                  saveEditorViewPreference(nextFontSize, wrapEditorLines);
                }}
              >
                <option value={13}>Small</option>
                <option value={15}>Comfortable</option>
                <option value={17}>Large</option>
              </select>
            </label>
            <label className="editor-wrap-control">
              <input
                type="checkbox"
                checked={wrapEditorLines}
                onChange={(event) => {
                  const nextWrapEditorLines = event.target.checked;
                  setWrapEditorLines(nextWrapEditorLines);
                  saveEditorViewPreference(
                    editorFontSize,
                    nextWrapEditorLines,
                  );
                }}
              />
              <span>Wrap lines</span>
            </label>
            <button
              type="button"
              className="editor-search-trigger"
              aria-expanded={isEditorSearchOpen}
              aria-controls="coding-editor-search"
              data-draft-save-action="true"
              onClick={openEditorSearch}
            >
              Find
            </button>
            <button
              ref={editorFocusButton}
              type="button"
              className="editor-focus-trigger"
              aria-pressed={isEditorFocused}
              aria-keyshortcuts={isEditorFocused ? "Escape" : undefined}
              data-draft-save-action="true"
              onClick={() => setIsEditorFocused((current) => !current)}
            >
              {isEditorFocused ? "Exit focus" : "Focus"}
            </button>
            <span className="sr-only">
              These view preferences stay in this browser. Focus view is
              temporary and does not change your saved work.
            </span>
          </div>
          <div className="code-editor-save-status">
            <span
              className="code-editor-status"
              aria-live="polite"
              aria-atomic="true"
            >
              {isCleanPractice
                ? cleanPracticeSubmitted
                  ? "Submitted"
                  : "Practice copy"
                : isSignedIn
                  ? saveState === "saving"
                    ? "Saving…"
                    : saveState === "saved"
                      ? "Saved"
                      : saveState === "error"
                        ? "Save failed"
                        : "Unsaved"
                  : "Local only"}
            </span>
            {isSignedIn &&
            !isCleanPractice &&
            hasEditableDraft &&
            saveState !== "saving" ? (
              <button
                type="button"
                className={
                  saveState === "error"
                    ? "code-editor-save-action is-error"
                    : "code-editor-save-action"
                }
                data-draft-save-action="true"
                onClick={saveDraftNow}
              >
                {saveState === "error" ? "Retry save" : "Save now"}
              </button>
            ) : null}
          </div>
          <span
            className="code-editor-shortcuts"
            id="coding-editor-indentation-hint"
          >
            {isEditorFocused
              ? "Focus view · Escape exits · Tab/Shift+Tab indent · Ctrl/⌘ / comments · Ctrl/⌘ F finds"
              : "Tab/Shift+Tab indent · Ctrl/⌘ / comments · Ctrl/⌘ F finds · Esc then Tab exits"}
          </span>
        </div>
        {editorImportState.kind !== "idle" ? (
          <p
            className={
              editorImportState.kind === "error"
                ? "code-editor-import-message is-error"
                : "code-editor-import-message"
            }
            role="status"
            aria-live="polite"
          >
            {editorImportState.message}
          </p>
        ) : null}
        {pendingEditorImport ? (
          <div
            className="starter-restore-confirmation editor-import-confirmation"
            role="group"
            aria-labelledby="editor-import-confirmation-title"
          >
            <div>
              <strong id="editor-import-confirmation-title">
                Import {pendingEditorImport.fileName}?
              </strong>
              <p>
                This replaces the current editor text. Your saved results stay
                unchanged, and the imported source becomes unsaved work.
              </p>
            </div>
            <div>
              <button
                type="button"
                className="starter-restore-trigger"
                onClick={cancelJavaScriptImport}
              >
                Keep editor
              </button>
              <button
                type="button"
                className="starter-restore-confirm"
                onClick={confirmJavaScriptImport}
              >
                Import file
              </button>
            </div>
          </div>
        ) : null}
        {loadedSubmission ? (
          <div className="loaded-submission-cue" role="status">
            <div>
              <span>Past submission loaded</span>
              <strong>
                {loadedSubmission.verdict} · {loadedSubmission.passedTests}/
                {loadedSubmission.totalTests} checks
              </strong>
              <small>
                Submitted{" "}
                {new Intl.DateTimeFormat("en", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(loadedSubmission.createdAt))}
              </small>
            </div>
            <p>
              This is an unsaved editor copy. Run it safely, or edit and submit
              when ready. Your saved code and learning record were not changed
              by loading it.
            </p>
            <Link href={`/practice/${problem.slug}`}>Restore saved editor</Link>
          </div>
        ) : null}
        {isCleanPractice ? (
          <div className="clean-practice-cue" role="status">
            <div>
              <span>Clean practice copy</span>
              <strong>
                {cleanPracticeSubmitted
                  ? "This practice copy has been submitted."
                  : "Solve from the starter, not the saved answer."}
              </strong>
            </div>
            <p>
              {cleanPracticeSubmitted
                ? "Your attempt and editor are saved. Earlier source stays hidden until you leave clean practice."
                : "Typing and browser runs stay local. Your saved solution changes only if you deliberately submit this copy."}
            </p>
            <Link href={`/practice/${problem.slug}`}>
              {cleanPracticeSubmitted
                ? "Open saved editor"
                : "Return to saved solution"}
            </Link>
          </div>
        ) : null}
        {recoveredAnonymousDraft ? (
          <div className="loaded-submission-cue anonymous-draft-cue" role="status">
            <div>
              <span>Local draft recovered</span>
              <strong>Your work is back after sign-in</strong>
              <small>Not saved to your account yet</small>
            </div>
            <p>
              This browser copy did not replace account-owned code. Save it as
              your current draft, keep editing, or submit when you’re ready.
            </p>
            <button
              type="button"
              onClick={() =>
                void saveDraft(editorCode, draftRevision.current)
              }
              disabled={saveState === "saving"}
            >
              {saveState === "saving" ? "Saving…" : "Save recovered draft"}
            </button>
          </div>
        ) : null}
        {recoverableBrowserDraft && !recoveredAnonymousDraft ? (
          <aside
            className="browser-draft-recovery"
            aria-labelledby="browser-draft-recovery-title"
          >
            <div>
              <span>Browser recovery</span>
              <strong id="browser-draft-recovery-title">
                Newer work is available on this browser.
              </strong>
            </div>
            <p>
              Your private saved solution is still loaded. Restore this copy as
              unsaved work, or keep the account-backed version.
            </p>
            <div className="browser-draft-recovery-actions">
              <button type="button" onClick={keepPrivateSavedDraft}>
                Keep saved editor
              </button>
              <button type="button" onClick={restoreBrowserDraft}>
                Restore browser draft
              </button>
            </div>
          </aside>
        ) : null}
        {isEditorSearchOpen ? (
          <section
            className="code-editor-search"
            id="coding-editor-search"
            aria-label="Find and replace in code"
          >
            <div className="code-editor-search-fields">
              <label>
                <span>Find</span>
                <input
                  ref={editorSearchInput}
                  type="search"
                  value={editorSearchQuery}
                  data-draft-save-action="true"
                  onChange={(event) => {
                    setEditorSearchQuery(event.target.value);
                    setEditorSearchIndex(0);
                    previewFirstEditorSearchMatch(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      closeEditorSearch();
                    } else if (event.key === "Enter") {
                      event.preventDefault();
                      selectEditorSearchMatch(
                        currentEditorSearchIndex + (event.shiftKey ? -1 : 1),
                      );
                    }
                  }}
                />
              </label>
              <label>
                <span>Replace with</span>
                <input
                  type="text"
                  value={editorReplacement}
                  data-draft-save-action="true"
                  onChange={(event) => setEditorReplacement(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      closeEditorSearch();
                    }
                  }}
                />
              </label>
            </div>
            <p className="code-editor-search-status" aria-live="polite">
              {!editorSearchQuery
                ? "Enter text to search this file."
                : editorSearchMatches.length === 0
                  ? "No matches"
                  : `${currentEditorSearchIndex + 1} of ${editorSearchMatches.length} ${editorSearchMatches.length === 1 ? "match" : "matches"}`}
            </p>
            <div className="code-editor-search-actions">
              <button
                type="button"
                data-draft-save-action="true"
                onClick={() =>
                  selectEditorSearchMatch(currentEditorSearchIndex - 1)
                }
                disabled={editorSearchMatches.length === 0}
              >
                Previous
              </button>
              <button
                type="button"
                data-draft-save-action="true"
                onClick={() =>
                  selectEditorSearchMatch(currentEditorSearchIndex + 1)
                }
                disabled={editorSearchMatches.length === 0}
              >
                Next
              </button>
              <button
                type="button"
                data-draft-save-action="true"
                onClick={replaceCurrentEditorSearchMatch}
                disabled={editorSearchMatches.length === 0}
              >
                Replace match
              </button>
              <button
                type="button"
                className="code-editor-search-close"
                data-draft-save-action="true"
                onClick={closeEditorSearch}
              >
                Close
              </button>
            </div>
          </section>
        ) : null}
        <label htmlFor="coding-solution">JavaScript solution</label>
        <div className="code-editor-input">
          <div
            aria-hidden="true"
            className="code-editor-line-numbers"
            ref={lineNumberGutterRef}
          >
            {Array.from(
              { length: Math.max(1, editorCode.split("\n").length) },
              (_, index) => (
                <span key={index}>{index + 1}</span>
              ),
            )}
          </div>
          <textarea
            ref={editorTextarea}
            id="coding-solution"
            aria-label="JavaScript solution"
            aria-describedby="coding-editor-keyboard-hint coding-editor-indentation-hint"
            value={editorCode}
            onChange={(event) => updateCode(event.target.value)}
            onKeyDown={handleEditorKeyDown}
            onBlur={isCleanPractice ? undefined : saveDraftOnBlur}
            wrap={wrapEditorLines ? "soft" : "off"}
            style={{
              fontSize: `${editorFontSize}px`,
              overflowWrap: wrapEditorLines ? "anywhere" : "normal",
              whiteSpace: wrapEditorLines ? "pre-wrap" : "pre",
            }}
            onScroll={(event) => {
              if (lineNumberGutterRef.current) {
                lineNumberGutterRef.current.style.transform = `translateY(-${event.currentTarget.scrollTop}px)`;
              }
            }}
            disabled={runState.kind === "running"}
            spellCheck={false}
          />
        </div>
        {isSignedIn && !isCleanPractice ? (
          <div className="starter-restore">
            {isRestoreConfirmationOpen ? (
              <div
                className="starter-restore-confirmation"
                role="group"
                aria-labelledby="starter-restore-title"
              >
                <div>
                  <strong id="starter-restore-title">Restore the clean starter?</strong>
                  <p>
                    This replaces only the editor. Your saved code and attempts stay
                    unchanged until you edit or submit again.
                  </p>
                </div>
                <div>
                  <button
                    className="starter-restore-cancel"
                    type="button"
                    onClick={() => setIsRestoreConfirmationOpen(false)}
                    disabled={runState.kind === "running"}
                  >
                    Keep my code
                  </button>
                  <button
                    className="starter-restore-confirm"
                    type="button"
                    onClick={restoreStarter}
                    disabled={runState.kind === "running"}
                  >
                    Restore starter
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="starter-restore-trigger"
                type="button"
                onClick={() => {
                  setIsRestoreConfirmationOpen(true);
                }}
                disabled={
                  editorCode === problem.starterCode ||
                  runState.kind === "running"
                }
              >
                {editorCode === problem.starterCode
                  ? "Clean starter loaded"
                  : "Restore clean starter"}
              </button>
            )}
          </div>
        ) : null}
      </div>

      <div className="coding-actions">
        <span
          className="coding-keyboard-hint"
          id="coding-editor-keyboard-hint"
        >
          {isSignedIn
            ? "Keyboard: Ctrl/⌘ + Enter to run · add Shift to submit"
            : "Keyboard: Ctrl/⌘ + Enter to run"}
        </span>
        <button
          className="secondary-code-action"
          type="button"
          onClick={runExamples}
          disabled={runState.kind === "running"}
          aria-describedby="coding-editor-keyboard-hint"
        >
          {`Run ${problem.examples.length} ${problem.examples.length === 1 ? "example" : "examples"}`}
        </button>
        {isSignedIn ? (
          <button
            className="submit-code-action"
            type="button"
            onClick={submitSolution}
            disabled={runState.kind === "running"}
            aria-describedby="coding-editor-keyboard-hint"
          >
            {runState.kind === "running" ? "Running checks…" : "Submit solution"}
          </button>
        ) : (
          <Link
            className="submit-code-action"
            href={getSignInHref(`/practice/${problem.slug}`)}
          >
            Sign in to submit
          </Link>
        )}
      </div>

      <details className="custom-test-runner">
        <summary>
          <span>Try your own input</span>
          <small>Runs locally without adding a saved attempt</small>
        </summary>
        <div className="custom-test-fields">
          <label htmlFor="custom-test-input">Custom input</label>
          <textarea
            id="custom-test-input"
            value={customInput}
            onChange={(event) => setCustomInput(event.target.value)}
            spellCheck={false}
          />
          <div className="custom-test-actions">
            <button
              className="custom-test-action"
              type="button"
              onClick={runCustomInput}
              disabled={runState.kind === "running"}
            >
              {runState.kind === "running" ? "Running…" : "Run custom input"}
            </button>
            {isSignedIn ? (
              <button
                className="custom-test-save-action"
                type="button"
                onClick={() => void saveCurrentCustomInput()}
                disabled={
                  isTestCaseSaving ||
                  customInput.trim().length === 0 ||
                  customTestCases.length >= MAX_CODING_TEST_CASES
                }
              >
                {isTestCaseSaving ? "Saving…" : "Save test case"}
              </button>
            ) : null}
          </div>
        </div>
        {isSignedIn ? (
          <div className="private-test-cases">
            <div className="private-test-cases-heading">
              <div>
                <h3>Private test cases</h3>
                <p>Inputs save only to your account. Local runs never add attempts.</p>
              </div>
              <span>
                {customTestCases.length}/{MAX_CODING_TEST_CASES}
              </span>
            </div>
            {customTestCases.length > 0 ? (
              <>
                <button
                  className="private-test-suite-run"
                  type="button"
                  onClick={runPrivateTestSuite}
                  disabled={runState.kind === "running"}
                >
                  {runState.kind === "running"
                    ? "Running test suite…"
                    : `Run all ${customTestCases.length} ${customTestCases.length === 1 ? "case" : "cases"}`}
                </button>
                <div className="private-test-case-list">
                  {customTestCases.map((testCase, index) => (
                    <div className="private-test-case" key={index}>
                      <div className="private-test-case-input">
                        <label htmlFor={`saved-test-case-${index}`}>
                          Test case {index + 1} input
                        </label>
                        <textarea
                          id={`saved-test-case-${index}`}
                          value={testCase.input}
                          onChange={(event) =>
                            updateCustomTestCase(index, event.target.value)
                          }
                          spellCheck={false}
                        />
                      </div>
                      <div className="private-test-case-expectation">
                        <label>
                          <input
                            type="checkbox"
                            checked={testCase.expectedOutput !== null}
                            onChange={(event) =>
                              updateExpectedOutput(
                                index,
                                event.target.checked ? "" : null,
                              )
                            }
                          />
                          Check expected output
                        </label>
                        {testCase.expectedOutput !== null ? (
                          <>
                            <label htmlFor={`saved-test-output-${index}`}>
                              Expected output
                            </label>
                            <textarea
                              id={`saved-test-output-${index}`}
                              value={testCase.expectedOutput}
                              onChange={(event) =>
                                updateExpectedOutput(index, event.target.value)
                              }
                              placeholder="Empty is a valid expected output"
                              spellCheck={false}
                            />
                          </>
                        ) : (
                          <p>Run this input without an automatic check.</p>
                        )}
                      </div>
                      <div className="private-test-case-actions">
                        <button
                          type="button"
                          onClick={() => setCustomInput(testCase.input)}
                        >
                          Use input
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeCustomTestCase(index)}
                          disabled={isTestCaseSaving}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="private-test-cases-empty">
                No saved cases yet. Try an input above, then save it here.
              </p>
            )}
            {testCaseSaveState === "unsaved" ? (
              <button
                className="private-test-cases-save"
                type="button"
                onClick={() => void persistCustomTestCases(customTestCases)}
                disabled={isTestCaseSaving}
              >
                {isTestCaseSaving ? "Saving…" : "Save changes"}
              </button>
            ) : null}
            <p
              className={`private-test-cases-status is-${testCaseSaveState}`}
              aria-live="polite"
            >
              {testCaseMessage}
            </p>
          </div>
        ) : null}
      </details>

      <div
        className={`coding-result is-${runState.kind}${
          runState.kind === "verdict"
            ? runState.verdict === "Accepted"
              ? " is-accepted"
              : " is-wrong"
            : runState.kind === "examples" &&
                runState.results.every((example) => example.passed)
              ? " is-accepted"
              : !isCleanPractice &&
                  runState.kind === "idle" &&
                  initialBestVerdict === "Accepted"
                ? " is-accepted"
              : ""
        }`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div>
          <span>
            {runState.kind === "verdict"
              ? runState.verdict
              : runState.kind === "examples"
                ? runState.results.every((example) => example.passed)
                  ? "Examples passed"
                  : "Examples differ"
                : runState.kind === "custom"
                  ? "Custom run"
                  : runState.kind === "test-suite"
                    ? "Private test suite"
                    : runState.kind === "error"
                      ? "Runner stopped"
                      : runState.kind === "timeout"
                        ? "Time limit exceeded"
                        : runState.kind === "running"
                          ? "Judging"
                          : !isCleanPractice && initialBestVerdict === "Accepted"
                            ? "Accepted"
                            : "Ready"}
          </span>
          {runState.kind === "verdict" ? (
            <strong>
              {runState.passedTests}/{runState.totalTests} checks
            </strong>
          ) : null}
        </div>
        <p>{runState.message}</p>
        {runtimeErrorLocation ? (
          <button
            className="runtime-location-action"
            type="button"
            aria-label={`Open line ${runtimeErrorLocation.line}, column ${runtimeErrorLocation.column} in the editor`}
            data-draft-save-action="true"
            onClick={openRuntimeErrorLocation}
          >
            Open line {runtimeErrorLocation.line}
          </button>
        ) : null}
        {runState.kind === "verdict" && runState.checks.length > 0 ? (
          <section
            className="judge-check-results"
            aria-labelledby={`judge-check-results-${problem.slug}`}
          >
            <div>
              <span>Judge coverage</span>
              <h3 id={`judge-check-results-${problem.slug}`}>
                What passed, and what needs work
              </h3>
            </div>
            <ol>
              {runState.checks.map((check) => (
                <li className={check.passed ? "is-passed" : "is-revisit"} key={check.label}>
                  <span aria-hidden="true">{check.passed ? "✓" : "·"}</span>
                  <strong>{check.label}</strong>
                  <small>{check.passed ? "Passed" : "Needs work"}</small>
                </li>
              ))}
            </ol>
            <p>
              Check names describe coverage only. Inputs, expected outputs, and
              solution code stay hidden.
            </p>
          </section>
        ) : null}
        {runState.kind === "custom" ? (
          <div className="sample-output">
            <span>Your output</span>
            <pre>{runState.output || "(empty)"}</pre>
          </div>
        ) : null}
        {runState.kind === "examples" ? (
          <ol
            className="example-run-results"
            aria-label="Visible example results"
          >
            {runState.results.map((result, index) => (
              <li key={`${index}-${result.input}`}>
                <span>Example {index + 1}</span>
                <div>
                  <p>Input</p>
                  <pre>{result.input}</pre>
                </div>
                <div>
                  <p>Your output</p>
                  <pre>{result.output || "(empty)"}</pre>
                </div>
                <div className={result.passed ? "is-matched" : "is-mismatch"}>
                  <p>Expected</p>
                  <pre>{result.expectedOutput || "(empty)"}</pre>
                  <span>{result.passed ? "Matched" : "Mismatch"}</span>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
        {runState.kind === "test-suite" ? (
          <ol
            className="private-test-suite-results"
            aria-label="Private test suite outputs"
          >
            {runState.results.map((result, index) => (
              <li key={`${index}-${result.input}`}>
                <span>Case {index + 1}</span>
                <div>
                  <p>Input</p>
                  <pre>{result.input}</pre>
                </div>
                <div>
                  <p>Output</p>
                  <pre>{result.output || "(empty)"}</pre>
                </div>
                <div className={`private-test-suite-check is-${result.passed === null ? "unchecked" : result.passed ? "matched" : "mismatch"}`}>
                  <p>Expected</p>
                  <pre>
                    {result.expectedOutput === null
                      ? "Not checked"
                      : result.expectedOutput || "(empty)"}
                  </pre>
                  <span>
                    {result.passed === null
                      ? "No expectation"
                      : result.passed
                        ? "Matched"
                        : "Mismatch"}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
        {visibleDebugOutput.length > 0 ? (
          <div className="debug-output">
            <span>Debug console · local only</span>
            <pre>{visibleDebugOutput.join("\n")}</pre>
          </div>
        ) : null}
        {runnerRecovery ? (
          <div className="runner-recovery">
            <span>{runnerRecovery.label}</span>
            <p>{runnerRecovery.guidance}</p>
          </div>
        ) : null}
        {runState.kind === "verdict" && runState.verdict === "Accepted" ? (
          <div
            className={`accepted-continuation${
              isReviewSession ? " is-review-session" : ""
            }`}
          >
            <p className="accepted-progress">
              Practice progress · {runState.completedCount}/{runState.totalCount} accepted
            </p>
            <div className="accepted-actions">
              {runState.dailyChallengeCompleted ? (
                <Link
                  className="accepted-next-action"
                  href="/practice/daily"
                >
                  Return to today’s challenge
                </Link>
              ) : null}
              {isReviewSession ? (
                <Link
                  className="accepted-next-action"
                  href="/practice/review"
                >
                  Return to refreshed review
                </Link>
              ) : null}
              <Link
                className={
                  isReviewSession || runState.dailyChallengeCompleted
                    ? "accepted-secondary-action"
                    : "accepted-next-action"
                }
                href={
                  runState.nextProblemSlug
                    ? `/practice/${runState.nextProblemSlug}`
                    : "/practice"
                }
              >
                {runState.nextProblemSlug
                  ? "Continue to next unfinished step"
                  : "View completed path"}
              </Link>
            </div>
          </div>
        ) : null}
        {runState.kind === "verdict" &&
        runState.verdict === "Wrong Answer" ? (
          <div className="wrong-answer-hint">
            <span>Try this next</span>
            <p>{problem.recoveryHint}</p>
            {revealedRecoveryHintCount > 0 ? (
              <ol
                className="recovery-hint-ladder"
                aria-label="Additional recovery hints"
              >
                {problem.recoveryHints
                  .slice(0, revealedRecoveryHintCount)
                  .map((hint, index) => (
                    <li key={hint}>
                      <span>Hint {index + 2}</span>
                      <p>{hint}</p>
                    </li>
                  ))}
              </ol>
            ) : null}
            {revealedRecoveryHintCount < problem.recoveryHints.length ? (
              <button
                className="recovery-hint-reveal"
                type="button"
                onClick={() =>
                  setRevealedRecoveryHintCount((count) =>
                    Math.min(count + 1, problem.recoveryHints.length),
                  )
                }
              >
                {revealedRecoveryHintCount === 0
                  ? "Show another hint"
                  : "Show final hint"}
              </button>
            ) : (
              <p className="recovery-hint-complete">
                All hints shown. Return to your code and try one change at a
                time.
              </p>
            )}
          </div>
        ) : null}
        {showAcceptedExplanation ? (
          <section
            className="accepted-explanation"
            aria-labelledby={`accepted-explanation-${problem.slug}`}
          >
            <div>
              <span>Concept unlocked</span>
              <h3 id={`accepted-explanation-${problem.slug}`}>
                {problem.acceptedExplanation.concept}
              </h3>
            </div>
            <p>{problem.acceptedExplanation.whyItWorks}</p>
            <section
              className="accepted-worked-trace"
              aria-labelledby={`accepted-worked-trace-${problem.slug}`}
            >
              <div className="accepted-worked-trace-heading">
                <span>Worked trace</span>
                <h4 id={`accepted-worked-trace-${problem.slug}`}>
                  Follow the first example
                </h4>
              </div>
              <div className="accepted-worked-trace-values">
                <div>
                  <span>Input</span>
                  <pre>{problem.examples[0].input}</pre>
                </div>
                <div>
                  <span>Expected output</span>
                  <pre>{problem.examples[0].expectedOutput}</pre>
                </div>
              </div>
              <ol>
                {problem.workedTrace.steps.map((step, index) => (
                  <li key={step}>
                    <span aria-hidden="true">{index + 1}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
              <p className="accepted-worked-trace-note">
                This follows the public example above. It does not analyze your
                source or reveal a solution.
              </p>
            </section>
            <div className="accepted-mistake">
              <span>Common mistake</span>
              <p>{problem.acceptedExplanation.commonMistake}</p>
            </div>
            <div className="accepted-efficiency">
              <div>
                <span>Efficiency target</span>
                <dl>
                  <div>
                    <dt>Time</dt>
                    <dd>{problem.acceptedExplanation.efficiency.time}</dd>
                  </div>
                  <div>
                    <dt>Extra space</dt>
                    <dd>{problem.acceptedExplanation.efficiency.space}</dd>
                  </div>
                </dl>
              </div>
              <p>{problem.acceptedExplanation.efficiency.explanation}</p>
              <small>
                This is the target for a direct approach, not an analysis of
                your exact source.
              </small>
            </div>
          </section>
        ) : null}
        {acceptedReview ? (
          <section
            className="accepted-code-review"
            aria-labelledby={`accepted-code-review-${problem.slug}`}
          >
            <header>
              <div>
                <span>Private code review</span>
                <h3 id={`accepted-code-review-${problem.slug}`}>
                  What your Accepted source already shows
                </h3>
              </div>
              <span className="accepted-code-review-badge">Only you</span>
            </header>
            <ol>
              {acceptedReview.points.map((point, index) => (
                <li className={`is-${point.kind}`} key={point.label}>
                  <span aria-hidden="true">{index + 1}</span>
                  <div>
                    <strong>{point.label}</strong>
                    <p>{point.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="accepted-code-review-note">
              Built from your most recent Accepted source. No new attempt or
              learner record was created.
            </p>
            <Link
              className="accepted-code-review-debrief-link"
              href={`/practice/${problem.slug}/debrief`}
            >
              Open private problem debrief <span aria-hidden="true">→</span>
            </Link>
          </section>
        ) : null}
        {acceptedReview && acceptedCode ? (
          <AcceptedSolutionDownload
            problemSlug={problem.slug}
            problemTitle={problem.title}
            source={acceptedCode}
          />
        ) : null}
        <div className="practice-recovery-cue">
          <span aria-hidden="true" />
          <p>
            {isCleanPractice && !cleanPracticeCompleted
              ? cleanPracticeSubmitted
                ? "This attempt and editor are saved. Earlier Accepted source remains hidden in clean practice."
                : "Your saved Accepted solution stays untouched until you submit this practice copy."
              : isSignedIn
              ? "Your saved code, attempts, and Accepted progress return after sign-in."
              : "Sign in to save this work. Your code, attempts, and Accepted progress return with your account."}
          </p>
        </div>
      </div>

      {isSignedIn && (!isCleanPractice || cleanPracticeCompleted) ? (
        <PracticeSolutionNote
          problemSlug={problem.slug}
          initialNote={initialSolutionNote}
          isAccepted={bestVerdict === "Accepted"}
        />
      ) : null}

      {showPracticeFeedback && (!isCleanPractice || cleanPracticeCompleted) ? (
        <PracticeFeedback
          problemSlug={problem.slug}
          initialFeedback={initialPracticeFeedback}
        />
      ) : null}

      {isCleanPractice && !cleanPracticeCompleted ? (
        <section
          className="clean-practice-history"
          aria-label="Saved work hidden"
        >
          <strong>Saved work stays out of view.</strong>
          <p>
            Finish this retrieval attempt first, or return to your saved
            solution to review earlier source and notes.
          </p>
        </section>
      ) : (
        <section
          className="attempt-history"
          aria-labelledby="attempt-history-title"
        >
          <div>
            <p className="quiz-kicker">Saved attempts</p>
            <h3 id="attempt-history-title">Verdict history</h3>
          </div>
          {attempts.length > 0 ? (
            <ol>
              {attempts.map((attempt, index) => (
                <li key={attempt.id}>
                  <span>#{attempts.length - index}</span>
                  <strong
                    className={
                      attempt.verdict === "Accepted"
                        ? "attempt-accepted"
                        : "attempt-wrong"
                    }
                  >
                    {attempt.verdict}
                  </strong>
                  <span>
                    {attempt.passedTests}/{attempt.totalTests} checks
                  </span>
                  <time dateTime={attempt.createdAt}>
                    {new Intl.DateTimeFormat("en", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(attempt.createdAt))}
                  </time>
                  {attempt.hasSource ? (
                    <Link
                      className="attempt-source-link"
                      href={`/submissions/${attempt.id}`}
                      aria-label={`Review source for attempt ${attempts.length - index}`}
                    >
                      Review source <span aria-hidden="true">→</span>
                    </Link>
                  ) : (
                    <span className="attempt-source-state">Result only</span>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="attempt-history-empty">
              No saved submissions yet. Your first verdict will appear here.
            </p>
          )}
        </section>
      )}
    </section>
  );
}
