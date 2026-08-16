"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./search-method-explorer.module.css";

type SearchMethod = "linear" | "binary";

type SearchStep = {
  activeIndex: number;
  lowerBound: number;
  upperBound: number;
  verdict: string;
};

const VALUES = [2, 5, 8, 13, 21] as const;
const TARGET = 13;

const SEARCH_STEPS: Record<SearchMethod, SearchStep[]> = {
  linear: [
    {
      activeIndex: 0,
      lowerBound: 0,
      upperBound: 4,
      verdict: "2 is not the target. Move one place to the right.",
    },
    {
      activeIndex: 1,
      lowerBound: 1,
      upperBound: 4,
      verdict: "5 is not the target. Keep scanning in order.",
    },
    {
      activeIndex: 2,
      lowerBound: 2,
      upperBound: 4,
      verdict: "8 is not the target. Check the next value.",
    },
    {
      activeIndex: 3,
      lowerBound: 3,
      upperBound: 4,
      verdict: "13 matches the target at index 3.",
    },
  ],
  binary: [
    {
      activeIndex: 2,
      lowerBound: 0,
      upperBound: 4,
      verdict: "8 is too small. Discard it and every value to its left.",
    },
    {
      activeIndex: 3,
      lowerBound: 3,
      upperBound: 4,
      verdict: "13 matches the target at index 3.",
    },
  ],
};

function getCellState(
  method: SearchMethod,
  stepIndex: number,
  valueIndex: number,
) {
  const step = SEARCH_STEPS[method][stepIndex];

  if (valueIndex === step.activeIndex) {
    return VALUES[valueIndex] === TARGET ? "found" : "checking";
  }

  if (method === "linear") {
    return valueIndex < step.activeIndex ? "discarded" : "waiting";
  }

  return valueIndex < step.lowerBound || valueIndex > step.upperBound
    ? "discarded"
    : "waiting";
}

export function SearchMethodExplorer() {
  const [isOpen, setIsOpen] = useState(false);
  const [method, setMethod] = useState<SearchMethod>("linear");
  const [stepIndex, setStepIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const hasOpenedRef = useRef(false);

  const steps = SEARCH_STEPS[method];
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const methodLabel = method === "linear" ? "Linear search" : "Binary search";

  useEffect(() => {
    if (!isOpen) {
      if (hasOpenedRef.current) triggerRef.current?.focus();
      return;
    }

    closeRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const closeExplorer = () => {
    setIsOpen(false);
  };

  const chooseMethod = (nextMethod: SearchMethod) => {
    setMethod(nextMethod);
    setStepIndex(0);
  };

  const advance = () => {
    setStepIndex((current) => (current === steps.length - 1 ? 0 : current + 1));
  };

  return (
    <div className={styles.dock}>
      {!isOpen ? (
        <button
          className={styles.trigger}
          onClick={() => {
            hasOpenedRef.current = true;
            setIsOpen(true);
          }}
          ref={triggerRef}
          type="button"
        >
          <span className={styles.triggerMark} aria-hidden="true">
            2×
          </span>
          Compare searches
        </button>
      ) : null}

      {isOpen ? (
        <div className={styles.backdrop} onMouseDown={closeExplorer}>
          <section
            aria-labelledby="search-explorer-title"
            aria-modal="true"
            className={styles.panel}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Browser-only method explorer</p>
                <h2 id="search-explorer-title">Watch the search space shrink.</h2>
              </div>
              <button
                aria-label="Close search comparison"
                className={styles.close}
                onClick={closeExplorer}
                ref={closeRef}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <p className={styles.intro}>
              Find <strong>{TARGET}</strong> in the same sorted list. Step through
              both methods to see why binary search can skip work.
            </p>

            <div className={styles.methodTabs} aria-label="Search method">
              {(["linear", "binary"] as const).map((candidate) => (
                <button
                  aria-pressed={method === candidate}
                  className={styles.methodTab}
                  data-active={method === candidate}
                  key={candidate}
                  onClick={() => chooseMethod(candidate)}
                  type="button"
                >
                  {candidate === "linear" ? "Linear search" : "Binary search"}
                  <span>
                    {candidate === "linear" ? "Up to 5 checks" : "Up to 3 checks"}
                  </span>
                </button>
              ))}
            </div>

            <div className={styles.stage}>
              <div className={styles.stageHeading}>
                <span>{methodLabel}</span>
                <span>
                  Comparison {stepIndex + 1} of {steps.length}
                </span>
              </div>

              <ol className={styles.values} aria-label="Sorted values">
                {VALUES.map((value, valueIndex) => {
                  const cellState = getCellState(method, stepIndex, valueIndex);
                  return (
                    <li data-state={cellState} key={value}>
                      <span>{value}</span>
                      <small>index {valueIndex}</small>
                    </li>
                  );
                })}
              </ol>

              <div className={styles.explanation} aria-live="polite">
                <span>
                  Checking index {step.activeIndex} · value {VALUES[step.activeIndex]}
                </span>
                <strong>{step.verdict}</strong>
              </div>
            </div>

            <div className={styles.controls}>
              <button
                className={styles.secondaryAction}
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                type="button"
              >
                Previous
              </button>
              <button className={styles.primaryAction} onClick={advance} type="button">
                {isLastStep ? "Run again" : "Next comparison"}
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <p className={styles.note}>
              Binary search needs sorted data. This explorer changes no saved code,
              checks, or progress.
            </p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
