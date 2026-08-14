"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CssPathFeedback } from "@/components/css-path-feedback";
import type { CssPracticeAttempt } from "@/db/css-practice";
import type { SavedCssPathFeedback } from "@/lib/css-path-feedback";
import {
  getCssChallengeDraftRecoveryKey,
  parseCssChallengeDraftRecovery,
  serializeCssChallengeDraftRecovery,
  type CssChallengeDraftRecovery,
} from "@/lib/css-challenge-draft-recovery";
import {
  buildCssChallengePreview,
  type CssChallengeCheck,
} from "@/lib/css-practice-challenges";
import { captureCssPracticeCompleted } from "@/lib/product-analytics";

type CssChallengeWorkspaceProps = {
  attempts: CssPracticeAttempt[];
  bestVerdict: string | null;
  browserRecoveryScope?: string | null;
  challenge: {
    slug: string;
    title: string;
    checks: CssChallengeCheck[];
    successTakeaway: {
      concept: string;
      explanation: string;
    };
  };
  initialCss: string;
  hasSavedDraft?: boolean;
  initialPathFeedback?: SavedCssPathFeedback | null;
  isSignedIn: boolean;
  isReviewSession?: boolean;
  isPathFeedbackEligible?: boolean;
  nextChallengeSlug: string | null;
};

type AttemptResponse = {
  id: string;
  verdict: "Completed" | "Needs revision";
  bestVerdict: "Completed" | "Needs revision";
  checks: CssChallengeCheck[];
  passedChecks: number;
  totalChecks: number;
  completedCount: number;
  totalCount: number;
  nextChallengeSlug: string | null;
  createdAt: string;
  isFirstCompletedResult: boolean;
  error?: string;
};

export function CssChallengeWorkspace({
  attempts: initialAttempts,
  bestVerdict: initialBestVerdict,
  browserRecoveryScope = null,
  challenge,
  initialCss,
  hasSavedDraft = false,
  initialPathFeedback = null,
  isSignedIn,
  isReviewSession = false,
  isPathFeedbackEligible = false,
  nextChallengeSlug: initialNextChallengeSlug,
}: CssChallengeWorkspaceProps) {
  const [css, setCss] = useState(initialCss);
  const [checks, setChecks] = useState(challenge.checks);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [bestVerdict, setBestVerdict] = useState(initialBestVerdict);
  const [nextChallengeSlug, setNextChallengeSlug] = useState(
    initialNextChallengeSlug,
  );
  const [showPathFeedback, setShowPathFeedback] = useState(
    isPathFeedbackEligible,
  );
  const [saveState, setSaveState] = useState<
    "saved" | "unsaved" | "saving" | "error"
  >(isSignedIn && hasSavedDraft ? "saved" : "unsaved");
  const [status, setStatus] = useState(
    isSignedIn
      ? initialBestVerdict === "Completed"
        ? "Completed CSS restored from your account."
        : initialAttempts.length > 0
          ? "Your latest saved attempt is ready to revise."
          : hasSavedDraft
            ? "Your saved CSS draft is restored. Submit when you want deterministic feedback."
          : "Your draft saves as you type. Submit when you want deterministic feedback."
      : "Try the challenge now. Sign in to save drafts, attempts, and completion.",
  );
  const [submitting, setSubmitting] = useState(false);
  const [recoverableBrowserDraft, setRecoverableBrowserDraft] =
    useState<CssChallengeDraftRecovery | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCss = useRef(initialCss);
  const draftSaveInFlight = useRef(false);
  const queuedDraft = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const previewDocument = useMemo(() => buildCssChallengePreview(css), [css]);
  const passedCount = checks.filter((check) => check.passed).length;
  const hasSavedAttempt = attempts.length > 0;
  const browserRecoveryKey =
    isSignedIn && browserRecoveryScope
      ? getCssChallengeDraftRecoveryKey(browserRecoveryScope, challenge.slug)
      : null;

  useEffect(() => {
    if (!browserRecoveryKey) return;

    try {
      const storedValue = window.localStorage.getItem(browserRecoveryKey);
      const browserDraft = parseCssChallengeDraftRecovery(storedValue);

      if (!browserDraft || browserDraft.css === initialCss) {
        if (storedValue) window.localStorage.removeItem(browserRecoveryKey);
        return;
      }

      setRecoverableBrowserDraft(browserDraft);
    } catch {
      // Private server saving remains available when browser storage is blocked.
    }
  }, [browserRecoveryKey, initialCss]);

  useEffect(() => {
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, []);

  function persistBrowserRecovery(nextCss: string) {
    if (!browserRecoveryKey) return;

    try {
      window.localStorage.setItem(
        browserRecoveryKey,
        serializeCssChallengeDraftRecovery(nextCss),
      );
      setRecoverableBrowserDraft(null);
    } catch {
      // The existing private autosave remains the fallback when storage is blocked.
    }
  }

  function clearBrowserRecoveryIfMatches(savedCss: string) {
    if (!browserRecoveryKey) return;

    try {
      const browserDraft = parseCssChallengeDraftRecovery(
        window.localStorage.getItem(browserRecoveryKey),
      );

      if (browserDraft?.css === savedCss) {
        window.localStorage.removeItem(browserRecoveryKey);
      }
    } catch {
      // A blocked cleanup does not change the truth of the private save.
    }
  }

  async function saveDraft(nextCss: string) {
    if (!isSignedIn) return;

    if (draftSaveInFlight.current || submittingRef.current) {
      queuedDraft.current = nextCss;
      return;
    }

    draftSaveInFlight.current = true;
    setSaveState("saving");
    try {
      const response = await fetch(`/api/practice/css/${challenge.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "draft", css: nextCss }),
      });

      if (!response.ok) {
        if (latestCss.current === nextCss) setSaveState("error");
        return;
      }

      clearBrowserRecoveryIfMatches(nextCss);

      if (latestCss.current === nextCss) {
        setSaveState("saved");
        setStatus("Draft saved. Submit to refresh the checks.");
      }
    } catch {
      if (latestCss.current === nextCss) setSaveState("error");
    } finally {
      draftSaveInFlight.current = false;
      const nextDraft = queuedDraft.current;
      queuedDraft.current = null;

      if (nextDraft !== null && nextDraft !== nextCss) {
        void saveDraft(nextDraft);
      }
    }
  }

  function updateCss(nextCss: string) {
    latestCss.current = nextCss;
    persistBrowserRecovery(nextCss);
    setCss(nextCss);
    setSaveState("unsaved");
    setStatus(
      isSignedIn
        ? "Draft changed. Submit to refresh the checks."
        : "Local draft changed. Sign in before leaving to keep it.",
    );

    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      void saveDraft(nextCss);
    }, 700);
  }

  function restoreBrowserDraft() {
    if (!recoverableBrowserDraft) return;

    updateCss(recoverableBrowserDraft.css);
    setStatus(
      "Browser CSS restored as unsaved work. Your private saved draft stays unchanged until this exact CSS saves.",
    );
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

  async function submitAttempt() {
    if (!isSignedIn) {
      setStatus("Create a free account to check and save this attempt.");
      return;
    }

    if (draftSaveInFlight.current) return;

    if (draftTimer.current) {
      clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }

    const submittedCss = latestCss.current;
    submittingRef.current = true;
    setSubmitting(true);
    setStatus("Checking the selectors and box-model rules…");

    try {
      const response = await fetch(`/api/practice/css/${challenge.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "submit", css: submittedCss }),
      });
      const payload = (await response.json()) as AttemptResponse;

      if (!response.ok) {
        setSaveState("error");
        setStatus(
          payload.error ?? "The attempt could not be saved. Try again.",
        );
        return;
      }

      clearBrowserRecoveryIfMatches(submittedCss);
      setChecks(payload.checks);
      setBestVerdict(payload.bestVerdict);
      setNextChallengeSlug(payload.nextChallengeSlug);
      setAttempts((current) =>
        [
          {
            id: payload.id,
            verdict: payload.verdict,
            passedChecks: payload.passedChecks,
            totalChecks: payload.totalChecks,
            createdAt: payload.createdAt,
          },
          ...current,
        ].slice(0, 8),
      );
      if (latestCss.current !== submittedCss) {
        setSaveState("unsaved");
        setStatus(
          "Your attempt is saved. Newer CSS changes are still unsaved and unchecked.",
        );
      } else {
        setSaveState("saved");
        setStatus(
          payload.verdict === "Completed"
            ? `${challenge.title} is complete. Your CSS and result are saved.`
            : `${payload.passedChecks} of ${payload.totalChecks} checks pass. This attempt is saved with exact feedback below.`,
        );
      }

      if (
        payload.verdict === "Completed" &&
        payload.isFirstCompletedResult &&
        payload.completedCount === payload.totalCount
      ) {
        setShowPathFeedback(true);
        captureCssPracticeCompleted({
          pathSlug: "css-selectors-box-model",
          completionState: "completed",
        });
      }
    } catch {
      setSaveState("error");
      setStatus(
        "The attempt could not be saved. Check your connection and try again.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);

      const nextDraft = queuedDraft.current;
      queuedDraft.current = null;
      if (nextDraft !== null && nextDraft !== submittedCss) {
        void saveDraft(nextDraft);
      }
    }
  }

  return (
    <section
      className="css-challenge-workspace"
      aria-labelledby="css-workspace-title"
    >
      <header className="css-challenge-workspace-heading">
        <div>
          <p className="quiz-kicker">Live CSS workbench</p>
          <h2 id="css-workspace-title">Make the rule predictable.</h2>
          <p>
            The preview updates as you type. Submission checks only the exact
            selector and box-model choices named in this challenge.
          </p>
        </div>
        <div
          className={
            bestVerdict === "Completed"
              ? "css-best-result is-complete"
              : "css-best-result"
          }
        >
          <span>Best result</span>
          <strong>{bestVerdict ?? "Not submitted"}</strong>
          <small>
            {passedCount}/{checks.length} latest checks
          </small>
        </div>
      </header>

      <div className="css-challenge-panels">
        <div className="css-challenge-editor">
          <div className="code-editor-bar">
            <span>challenge.css</span>
            <span>
              {isSignedIn
                ? saveState === "saving"
                  ? "Saving…"
                  : saveState === "saved"
                    ? "Saved"
                    : saveState === "error"
                      ? "Save failed"
                      : "Unsaved"
                : "Local only"}
            </span>
          </div>
          {recoverableBrowserDraft ? (
            <aside
              className="css-browser-draft-recovery"
              aria-labelledby={`css-browser-draft-recovery-${challenge.slug}`}
            >
              <div>
                <span>Browser recovery</span>
                <h3 id={`css-browser-draft-recovery-${challenge.slug}`}>
                  Unfinished CSS is available on this browser.
                </h3>
              </div>
              <p>
                Your private saved CSS is still loaded. Restore the browser copy
                as unsaved work, or keep the account-backed version.
              </p>
              <div className="css-browser-draft-recovery-actions">
                <button type="button" onClick={keepPrivateSavedDraft}>
                  Keep saved CSS
                </button>
                <button type="button" onClick={restoreBrowserDraft}>
                  Restore browser CSS
                </button>
              </div>
            </aside>
          ) : null}
          <label htmlFor="css-challenge-editor">CSS solution</label>
          <textarea
            id="css-challenge-editor"
            aria-label="CSS solution"
            value={css}
            onChange={(event) => updateCss(event.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="css-challenge-preview">
          <div className="code-editor-bar">
            <span>Live preview</span>
            <span>Network blocked</span>
          </div>
          <iframe
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={previewDocument}
            title={`${challenge.title} live preview`}
          />
        </div>
      </div>

      <div className="css-challenge-submit">
        <button
          className="submit-code-action"
          type="button"
          onClick={submitAttempt}
          disabled={submitting || saveState === "saving"}
        >
          {submitting ? "Checking CSS…" : "Check and save attempt"}
        </button>
        <p
          className={saveState === "error" ? "is-error" : ""}
          aria-live="polite"
          role="status"
        >
          {status}
          {!isSignedIn && status.startsWith("Create a free account") ? (
            <>
              {" "}
              <Link href="/account">Create account</Link>
            </>
          ) : null}
        </p>
      </div>

      {bestVerdict === "Completed" ? (
        <section
          className="css-success-takeaway"
          aria-labelledby={`css-success-takeaway-${challenge.slug}`}
        >
          <div>
            <span>Concept unlocked</span>
            <h3 id={`css-success-takeaway-${challenge.slug}`}>
              {challenge.successTakeaway.concept}
            </h3>
          </div>
          <p>{challenge.successTakeaway.explanation}</p>
        </section>
      ) : null}

      <div className="css-challenge-feedback">
        <div className="css-check-list">
          <div className="css-check-list-heading">
            <div>
              <p className="quiz-kicker">Deterministic feedback</p>
              <h3>Every failed check gives you a next move.</h3>
            </div>
            <span>
              {passedCount}/{checks.length} passing
            </span>
          </div>
          {checks.map((check) => (
            <div
              className={check.passed ? "css-check is-passed" : "css-check"}
              key={check.id}
            >
              <span aria-hidden="true">{check.passed ? "✓" : "○"}</span>
              <div>
                <strong>{check.label}</strong>
                {!check.passed && hasSavedAttempt ? (
                  <div className="css-check-recovery">
                    <p>
                      <span>Concept to revisit</span>
                      {check.concept}
                    </p>
                    <p>
                      <span>Next attempt</span>
                      {check.nextAttempt}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <aside className="css-attempt-history" aria-label="Saved attempts">
          <p className="quiz-kicker">Saved attempts</p>
          <h3>Your last tries stay here.</h3>
          {attempts.length > 0 ? (
            <ol>
              {attempts.map((attempt) => (
                <li key={attempt.id}>
                  <strong>{attempt.verdict}</strong>
                  <span>
                    {attempt.passedChecks}/{attempt.totalChecks} checks
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="css-empty-attempts">
              No saved attempts yet. Your first submission will appear here.
            </p>
          )}
          {bestVerdict === "Completed" ? (
            <div
              className={
                isReviewSession
                  ? "css-completed-actions is-review-session"
                  : "css-completed-actions"
              }
            >
              {isReviewSession ? (
                <Link
                  className="css-review-return-action"
                  href="/practice/css/review"
                >
                  Return to refreshed review
                </Link>
              ) : null}
              {nextChallengeSlug ? (
                <Link
                  className="css-next-challenge"
                  href={`/practice/css/${nextChallengeSlug}`}
                >
                  Continue to the next unfinished challenge{" "}
                  <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <Link className="css-next-challenge" href="/practice/css">
                  Review the complete CSS path{" "}
                  <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          ) : null}
        </aside>
      </div>

      {showPathFeedback ? (
        <CssPathFeedback initialFeedback={initialPathFeedback} />
      ) : null}
    </section>
  );
}
