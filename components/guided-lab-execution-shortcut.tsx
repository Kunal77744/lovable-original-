"use client";

import type { KeyboardEvent } from "react";
import { useRef } from "react";

export const GUIDED_LAB_EXECUTION_HINT_ID =
  "guided-lab-execution-keyboard-hint";

type GuidedLabExecutionShortcutOptions = {
  disabled: boolean;
  onRun: () => Promise<void> | void;
};

export function useGuidedLabExecutionShortcut({
  disabled,
  onRun,
}: GuidedLabExecutionShortcutOptions) {
  const runInFlightRef = useRef(false);

  return (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const usesPrimaryModifier = event.ctrlKey || event.metaKey;

    if (
      event.key !== "Enter" ||
      !usesPrimaryModifier ||
      event.shiftKey ||
      event.altKey ||
      event.repeat ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();
    if (disabled || runInFlightRef.current) return;

    runInFlightRef.current = true;
    try {
      const result = onRun();
      void Promise.resolve(result).finally(() => {
        runInFlightRef.current = false;
      });
    } catch (error) {
      runInFlightRef.current = false;
      throw error;
    }
  };
}

export function GuidedLabExecutionHint() {
  return (
    <p
      className="guided-lab-execution-hint"
      id={GUIDED_LAB_EXECUTION_HINT_ID}
    >
      <span className="sr-only">Keyboard Ctrl/⌘ + Enter to run checks</span>
      <span aria-hidden="true" className="guided-lab-execution-hint-visible">
        <span>Keyboard</span>
        <kbd>Ctrl/⌘</kbd>
        <span>+</span>
        <kbd>Enter</kbd>
        <span>to run checks</span>
      </span>
    </p>
  );
}
